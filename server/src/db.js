const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
  },
  titles: [String],
})

const Profile = mongoose.model('Profile', profileSchema);

exports.connect = function () {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true
  });
}

exports.addProfile = function (profileID) {
  const profile = new Profile({ id: profileID, titles: [] });
  profile.save((err, data) => {
    if (err) console.log(err);
  });
}

exports.addTitleForProfile = function (profileID, title) {
  Profile.findOneAndUpdate({ id: profileID }, { $addToSet: { titles: [title] } }, { upsert: true }, (err, data) => {
    if (err) console.log(err);
  });
}

exports.getTitlesForProfile = async function (profileID) {
  var titles = [];
  try {
    titles = await Profile.findOne({ id: profileID }, 'titles', (err, data) => {
      if (err) throw err;
      titles = data.titles;
    });
  }
  catch (err) {
    console.log(err);
  }
  return titles;
}
