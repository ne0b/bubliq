import {Meteor} from 'meteor/meteor';
import {Migrations} from 'meteor/percolate:migrations';
import {SyncedCron} from 'meteor/percolate:synced-cron';

import config from './config/index';
import answers from './answers';
import giventasks from './giventasks';
import orders from './orders';
import users from './users';
import tasks from './tasks';
import contacts from './contacts';
import mentors from './mentors';
import streams from './streams';
import programs from './programs';
import rolespresets from './rolespresets';
import feed from './feed';
import stars from './stars';

import chat from './chat';
import updates from './updates';
import logger from './logger';

logger();
config();

Meteor.startup(() => {
  Migrations.start();
  SyncedCron.start();
});

answers();
giventasks();
orders();
users();
contacts();
tasks();
mentors();
streams();
programs();
rolespresets();
feed();
stars();

updates();
chat();
