const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
  },
  discordId: String,
  earnedTitles: [String],
  redeemedTitles: [String]
})

const Profile = mongoose.model('Profile', profileSchema);

var dbConnected = false;
exports.connect = function () {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true
  }).catch(err => {
    console.error(`DB error: ${err}`);
  });

  mongoose.connection.on('connected', () => {
    dbConnected = true;
  });
  mongoose.connection.on('error', () => {
    dbConnected = false;
  });
  mongoose.connection.on('disconnected', () => {
    dbConnected = false;
  });
}

exports.linkDiscordForProfile = function (profileID, discordId) {
  if (dbConnected) {
    Profile.findOneAndUpdate({ id: profileID }, { discordId: discordId }, { upsert: true }, (err, data) => {
      if (err) console.error(err);
    });
  }
}

exports.addTitlesForProfile = function (profileID, titles, redeem = false) {
  if (dbConnected) {
    const update = redeem ? { $addToSet: { redeemedTitles: titles } } : { $addToSet: { earnedTitles: titles } };
    Profile.findOneAndUpdate({ id: profileID }, update, { upsert: true }, (err, data) => {
      if (err) console.error(err);
    });
  }
}

exports.redeemTitleForProfile = function (profileID, title) {
  exports.addTitlesForProfile(profileID, [title], true);
}

async function getTitlesForProfile(profileID, redeemed = false) {
  var titles = [];
  if (dbConnected) {
    try {
      await Profile.findOne({ id: profileID }, redeemed ? 'redeemedTitles' : 'earnedTitles', (err, data) => {
        if (err) throw err;
        titles = data ? (redeemed ? data.redeemedTitles : data.earnedTitles) : [];
      });
    }
    catch (err) {
      console.error(err);
    }
  }
  return new Promise(resolve => {
    resolve({ titles: titles });
  });
}

exports.getRedeemedTitlesForProfile = async function (profileID) {
  return getTitlesForProfile(profileID, true);
}

exports.getTitlesForDiscordUser = async function (discordId) {
}
