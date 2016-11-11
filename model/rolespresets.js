import {Mongo} from 'meteor/mongo';

const Rolespresets = new Mongo.Collection('rolespresets');

if (global || window) {
  const g = (global || window);
  g.Rolespresets = Rolespresets;
}

export {Rolespresets};


