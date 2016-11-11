import {Mongo} from 'meteor/mongo';

const Programs = new Mongo.Collection('programs');

if (global || window) {
  const g = (global || window);
  g.Programs = Programs;
}

export {Programs};

