const express = require("express");
const path = require('path');
const cors = require("cors");

const dotenv = require("dotenv").config();
const fetch = require("node-fetch");
const destiny = require("./destiny-parser")

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});

const app = express();
const port = process.env.PORT || "8000";

const ErrorCode = {
  NONE: 0,
  SUCCESS: 1,
  UNAVAILABLE: 5
}

var accessMap = {};

app.use(cors());

if (process.env.NODE_ENV === 'production') {
  var REACT_APP_URL = '';

  app.use(express.static(path.join(__dirname, '..', '..', 'view', 'build')));

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'view', 'build', 'index.html'));
  });

  app.get('/profile/:profileId', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'view', 'build', 'index.html'));
  });
}
else {
  var REACT_APP_URL = 'http://localhost:3000';
}

app.get("/oauth", (req, res) => {
  const clientId = process.env.ClIENT_ID;
  // TODO generate state and check it on response
  res.send(`https://www.bungie.net/en/OAuth/Authorize?client_id=${clientId}&response_type=code&state=12345678`);
});

app.get("/oauth/redirect", (req, res) => {
  const reqCode = req.query.code;
  const clientId = process.env.ClIENT_ID;
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
          accessMap[data.Response.destinyMemberships[0].membershipId] = accessToken;
          res.redirect(`${REACT_APP_URL}/profile/${data.Response.destinyMemberships[0].membershipId}`);
        })
    })
});

app.get("/destiny/:profileId", (req, res) => {
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

      let roleDefinitions = [];
      //roleDefinitions.push(destiny.parseAscendant(data.Response)); // TODO parse inventorie and calculate power
      roleDefinitions.push(destiny.parseTriumphant(data.Response));
      roleDefinitions.push(destiny.parseChosen(data.Response));
      roleDefinitions.push(destiny.parseConqueror(data.Response));
      roleDefinitions.push(destiny.parseOutlaw(data.Response));
      roleDefinitions.push(destiny.parseVanquisher(data.Response));

      res.status(200).json({
        'roles': roleDefinitions
      });
    });
});

app.get("/db/:profileId/", (req, res) => {
  // return unlocked titles or empty array if profileid is missing
});

app.post("/db/:profileId/:title", (req, res) => {
  console.log(`${req.params.title} title unlocked for profile: ${req.params.profileId}`);
  res.status(200).end();
  // store unlocked title for user
});

app.listen(port)
