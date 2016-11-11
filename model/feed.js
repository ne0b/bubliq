import {Mongo} from 'meteor/mongo';

const Feed = new Mongo.Collection('feed');

if (global || window) {
  const g = (global || window);
  g.Feed = Feed;
}

export {Feed};
