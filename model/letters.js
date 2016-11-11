import {Mongo} from 'meteor/mongo';

const Letters = new Mongo.Collection('letters');

if (global || window) {
  const g = (global || window);
  g.Letters = Letters;
}

export {Letters};

