// import {Meteor} from 'meteor/meteor';
import {Feed} from '/model/feed';

export default function () {
  Feed._ensureIndex({forUsers: 1}, {background: true});
  Feed._ensureIndex({givenTaskId: 1}, {background: true});
  Feed._ensureIndex({createdAt: 1}, {background: true});
}
