import {Mongo} from 'meteor/mongo';

const SentLetters = new Mongo.Collection('sentletters');

if (global || window) {
  const g = (global || window);
  g.SentLetters = SentLetters;
}

export {SentLetters};

