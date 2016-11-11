
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { getContactsCursors } from './lib';

export default function() {
  Meteor.methods({
    getMoreContacts(filterObject, searchString, limit, skip) {
      this.unblock();

      const user = Meteor.user();

      return getContactsCursors(user, filterObject, searchString, limit+1, skip).fetch();
    }
  });
}
