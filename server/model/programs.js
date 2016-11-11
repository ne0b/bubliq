import sanitizeHtml from 'sanitize-html';

Meteor.methods({
  addProgram: function (newProgram, newProgramTasks, newProgramStreams) {
    check(newProgram, {
      title: String,
      desc: String,
      goals: String,
      tasks: Array,
      streams: Array,
      free: Boolean
    });

    check(newProgramTasks, Array);
    check(newProgramStreams, Array);

    if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
      throw new Meteor.Error('not-authorized');
    }
    this.unblock();

    newProgram.desc = sanitizeHtml(newProgram.desc, sanitizeOptions);

    const program = Programs.insert({
      title: newProgram.title,
      desc: newProgram.desc,
      goals: newProgram.goals,
      free: newProgram.free,
      createdAt: new Date()
    });

    trialToken = CryptoJS.MD5(program+";7s8xFQWmwmXERE5DUJqSgLqJ").toString();

    Programs.update(program, { $set: { trialToken } });

    if(newProgramTasks && newProgramTasks.length > 0){
      newProgramTasks.forEach(function(task) {
        task.desc = sanitizeHtml(task.desc, sanitizeOptions);

        Tasks.insert({
          title: task.title,
          type: task.type,
          desc: task.desc,
          start: task.start,
          duration: task.duration,
          end: task.end,
          required: task.required,
          periodic: task.periodic,
          programId: program,
          createdAt: new Date()
        });
      });
    }

    if(newProgramStreams && newProgramStreams.length > 0){
      newProgramStreams.forEach(function(stream) {
        Streams.insert({
          title: stream.title,
          start: stream.start,
          programId: program,
          createdAt: new Date()
        });
      });
    }
  },
  copyProgram: function (programId) {
    if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
      throw new Meteor.Error('not-authorized');
    }
    this.unblock();

    const existingProgram = Programs.findOne({ _id: programId });

    const program = Programs.insert({
      title: existingProgram.title,
      desc: existingProgram.desc,
      goals: existingProgram.goals,
      free: existingProgram.free,
      createdAt: new Date()
    });

    trialToken = CryptoJS.MD5(program+";7s8xFQWmwmXERE5DUJqSgLqJ").toString();

    Programs.update(program, { $set: { trialToken } });

    const existingTasks = Tasks.find({ programId: programId });

    if(existingTasks && existingTasks.fetch().length > 0){
      existingTasks.fetch().forEach(function(task) {
        Tasks.insert({
          title: task.title,
          type: task.type,
          desc: task.desc,
          start: task.start,
          duration: task.duration,
          end: task.end,
          required: task.required,
          periodic: task.periodic,
          programId: program,
          createdAt: new Date()
        });
      });
    }
  },
  deleteProgramStepOne: function (programId) {
    if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
      throw new Meteor.Error('not-authorized');
    }

    const users = Meteor.users.find({ "profile.programs":programId },
                                    {
                                      fields: {
                                        "profile.programs":1,
                                        "profile.streams":1,
                                        "paidPrograms":1
                                      }
                                    });

    const streamsIds = Streams.find({ programId:programId }).map((stream) => {
      return stream._id;
    });

    users.forEach((user) => {
      const usersPrograms = _.without(user.profile.programs, programId);
      const usersPaidPrograms = _.without(user.paidPrograms, programId);
      const usersStreams = _.difference(user.profile.streams, streamsIds);

      Meteor.users.update(user, { $set: { "profile.programs":usersPrograms,
                                          "paidPrograms":usersPaidPrograms,
                                          "profile.streams":usersStreams } });
    });

    const messagesIds = Messages.find({ $or: [
                                                { chat: programId },
                                                { chat: { $in: _.pluck(streamsIds, '_id')  } }
                                               ]
                                        }).map((message) => message._id);


    const answersToRemove = Answers.find({ messageId: { $in: messagesIds }, read: false }).fetch();

    Answers.remove({ messageId: { $in: messagesIds } });

    Messages.remove({ $or: [
                            { chat: programId },
                            { chat: { $in: _.pluck(streamsIds, '_id')  } }
                           ]
                    });

    return 30;
  },
  deleteProgramStepTwo: function (programId) {
    if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
      throw new Meteor.Error('not-authorized');
    }

    let giventasksIdsQuery = [];
    const giventasksIds = GivenTasks.find({ programId: programId }).map((giventask) => {
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

      const answersToRemove = Answers.find(giventasksIdsQueryRead).fetch();

      Answers.remove(giventasksIdsQuery);
    }

    const answersToRemove = Answers.find({ taskId: { $in: giventasksIds }, read: false }).fetch();

    Answers.remove({ taskId: { $in: giventasksIds } });

    Likes.remove({ taskId: { $in: giventasksIds } });

    return 60;
  },
  deleteProgramStepThree: function (programId) {
    if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
      throw new Meteor.Error('not-authorized');
    }

    Tasks.remove({ programId: programId });

    return 70;
  },
  deleteProgramStepFour: function (programId) {
    if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
      throw new Meteor.Error('not-authorized');
    }

    const giventasks = GivenTasks.find({ programId, report: { $exists: false } }, { fields: { userId: 1 } }).fetch();

    giventasks.forEach((giventask) => {
      increaseUsersCounter(giventask.userId, 'newTasksCount', -1);
    });

    GivenTasks.remove({ programId });

    return 85;
  },
  deleteProgramStepFive: function (programId) {
    if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
      throw new Meteor.Error('not-authorized');
    }

    Streams.remove({ programId: programId });

    return 95;
  },
  deleteProgramStepSix: function (programId) {
    if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
      throw new Meteor.Error('not-authorized');
    }

    Programs.remove(programId);

    return 100;
  },
  editProgram: function (newValues) {
    check(newValues, {
      _id: String,
      title: String,
      createdAt: Date,
      desc: String,
      goals: String,
      free: Boolean,
      trialToken: Match.Maybe(String)
    });

    if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
      throw new Meteor.Error('not-authorized');
    }
    this.unblock();

    newValues.desc = sanitizeHtml(newValues.desc, sanitizeOptions);

    const program = Programs.findOne(newValues._id);

    trialToken = program.trialToken ||
                 CryptoJS.MD5(program._id+";7s8xFQWmwmXERE5DUJqSgLqJ").toString();

    Programs.update(program._id,
     {
       $set: {
         "title": newValues.title,
         "desc": newValues.desc,
         "goals": newValues.goals,
         "free": newValues.free,
         trialToken
       }
     });
  },
  addProgramsToUser: function (programs, streams, stars, userId) {
    check(programs, Array);
    check(streams, Array);
    check(stars, Array);
    check(userId, String);

    if (!Roles.userIsInRole(this.userId, ['mentor-assign'])) {
      throw new Meteor.Error('not-authorized');
    }

    const user = Meteor.users.findOne(userId, { fields: { follows: 1, "profile.programs": 1, "profile.streams": 1, "profile.stars":1 } });

    const programsIds = (programs && programs.length > 0) ? programs.map((program) => {
      return program._id
    }) : [];

    const streamsIds = (streams && streams.length > 0) ? streams : [];

    const starsIds = (stars && stars.length > 0) ? stars : [];

    if (!_.isEqual(user.profile.programs, programsIds) || !_.isEqual(user.profile.streams, streamsIds) || !_.isEqual(user.profile.stars, starsIds)) {
      Meteor.users.update(userId, { $set: {
        "profile.programs": programsIds,
        "profile.streams": streamsIds,
        "profile.stars": starsIds
      } });

      if (!_.isEqual(user.profile.streams, streamsIds)) {
        user.profile.streams = user.profile.streams || [];

        let newStreams = _.difference(streamsIds, user.profile.streams);
        let deletedStreams = _.difference(user.profile.streams, streamsIds);

        if (newStreams.length > 0) {
          Meteor.users.update({ _id: { $ne: userId }, "profile.streams": { $in: newStreams } }, { $addToSet: { "follows.follows": userId, "follows.followers": userId } }, { multi: true });
        }

        if (deletedStreams.length > 0) {
          Meteor.users.update({ _id: { $ne: userId }, "profile.streams": { $in: deletedStreams } }, { $pull: { "follows.follows": userId, "follows.followers": userId } }, { multi: true });

          const follows = Meteor.users.find({ _id: { $ne: userId }, "profile.streams": { $in: streamsIds } }, { fields: { _id: 1 } }).fetch().map((user) => user._id);

          Meteor.users.update(userId, { $set: { "follows.follows": follows, "follows.followers": follows } });
        }
        else if (newStreams.length > 0) {
          const follows = Meteor.users.find({ _id: { $ne: userId }, "profile.streams": { $in: newStreams } }, { fields: { _id: 1 } }).fetch().map((user) => user._id);

          Meteor.users.update(userId, { $addToSet: { "follows.follows": { $each: follows }, "follows.followers": { $each: follows } } });
        }
      }
    }
  }
});
