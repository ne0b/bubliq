
import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';

import {Tasks} from '/model/tasks';
import {GivenTasks} from '/model/giventasks';

export default function () {
  Meteor.publish('taskWall', function (streamId, taskId, limit) {
    check(streamId, String);
    check(taskId, String);
    check(limit, Match.Maybe(Number));

    limit += 1;

    const cachedUsers = [];

    function setOwnerInfo(object, userId) {
      if (!cachedUsers[userId])
           cachedUsers[userId] = Meteor.users.findOne(userId);

      object.owner = cachedUsers[userId];

      if(object.owner && object.owner.profile){
        if(object.owner.profile.privacy === 'private' || object.owner.profile.privacy === 'hidden') {
          object.owner.profile.avatar = Meteor.users.getAvatarProps('private');
        } else {
          object.owner.profile.avatar = Meteor.users.getAvatarProps(object.owner._id);
        }
        object.owner.profile.fullname = [object.owner.profile.name, object.owner.profile.lastname].join(' ').replace(/\s+/g, ' ').trim();
      }

      return object;
    }

    function transform(giventask, userId) {
      giventask = setGiventaskInfo(giventask);

      if(giventask.stream && giventask.task){
        giventask.starttime = moment(giventask.stream.start).add(giventask.task.start-1, 'days').locale('ru').format("DD.MM, dd");
      }

      giventask = setOwnerInfo(giventask, giventask.userId);

      if (giventask.task && !(giventask.task.shareTitle && giventask.task.shareTitle.length > 0)) {
        giventask.task.shareTitle = giventask.task.title;
      }

      giventask.likes = Likes.find({taskId: giventask._id}, {limit: 8})
        .map((like) => {
          return setOwnerInfo(like, like.userId);
        });

      if (giventask.comments) {
        giventask.comments = giventask.comments.slice(-5).map((comment) => {
          comment = setOwnerInfo(comment, comment.ownerId);

          comment.likes = Likes.find({ commentId: giventask._id + "." + giventask.comments.indexOf(comment) }, {limit: 8})
            .map((like) => {
              return setOwnerInfo(like, like.userId);
            });

          const commentId = `${giventask._id}.${giventask.comments.indexOf(comment)}`;
          const userlike = Likes.find({userId, commentId}).count();

          comment.userLikeColor = userlike
            ? 'color: rgba(16, 108, 200, 0.82) !important;'
            : 'color: rgba(0, 0, 0, 0.541176) !important;';

          comment.likescount = comment.likescount || 0;
          return comment;
        });
      }

      const taskId = giventask._id;
      const userlike = Likes.find({userId, taskId}).count();

      giventask.userLikeColor = userlike
        ? 'color: rgba(16, 108, 200, 0.82) !important;'
        : 'color: rgba(0, 0, 0, 0.541176) !important;';

      giventask.likescount = giventask.likescount || 0;

      return giventask;
    };

    let currentUser = Meteor.users.findOne({ _id: this.userId });

    if (!currentUser.tasks.includes(taskId) &&
        !currentUser.roles.includes('tasks-assign')) return this.ready();

    const selector = {
      "streamId": streamId,
      "taskId": taskId,
      "report": {
        $exists: true
      }
    };
    const sort = { "report.reportSendAt": -1 };
    const reactive = true;

    const givenTasksCursor = GivenTasks.find(selector, { limit, sort }, { reactive });

    const name = 'giventasks';

    const givenTasksObserver = givenTasksCursor.observe({
      added: (doc) => this.added(name, doc._id, transform(doc, this.userId)),
      changed: (doc) => this.changed(name, doc._id, transform(doc, this.userId)),
      removed: (doc) => this.removed(name, doc._id),
    });

    this.onStop(() => givenTasksObserver.stop());

    return this.ready();
  });
}
