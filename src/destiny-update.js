const destiny = require('./destiny-api');
const db = require('./db');

var now = new Date();
const startTime = Math.round(now.getTime() / 1000);

var updatePromises = [];

async function updateDataForUser(user) {
  const profileId = user.id;
  return destiny.refreshAuthToken(user.token)
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
    .then(() => {
      console.log(`Updated data for profile ${profileId}`);
    });
}

db.connect()
  .then(() => {
    return db.getAllUsersWithKey('discordId');
  })
  .then(users => {
    users.forEach(user => {
      updatePromises.push(updateDataForUser(user));
    });
  })
  .then(() => {
    Promise.all(updatePromises)
      .then(() => {
        now = new Date();
        const endTime = Math.round(now.getTime() / 1000);
        console.log(`Destiny data update took ${endTime - startTime} seconds.`);
        process.exit();
      })
  })
  .catch((error => {
    console.error(error);
    process.exit();
  }));
