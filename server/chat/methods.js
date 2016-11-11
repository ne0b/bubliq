import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';
import {Messages, Chats} from '/model/chats';
import {Updates} from '/model/updates';
import {Likes} from '/model/likes';
import {createChat, notifyChatUsers} from './lib';

/**
 * check user accessibility for particular message
 * @param  {String|Object}  message    Message id or Message doc
 * @param  {String}  owner  user id
 * @return  {Boolean}  can access?
 */
const messageAccessibleForUser = (message, owner) => {
  if (_.isString(message)) {
    return Boolean(Messages.find({message, owner}).count());
  }

  return (message || {}).owner === owner;
};

/**
 * Checks if user can iterate by his role and payment status
 * @param  {String}  userId  User Id
 * @return  {Boolean}  can access?
 */
const checkUserAccessByPayment = (userId) => {
  const accessRoles = [
    'programs-take-all',
    'tasks-review',
    'tasks-assign',
    'moderator',
    'users-manage',
  ];
  const trialEnded = new Date() > new Date(Meteor.settings.public.CURRENT_PROGRAM_TRIAL_LAST_DAY);
  const fields = trialEnded ? {roles: 1} : {roles: 1, trialPrograms: 1};
  const user = Meteor.users.findOne(userId, {fields});

  if (_.intersection(user.roles || [], accessRoles).length) {
    return true;
  }

  const currentProgram = Meteor.settings.public.CURRENT_PROGRAM;

  if (trialEnded && _.some(user.trialPrograms || {}, (v) => v._id === currentProgram)) {
    return false;
  }

  return true;
};

/**
 * checks if Chat accessible for user
 * @param  {String|Onject}  chat    Chat id ior Chat doc
 * @param  {String}  userId  User id
 * @return  {Boolean}  can access?
 */
const checkUserAccessForChat = (chat, userId) => {
  const chatData = _.isString(chat) ?
    Chats.findOne(chat, {fields: {stuffUsers: 1, type: 1}}) : chat;
  if (!chatData || (!(chatData.stuffUsers || []).includes(userId))) {
    return false;
  }

  if (chatData.type === Chats.TYPES.PRIVATE) {
    return true;
  }

  return checkUserAccessByPayment(userId);
};

// -----------------------------------------------------------------------------
// No unblock here!
// have to prevent methods stubm cause we may have messages queue
// so make shure we handle them in correct order
// -----------------------------------------------------------------------------

export default function () {
  Meteor.methods({
    /**
     * Applies new msg for DB
     * @param  {String}  text      message content
     * @param  {String}  chat    chat id
     * @param  {String}  replyId   id of the massage reply to
     * @return  {[type]}  [description]
     */
    sendMessage(text, chat, replyId) {
      check(text, String);
      check(replyId, Match.Maybe(String));

      const chatData = Chats.findOne(chat, {fields: {type: 1, stuffUsers: 1}});

      if (!checkUserAccessForChat(chatData, this.userId)) {
        throw new Meteor.Error(403, 'Access denied');
      }

      const createdAt = new Date();

      const msgData = {
        text,
        chat,
        createdAt,
        owner: this.userId,
        uuts: Date.now(),
      };

      if (replyId) {
        const fields = {text: 1, owner: 1, createdAt: 1};
        const reply = Messages.findOne(replyId, {fields});

        if (reply) {
          reply.text = reply.text.replace(/(([^\s]+\s\s*){20})(.*)/m, '$1');
          msgData.reply = reply;
          this.unblock();
        }
      }

      const newMsgId = Messages.insert(msgData);

      // notify Chat for updates
      return Chats.update(chat, {$set: {lastAt: createdAt}}, (err) => {
        if (err) {
          throw new Meteor.Error(err);
        }

        if (msgData.reply && msgData.owner !== this.userId) {
          Answers.insert({
            createdAt,
            userId: msgData.owner,
            fromUserId: this.userId,
            messageId: newMsgId,
            inReplyId: replyId,
            read: false,
          }, (aerr) => {
            if (aerr) {
              throw new Meteor.Error(aerr);
            }

            Updates.registerEvent(msgData.owner, {type: 'ANSWERS'});
          });
        }

        // Do the Updates
        const usersNotify = _.without(chatData.stuffUsers || [], this.userId);
        notifyChatUsers(chat, usersNotify, {
          chat,
          owner: this.userId,
          replyOwner: (msgData.reply && msgData.reply.owner),
          text: `${text.slice(0, 26).trim()}${text.length > 26 ? '...' : ''}`,
          type: chatData.type,
        });
      });
    },

    /**
    * creates new chat for Type and users stuff
    * @param  {String}  type   Chat    type (Chats.TYPES enum)
    * @param  {String}  name   Chat    name (optional)
    * @param  {Array:String}   users   id (Array)
    * @param  {String}         subject chat id or subject
    * @return  {String}  new chat Id
    */
    openChat(_type, name = '', users = [], subject) {
      check(subject, Match.Maybe(String));
      check(_type, String);
      check(users, Array);

      if (_type !== Chats.TYPES.PRIVATE && _type !== Chats.TYPES.GROUP) {
        throw new Meteor.Error(403, 'Access denied');
      }

      if (_type === Chats.TYPES.GROUP && !checkUserAccessByPayment(this.userId)) {
        throw new Meteor.Error(403, 'Access denied');
      }

      const chatUsers = _.union(users, [this.userId]);

      if (chatUsers.length < 2) {
        throw new Meteor.Error(403, 'No users for chat');
      } else if (chatUsers.length > 3) {
        check(name, String);
      }

      const type = chatUsers.length > 2 ? Chats.TYPES.GROUP : Chats.TYPES.PRIVATE;
      return createChat(subject, type, name, this.userId, chatUsers);
    },

    /**
     * Removes message (and Likes and Answers also) by message id
     * @param  {String}  messageId  id of the message to delete
     * @return  {[type]}  [description]
     */
    deleteMessage(messageId) {
      check(messageId, String);

      if (!this.userId) {
        throw new Meteor.Error(403, 'Access denied');
      }

      const messageData = Messages.findOne(messageId, {fields: {owner: 1, likesCount: 1}});

      if (!messageAccessibleForUser(messageData, this.userId)) {
        throw new Meteor.Error(403, 'Access denied');
      }

      return Messages.remove(messageId, (err) => {
        if (err) {
          throw new Meteor.Error(err);
        }

        if (messageData.likesCount) {
          increaseUsersCounter(messageData.owner, 'messagesLikesCount', -likesCount);
        }

        Likes.remove({messageId}, () => {});
        Answers.remove({messageId}, () => {});
      });
    },

    /**
     * Updates message by id w new content
     * @param  {String}  text       new message content
     * @param  {String}  messageId  message id
     * @return  {[type]}  [description]
     */
    editMessage(text, messageId) {
      check(messageId, String);
      check(text, String);

      const selector = {_id: messageId, owner: this.userId};

      if (!Messages.update(selector, {$set: {text, uuts: Date.now()}})) {
        throw new Meteor.Error(403, 'Access denied');
      }

      return true;
    },

    /**
     * like/unlike message by currentUser
     * @param  {String}  messageId  message id
     * @return  {[type]}  [description]
     */
    likeMessage(chat, messageId) {
      check(chat, String);
      check(messageId, String);

      const userId = this.userId;

      if (!(messageId) || !(chat) || !checkUserAccessForChat(chat, userId)) {
        throw new Meteor.Error(403, 'Access denied');
      }

      const messageData = Messages.findOne(messageId, {fields: {owner: 1, likesUsers: 1}});

      if (!messageData) {
        throw new Meteor.Error(404, 'No message to like');
      }

      const alreadyLiked = (messageData.likesUsers || []).includes(userId);

      const likesUsers = alreadyLiked ?
        _.chain(messageData.likesUsers || [])
            .without(userId)
            .compact()
            .value() :
        _.chain(messageData.likesUsers || [])
          .union([userId])
          .compact()
          .value();

      const likesCount = likesUsers.length;
      const uuts = Date.now();

      return Messages.update(messageId, {$set: {likesUsers, likesCount, uuts}}, (err) => {
        if (err) {
          throw new Meteor.Error(err);
        }

        if (alreadyLiked) {
          increaseUsersCounter(messageData.owner, 'messagesLikesCount', -1);
        } else {
          increaseUsersCounter(messageData.owner, 'messagesLikesCount', 1);
        }

        if (messageData.owner !== this.userId) {
          if (alreadyLiked) {
            Answers.remove({messageId}, (aerr) => {
              if (aerr) {
                throw new Meteor.Error(aerr);
              }

              Updates.disposeEvent(messageData.owner, {type: 'ANSWERS'});
            });
          } else {
            Answers.upsert({messageId}, {
              $set: {
                likesCount,
                likesUsers,
                userId: messageData.owner,
                createdAt: new Date(),
                read: false,
              },
            }, (aerr) => {
              if (aerr) {
                throw new Meteor.Error(aerr);
              }

              Updates.registerEvent(messageData.owner, {type: 'ANSWERS'});
            });
          }

          if (!alreadyLiked) {
            if (Meteor.users.find({ _id: messageData.owner, 'profile.pushLikesNotify': true }).count()) {
              BrowserNotifications.sendNotification({
                userId: messageData.owner,
                title: `${Meteor.user().profile.name} понравилось ваше сообщение`,
                body: '',
                icon: 'https://entry.spacebagel.com/fav-icon.png',
              });
            }
          }
        }
      });
    },
  });
}
