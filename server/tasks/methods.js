
import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';

import {Tasks} from '/model/tasks';

import sanitizeHtml from 'sanitize-html';

export default function () {
  Meteor.methods({
    getTaskInfo(taskId) {
      this.unblock();
      return Tasks.findOne(taskId);
    },
    addTask: function (task, programId) {
      check(task, {
        _id: null,
        title: String,
        type: String,
        desc: String,
        start: Number,
        duration: Number,
        maxgrade: Match.Maybe(Number),
        periodic: Boolean,
        shareable: Boolean,
        notStandardAdvertMessage: Boolean,
        advertMessage: String,
        shortDesc: String,
        shareTitle: String,
        end: Number
      });
      check(programId, String);

      task.desc = sanitizeHtml(task.desc, sanitizeOptions);

      if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
        throw new Meteor.Error('not-authorized');
      }
      this.unblock();

      Tasks.insert({
        title: task.title,
        type: task.type,
        desc: task.desc,
        start: task.start,
        duration: task.duration,
        end: task.end,
        maxgrade: task.maxgrade,
        periodic: task.periodic,
        shareable: task.shareable,
        notStandardAdvertMessage: task.notStandardAdvertMessage,
        advertMessage: task.advertMessage,
        shortDesc: task.shortDesc,
        shareTitle: task.shareTitle,
        programId: programId,
        createdAt: new Date()
      });
    },
    editTask: function (task) {
      check(task, {
        _id: String,
        title: String,
        type: String,
        desc: String,
        start: Number,
        duration: Number,
        maxgrade: Match.Maybe(Number),
        periodic: Boolean,
        shareable: Boolean,
        notStandardAdvertMessage: Boolean,
        advertMessage: String,
        shortDesc: String,
        shareTitle: String,
        end: Number
      });

      task.desc = sanitizeHtml(task.desc, sanitizeOptions);

      if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
        throw new Meteor.Error('not-authorized');
      }

      Tasks.update({_id:task._id},
       {$set:
         {
           "title": task.title,
           "type": task.type,
           "desc": task.desc,
           "start": task.start,
           "duration": task.duration,
           "end": task.end,
           "maxgrade": task.maxgrade,
           "periodic": task.periodic,
           "shareable": task.shareable,
           "notStandardAdvertMessage": task.notStandardAdvertMessage,
           "advertMessage": task.advertMessage,
           "shortDesc": task.shortDesc,
           "shareTitle": task.shareTitle
        }
       });
    },
    deleteTaskStepOne: function (taskId) {
      check(taskId, String);

      if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
        throw new Meteor.Error('not-authorized');
      }

      let giventasksIdsQuery = [];
      const giventasksIds = GivenTasks.find({ taskId: taskId }).map((giventask) => {
        giventasksIdsQuery.push({
          commentId: {
            '$regex': giventask._id+'.*'
          }
        });

        return giventask._id;
      });

      if (giventasksIdsQuery.length > 0) {
        giventasksIdsQueryRead = {
          $or: giventasksIdsQuery,
          read: false
        };
        giventasksIdsQuery = {
          $or: giventasksIdsQuery
        };

        Likes.remove(giventasksIdsQuery);

        Answers.remove(giventasksIdsQuery);

        Answers.remove({ taskId: { $in: giventasksIds } });

        Likes.remove({ taskId: { $in: giventasksIds } });
      }

      return 85;
    },
    deleteTaskStepTwo: function (taskId) {
      check(taskId, String);

      if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
        throw new Meteor.Error('not-authorized');
      }

      const giventasks = GivenTasks.find({ taskId, report: { $exists: false } }, { fields: { userId: 1 } }).fetch();

      giventasks.forEach((giventask) => {
        increaseUsersCounter(giventask.userId, 'newTasksCount', -1);
      });


      GivenTasks.remove({ taskId });

      return 95;
    },
    deleteTaskStepThree: function (taskId) {
      check(taskId, String);

      if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
        throw new Meteor.Error('not-authorized');
      }

      Tasks.remove(taskId);

      return 100;
    }
  });
}
