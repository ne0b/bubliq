import {Feed} from '/model/feed';
import {Migrations} from 'meteor/percolate:migrations';

// 01.06.16
const migrateAt10616 = () => {
  const giventasks = GivenTasks.find({ programId: "vgrZkhetM6sLhJiMY", report: { $exists: true } }).fetch();

  let tasksCache = [];
  let usersCache = [];

  giventasks.forEach((giventask) => {
    const taskDB = tasksCache[giventask.taskId] || {};

    if (!usersCache[giventask.userId])
      usersCache[giventask.userId] = Meteor.users.findOne(giventask.userId, { fields: { "follows.followers": 1 } });

    const user = usersCache[giventask.userId] || {};

    const newFeed = {
      byUserId: giventask.userId,
      givenTaskId: giventask._id,
      title: taskDB.title,
      report: giventask.report,
      forUsers: user.follows && user.follows.followers ? user.follows.followers : [],
      createdAt: giventask.report.reportSendAt
    }

    const feedDB = Feed.findOne({ givenTaskId: giventask._id }, { fields: { _id: 1 } });

    if (!feedDB) {
      Feed.insert(newFeed);
    }
  });
};

export default function () {
  // 01.06.16
  Migrations.add({
    version: 10616,
    name: 'Generate users giventask feed',
    up: migrateAt10616
  });
}
