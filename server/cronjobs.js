import {Meteor} from 'meteor/meteor';
import {SyncedCron} from 'meteor/percolate:synced-cron';

import {Programs} from '/model/programs';
import {Streams} from '/model/streams';
import {Tasks} from '/model/tasks';
import {GivenTasks} from '/model/giventasks';

import {Logger} from '/model/logger';

SyncedCron.add({
  name: 'Присвоить задания пользователям в зависимости от текущего дня потока программы',
  schedule(parser) {
    return parser.text(Meteor.settings.TASK_DISTRIBUTION_SCHEDULE || 'every 4 hours');
  },
  job() {
    const jobStartDate = new Date();

    const jobLogger = Logger.define('distributetasks', {jobStartDate});

    const currentProgram = Programs.findOne({'properties.isCurrent': true});

    if (!currentProgram) {
      jobLogger.warning('currentProgram is empty');
      return;
    }

    const programId = currentProgram._id;
    const trialExpired = new Date() > new Date(currentProgram.properties.date3);

    const maxTaskDayNumber = Math.floor(
      (new Date() - new Date(currentProgram.properties.startDate)) / (1000 * 60 * 60 * 24)) + 1;


    jobLogger.extInfo = _.extend(jobLogger.extInfo, {
      programId,
      trialExpired,
      maxTaskDayNumber,
    });

    if (!maxTaskDayNumber) {
      jobLogger.warning('maxTaskDayNumber is empty');
      return;
    }

    const getTasksForDay = () => {
      const selector = {
        programId,
        start: maxTaskDayNumber,
      };

      return _.reduce(Tasks.find(selector, {sort: {start: 1}}).fetch(), (memo, item) => {
        return _.extend(memo, {[`${item._id}`]: item});
      }, {});
    };

    const getStreamsForProgram = () => {
      return _.reduce(Streams.find({programId}).fetch(), (memo, item) => {
        return _.extend(memo, {[`${item._id}`]: item});
      }, {});
    };

    const streamsMap = getStreamsForProgram();
    const streamsIds = _.keys(streamsMap);
    const tasksMap = getTasksForDay();
    const tasksIds = _.keys(tasksMap);

    const selector = trialExpired ?
    {
      'profile.programs': programId,
      $or: [
        {paidPrograms: programId},
        {roles: 'tasks-review'},
      ],
    } : {'profile.programs': programId};

    const fields = {tasks: 1, profile: 1, emails: 1};

    const usersList = Meteor.users.find(selector, {fields}).fetch();

    jobLogger.extInfo.usersListLength = usersList.length;
    jobLogger.info('started');

    const title = 'Новое задание';
    const icon = 'https://entry.spacebagel.com/fav-icon.png';

    let totalTasksEmmited = 0;

    const processNextUser = () => {
      if (!usersList.length) {
        const jobEndDate = new Date();
        jobLogger.success('job done', {totalTasksEmmited, jobEndDate});
        return;
      }

      const user = usersList.pop();
      const userId = user._id;

      const streamId = _.intersection(user.profile.streams || [], streamsIds)[0];

      if (!streamId) {
        return processNextUser();
      }

      const tasksIdsToEmmit = _.difference(tasksIds, user.tasks || []);

      if (!tasksIdsToEmmit.length) {
        return processNextUser();
      }

      const tasksIdsEmmited = [];

      const publicTask = user.profile.privacy === 'private';
      const notifyByPush = user.profile.pushTasksNotify;
      const notifyByEmail = user.profile.tasksnotify;

      const processTasksEmmited = () => {
        const tasks = _.chain(user.tasks || [])
          .union(tasksIdsEmmited)
          .compact()
          .value();

        Meteor.users.update(userId, {$set: {tasks}}, (error) => {
          if (error) {
            const jobEndDate = new Date();
            jobLogger.error(error.message, {totalTasksEmmited, jobEndDate, error});

            throw new Meteor.Error(error);
          }
          increaseUsersCounter(userId, 'newTasksCount', tasksIdsEmmited.length);

          totalTasksEmmited += tasksIdsEmmited.length;
          processNextUser();
        });
      };

      const processNextTask = () => {
        if (!tasksIdsToEmmit.length) {
          return processTasksEmmited();
        }

        const taskId = tasksIdsToEmmit.pop();
        const upsertSelector = {taskId, userId, streamId, programId};
        const upsertModifier = {public: publicTask, createdAt: new Date()};

        GivenTasks.upsert(upsertSelector, {$set: upsertModifier}, (error, res) => {
          if (error) {
            jobLogger.warning('given task upsert error', {totalTasksEmmited, upsertSelector, error});
            return processTasksEmmited();
          }

          tasksIdsEmmited.push(taskId);

          const {insertedId} = res;

          if (notifyByPush && insertedId) {
            BrowserNotifications.sendNotification({
              userId,
              title,
              icon,
              body: `${(tasksMap[taskId] || {}).title}`,
            });
          }

          if (notifyByEmail && insertedId) {
            try {
              Meteor.call('sendNewTaskNotifications', user, tasksMap[taskId], streamsMap[streamId], insertedId);
            } catch (callError) {
              jobLogger.error('send email notification error', {error: callError});
              return processTasksEmmited();
            }
          }

          processNextTask();
        });
      };

      return processNextTask();
    };

    return processNextUser();
// });
  },
});
