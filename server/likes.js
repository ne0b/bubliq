Meteor.methods({
  likeGivenTask: function (taskId) {
    check(taskId, String);
    this.unblock();

    if (!this.userId) throw new Meteor.Error('not-authorized');

    const userId = this.userId;

    const task = GivenTasks.findOne(taskId, { fields: { userId: 1, streamId: 1 } });

    if (task.userId === userId) return;

    const like = Likes.findOne({ userId, taskId });
    const exAnswer = Answers.findOne({ taskId, likesCount: { $exists: true } }, { fields : { likesUsers: 1, read: 1 }});

    let likesUsers = exAnswer && exAnswer.likesUsers ? exAnswer.likesUsers : [];
    const alreadyLiked = likesUsers.includes(userId) || like ? -1 : 1;

    if (like) {
      likesUsers = likesUsers.filter((id) => id !== userId);
      Likes.remove(like._id);

      increaseUsersProgramsCounter(task.userId, task.streamId, 'givenTasksLikesCount', -1);
    } else {
      likesUsers.push(userId);
      Likes.insert({ userId, taskId });

      increaseUsersProgramsCounter(task.userId, task.streamId, 'givenTasksLikesCount', 1);
    }

    let likesCount = likesUsers.length;

    GivenTasks.update(task, { $set: { likescount: likesCount } });

    if (exAnswer && alreadyLiked < 0 && exAnswer.likesUsers && exAnswer.likesUsers.length === 1) {
      if (!exAnswer.read) Updates.disposeEvent(task.userId, { type: 'ANSWERS' }, -1);

      Answers.remove(exAnswer._id);
    }
    else if (exAnswer) {
      if (exAnswer.read) Updates.registerEvent(task.userId, { type: 'ANSWERS' });

      Answers.update(exAnswer._id, {$set: {likesCount, likesUsers, createdAt: new Date(), read: false}});
    }
    else {
      Answers.insert({
        taskId,
        createdAt: new Date(),
        userId: task.userId,
        likesCount,
        likesUsers,
        read: false
      });

      Updates.registerEvent(task.userId, { type: 'ANSWERS' });

      if(Meteor.users.find({ _id: task.userId, 'profile.pushLikesNotify': true }).count()) {
        BrowserNotifications.sendNotification({
          userId: task.userId,
          title: `${Meteor.user().profile.name} понравился ваш отчет`,
          body: '',
          icon: "https://entry.spacebagel.com/fav-icon.png"
        });
      }
    }
  },
  likeTaskComment: function (taskId, commentId) {
    check(taskId, String);
    check(commentId, Number);
    this.unblock();

    const userId = this.userId;

    if (!userId) {
      throw new Meteor.Error('not-authorized');
    }

    const commentIndex = commentId;
    commentId = taskId+"."+commentId;

    const task = GivenTasks.findOne({ _id: taskId });

    const commentOwner = task.comments[commentIndex].ownerId;

    if (commentOwner === userId) return;

    const like = Likes.findOne({ userId, commentId });
    const exAnswer = Answers.findOne({ commentId, likesCount: { $exists: true } }, { fields : { likesUsers: 1, read: 1 }});

    let likesUsers = exAnswer && exAnswer.likesUsers ? exAnswer.likesUsers : [];
    const alreadyLiked = likesUsers.includes(userId) || like ? -1 : 1;

    if (like) {
      likesUsers = likesUsers.filter((id) => id !== userId);
      Likes.remove(like._id);

      increaseUsersProgramsCounter(commentOwner, task.streamId, 'commentsLikesCount', -1);
    } else {
      likesUsers.push(userId);
      Likes.insert({ userId, commentId });

      increaseUsersProgramsCounter(commentOwner, task.streamId, 'commentsLikesCount', 1);
    }

    let likesCount = likesUsers.length;

    let updatetask = {};
    updatetask["comments." + commentIndex + ".likescount"] = likesCount;
    GivenTasks.update(task, { $set: updatetask });

    if (exAnswer && alreadyLiked < 0 && exAnswer.likesUsers && exAnswer.likesUsers.length === 1) {
      if (!exAnswer.read) Updates.disposeEvent(commentOwner, { type: 'ANSWERS' }, -1);

      Answers.remove(exAnswer._id);
    }
    else if (exAnswer) {
      if (exAnswer.read) Updates.registerEvent(commentOwner, { type: 'ANSWERS' });

      Answers.update(exAnswer._id, {$set: {likesCount, likesUsers, createdAt: new Date(), read: false}});
    }
    else {
      Answers.insert({
        commentId,
        createdAt: new Date(),
        userId: commentOwner,
        likesCount,
        likesUsers,
        read: false
      });

      Updates.registerEvent(commentOwner, { type: 'ANSWERS' });

      if(Meteor.users.find({ _id: task.userId, 'profile.pushLikesNotify': true }).count()) {
        BrowserNotifications.sendNotification({
          userId: commentOwner,
          title: `${Meteor.user().profile.name} понравился ваш комментарий`,
          body: '',
          icon: "https://entry.spacebagel.com/fav-icon.png"
        });
      }
    }
  }
});
