import {Migrations} from 'meteor/percolate:migrations';

// 01.06.25 create and assign stars to users
const migrateAt10625 = () => {
  const streams = Streams.find({}).fetch();

  streams.forEach((stream) => {
    if (!Stars.find({ streamId: stream._id }).count()) {
      let star = Stars.insert({
        title: 'Звездочка',
        streamId: stream._id
      });

      Meteor.users.update({ "profile.streams":stream._id }, { $addToSet: { "profile.stars":star } }, { multi:true });
    }
  });
};

export default function () {
  // 01.06.25
  Migrations.add({
    version: 10625,
    name: 'create and assign stars to users',
    up: migrateAt10625
  });
}
