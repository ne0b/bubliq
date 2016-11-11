import {Mongo} from 'meteor/mongo';

const Tasks = new Mongo.Collection('tasks');

if (global || window) {
  const g = (global || window);
  g.Tasks = Tasks;
}

export {Tasks};
