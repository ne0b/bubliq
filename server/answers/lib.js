
export default function() {
  getAnswersCursor = (limit, skip, userId) => {
    const sort = {
      createdAt: -1
    };

    return Answers.find({ userId }, {
      sort,
      limit,
      skip,
      transform: transformAnswers
    });
  }

  const givenTaskCache = {};
  const cachedUsers = {};
  const cachedMessages = {};

  const transformAnswers = (answer) => {
    if (!cachedUsers[answer.fromUserId]) cachedUsers[answer.fromUserId] = Meteor.users.findOne({ _id: answer.fromUserId },
               { fields: { "profile.name": 1, "profile.lastname": 1, "profile.avatar": 1, "profile.privacy": 1 }});
    answer.fromUser = cachedUsers[answer.fromUserId];

    if (answer.fromUser) {
      answer.fromUser.profile.avatar = Meteor.users.getAvatarProps(answer.fromUserId);
    } else {
      answer.anonAvatar = {
        style: 'background-color: rgb(0, 0, 0);',
        url: {
          thumb: '/images/anonymous_avatar.png'
        }
      }
    }

    if (answer.likesUsers) {
      answer.likesUsers = answer.likesUsers.slice(-10).map((user) => {
        let like = { owner: { profile: {} }, userId: user };

        if (!cachedUsers[user]) cachedUsers[user] = Meteor.users.findOne({ _id: user },
                   { fields: { "profile.name": 1, "profile.lastname": 1 }});
        const owner = cachedUsers[user];

        if (owner) {
          const { profile } = owner;

          like.owner.profile.avatar = Meteor.users.getAvatarProps(user);
          like.owner.profile.fullname = [profile.name || '', profile.lastname || ''].join(" ").replace(/\s+/g, " ").trim();
        }

        return like;
      });
    }

    if (answer.taskId) {
      if (!givenTaskCache[answer.taskId])
           givenTaskCache[answer.taskId] = GivenTasks.findOne({ _id:answer.taskId });
      const giventask = givenTaskCache[answer.taskId];

      if (giventask) {
        answer.givenTaskUserId = giventask.userId;
        answer.task = _.pick(Tasks._cache[giventask.taskId], 'title');
      }
    }

    if (!answer.task && answer.commentId) {
      if (!givenTaskCache[answer.commentId.split('.')[0]])
           givenTaskCache[answer.commentId.split('.')[0]] = GivenTasks.findOne({ _id:answer.commentId.split('.')[0] });
      const giventask = givenTaskCache[answer.commentId.split('.')[0]];

      if (giventask) {
        answer.givenTaskUserId = giventask.userId;
        answer.task = _.pick(Tasks._cache[giventask.taskId], 'title');
      }
    }

    if (answer.task && answer.givenTaskUserId !== answer.userId) {
      if (!cachedUsers[answer.givenTaskUserId]) cachedUsers[answer.givenTaskUserId] = Meteor.users.findOne({ _id: answer.givenTaskUserId },
                 { fields: { "profile.name": 1, "profile.lastname": 1, "profile.avatar": 1, "profile.privacy": 1 }});
      answer.ownerFullname = cachedUsers[answer.givenTaskUserId] ? [cachedUsers[answer.givenTaskUserId].profile.name || '', cachedUsers[answer.givenTaskUserId].profile.lastname || ''].join(" ").replace(/\s+/g, " ").trim() : 'Пользователь не найден';
    }

    if (answer.messageId) {
      if (!cachedMessages[answer.messageId])
           cachedMessages[answer.messageId] = Messages.findOne({_id:answer.messageId}, {fields: { "text":1, "chat":1 }});
      let messageDB = cachedMessages[answer.messageId];
      answer.message = messageDB || { text: 'сообщение удалено' };
    }

    if (answer.inReplyId) {
      if (!cachedMessages[answer.inReplyId])
           cachedMessages[answer.inReplyId] = Messages.findOne({_id:answer.inReplyId}, {fields: { "text":1, "chat":1 }});
      let messageDB = cachedMessages[answer.inReplyId];
      answer.inReplyMessage = messageDB || { text: 'сообщение удалено' };
    }

    if (answer.createdAt) answer.sentTime = moment(answer.createdAt).locale('ru').format("HH:mm, DD.MM");

    return answer
  }
}
