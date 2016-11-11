import {Mongo} from 'meteor/mongo';

const Updates = new Mongo.Collection('updates');

if (global || window) {
  const g = (global || window);
  g.Updates = Updates;
}

export {Updates};
