import {Meteor} from 'meteor/meteor';
import {Feed} from '/model/feed';
import lib from './lib';

lib();

export default function() {
  Meteor.methods({
    getMoreFeed(limit, skip) {
      check(limit, Number);
      check(skip, Number);

      this.unblock();

      const stubUserId = this.userId;

      // kick off unauthorized
      if (!stubUserId) return;

      return getFeedCursor(limit, skip, stubUserId).fetch();
    },
    getFeedCount() {
      this.unblock();

      // kick off unauthorized
      if (!this.userId) return;

      return Feed.find({ forUsers: this.userId }).count();
    },
    getNewFeed(difference) {
      check(difference, Number);

      this.unblock();

      const stubUserId = this.userId;

      // kick off unauthorized
      if (!stubUserId) return;

      return getFeedCursor(difference, 0, stubUserId).fetch();
    }
  });
}
