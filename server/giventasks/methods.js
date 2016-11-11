import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';

import {Answers} from '/model/answers';
import {GivenTasks} from '/model/giventasks';

import {subscribeUserToGivenTask} from './lib';

import sanitizeHtml from 'sanitize-html';

export default function () {
  Meteor.methods({

    /**
     * rate task by id
     * @param  {String}  taskId     task id
     * @param  {Number}  taskgrade  rating given
     * @return  {[type]}  [description]
     */
    rateTask(taskId, taskgrade) {
      check(taskId, String);
      check(taskgrade, Number);

      if (!Roles.userIsInRole(this.userId, [ 'tasks-review' ])) {
        throw new Meteor.Error(403, 'Access denied');
      }

      let grade = Math.ceil(taskgrade);

      // only "userId" and "taskId" required later
      const task = GivenTasks.findOne(taskId, {fields: { userId: 1, taskId: 1 }});

      if (task) {
        const programTask = Tasks._cache[task.taskId];

        if (programTask && programTask.maxgrade) {
          if (grade > programTask.maxgrade) {
            grade = programTask.maxgrade;
          }
          else if (grade < 0) {
            grade = 0;
          }

          // taskId is the same
          GivenTasks.update(taskId, {$set: {grade}});

          // we need only "_id" for update later
          const answer = Answers.findOne({taskId, taskRated: {$exists: true }}, {fields: {_id: 1}});

          if (answer) {
            return Answers.update(answer._id, {$set: {taskRated: grade}});
          }

          Answers.insert({
            taskId,
            userId: task.userId,
            taskRated: grade,
            read: false,
            createdAt: new Date()
          });

          Updates.registerEvent(task.userId, { type: 'ANSWERS' });
        }
      }
    },

    /**
     * apply report to task
     * @param  {String}  taskId      tack id
     * @param  {String}  taskReport  content of report
     * @return  {[type]}  [description]
     *
     */
    sendReport(taskId, taskReport) {
      check(taskId, String);
      check(taskReport, String);

      const givenTask = GivenTasks.findOne(taskId);

      if (!givenTask.report) increaseUsersCounter(this.userId, 'newTasksCount', -1);

      taskReport = sanitizeHtml(taskReport, sanitizeOptions);

      const changes = {
        draft: taskReport,
        draftUpdated: new Date(),
        report: { message: taskReport }
      };

      const taskDB = Tasks._cache[givenTask.taskId];
      const streamDB = Streams._cache[givenTask.streamId];

      const deadline = moment(streamDB.start).add(taskDB.end-1, 'days').set('hour', 12);

      changes.report.reportSendAt = (deadline.diff() > 0 || !givenTask.report ||
                                    (givenTask.report && moment(givenTask.report.reportSendAt).diff(deadline) > 0)) ?
                                    new Date() : givenTask.report.reportSendAt;

      if (!givenTask.oldReport && deadline.diff() < 0 && givenTask.report &&
          moment(givenTask.report.reportSendAt).diff(deadline) < 0) {
        changes.oldReport = givenTask.report;
      }

      GivenTasks.update({_id: taskId, userId: this.userId}, { $set: changes });

      const user = Meteor.users.findOne(this.userId, { fields: { "follows.followers": 1 } });

      if (givenTask.programId === Meteor.settings.public.CURRENT_PROGRAM && user.follows && user.follows.followers) {
        Feed.upsert({ givenTaskId: taskId }, { $set: {
          byUserId: this.userId,
          givenTaskId: taskId,
          title: taskDB.title,
          report: {
            reportSendAt: changes.report.reportSendAt
          },
          forUsers: user.follows.followers,
          createdAt: changes.report.reportSendAt
        } });
      }
    },

    /**
     * apply draft to task
     * @param  {String}  taskId      tack id
     * @param  {String}  draft  content of draft
     * @return  {[type]}  [description]
     *
     */

    sendReportDraft(taskId, draft) {
      check(taskId, String);
      check(draft, String);

      draft = sanitizeHtml(draft, sanitizeOptions);
      const draftUpdated = new Date();

      GivenTasks.update({_id: taskId, userId: this.userId}, {$set: { draft, draftUpdated}});
      return draftUpdated;
    },

    /**
     * apply shareText to task
     * @param  {String}  taskId      task id
     * @param  {String}  shareText  content of shareable text
     * @return  {[type]}  [description]
     *
     */
    editGivenTaskShareText(taskId, shareText) {
      check(taskId, String);
      check(shareText, String);

      shareText = sanitizeHtml(shareText, sanitizeOptions);

      GivenTasks.update({ _id: taskId, userId: this.userId }, {$set: { shareText } });
    },

    /**
     * apply new comment for task by id
     * @param  {String}  taskId     tack id
     * @param  {String}  message    comment content
     * @param  {Number}  inReplyTo  Optional, index of existed comment to reply to
     * @return  {[type]}  [description]
     *
     */
    sendComment(taskId, message, inReplyTo) {
      check(taskId, String);
      check(message, String);
      check(inReplyTo, Match.Maybe(Number));

      message = sanitizeHtml(message, sanitizeOptions);

      if (!Roles.userIsInRole(this.userId, [ 'tasks-review', 'programs-take-all', 'programs-take-free' ])) {
        throw new Meteor.Error(403, 'Access denied');
      }

      const createdAt = new Date();

      const comments = {
        inReplyTo,
        createdAt,
        message,
        ownerId: this.userId
      };

      GivenTasks.update(taskId, { $push: { comments }, $inc: { commentsCount: 1 } });

      const task = GivenTasks.findOne(taskId);

      const programTask = Tasks._cache[task.taskId];

      let commentByIndex;
      if (inReplyTo || inReplyTo === 0) {
        commentByIndex = task.comments[inReplyTo];
        if (commentByIndex && commentByIndex.ownerId !== this.userId) {
          Answers.insert({
            createdAt,
            userId: commentByIndex.ownerId,
            fromUserId: this.userId,
            commentId: taskId + '.' + (task.comments.length - 1),
            inReplyToCommentId: taskId + '.' + inReplyTo,
            read: false
          });

          Updates.registerEvent(commentByIndex.ownerId, { type: 'ANSWERS' });
        }
      }

      if (task.userId !== this.userId) {
        if (!commentByIndex || commentByIndex.ownerId !== task.userId) {
          Answers.insert({
            taskId,
            createdAt,
            userId: task.userId,
            fromUserId: this.userId,
            commentId: `${taskId}.${task.comments ? task.comments.length - 1 : 0}`,
            read: false
          });

          Updates.registerEvent(task.userId, { type: 'ANSWERS' });
        }

        if(Meteor.users.find({ _id: task.userId, 'profile.pushCommentsNotify': true }).count()) {
          BrowserNotifications.sendNotification({
            userId: task.userId,
            title: `Комментарий к отчету ${programTask.title}`,
            body: message.replace(/<[^>]+>/gm, ''),
            icon: "https://entry.spacebagel.com/fav-icon.png"
          });
        }

        if (!task.subscribers || !task.subscribers.includes(this.userId)) {
          subscribeUserToGivenTask(taskId, this.userId);
        }
      }

      if (task.subscribers) {
        const subs = _.without(task.subscribers, this.userId, commentByIndex ? commentByIndex.ownerId : '');

        subs.forEach((subscriber) => {
          Answers.insert({
            taskId,
            createdAt,
            userId: subscriber,
            fromUserId: this.userId,
            commentId: `${taskId}.${task.comments ? task.comments.length - 1 : 0}`,
            read: false,
            fromSubscription: true
          });

          Updates.registerEvent(subscriber, { type: 'ANSWERS' });
        });

        Meteor.users.find({ _id: { $in: subs }, 'profile.pushCommentsNotify': true }).forEach((subscriber) => {
          BrowserNotifications.sendNotification({
            userId: subscriber,
            title: `Комментарий к отчету ${programTask.title}`,
            body: message.replace(/<[^>]+>/gm, ''),
            icon: "https://entry.spacebagel.com/fav-icon.png"
          });
        });
      }
    },

    /**
     * edit comment content by task id and comment index
     * @param  {String}  taskId     task id
     * @param  {Number}  commentId  index of the comment
     * @param  {String}  message    content to replace previous
     * @return  {[type]}  [description]
     *
     * comment index - index? simple sorting could break the logic? OMG!
     */
    editComment(taskId, commentId, message) {
      check(taskId, String);
      check(commentId, Number);
      check(message, String);

      message = sanitizeHtml(message, sanitizeOptions);

      if (!Roles.userIsInRole(this.userId, [ 'tasks-review', 'programs-take-all', 'programs-take-free' ])) {
        throw new Meteor.Error(403, 'Access denied');
      }

      const task = GivenTasks.findOne(taskId);

      if (!task || !task.comments[commentId]) {
        throw new Meteor.Error(500, 'Cant find comment by index');
      }

      if (task.comments[commentId].ownerId === this.userId || Roles.userIsInRole(this.userId, [ 'moderator' ])) {
        const fieldPath = `comments.${commentId}.message`;
        const modifier = {[`${fieldPath}`]: message};

        GivenTasks.update(taskId, {$set: modifier});
      }
    },

    /**
     * deleto task comment by comment index
     * @param  {String}  taskId     task id
     * @param  {Number}  commentId  comment index
     * @return  {[type]}  [description]
     *
     * comment index - index? simple sorting could break the logic? OMG!
     */
    deleteComment(taskId, commentId) {
      check(taskId, String);
      check(commentId, Number);

      if (!Roles.userIsInRole(this.userId, [ 'tasks-review', 'programs-take-all', 'programs-take-free' ])) {
        throw new Meteor.Error(403, 'Access denied');
      }
      // kick unblock - we have to be shure all is done
      // this.unblock();

      const task = GivenTasks.findOne(taskId);

      if (!task || !task.comments[commentId]) {
        throw new Meteor.Error(500, 'Cant find comment by index');
      }

      if (task.comments[commentId].ownerId === this.userId || Roles.userIsInRole(this.userId, [ 'moderator' ])) {
        const likesCount = Likes.find({ commentId: `${taskId}.${commentId}` }).count();

        if (likesCount) increaseUsersCounter(task.comments[commentId].ownerId, 'commentsLikesCount', -likesCount);

        Likes.remove({ commentId: `${taskId}.${commentId}` });

        task.comments[commentId] = null;
        const comments = _.compact(task.comments);

        GivenTasks.update(taskId, { $set: { comments }, $inc: { commentsCount: -1 } });

        Answers.remove({ $or: [
          { commentId: `${taskId}.${commentId}` },
          { inReplyToCommentId: `${taskId}.${commentId}` }
        ]});
      }
    },

    /**
     * subscriber/unsubscribe user to/from GivenTask
     * @param  {String}  userId  user id
     * @param  {String}  taskId     task id§
     *
     */
    subscribeUserToGivenTask (taskId) {
      check(taskId, String);

      this.unblock();

      if (!this.userId) throw new Meteor.Error(403, 'Access denied');

      return subscribeUserToGivenTask(taskId, this.userId);
    },
    assignTasksToUser(userId) {
      if (!Roles.userIsInRole(this.userId, ['users-manage']))
        throw new Meteor.Error(403, 'Permission denied');

      const currentProgram = Programs.getCurrent();

      const loggerLastMessage = Logger.findOne({ section: "distributetasks" }, { sort: { createdAt: -1 } });

      const canAssign = !loggerLastMessage ||
                        (loggerLastMessage.message !== 'started' &&
                        moment().diff(moment(loggerLastMessage.createdAt).startOf('hour')) > 300000 &&
                        moment().diff(moment(loggerLastMessage.createdAt).startOf('hour')) < 14100000);

      if (canAssign) {
        const programId = currentProgram._id;
        const trialExpired = new Date() > new Date(currentProgram.properties.date3);

        const userSelector = trialExpired ?
        {
          _id: userId,
          'profile.programs': programId,
          $or: [
            {paidPrograms: programId},
            {roles: 'tasks-review'},
          ],
        } : { _id: userId, 'profile.programs': programId};

        const user = Meteor.users.findOne(userSelector, { fields: { tasks: 1, profile: 1, emails: 1 } });

        if (!user) return 'Пользователь не найден, или у пользователя нет текущей программы, или закончился триал';

        const maxTaskDayNumber = Math.floor(
          (new Date() - new Date(currentProgram.properties.startDate)) / (1000 * 60 * 60 * 24)) + 1;

        if (!maxTaskDayNumber) throw new Meteor.Error(403, 'maxTaskDayNumber is empty');

        const getTasksForDay = () => {
          const selector = {
            programId,
            start: { $lte: maxTaskDayNumber },
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

        const title = 'Новое задание';
        const icon = 'https://entry.spacebagel.com/fav-icon.png';

        const tasksIdsToEmmit = _.difference(tasksIds, user.tasks);

        if (!tasksIdsToEmmit.length) return 'Все задания уже выданы';

        const toAssignCount = tasksIdsToEmmit.length;

        const tasksIdsEmmited = [];

        const streamId = _.intersection(user.profile.streams, streamsIds)[0];
        const publicTask = user.profile.privacy === 'private';

        const notifyByPush = user.profile.pushTasksNotify;
        const notifyByEmail = user.profile.tasksnotify;

        const processTasksEmmited = () => {
          const tasks = _.chain(user.tasks || [])
            .union(tasksIdsEmmited)
            .compact()
            .value();

          Meteor.users.update(userId, {$set: {tasks}}, (error) => {
            if (error) throw new Meteor.Error(error);

            increaseUsersCounter(userId, 'newTasksCount', tasksIdsEmmited.length);
          });
        };

        const processNextTask = () => {
          if (!tasksIdsToEmmit.length) return processTasksEmmited();

          const taskId = tasksIdsToEmmit.pop();
          const upsertSelector = { taskId, userId, streamId, programId };
          const upsertModifier = { public: publicTask, createdAt: new Date() };

          GivenTasks.upsert(upsertSelector, {$set: upsertModifier}, (error, res) => {
            if (error) return processTasksEmmited();

            tasksIdsEmmited.push(taskId);

            const { insertedId } = res;

            if (notifyByPush && insertedId) {
              BrowserNotifications.sendNotification({
                userId,
                title,
                icon,
                body: `${(tasksMap[taskId] || {}).title}`,
              });
            }

            if (notifyByEmail && insertedId) {
              Meteor.call('sendNewTaskNotifications', user, tasksMap[taskId], streamsMap[streamId], insertedId);
            }

            processNextTask();
          });
        };

        processNextTask();
        return `Выдается ${toAssignCount} заданий.`;
      } else return 'Выдача заданий уже производится';
    }
  });
}
