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

const STEAM_MEMBERSHIP_ID = 3;

var accessMap = {};

app.use(cors());

if (process.env.NODE_ENV === 'production') {
  var REACT_APP_URL = '';

  app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

  const reactDefaultHandler = (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
  };

  app.get('/', reactDefaultHandler);
  app.get('/profile/:profileId', reactDefaultHandler);
}
else {
  var REACT_APP_URL = 'http://localhost:3000';
}

function getOauthURL() {
  const clientId = process.env.CLIENT_ID;
  return `https://www.bungie.net/en/OAuth/Authorize?client_id=${clientId}&response_type=code`;
}

app.get('/oauth/', (req, res) => {
  res.send(getOauthURL());
});

app.get('/register/', (req, res) => {
  const discordId = req.query.di;
  const stateParam = discordId ? `&state=${discordId}` : '';
  res.redirect(getOauthURL() + stateParam);
});

app.get('/oauth/redirect', (req, res) => {
  const reqCode = req.query.code;
  const discordId = req.query.state;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  fetch('https://www.bungie.net/platform/app/oauth/token/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=authorization_code&code=${reqCode}&client_id=${clientId}&client_secret=${clientSecret}`
    })
    .then(response => response.json())
    .then(data => {
      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;
      fetch(`https://www.bungie.net/Platform/User/GetMembershipsById/${data.membership_id}/254/`,
        { method: 'GET', headers: { 'x-api-key': process.env.BUNGIE_API_KEY } })
        .then(response => response.json())
        .then(data => {
          if (data.ErrorCode != ErrorCode.SUCCESS) {
            res.status(400).json({ 'errorMessage': data.Message });
            return;
          }

          const bnetMembership = data.Response.destinyMemberships.find(membership => membership.membershipType == STEAM_MEMBERSHIP_ID);
          if (bnetMembership) {
            const profileId = bnetMembership.membershipId;
            accessMap[profileId] = accessToken;

            if (refreshToken) {
              db.storeTokenForProfile(profileId, refreshToken)
            }
            if (discordId) {
              db.linkDiscordForProfile(profileId, discordId)
            }

            res.redirect(`${REACT_APP_URL}/profile/${profileId}`);
          }
        })
    })
});

async function getDestinyData(profileId, accessToken) {
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
  const components = 'components=100,102,200,201,202,205,300,700,800,900';
  return fetch(`https://www.bungie.net/Platform//Destiny2/${STEAM_MEMBERSHIP_ID}/Profile/${profileId}/?${components}`,
    {
      method: 'GET',
      headers: {
        'x-api-key': process.env.BUNGIE_API_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    })
    .then(response => response.json())
    .then(async (data) => {
      if (data.ErrorCode != ErrorCode.SUCCESS) {
        res.status(400).json({ 'errorMessage': data.Message });
      }

      const titleDefinitions = await destiny.getTitleDefinitions(data.Response);

      const titlesEarned = [];
      titleDefinitions.forEach(title => {
        if (title.isRedeemable) titlesEarned.push(title.name);
      });
      db.addTitlesForProfile(profileId, titlesEarned);
      return titleDefinitions;
    });
}

app.get('/destiny/:profileId', async (req, res) => {
  const accessToken = accessMap[req.params.profileId];

  if (!accessToken) {
    res.status(403).json({ 'errorMessage': 'Bad Auth' });
    return;
  }

  const titlesRedeemed = db.getRedeemedTitlesForProfile(req.params.profileId).then((data) => data.titles);
  const titleDefinitions = getDestinyData(req.params.profileId, accessToken);

  res.status(200).json({
    'titleDefinitions': await titleDefinitions,
    'titlesRedeemed': await titlesRedeemed
  });

});

app.get('/titles/:discordId', (req, res) => {
  const discordId = req.params.discordId;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  db.getRefreshTokenForDiscordUser(discordId)
    .then((data) => {
      const profileId = data.profileId;
      if (data.token && profileId) {
        fetch('https://www.bungie.net/platform/app/oauth/token/',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=refresh_token&refresh_token=${data.token}&client_id=${clientId}&client_secret=${clientSecret}`
          })
          .then(response => response.json())
          .then(data => {
            const accessToken = data.access_token;
            if (accessToken) {
              getDestinyData(profileId, accessToken).then(() => {
                db.getTitlesForDiscordUser(req.params.discordId).then((data) => {
                  const statusCode = data.error ? 404 : 200;
                  res.status(statusCode).json({
                    'titles': data.titles,
                    'error': data.error
                  });
                  if (data.error) {
                    throw data.error;
                  }
                });
              });
            }
            else {
              throw `discord user ${discordId} failed to refresh token`
            }
          })
          .catch((error) => {
            console.log(`Error: ${error}`);
          });
      }
      else {
        throw `discord user ${discordId} does not have a refresh token`;
      }
    })
    .catch((error) => {
      console.log(`Error: ${error}`);
    });
});

app.get('/db/:profileId/', (req, res) => {
  db.getRedeemedTitlesForProfile(req.params.profileId).then((data) => {
    res.status(200).json({
      'titlesRedeemed': data.titles
    });
  });
});

app.post('/db/:profileId/:title', (req, res) => {
  db.redeemTitleForProfile(req.params.profileId, req.params.title);
  res.status(200).end();
});

app.listen(port)
