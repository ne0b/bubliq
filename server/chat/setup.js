import {Meteor} from 'meteor/meteor';
import {Messages, Chats} from '/model/chats';

import {Programs} from '/model/programs';
import {Streams} from '/model/streams';

import {chatExistsForSubject, extractUserName, createChat} from './lib';

/**
 * ensures chat exists or creates Chat for Program or Stream
 * @param  {[type]}  subject  [description]
 * @param  {[type]}  type     [description]
 * @return  {[type]}  [description]
 */
const ensureChat = (subject, type) => {
  if (!chatExistsForSubject(subject, type)) {
    const getChatNameForType = () => {
      if (type === Chats.TYPES.PROGRAM) {
        return (Programs._cache[subject] || {}).title || 'Программа без названия';
      }

      const streamData = Streams._cache[subject] || {};
      const programData = Programs._cache[streamData.programId] || {};

      return `${streamData.title || 'Поток без названия'} (${programData.title || 'Программа без названия'})`;
    };

    const name = getChatNameForType();
    return createChat(subject, type, name);
  }
};

/**
 * watch for Users got changed and update Chats accordingly
 * @return  {[type]}  [description]
 */
const watchForUsers = () => {
  const fields = {
    roles: 1,
    'profile.name': 1,
    'profile.lastname': 1,
    'profile.programs': 1,
    'profile.streams': 1,
  };

  return Meteor.users.find({}, {fields}).observe({
    changed(curr, old) {
      const userId = curr._id;
      const userName = extractUserName(curr.profile);

      // to remove User from Chat
      const removeModifier = {
        $pull: {stuffUsers: userId},
        $inc: {stuffCount: -1},
      };

      // to add User to Chat
      const addModifier = {
        $push: {stuffUsers: userId},
        $inc: {stuffCount: 1},
        $set: {[`stuffNames.${userId}`]: userName},
      };

      // to update User name in Chats
      const updateModifier = {
        $set: {[`stuffNames.${userId}`]: userName},
      };

      // -----------------------------------------------------------------------
      // Find if roles changed
      // -----------------------------------------------------------------------
      const autobindRoles = ['tasks-review', 'tasks-assign', 'moderator', 'users-manage'];
      const currRoles = curr.roles || [];
      const oldRoles = old.roles || [];
      const hadBindableRoles = _.intersection(oldRoles, autobindRoles).length;
      const hasBindableRoles = _.intersection(currRoles, autobindRoles).length;

      if (hadBindableRoles && !hasBindableRoles) {
        const usersPrograms = curr.profile.programs || [];
        const usersStreams = curr.profile.streams || [];
        const expectSubjects = _.union(usersPrograms, usersStreams);

        const selector = {
          subject: {$nin: expectSubjects},
          type: {$in: [Chats.TYPES.PROGRAM, Chats.TYPES.STREAM]},
          stuffUsers: userId,
        };
        Chats.update(selector, removeModifier, {multi: true});
      }

      if (!hadBindableRoles && hasBindableRoles) {
        const selector = {
          type: {$in: [Chats.TYPES.PROGRAM, Chats.TYPES.STREAM]},
          stuffUsers: {$ne: userId},
        };
        Chats.update(selector, addModifier, {multi: true});
      }

      // -----------------------------------------------------------------------
      // Find if programs changed
      // -----------------------------------------------------------------------
      const currPrograms = curr.profile.programs || [];
      const oldPrograms = old.profile.programs || [];

      const programsAdded = _.difference(currPrograms, oldPrograms);
      const programsMoved = _.difference(oldPrograms, currPrograms);

      if (programsAdded.length) {
        programsAdded.forEach((subject) => ensureChat(subject, Chats.TYPES.PROGRAM));
        const selector = {subject: {$in: programsAdded}, type: Chats.TYPES.PROGRAM};
        Chats.update(selector, addModifier, {multi: true});
      }

      if (programsMoved.length) {
        programsMoved.forEach((subject) => ensureChat(subject, Chats.TYPES.PROGRAM));
        const selector = {subject: {$in: programsMoved}, type: Chats.TYPES.PROGRAM};
        Chats.update(selector, removeModifier, {multi: true});
      }

      // -----------------------------------------------------------------------
      // Find if streams changed
      // -----------------------------------------------------------------------
      const currStreams = curr.profile.streams || [];
      const oldStreams = old.profile.streams || [];

      const streamsAdded = _.difference(currStreams, oldStreams);
      const streamsMoved = _.difference(oldStreams, currStreams);

      if (streamsAdded.length) {
        streamsAdded.forEach((subject) => ensureChat(subject, Chats.TYPES.STREAM));
        const selector = {subject: {$in: streamsAdded}, type: Chats.TYPES.STREAM};
        Chats.update(selector, addModifier, {multi: true});
      }

      if (streamsMoved.length) {
        streamsMoved.forEach((subject) => ensureChat(subject, Chats.TYPES.STREAM));
        const selector = {subject: {$in: streamsMoved}, type: Chats.TYPES.STREAM};
        Chats.update(selector, removeModifier, {multi: true});
      }

      // -----------------------------------------------------------------------
      // Find if user name changed?
      // -----------------------------------------------------------------------
      const oldName = extractUserName(old.profile);

      if (oldName !== userName) {
        const selector = {stuffUsers: userId};

        // dont forget that Program and Stream Chats already could be updated!
        const updatedSubjects = programsAdded.concat(streamsAdded);
        if (updatedSubjects.length) {
          selector.subject = {$nin: updatedSubjects};
        }
        Chats.update(selector, updateModifier, {multi: true});
      }
    },
  });
};

export default function () {
  Messages._ensureIndex({chat: 1});
  Messages._ensureIndex({owner: 1});
  Messages._ensureIndex({createdAt: 1});
  Chats._ensureIndex({subject: 1}, {background: true});
  Chats._ensureIndex({stuffUsers: 1}, {background: true});
  Chats._ensureIndex({typeOrder: 1, lastAt: -1}, {background: true});

  watchForUsers();
}
