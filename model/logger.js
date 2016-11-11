import {Mongo} from 'meteor/mongo';
import {Meteor} from 'meteor/meteor';

const Logger = new Mongo.Collection('logger');

Logger.TYPES = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  SUCCESS: 'SUCCESS',
  INFO: 'INFO',
};

if (global || window) {
  const g = (global || window);
  g.Logger = Logger;
}

export {Logger};
