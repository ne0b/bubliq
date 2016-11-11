
import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';
import {buildAdminUsersSelector} from './lib';

import {Stars} from '/model/stars';

export default function () {
  Meteor.publish('userProfileData', function(userId) {
    check(userId, Match.Maybe(String));

    userId = userId || this.userId;

    const fields = {
      profile: 1,
      "counters.givenTasksLikesCount": 1,
      "counters.commentsLikesCount": 1,
      "counters.messagesLikesCount": 1,
      "counters.programsCounters": 1,
    };
    if (Roles.userIsInRole(this.userId, ['tasks-review'])) fields["emails"] = 1;

    return Meteor.users.find(userId, { fields });
  });

  Meteor.publish('userTaskData', function(userId, limit) {
    check(userId, String);
    check(limit, Match.Maybe(Number));

    if (!this.userId) return this.ready();

    function transform(giventask) {
      giventask = setGiventaskInfo(giventask);

      if(giventask.stream && giventask.task){
        giventask.endtime = moment(giventask.stream.start).add(giventask.task.end-1, 'days').locale('ru').format("DD.MM, dd");
      }

      return giventask;
    }

    const currentUser = Meteor.users.findOne({ _id: this.userId }, { fields: { "tasks": 1 } });

    const name = 'giventasks';

    const givenTasksObserver = GivenTasks.find({ userId }, {
      sort: {
        createdAt: -1,
        _id: 1
      },
      limit: limit+10,
      fields: { userId:1, taskId:1, streamId:1, report:1, grade:1 }
    }).observe({
      added: (doc) => {
        if (Roles.userIsInRole(this.userId, ['tasks-assign']) ||
            userId === this.userId ||
            (currentUser.tasks && currentUser.tasks.includes(doc.taskId))) this.added(name, doc._id, transform(doc));
      },
      changed: (doc) => this.changed(name, doc._id, transform(doc)),
      removed: (doc) => this.removed(name, doc._id),
    });

    this.onStop(() => givenTasksObserver.stop());

    return this.ready();
  });

  /**
   * solves possible issues with default user profile
   * @return  {Array}  Array of livedate cursors
   */
  Meteor.publish(null, function () {
    if (!this.userId) {
      return this.ready();
    }
    return Meteor.users.find(this.userId, {fields: {profile: 1, paidPrograms: 1, trialPrograms: 1, counters: 1}});
  });

  /**
   * publish Admin user data list
   * @param  {Object}  filter params
   * @_limit {Number}  number of fetched element (undefined means 0)
   * @return  {LiveDataCursor}  Mongo Livedata Cursor
   */
  Meteor.publish('adminUsersData', function adminUsersData(params, _limit) {
    check(params, Object);

    if (!this.userId) {
      throw new Meteor.Error(403, 'Access denied');
    }

    if (!Roles.userIsInRole(this.userId, ['users-manage', 'mentor-assign'])) {
      throw new Meteor.Error(403, 'Access denied');
    }

    const selector = buildAdminUsersSelector(this.userId, params);

    const fields = {profile: 1, normalized: 1, emails: 1, referalsCount: 1};
    const limit = (_limit || 0) + 1;
    const sort = {normalized: 1};

    return [
      Meteor.users.find(selector, {fields, sort, limit}, {reactive: false}),
      Stars.find({})
    ]
  });

  /**
   * publish all Stars for Admin interface
   * @return  {LiveDataCursor}  Mongo Livedata Cursor
   */
  Meteor.publish('adminStars', function adminStars() {
    if (!this.userId) {
      throw new Meteor.Error(403, 'Access denied');
    }

    if (!Roles.userIsInRole(this.userId, ['users-manage', 'mentor-assign'])) {
      throw new Meteor.Error(403, 'Access denied');
    }
    return Stars.find({});
  });
}
