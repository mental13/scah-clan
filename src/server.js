const express = require('express');
const path = require('path');
const cors = require('cors');

const dotenv = require('dotenv').config();
const destiny = require('./destiny-api');

const db = require('./db');
db.connect()
  .catch(error => {
    console.error(error);
  });

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

app.get('/check-register/:discordId', (req, res) => {
  const discordId = req.params.discordId;

  db.getDataByDiscordId(discordId)
    .then(data => {
      res.status(200).json({
        'registered': true,
      });
    })
    .catch((error) => {
      res.status(400).json({
        'registered': false,
        'error': error.message,
      });
    });
});

app.post('/unregister/:discordId', (req, res) => {
  const discordId = req.params.discordId;

  db.getDataByDiscordId(discordId)
    .then(data => {
      return db.addDataToProfile(data.id, { discordId: null });
    })
    .then((updatedEntry) => {
      if (updatedEntry.discordId) {
        throw new Error('Failed to unlink discord from profile');
      }
      res.status(200).end();
    })
    .catch((error) => {
      res.status(400).json({
        'error': error.message,
      });
    });
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

app.get('/sync/:discordId', (req, res) => {
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

app.get('/sync', (req, res) => {
  var usersToSync = [];
  db.getAllUsersWithKey('discordId')
    .then(users => {
      users.forEach(user => {
        usersToSync.push({
          discordId: user.discordId,
          earnedTitles: user.earnedTitles
        });
      });
      res.status(200).json({
        'data': usersToSync
      });
    })
    .catch((error) => {
      res.status(400).json({
        'error': error.message,
      });
    });
});

app.post('/reset/:secret', (req, res) => {
  const secret = process.env.RESET_SECRET;
  const reqSecret = req.params.secret;

  if (!secret || !reqSecret) {
    console.log('Command unavailable: no reset secret provided');
    res.status(400).end();
    return;
  }

  if (secret != reqSecret) {
    console.log('Command failed: secrets do not match');
    res.status(400).end();
    return;
  }

  db.getAllUsersWithKey('id')
    .then(users => {
      users.forEach(user => {
        db.addDataToProfile(user.id, { $set: { earnedTitles: [] } });
        db.addDataToProfile(user.id, { $set: { redeemedTitles: [] } });
        res.status(200).end();
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
});

app.post('/db/:profileId/:title', (req, res) => {
  db.addDataToProfile(req.params.profileId, { $addToSet: { redeemedTitles: [req.params.title] } });
  res.status(200).end();
});

app.listen(port)
