import {Answers} from '/model/answers';
import {Migrations} from 'meteor/percolate:migrations';

// 01.00.01
const migrateAt10001 = () => {
  Answers.update({ read: { $exists: false } }, {$set: {read: false}}, {multi: true});
};

// 01.05.01 Unify likes in Answers
const migrateAt10501 = () => {
  let answers = Answers.find({ likesCount: { $exists: false },
                                 likesUsers: { $exists: false },
                                 likeId: { $exists: true },
                                 messageId: { $exists: true } }).fetch();

  const messageIds = [];

  answers.forEach(({ messageId, userId }) => {
    if (!messageIds.includes(messageId)) {
      messageIds.push(messageId);

      const sameAnswers = answers.filter((answer) => answer.messageId === messageId);

      const likesUsers = sameAnswers.map((answer) => answer.fromUserId);

      const likesCount = likesUsers.length;

      Answers.remove({ messageId });

      Answers.insert({
        messageId,
        createdAt: new Date(),
        userId,
        likesCount,
        likesUsers,
        read: false
      });
    }
  });

  answers = Answers.find({ likesCount: { $exists: false },
                                 likesUsers: { $exists: false },
                                 likeId: { $exists: true },
                                 taskId: { $exists: true } }).fetch();

  const taskIds = [];

  answers.forEach(({ taskId, userId }) => {
    if (!taskIds.includes(taskId)) {
      taskIds.push(taskId);

      const sameAnswers = answers.filter((answer) => answer.taskId === taskId);

      const likesUsers = sameAnswers.map((answer) => answer.fromUserId);

      const likesCount = likesUsers.length;

      Answers.remove({ taskId });

      Answers.insert({
        taskId,
        createdAt: new Date(),
        userId,
        likesCount,
        likesUsers,
        read: false
      });
    }
  });

  answers = Answers.find({ likesCount: { $exists: false },
                                 likesUsers: { $exists: false },
                                 likeId: { $exists: true },
                                 commentId: { $exists: true } }).fetch();

  const commentIds = [];

  answers.forEach(({ commentId, userId }) => {
    if (!commentIds.includes(commentId)) {
      commentIds.push(commentId);

      const sameAnswers = answers.filter((answer) => answer.commentId === commentId);

      const likesUsers = sameAnswers.map((answer) => answer.fromUserId);

      const likesCount = likesUsers.length;

      Answers.remove({ commentId });

      Answers.insert({
        commentId,
        createdAt: new Date(),
        userId,
        likesCount,
        likesUsers,
        read: false
      });
    }
  });
};


export default function () {
  // 01.00.01
  Migrations.add({
    version: 10001,
    name: 'Set read as false for all Answers',
    up: migrateAt10001
  });

  // 01.05.01
  Migrations.add({
    version: 10501,
    name: 'Unify likes in Answers',
    up: migrateAt10501
  });
}
