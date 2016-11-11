import {Mongo} from 'meteor/mongo';

const GivenTasks = new Mongo.Collection('giventasks');

if (global || window) {
  const g = (global || window);
  g.GivenTasks = GivenTasks;
}

export {GivenTasks};
