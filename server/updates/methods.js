import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';
import {Updates} from '/model/updates';


export default function () {
  Meteor.methods({
    disposeEvent(selector, count) {
      if (!this.userId) {
        throw new Meteor.Error(403, 'Access denied');
      }

      check(selector, Match.OneOf(Object));
      check(count, Match.Maybe(Number));

      if (count === 0) {
        return;
      }

      this.unblock();
      return Updates.disposeEvent(this.userId, selector, count);
    },
  });
}
