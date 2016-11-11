
import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';

export default function () {
  Meteor.publish('mentorsData', function () {
    if (Roles.userIsInRole(this.userId, ['mentor-assign'])) {
      var rolespresets = Rolespresets.find({ "rights.tasksreview":true });

      const rolespresetIds = rolespresets.map((r) => r._id);

      return Meteor.users.find({
        $and:[
          {"emails.verified": true},
          {"profile.role": { $in: rolespresetIds }}
        ]}, {fields: {emails: 1, profile: 1, roles: 1, createdAt: 1}});
    }
  });
}
