import {Migrations} from 'meteor/percolate:migrations';

/*
// 01.06.14 merge streams
const migrateAt10614 = () => {
  const mergeStreams = (streamTo, streamFrom) => {
    GivenTasks.update({ streamId: streamFrom }, { $set: { streamId: streamTo } }, { multi: true });

    const users = Meteor.users.find({ "profile.streams":streamFrom });

    users.forEach((user) => {
      let streamsIds = user.profile.streams.map((s) => {
        return (s._id == streamFrom) ? {_id: streamTo} : s;
      });

      Meteor.users.update(user, { $set: { "profile.streams":streamsIds } });
    });

    Streams.remove(streamFrom);
  }

  mergeStreams("SbCvHpNynrcSwd9HY", "CXWYcdwNhBEGyuLzD"); // 2-ой с 6-ым
  mergeStreams("fwPYXXKAB2Ftpz2sM", "FmGsF8534WwGHNoXB"); // 3-ий с 7-ым
  mergeStreams("fwPYXXKAB2Ftpz2sM", "9L5MS5wAwQtGrbfAW"); // 3-ий с 8-ым
  mergeStreams("5M6rnhF5EGed3qiLD", "LJASwBsDcE8n7SwnC"); // 4-ый с 1-ым

  Meteor.users.update({ "profile.streams": "ZvYrFciXzsD8NQJHB" }, { $set: { "profile.mentor": "znksXwGwk5NdLGA7o" } }, { multi: 1 }); // 1-ый - Елена Морозова
  Meteor.users.update({ "profile.streams": "SbCvHpNynrcSwd9HY" }, { $set: { "profile.mentor": "tPSxNPMrj99tBwcMu" } }, { multi: 1 }); // 2-ый - Мария Фалалеева
  Meteor.users.update({ "profile.streams": "fwPYXXKAB2Ftpz2sM" }, { $set: { "profile.mentor": "n9QshxZoSGWL6zPC2" } }, { multi: 1 }); // 3-ый - Юля Аделова
  Meteor.users.update({ "profile.streams": "5M6rnhF5EGed3qiLD" }, { $set: { "profile.mentor": "puxdzvQJrxJE96wFb" } }, { multi: 1 }); // 4-ый - Анна Соколова
};*/

export default function () {
  // 01.06.14 merge streams
  /*Migrations.add({
    version: 10614,
    name: 'merge streams',
    up: migrateAt10614
  });*/
}
