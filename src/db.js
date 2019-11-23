const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
  },
  discordId: String,
  titles: [String],
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

exports.addTitleForProfile = function (profileID, title) {
  if (dbConnected) {
    Profile.findOneAndUpdate({ id: profileID }, { $addToSet: { titles: [title] } }, { upsert: true }, (err, data) => {
      if (err) console.error(err);
    });
  }
}

exports.getTitlesForProfile = async function (profileID) {
  var titles = [];
  if (dbConnected) {
    try {
      await Profile.findOne({ id: profileID }, 'titles', (err, data) => {
        if (err) throw err;
        titles = data ? data.titles : [];
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
