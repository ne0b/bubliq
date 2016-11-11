import {Mongo} from 'meteor/mongo';

const Likes = new Mongo.Collection('likes');

if (global || window) {
  const g = (global || window);
  g.Likes = Likes;
}

export {Likes};
