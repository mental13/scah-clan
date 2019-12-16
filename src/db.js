const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
  },
  discordId: String,
  token: String,
  earnedTitles: [String],
  redeemedTitles: [String],
  lastUpdate: Number
})

const Profile = mongoose.model('Profile', profileSchema);

var dbConnected = false;
exports.connect = async function () {
  const connectPromise = mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true
  }).catch(error => {
    throw error;
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

  return connectPromise;
}

exports.getDataByProfileId = async function (profileId) {
  if (!dbConnected) return;

  return Profile.findOne({ id: profileId })
    .then(data => {
      if (!data) throw `No entry with profile ID: ${profileId}`;
      return data;
    })
    .catch(errorMessage => {
      throw new Error(errorMessage);
    });
}

exports.getDataByDiscordId = async function (discordId) {
  if (!dbConnected) return;

  return Profile.findOne({ discordId: discordId })
    .then(data => {
      if (!data) throw `No entry with discord ID: ${discordId}`;
      return data;
    })
    .catch(errorMessage => {
      throw new Error(errorMessage);
    });
}

exports.getAllUsersWithKey = async function (key) {
  if (!dbConnected) return;

  return Profile.find({ [key]: { $ne: null } })
    .then(data => {
      if (!data || data.length == 0) throw `No registered users in DB`;
      return data;
    })
    .catch(errorMessage => {
      throw new Error(errorMessage);
    });
}

exports.addDataToProfile = async function (profileId, updateQuery) {
  if (!dbConnected) return;

  return Profile.findOneAndUpdate({ id: profileId }, updateQuery, { upsert: true, new: true })
    .catch(errorMessage => {
      throw new Error(errorMessage);
    });
}
