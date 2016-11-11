import {Meteor} from 'meteor/meteor';
import {Chats} from '/model/chats';
import {Updates} from '/model/updates';

/**
 * get Chat exists by subject and type
 * @param  {String}  subject  Subject id (Program id, stream id, etc)
 * @param  {String}  type     Chat type (Chat.TYPES enum)
 * @return  {Boolean}  is exists
 */
export const chatExistsForSubject = (subject, type) => {
  return Boolean(Chats.find({subject, type}).count());
};

/**
 * get Chat exists by type and users stuff
 * @param  {String}  type  Chat  type (Chat.TYPES enum)
 * @param  {Array:String}  users Array of users to check
 * @return  {Boolean}  is exists
 */
export const chatExistsByStuff = (type, users = []) => {
  return Boolean(Chats.find({type, stuffUsers: {$all: users}}).count());
};

/**
 * returns chat id by type and subject
 * @param  {String}  type   type (Chat.TYPES enum)
 * @param  {String}  subject ID
 * @return  {String}  chat id
 */
export const getChatIdBySubject = (type, subject) => {
  const chat = Chats.findOne({type, subject}, {fields: {_id: 1}});
  return chat && chat._id;
};

/**
 * returns chat id by type and users stuff
 * @param  {String}  type   type (Chat.TYPES enum)
 * @param  {Array:String}   users  Array
 * @return  {String}  chat id
 */
export const getChatIdByStuff = (type, users = []) => {
  const chat = Chats.findOne({type, stuffUsers: {$all: users}}, {fields: {_id: 1}});
  return chat && chat._id;
};

/**
 * extracts user full name from user profile
 * @param  {String}  options.name      Name from profile
 * @param  {String}  options.lastname  LastName from profile
 * @return  {[type]}  [description]
 */
export const extractUserName = (props) => {
  return Meteor.users.extractUserName(props);
};

/**
 * HELPER: generates users map by users ids array
 * @param  {Array}  users  Users ids
 * @return  {Object}  map {stuffUsers = [], stuffNames = {}, stuffCount = 999}
 */
export const getGenerateUsersMap = (users = []) => {
  const stuffUsers = _.compact(users);
  const selector = {_id: {$in: stuffUsers}};
  const fields = {'profile.name': 1, 'profile.lastname': 1};

  const stuffNames = Meteor.users.find(selector, {fields})
    .map(doc => doc)
    .reduce((memo, {_id, profile}) => {
      return _.extend({}, memo, {[`stuffNames.${_id}`]: extractUserName(profile)});
    }, {});
  const stuffCount = stuffUsers.length;

  return _.extend({}, {stuffUsers, stuffCount}, stuffNames);
};

/**
 * map Users for Chat - apply usernames
 * @param  {String}  subject  Subject id
 * @param  {String}  type     Chat type (Chat.TYPES enum)
 * @param  {Array}   users    array of Users ids - Chat stuff
 * @return  {[type]}  [description]
 */
export const mapUsersToChat = (subject, type, users = []) => {
  if (!subject || !type) {
    return null;
  }

  const modifier = getGenerateUsersMap(users);
  return Chats.update({subject, type}, {$set: modifier});
};

/**
 * creates new Chat
 * @param  {[type]}  subject  Subject id (Program id, stream id, etc)
 * @param  {[type]}  type     Chat type (Chat.TYPES enum)
 * @param  {String}  name     Chat name
 * @param  {String}  owner    User id for owner (manager)
 * @param  {Array:String}   users    array of Users ids - Chat stuff
 * @return  {Sring}  new Chat id
 */
export const createChat = (subject, type, name = '', owner = null, users = []) => {
  if (!type) {
    throw new Meteor.Error(400, 'createChat: no type defined');
  }

  if ((type === Chats.TYPES.PROGRAM || type === Chats.TYPES.STREAM) && !subject) {
    throw new Meteor.Error(400, `createChat: no subject defined for chat with type ${type}`);
  }

  const typeOrder = Chats.TYPES_ORDER[type];

  if (type === Chats.TYPES.PROGRAM || type === Chats.TYPES.STREAM) {
    const modifier = _.extend({type, subject, name, typeOrder}, getGenerateUsersMap(users));
    const result = Chats.upsert({subject, type}, {$set: modifier});

    return {newChatId: result.insertedId};
  }

  if (type === Chats.TYPES.PRIVATE || type === Chats.TYPES.GROUP) {
    const existedChatId = (type === Chats.TYPES.PRIVATE) ? getChatIdByStuff(type, users) : subject;

    if (existedChatId) {
      Chats.update(existedChatId, {$set: _.extend({owner, type, name, typeOrder}, getGenerateUsersMap(users))});
      return {existedChatId};
    }

    const newChatId = Chats.insert({owner, type, name, typeOrder});
    if (newChatId) {
      Chats.update(newChatId, {$set: getGenerateUsersMap(users)}, () => {});
    }

    return {newChatId};
  }
};

/**
 * Registers an Event for Upades and Count for all Chat users
 * @param  {String}  subject  Chat Id
 * @param  {Array}   users    Array of User's Ids
 * @param  {Object}  info     Optional info
 * @return  {Voud}  None
 */
export const notifyChatUsers = (subject, users = [], info) => {
  const event = {info, subject, type: 'CHAT'};
  Updates.registerEvent(users, event);
};
