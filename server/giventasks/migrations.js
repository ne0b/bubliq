import {GivenTasks} from '/model/giventasks';
import {Migrations} from 'meteor/percolate:migrations';

// 01.00.02 hot fix
const migrateAt10002 = () => {
  GivenTasks.find({comments: null}).forEach(({_id, comments}) => {
    comments = _.compact(comments);
    GivenTasks.update(_id, {$set: {comments}});
  });
};

// 01.05.05 fix likescount for GivenTasks and comments
const migrateAt10505 = () => {
  const giventasks = GivenTasks.find({ likesRecounted: { $exists: false } }, { fields: { _id:1, comments:1 } });

  giventasks.forEach((task) => {
    let likescount = Likes.find({ taskId: task._id }).count();

    GivenTasks.update(task._id, { $set: { likescount } });

    task.comments.forEach((comment, index) => {
      likescount = Likes.find({ commentId: task._id+"."+index }).count();

      let updatetask = {};
      updatetask["comments." + index + ".likescount"] = likescount;
      GivenTasks.update(task._id, { $set: updatetask });
    });
  });

  GivenTasks.update({}, { $set: { likesRecounted: true } }, { multi: true });
};

// 01.06.13 set commentsCount for GivenTasks
const migrateAt10613 = () => {
  const giventasks = GivenTasks.find({ commentsCount: { $exists: false } }, { fields: { comments: 1 } });

  giventasks.forEach((task) => {
    let commentsCount = task.comments.length;

    GivenTasks.update(task._id, { $set: { commentsCount } });
  });
};

// 01.06.15 set draft for GivenTasks
const migrateAt10615 = () => {
  const giventasks = GivenTasks.find({ draft: { $exists: false }, report: { $exists: true } }, { fields: { report: 1 } });

  giventasks.forEach((task) => {
    GivenTasks.update(task._id, { $set: { draft: task.report.message, draftUpdated: task.report.reportSendAt } });
  });
};

// 01.06.27 reset GivenTasks
const migrateAt10627 = () => {
  const giventasks = GivenTasks.find({ programId: { $ne: Meteor.settings.public.CURRENT_PROGRAM }, createdAt: { $gte: moment(Meteor.settings.public.CURRENT_PROGRAM_START_DAY).toDate() } }).fetch();

  giventasks.forEach((task) => {
    if (!task.report) increaseUsersCounter(task.userId, 'newTasksCount', -1);

    Meteor.users.update(task.userId, { $pull: { tasks: task.taskId } });

    GivenTasks.remove(task._id);
  });
};

// 01.06.30 fix Answers for GivenTasks comments subscribers
const migrateAt10630 = () => {
  const answers = Answers.find({ taskId: { $exists:true }, fromUserId: { $exists:true }, fromSubscription: { $exists: false } }, { fields: { taskId:1, userId:1 } });

  answers.forEach((answer) => {
    const giventask = GivenTasks.findOne(answer.taskId, { fields: { userId:1 } });

    if (giventask && giventask.userId !== answer.userId) {
      Answers.update(answer._id, { $set: { fromSubscription: true } });
    }
  });
};

export default function () {
  // 01.00.02
  Migrations.add({
    version: 10002,
    name: 'Fix NULL in Giventask comments',
    up: migrateAt10002
  });

  // 01.05.05 fix likescount for GivenTasks and comments
  Migrations.add({
    version: 10505,
    name: 'fix likescount for GivenTasks and comments',
    up: migrateAt10505
  });

  // 01.06.13 set commentsCount for GivenTasks
  Migrations.add({
    version: 10613,
    name: 'set commentsCount for GivenTasks',
    up: migrateAt10613
  });

  // 01.06.15 set draft for GivenTasks
  Migrations.add({
    version: 10615,
    name: 'set draft for GivenTasks',
    up: migrateAt10615
  });

  // 01.06.27 reset GivenTasks
  Migrations.add({
    version: 10627,
    name: 'reset GivenTasks',
    up: migrateAt10627
  });

  // 01.06.30 fix Answers for GivenTasks comments subscribers
  Migrations.add({
    version: 10630,
    name: 'fix Answers for GivenTasks comments subscribers',
    up: migrateAt10630
  });
}
