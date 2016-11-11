import {Mongo} from 'meteor/mongo';

const Answers = new Mongo.Collection('answers');

if (global || window) {
  const g = (global || window);
  g.Answers = Answers;
}

export {Answers};
