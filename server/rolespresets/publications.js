import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';

export default function () {
  Meteor.publish('rolespresets', function() {
    let allowedFields = Roles.userIsInRole(this.userId, ['users-manage', 'mentor-assign']) ? {
      fields: {
        title: 1,
        rights: 1,
        weight: 1
      }
    } : {
      fields: {
        title: 1,
        weight: 1
      }
    };

    return Rolespresets.find({}, allowedFields);
  });
}
