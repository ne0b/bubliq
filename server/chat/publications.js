import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';
import {Messages, Chats} from '/model/chats';

import moment from 'moment';

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
 * @param  {String}  chat    Chat id
 * @param  {String}  userId  User id
 * @return  {Boolean}  can access?
 */
const checkUserAccessForChat = (chat, userId) => {
  const chatData = Chats.findOne(chat, {fields: {stuffUsers: 1, type: 1}});
  if (!chatData || (!(chatData.stuffUsers || []).includes(userId))) {
    return false;
  }

  if (chatData.type === Chats.TYPES.PRIVATE) {
    return true;
  }

  return checkUserAccessByPayment(userId);
};


export default function () {
  Meteor.publish('chat', function (chat, _limit) {
    check(chat, String);
    const hasAccess = checkUserAccessForChat(chat, this.userId);

    if (!hasAccess) {
      throw new Meteor.Error(403, 'Access denied');
    }

    const limit = (_limit || 0) + 1;
    const sort = {createdAt: -1};

    const messagesCrs = Messages.find({chat}, {sort, limit});

    /**
     * Updates Chat's stuffBreaks[userId] with last timestamp
     */
    this.onStop(() => {
      // Updates only if user is accessed for this chat!
      if (hasAccess) {
        const modifier = {[`stuffBreaks.${this.userId}`]: Date.now()};
        Chats.update(chat, {$set: modifier});
      }
    });

    return [Chats.find(chat), messagesCrs];
  });

  Meteor.publish('chats', function (_limit) {
    const transform = (_doc) => {
      let doc = _doc;

      if (doc.type === Chats.TYPES.PRIVATE) {
        if (doc.stuffUsers) {
          const person = doc.stuffUsers.filter((userId) => userId !== this.userId)[0];

          if (person) {
            const name = doc.stuffNames && doc.stuffNames[person];
            doc = _.extend({}, doc, {name, person});
          }
        }
      }

      if (doc.lastAt) {
        doc.hasUpdates = !doc.stuffBreaks ||
        !doc.stuffBreaks[this.userId] ||
        (doc.lastAt.getTime() > doc.stuffBreaks[this.userId]);
      }

      return _.omit(doc, 'stuffUsers', 'stuffNames', 'stuffBreaks');
    };

    const name = 'chats';
    const selector = {stuffUsers: this.userId};
    const limit = (_limit || 0) + 1;
    const sort = [['typeOrder', 'asc'], ['lastAt', 'desc']];

    const chatCrsObserver = Chats.find(selector, {sort, limit}).observe({
      added: (doc) => this.added(name, doc._id, transform(doc)),
      changed: (doc) => this.changed(name, doc._id, transform(doc)),
      removed: (doc) => this.removed(name, doc._id),
    });

    this.onStop(() => chatCrsObserver.stop());

    return this.ready();
  });

  Meteor.publish('chatConfig', function (chatId) {
    check(chatId, String);

    if (!checkUserAccessForChat(chatId, this.userId)) {
      throw new Meteor.Error(403, 'Access denied');
    }
    return Chats.find({_id: chatId});
  });

  Meteor.publish('chatStuff', function (_limit, owner, stuffFilter, stuffQuery) {
    check(_limit, Number);
    check(stuffFilter, String);
    check(owner, String);
    check(stuffQuery, Match.Maybe(String));

    const limit = (_limit || 0) + 1;
    const sort = {normalized: 1};
    const selector = {_id: {$ne: owner}};

    const query = (stuffQuery || '').trim();
    if (query.length > 0) {
      selector.normalized = {$regex: `.*${query}.*`, $options: 'i'};
    }

    if (stuffFilter === 'PROGRAM' || stuffFilter === 'STREAM') {
      const user = Meteor.users.findOne(this.userId, {fields: {profile: 1}});

      if (stuffFilter === 'PROGRAM') {
        selector['profile.programs'] = {
          $in: user.profile.programs || [],
        };
      } else {
        selector['profile.streams'] = {
          $in: user.profile.streams || [],
        };
      }
    }

    const fields = {
      'profile.name': 1,
      'profile.lastname': 1,
      'profile.country': 1,
      'profile.town': 1,
    };

    return Meteor.users.find(selector, {fields, limit, sort});
  });
}
