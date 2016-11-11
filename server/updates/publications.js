import {Meteor} from 'meteor/meteor';
import {Updates} from '/model/updates';

export default function () {
  Meteor.publish(null, function allUpdatesForUser() {
    if (!this.userId) {
      return this.ready();
    }

    return Updates.find({user: this.userId});
  });
}
