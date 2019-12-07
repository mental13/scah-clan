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
        db.addDataToProfile(profileId, { token: refreshToken });
      }
      if (discordId) {
        db.addDataToProfile(profileId, { discordId: discordId });
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
      const earnedTitles = [];
      titleDefinitions.forEach(title => {
        if (title.isRedeemable) earnedTitles.push(title.name);
      });
      db.addDataToProfile(profileId, { $addToSet: { earnedTitles: earnedTitles } });
      return titleDefinitions
    });

  const titlesRedeemed = db.getDataByProfileId(profileId)
    .then((data) => data ? data.redeemedTitles : []);

  Promise.all([titleDefinitions, titlesRedeemed])
    .then(data => {
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

  db.getDataByDiscordId(discordId)
    .then(data => {
      profileId = data.id;
      return destiny.refreshAuthToken(data.token);
    })
    .then(newAccessToken => {
      return destiny.getProfileData(profileId, newAccessToken);
    })
    .then(titleDefinitions => {
      const earnedTitles = [];
      titleDefinitions.forEach(title => {
        if (title.isRedeemable) earnedTitles.push(title.name);
      });
      return db.addDataToProfile(profileId, { $addToSet: { earnedTitles: earnedTitles } });
    })
    .then(updatedEntry => {
      res.status(200).json({
        'titles': updatedEntry.earnedTitles,
      });
    })
    .catch((error) => {
      res.status(400).json({
        'error': error.message,
      });
    });
});

app.post('/db/:profileId/:title', (req, res) => {
  db.addDataToProfile(req.params.profileId, { $addToSet: { redeemedTitles: [req.params.title] } });
  res.status(200).end();
});

app.listen(port)
