const express = require('express');
const path = require('path');
const cors = require('cors');

const dotenv = require('dotenv').config();
const fetch = require('node-fetch');
const destiny = require('./destiny-parser');

const db = require('./db');
db.connect();

const app = express();
const port = process.env.PORT || '8000';

const ErrorCode = {
  NONE: 0,
  SUCCESS: 1,
  UNAVAILABLE: 5
}

var accessMap = {};

app.use(cors());

if (process.env.NODE_ENV === 'production') {
  var REACT_APP_URL = '';

  app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

  const reactServeHandler = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
  };

  app.get('/', reactServeHandler);
  app.get('/profile/:profileId', reactServeHandler);
}
else {
  var REACT_APP_URL = 'http://localhost:3000';
}

app.get('/oauth', (req, res) => {
  const clientId = process.env.CLIENT_ID;
  // TODO generate state and check it on response
  res.send(`https://www.bungie.net/en/OAuth/Authorize?client_id=${clientId}&response_type=code&state=12345678`);
});

app.get('/oauth/redirect', (req, res) => {
  const reqCode = req.query.code;
  const clientId = process.env.CLIENT_ID;
  fetch('https://www.bungie.net/platform/app/oauth/token/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=authorization_code&code=${reqCode}&client_id=${clientId}`
    })
    .then(response => response.json())
    .then(data => {
      const accessToken = data.access_token;
      fetch(`https://www.bungie.net/Platform/User/GetMembershipsById/${data.membership_id}/254/`,
        { method: 'GET', headers: { 'x-api-key': process.env.BUNGIE_API_KEY } })
        .then(response => response.json())
        .then(data => {
          // TODO add error handling here
          const bnetMembership = data.Response.destinyMemberships.find(membership => membership.membershipType == 4);
          if (bnetMembership) {
            accessMap[bnetMembership.membershipId] = accessToken;
            res.redirect(`${REACT_APP_URL}/profile/${bnetMembership.membershipId}`);
          }
        })
    })
});

app.get('/destiny/:profileId', async (req, res) => {
  // Components:
  // 100 - profile data (character IDs)
  // 102 - profile inventorie (vault)
  // 200 - character info
  // 201 - character inventorie
  // 202 - character progression (season resets)
  // 205 - character equipment
  // 300 - basic instanced item info
  // 700 - presentation nodes (seals)
  // 800 - collectibles
  // 900 - triumphs
  const accessToken = accessMap[req.params.profileId];

  if (!accessToken) {
    res.status(403).json({ 'errorMessage': 'Bad Auth' });
    return;
  }

  const titlesRedeemed = await db.getTitlesForProfile(req.params.profileId).then((data) => data.titles);

  fetch(`https://www.bungie.net/Platform//Destiny2/4/Profile/${req.params.profileId}/?components=100,102,200,201,202,205,300,700,800,900`,
    {
      method: 'GET',
      headers: {
        'x-api-key': process.env.BUNGIE_API_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.ErrorCode != ErrorCode.SUCCESS) {
        res.status(400).json({ 'errorMessage': data.Message });
      }

      let titleDefinitions = [];
      //titleDefinitions.push(destiny.parseAscendant(data.Response)); // TODO parse inventorie and calculate power
      titleDefinitions.push(destiny.parseTriumphant(data.Response));
      titleDefinitions.push(destiny.parseChosen(data.Response));
      titleDefinitions.push(destiny.parseConqueror(data.Response));
      titleDefinitions.push(destiny.parseOutlaw(data.Response));
      titleDefinitions.push(destiny.parseVanquisher(data.Response));

      res.status(200).json({
        'titleDefinitions': titleDefinitions,
        'titlesRedeemed': titlesRedeemed
      });
    });
});

app.get('/db/:profileId/', (req, res) => {
  db.getTitlesForProfile(req.params.profileId).then((data) => {
    res.status(200).json({
      'titlesRedeemed': data.titles
    });
  });
});

app.post('/db/:profileId/:title', (req, res) => {
  db.addTitleForProfile(req.params.profileId, req.params.title);
  res.status(200).end();
});

app.listen(port)
