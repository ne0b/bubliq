import {Migrations} from 'meteor/percolate:migrations';

// 01.02.01 normalize name and lastname for Users
const migrateAt10201 = () => {
  Meteor.users.find({ normalized: { $exists: false } }).forEach((user) => {

    let normalized = user.profile.name ?
                     user.profile.name.toLowerCase() : '🿿';

    normalized += user.profile.lastname ?
                  ` ${user.profile.lastname.toLowerCase()}` : '🿿';

    Meteor.users.update(user, { $set: { normalized } });
  });
};

// 01.06.10 set firstLetter for Users
const migrateAt10610 = () => {
  Meteor.users.find({ firstLetter: { $exists: false } }).forEach((user) => {
    let firstLetter = user.profile.name ? user.profile.name.toUpperCase()[0] : "🿿";

    Meteor.users.update(user, { $set: { firstLetter } });
  });
};

export default function () {
  // 01.02.01
  Migrations.add({
    version: 10201,
    name: 'normalize name and lastname for Users',
    up: migrateAt10201
  });

  // 01.06.10
  Migrations.add({
    version: 10610,
    name: 'set firstLetter for Users',
    up: migrateAt10610
  });
}
