import {Meteor} from 'meteor/meteor';
import {Migrations} from 'meteor/percolate:migrations';
import {SyncedCron} from 'meteor/percolate:synced-cron';

import {saveAvatarFromStream, composeUserSearchTerms} from './lib';

// 01.00.04 add paidPrograms to Users
const migrateAt10004 = () => {
  Meteor.users.update({
    paidPrograms: {
      $exists: false
    }
  }, {
    $set: {
      paidPrograms: []
    }
  }, {
    multi: true
  })
};

// 01.00.05 mark current rookies as paid for Base-4
const migrateAt10005 = () => {
  const paidrole = Rolespresets.findOne({
    "title": "Rookie"
  });

  const base4 = Programs.findOne({
    _id: "4Kf8ve2HxgNf53GiY"
  });

  const base5 = Programs.findOne({
    _id: "vgrZkhetM6sLhJiMY"
  });

  if (paidrole && base4 && base5)
    Meteor.users.update({
      "profile.role": paidrole._id,
      "paidPrograms": { $nin: [base4._id, base5._id] }
    }, {
      $push: {
        paidPrograms: base4._id
      }
    }, {
      multi: true
    });
};


// 01.00.06 subscribe all users to push notifications
const migrateAt10006 = () => {
  Meteor.users.update({
    "profile.pushTasksNotify": {
      $exists: false
    },
    "profile.pushCommentsNotify": {
      $exists: false
    },
    "profile.pushLikesNotify": {
      $exists: false
    }
  }, {
    $set: {
      "profile.pushTasksNotify": true,
      "profile.pushCommentsNotify": true,
      "profile.pushLikesNotify": true
    }
  }, {
    multi: true
  })
};

// 01.02.02 unite profile.place and profile.city for Users
const migrateAt10202 = () => {
  Meteor.users.find({ profile: { $exists: true }, "profile.town": { $exists: false } }).forEach((user) => {
    let town = user.profile.city ?
                     user.profile.city : '';

    town += user.profile.place ?
                  `, ${user.profile.place}` : '';

    Meteor.users.update(user, { $set: { "profile.town": town } });
  });

  Meteor.users.update({ "profile.town": { $exists: true } },
                      { $unset: { "profile.place":1, "profile.city":1 } },
                      { multi: true });
};

// 01.02.03 Base-4 rookies to exrookies
const migrateAt10203 = () => {
  const paidrole = Rolespresets.findOne({"title": "Rookie"});
  const expaidrole = Rolespresets.findOne({"title": "ExRookie"});

  const base4 = Programs.findOne({
    _id: "4Kf8ve2HxgNf53GiY"
  });

  if (paidrole && expaidrole && base4) {
    Meteor.users.update({ "profile.role":paidrole._id, paidPrograms: ['4Kf8ve2HxgNf53GiY'] },
                        { $set: { "profile.role":expaidrole._id } }, { multi: true });
  }
};

// 01.03.10 add referals to Users
const migrateAt10310 = () => {
  Meteor.users.update({ referals: { $exists: false }},
                      { $set: { referals: [], referalsCount: 0 } },
                      { multi: true });
};

// 01.05.02 add counters to Users
const migrateAt10502 = () => {
  Meteor.users.update({ counters: { $exists: false }},
                      { $set: { counters: {} } },
                      { multi: true });
};

// 01.05.04 set current newTasksCount to Users
const migrateAt10504 = () => {
  const users = Meteor.users.find({ "counters.newTasksCount": { $exists: false }});

  users.forEach((user) => {
    const newTasksCount = GivenTasks.find({ userId: user._id, report: { $exists: false } }).count();

    increaseUsersCounter(user._id, 'newTasksCount', newTasksCount);
  });
};

// 01.06.05 remapAvatarsToFS
const migrateAt10605 = () => {
  const modifier = {'profile.avatarOnFS': ''};
  Meteor.users.update({}, {$unset: modifier}, {multi: true});

  // saver for post 10605
  if (typeof Avatars === 'undefined') {
    return;
  }

  SyncedCron.add({
    name: 'remapAvatarsToFS',
    schedule(parser) {
      return parser.text('every 2 min');
    },
    job() {
      const selector = {'profile.avatar': {$exists: true}, 'profile.avatarOnFS': {$exists: false}};
      const fields = {_id: 1, 'profile.avatar': 1};
      const limit = 100;

      const updateUserProfile = (_id, res = false) => {
        return Meteor.users.update(_id, {$set: {'profile.avatarOnFS': res}});
      };

      const wrapAndSaveImageSync = Meteor.wrapAsync(saveAvatarFromStream);

      const usersCrs = Meteor.users.find(selector, {fields, limit});

      if (!usersCrs.count()) {
        return SyncedCron.remove('remapAvatarsToFS');
      }

      usersCrs.forEach(({_id, profile}) => {
        const avatar = Avatars.findOne(profile.avatar);

        if (avatar) {
          try {
            const res = wrapAndSaveImageSync(avatar.createReadStream(), _id);
            updateUserProfile(_id, res);
          } catch (e) {
            updateUserProfile(_id, e.message || e.toString());
          }
        }
      });
    },
  });
};

// 01.06.17 reformat Users streams and programs
const migrateAt10617 = () => {
  const users = Meteor.users.find({}, { fields: { profile: 1, tasks: 1 } });

  users.forEach((user) => {
    let usersStreams = [];
    let usersPrograms = [];
    let usersTasks = [];

    if (user.profile && user.profile.streams) {
      usersStreams = user.profile.streams.map((stream) => {
        return stream._id ? stream._id : stream;
      });
    }

    if (user.profile && user.profile.programs) {
      usersPrograms = user.profile.programs.map((program) => {
        return program._id ? program._id : program;
      });
    }

    if (user.tasks) {
      usersTasks = user.tasks.map((task) => {
        return task._id ? task._id : task;
      });
    }

    Meteor.users.update(user._id, { $set: { "profile.streams": usersStreams,
                                            "profile.programs": usersPrograms,
                                            "tasks": usersTasks } });
  });
};

// 01.06.18 set current likes counters to Users
const migrateAt10618 = () => {
  Meteor.users.update({ "counters.givenTasksLikesCount": { $exists: true }},
                      { $unset: {
                        "counters.givenTasksLikesCount":"",
                        "counters.commentsLikesCount":"",
                        "counters.messagesLikesCount":"",
                      } }, { multi: true });

  const users = Meteor.users.find({ "profile.streams": { $exists: true }}, { fields: { "profile.streams":1 } });

  users.forEach((user) => {
    let programsCounters = [];

    user.profile.streams.forEach((stream) => {
      let givenTasksLikesCount = 0;
      let commentsLikesCount = 0;

      const giventasks = GivenTasks.find({ userId: user._id, streamId: stream },
                                                { fields: { _id: 1, comments: 1 } });

      giventasks.forEach((giventask) => {
        const likesCount = Likes.find({ taskId: giventask._id }).count();

        givenTasksLikesCount += likesCount;

        if (giventask.comments) {
          giventask.comments.forEach((comment, index) => {
            const commentId = `${giventask._id}.${index}`;
            const commentLikesCount = Likes.find({ commentId }).count();

            commentsLikesCount += commentLikesCount;
          });
        }
      });

      programsCounters.push({
        _id: stream,
        givenTasksLikesCount,
        commentsLikesCount
      });
    });

    Meteor.users.update(user._id, { $set: { "counters.programsCounters": programsCounters } });
  });
};

// 01.06.20 set new trial for Users
const migrateAt10620 = () => {
  Meteor.users.update({ "profile.trial":true,
                        createdAt: { $gte: new Date("2016-07-25") },
                        trialPrograms: { $exists: false } }, { $set: {
    trialPrograms: [{
      _id: "thNTCCEoPqvncdpcx",
      free: true,
      addedAt: new Date()
    }]
  } }, { multi: true });

  Meteor.users.update({ "profile.trial":true,
                        createdAt: { $gte: new Date("2016-07-25") },
                        trialPrograms: { $type: 3 } }, { $set: {
    trialPrograms: [{
      _id: "thNTCCEoPqvncdpcx",
      free: true,
      addedAt: new Date()
    }]
  } }, { multi: true });

  Meteor.users.update({ trialPrograms: { $exists: false } }, { $set: { trialPrograms: [] } }, { multi: true });

  Orders.update({ paid: false, programId: { $exists: false } }, { $set: { programId: Meteor.settings.public.CURRENT_PROGRAM } });
};

// 01.06.23 fix referals
const migrateAt10623 = () => {
  const users = Meteor.users.find({ referals: { $ne: null, $ne: [] } });

  users.forEach((user) => {
    let referals = _.compact(user.referals.map((referal, index) => {
      if (_.filter(user.referals, (uref) => uref.paymentSum === referal.paymentSum &&
                   uref.paymentDate !== referal.paymentDate && uref._id === referal._id).length > 0) {
        user.referals[index] = {};
        referal = false;
      } else referal.programId = Meteor.settings.public.CURRENT_PROGRAM;

      return referal;
    }));



    Meteor.users.update(user._id, { $set: { referals, referalsCount: referals.length } });
  });
};

// 01.06.26 set follows to Users
const migrateAt10626 = () => {
  const streams = Streams.find({}, { fields: { _id: 1 } });

  streams.forEach((stream) => {
    const users = Meteor.users.find({ "profile.streams": stream._id },
                                      { fields: { _id: 1 } }).fetch();

    const follows = users.map((user) => user._id);

    users.forEach((user) => {
      const usersFollows = follows.filter((follow) => follow !== user._id);

      Meteor.users.update(user, { $set: { "follows.follows": usersFollows,
                                          "follows.followers": usersFollows } });
    });
  });
};

// 01.06.31 setup search string
const migrateAt10631 = () => {
  // const selector = {ftss: {$exists: false}};
  const selector = {};
  const fields = {profile: 1, emails: 1};

  const usersList = Meteor.users.find(selector, {fields}).fetch();

  const processNextUser = () => {
    if (!usersList.length) {
      return;
    }

    const data = usersList.pop();
    const ftss = composeUserSearchTerms(data);

    Meteor.users.update(data._id, {$set: {ftss}}, () => {
      return processNextUser();
    });
  };

  processNextUser();
};


export default function () {
  // 01.00.04
  Migrations.add({
    version: 10004,
    name: 'add paidPrograms to Users',
    up: migrateAt10004
  });

  // 01.00.05
  Migrations.add({
    version: 10005,
    name: 'mark current rookies as paid for Base-4',
    up: migrateAt10005
  });

  // 01.00.06
  Migrations.add({
    version: 10006,
    name: 'subscribe all users to push notifications',
    up: migrateAt10006
  });

  // 01.02.02
  Migrations.add({
    version: 10202,
    name: 'unite profile.place and profile.city for Users',
    up: migrateAt10202
  });

  // 01.02.03
  Migrations.add({
    version: 10203,
    name: 'Base-4 rookies to exrookies',
    up: migrateAt10203
  });

  // 01.03.10
  Migrations.add({
    version: 10310,
    name: 'add referals to Users',
    up: migrateAt10310
  });

  // 01.05.02 add counters to Users
  Migrations.add({
    version: 10502,
    name: 'add counters to Users',
    up: migrateAt10502
  });

  // 01.05.04 set current newTasksCount to Users
  Migrations.add({
    version: 10504,
    name: 'set current newTasksCount to Users',
    up: migrateAt10504
  });

  // 01.06.05 remapAvatarsToFS
  Migrations.add({
    version: 10605,
    name: 'remapAvatarsToFS',
    up: migrateAt10605,
  });

  // 01.06.17 reformat Users streams and programs
  Migrations.add({
    version: 10617,
    name: 'reformat Users streams and programs',
    up: migrateAt10617,
  });

  // 01.06.18 set current likes counters to Users
  Migrations.add({
    version: 10618,
    name: 'set current likes counters to Users',
    up: migrateAt10618,
  });

  // 01.06.20 set new trial for Users
  Migrations.add({
    version: 10620,
    name: 'set new trial for Users',
    up: migrateAt10620,
  });

  // 01.06.23 fix referals
  Migrations.add({
    version: 10623,
    name: 'fix referals',
    up: migrateAt10623,
  });

  // 01.06.26 set follows to Users
  Migrations.add({
    version: 10626,
    name: 'set follows to Users',
    up: migrateAt10626,
  });

  // 01.06.31 setup search string
  Migrations.add({
    version: 10631,
    name: 'setup search string',
    up: migrateAt10631,
  });
}
