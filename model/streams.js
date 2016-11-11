import {Mongo} from 'meteor/mongo';

const Streams = new Mongo.Collection('streams');

if (global || window) {
  const g = (global || window);
  g.Streams = Streams;
}

export {Streams};

