import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';

import {Migrations} from 'meteor/percolate:migrations';
import DeviceParser from 'device';

// -----------------------------------------------------------------------------
// check user activity
// we are going to handle 'not active' only if no calls after 5 minutes

let usersActivitity = {};

const markUserActive = (_id, userAgent, callback = () => {}) => {  

  const modifier = {
    'profile.online': true,
    'profile.lastActivity': new Date(),
    'profile.lastDevice': DeviceParser(userAgent).type
  };

  Meteor.users.update({_id}, {$set: modifier}, callback);
};

const markUserUnactive = (_id, callback = () => {}) => {
  const selector = {
    _id: _.isArray(_id) ? {$in: _id} : _id,
    'profile.online': true
  };

  const modifier = {
    'profile.online': false,
    'profile.lastActivity': new Date()
  };

  Meteor.users.update(selector, {$set: modifier}, {multi: true}, callback);
};

Meteor.methods({
  tickUserActivity(userAgent = '') {
    check(userAgent, String);
    
    this.unblock();

    const userId = this.userId;

    if (!userId) {
      return;
    }

    if (!userAgent.length) {
      userAgent = (this.connection.httpHeaders && this.connection.httpHeaders['user-agent']);
    }

    // we havnt wach for this user, so make him active
    if (!usersActivitity[userId]) {
      markUserActive(userId, userAgent);
    }

    usersActivitity[userId] = Date.now();
  }
});


Meteor.setInterval(() => {
  // user should be active at least 5 mins ago
  const minLastTime = Date.now() - 5 * 60 * 1000;

  const unactiveIds = _.chain(usersActivitity)
    .map((lastTime, key) => {
      return lastTime < minLastTime && key;
    })
    .compact()
    .value();

  if (unactiveIds.length) {
    // mark users offline and pass last activity datetime
    markUserUnactive(unactiveIds, false);

    // delete unactive ids from usersActivitity (watcher)
    usersActivitity = _.omit(usersActivitity, unactiveIds);
  }

}, 5 * 60 * 1000);

// mark all users unactive

Meteor.startup(() => {
  Meteor.users.update({'profile.online': true}, {$set: {'profile.online': false}}, {multi: true});
});

// -----------------------------------------------------------------------------
// migrations
// -----------------------------------------------------------------------------

Migrations.add({
  version: 1,
  name: 'Migrate users lastVisit',
  up: () => {
    const selector = {'profile.lastActivity': {$exists: false}};
    const fields = {_id: 1, createdAt: 1};
    
    Meteor.users.find(selector, {fields}).forEach(({_id, createdAt}) => {
      const modifier = {
        'profile.lastActivity': createdAt,
        'profile.lastDevice': 'desktop'
      };

      Meteor.users.update(_id, {$set: modifier});
    });
  }
});
