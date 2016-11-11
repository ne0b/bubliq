import {Meteor} from 'meteor/meteor';

export default function() {
  Meteor.methods({
    getStreamWallTasks(programId, streamId, limit, skip) {
      this.unblock();

      check(programId, String);
      check(streamId, String);
      check(limit, Match.Optional(Number));
      check(skip, Match.Optional(Number));

      let currentUser = Meteor.users.findOne(this.userId, { fields: { profile: 1, tasks: 1, roles: 1, trialPrograms: 1 } });

      if (!currentUser.profile.streams.includes(streamId) &&
          !currentUser.roles.includes('tasks-assign')) throw new Meteor.Error('not-authorized');

      const stream = Streams._cache[streamId];
      const program = Programs._cache[programId];

      let daysPaid = 0;

      if (program && program.free) {
        daysPaid = 0;
      } else if (!currentUser.roles.includes('programs-take-all') &&
                  moment(Meteor.settings.public.CURRENT_PROGRAM_TRIAL_LAST_DAY).diff(moment(), 'seconds') > 0 &&
                  _.findWhere(currentUser.trialPrograms, { _id: Meteor.settings.public.CURRENT_PROGRAM })) {
        daysPaid = moment(Meteor.settings.public.CURRENT_PROGRAM_TRIAL_LAST_DAY).diff(stream.start, 'days');

        if (daysPaid >= 0) {
          daysPaid += 1;
        }
      }

      let streamStartAt = moment().diff(stream.start, 'days');
      let streamStartAtSeconds = moment().diff(stream.start, 'seconds');

      const currentUserTasksIds = currentUser.tasks && currentUser.tasks.length > 0 ?
                                        { $in: currentUser.tasks } : null;

      let differenceInTime = streamStartAt + 1;
      if (daysPaid && differenceInTime > daysPaid) differenceInTime = daysPaid;

      let tasksQuery = currentUser.roles.includes('tasks-assign') ?
                        { programId, start: { $lte: differenceInTime } } :
                        { _id: currentUserTasksIds, programId };

      if (streamStartAtSeconds < 0) throw new Meteor.Error('not-authorized');

      function transformTask(task) {
        task.starttime = moment(stream.start).add(task.start-1, 'days').locale('ru').format("dd, DD.MM.YYYY");
        return task;
      }

      return Tasks.find(tasksQuery, {
                      limit: limit+1,
                      skip,
                      sort: {
                        "start": -1,
                        "createdAt": -1
                      },
                      transform: transformTask
                    }).fetch();
    },
    addStream: function (stream, programId) {
      check(stream, Object);
      check(programId, String);

      if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
        throw new Meteor.Error('not-authorized');
      }
      this.unblock();

      const streamDB = _.findWhere(Streams._cache, { title: stream.title, programId });

      if (!streamDB) {
        let newStream = Streams.insert({
          title: stream.title,
          start: stream.start,
          programId,
          createdAt: new Date()
        });

        const newStarsCount = 6;

        for (let i = 1; i <= newStarsCount; i++) {
          Stars.insert({
            title: `Звездочка ${i}`,
            streamId: newStream,
            programId,
            createdAt: new Date()
          });
        }
      }
    },
    editStream: function (stream) {
      check(stream, Object);

      if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
        throw new Meteor.Error('not-authorized');
      }
      this.unblock();

      if (!Streams.find({ _id: { $ne: stream._id }, title: stream.title, programId: stream.programId }).count()) {
        Streams.update(stream._id,
         {$set:
           {
             "title": stream.title,
             "start": stream.start,
             "coordinator": stream.coordinator,
             "trainer": stream.trainer
          }
         });
      } else throw new Meteor.Error('already-exists');
    },
    deleteStreamStepOne: function (streamId) {
      check(streamId, String);

      if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
        throw new Meteor.Error('not-authorized');
      }

      const stream = Streams.findOne({ _id:streamId })

      const users = Meteor.users.find({ "profile.streams":streamId },
                                      {
                                        fields: {
                                          "profile.programs":1,
                                          "profile.streams":1
                                        }
                                      });

      Meteor.users.update({ "profile.programs": stream.programId }, { $pull: { "profile.programs": stream.programId } }, { multi: true });
      Meteor.users.update({ "profile.streams": streamId }, { $pull: { "profile.streams": streamId } }, { multi: true });

      return 30;
    },
    deleteStreamStepTwo: function (streamId) {
      check(streamId, String);

      if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
        throw new Meteor.Error('not-authorized');
      }

      const messagesIds = Messages.find({ chat: streamId }).map((message) => message._id);

      Answers.remove({ messageId: { $in: messagesIds } });

      const chat = Chats.findOne({ subject: streamId });

      if (chat) {
        Messages.remove({ chat: chat._id });

        Chats.remove({ subject: streamId });
      }

      return 45;
    },
    deleteStreamStepThree: function (streamId) {
      check(streamId, String);

      if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
        throw new Meteor.Error('not-authorized');
      }

      let giventasksIdsQuery = [];
      const giventasksIds = GivenTasks.find({ streamId: streamId }).map((giventask) => {
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
      }

      Answers.remove({ taskId: { $in: giventasksIds } });

      Likes.remove({ taskId: { $in: giventasksIds } });

      return 85;
    },
    deleteStreamStepFour: function (streamId) {
      check(streamId, String);

      if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
        throw new Meteor.Error('not-authorized');
      }

      const giventasks = GivenTasks.find({ streamId, report: { $exists: false } }, { fields: { userId: 1 } }).fetch();

      giventasks.forEach((giventask) => {
        increaseUsersCounter(giventask.userId, 'newTasksCount', -1);
      });

      GivenTasks.remove({ streamId });

      return 95;
    },
    deleteStreamStepFive: function (streamId) {
      check(streamId, String);

      if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
        throw new Meteor.Error('not-authorized');
      }

      const streamStars = Stars.find({ streamId }).fetch();

      streamStars.forEach(({ _id }) => {
        Meteor.users.update({ "profile.stars": _id }, { $pull: { "profile.stars": _id } }, { multi: true });

        Meteor.users.update({ "captainInStars": _id }, { $pull: { "captainInStars": _id } }, { multi: true });
      });

      Stars.remove({ streamId });

      Streams.remove(streamId);

      return 100;
    }
  });
}
