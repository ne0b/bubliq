import {Mongo} from 'meteor/mongo';

const Adverts = new Mongo.Collection('adverts');
const Rules = new Mongo.Collection('rules');

if (global || window) {
  const g = (global || window);
  g.Adverts = Adverts;
  g.Rules = Rules;
}

export {Rules, Adverts};


