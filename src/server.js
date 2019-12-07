const express = require('express');
const path = require('path');
const cors = require('cors');

const dotenv = require('dotenv').config();
const destiny = require('./destiny-api');

const db = require('./db');
db.connect();

const app = express();
const port = process.env.PORT || '8000';

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

app.get('/oauth/', (req, res) => {
  res.send(destiny.getOauthURL());
});

app.get('/register/', (req, res) => {
  const discordId = req.query.di;
  const stateParam = discordId ? `&state=${discordId}` : '';
  res.redirect(destiny.getOauthURL() + stateParam);
});

app.get('/oauth/redirect', (req, res) => {
  const authCode = req.query.code;
  const discordId = req.query.state;
  var accessToken;
  var refreshToken;

  destiny.auth(authCode)
    .then(authData => {
      accessToken = authData.accessToken;
      refreshToken = authData.refreshToken;
      return destiny.getProfileId(authData.membershipId);
    })
    .then(profileId => {
      accessMap[profileId] = accessToken;

      if (refreshToken) {
        db.storeTokenForProfile(profileId, refreshToken)
      }
      if (discordId) {
        db.linkDiscordForProfile(profileId, discordId)
      }

      res.redirect(`${REACT_APP_URL}/profile/${profileId}`);
    })
    .catch(error => {
      res.status(400).json({ 'errorMessage': error.message });
    });
});

app.get('/destiny/:profileId', async (req, res) => {
  const accessToken = accessMap[req.params.profileId];
  const profileId = req.params.profileId;

  const titleDefinitions = destiny.getProfileData(profileId, accessToken)
    .then(titleDefinitions => {
      const titlesEarned = [];
      titleDefinitions.forEach(title => {
        if (title.isRedeemable) titlesEarned.push(title.name);
      });
      db.addTitlesForProfile(profileId, titlesEarned);
      return titleDefinitions
    });

  const titlesRedeemed = db.getRedeemedTitlesForProfile(profileId)
    .then((data) => data.titles);

  Promise.all([titleDefinitions, titlesRedeemed]).then(data => {
    res.status(200).json({
      'titleDefinitions': data[0],
      'titlesRedeemed': data[1]
    });
  })
    .catch(error => {
      res.status(400).json({ 'errorMessage': error.message });
    });
});

app.get('/titles/:discordId', (req, res) => {
  const discordId = req.params.discordId;
  var profileId;
  db.getRefreshTokenForDiscordUser(discordId)
    .then((data) => {
      profileId = data.profileId;
      return destiny.refreshAuthToken(data.token);
    })
    .then(accessToken => {
        return destiny.getProfileData(profileId, accessToken);
    })
    .then(titleDefinitions => {
      const titlesEarned = [];
      titleDefinitions.forEach(title => {
        if (title.isRedeemable) titlesEarned.push(title.name);
      });
      db.addTitlesForProfile(profileId, titlesEarned);

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
