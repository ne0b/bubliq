import {Mongo} from 'meteor/mongo';

const Stars = new Mongo.Collection('stars');

if (global || window) {
  const g = (global || window);
  g.Stars = Stars;
}

export {Stars};

