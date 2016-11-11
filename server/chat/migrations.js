import {Meteor} from 'meteor/meteor';
import {Messages, Chats} from '/model/chats';

import {Programs} from '/model/programs';
import {Streams} from '/model/streams';
import {Updates} from '/model/updates';

import {Migrations} from 'meteor/percolate:migrations';

import {createChat, extractUserName, getGenerateUsersMap} from './lib';

// 01.02.00
const migrateAt10200 = () => {
  const mapped = {
    room: {},
    stream: {},
    program: {},
  };

  Messages.find({}).forEach(({roomId, streamId, programId}) => {
    if (roomId) {mapped.room[roomId] = true;}
    if (streamId) {mapped.stream[streamId] = true;}
    if (programId) {mapped.program[programId] = true;}
  });

  _.each(mapped, (list, key) => {
    const chatType = key;
    const chatKey = `${key}Id`;

    _.keys(list).forEach((chatId) => {
      const selector = {[`${chatKey}`]: chatId};
      const modifier = {
        $set: {chatId, chatType},
        $unset: {[`${chatKey}`]: ''},
      };

      Messages.update(selector, modifier, {multi: true});
    });
  });

  let selector = {
    messageId: {$exists: true},
  };

  let fields = {
    messageId: 1,
    userId: 1,
  };

  const likesList = Likes.find(selector, {fields}).fetch();

  const likesMap = _.groupBy(likesList, 'messageId');

  _.each(likesMap, (list, messageId) => {
    const likesUsers = _.pluck(list, 'userId');
    const likesCount = likesUsers.length;

    Messages.update(messageId, {$set: {likesUsers, likesCount}});
  });

  Messages.update({}, {$unset: {likescount: ''}}, {multi: true});

  selector = {
    inReply: {$exists: true},
    replyText: {$exists: false},
  };

  fields = {
    inReply: 1,
  };

  Messages.find(selector, {fields}).forEach(({_id, inReply}) => {
    const targetMsg = Messages.findOne(inReply, {fields: {text: 1}});

    if (targetMsg) {
      const replyText = targetMsg.text.replace(/(([^\s]+\s\s*){20})(.*)/m, '$1');
      Messages.update({_id}, {$set: {replyText}});
    }
  });

  selector = {
    uuts: {$exists: false},
  };

  fields = {
    createdAt: 1,
  };

  Messages.find(selector, {fields}).forEach(({_id, createdAt}) => {
    Messages.update({_id}, {$set: {uuts: createdAt.getTime()}});
  });
};

// 01.06.00
const migrateAt10600 = () => {
  Programs.find({}).forEach(({_id, title}) => {
    const users = Meteor.users.find({'profile.programs': _id}, {fields: {_id: 1}})
      .map(user => user._id);

    return createChat(_id, Chats.TYPES.PROGRAM, title, null, users);
  });

  Streams.find({}).forEach(({_id, title}) => {
    const users = Meteor.users.find({'profile.streams': _id}, {fields: {_id: 1}})
        .map(user => user._id);

    return createChat(_id, Chats.TYPES.STREAM, title, null, users);
  });
};

// 01.06.01
const migrateAt10601 = () => {
  Chats.find({type: Chats.TYPES.PROGRAM}).forEach(({_id, subject}) => {
    return Messages.update({chatId: subject}, {$set: {chat: _id}}, {multi: true});
  });

  Chats.find({type: Chats.TYPES.STREAM}).forEach(({_id, subject}) => {
    return Messages.update({chatId: subject}, {$set: {chat: _id}}, {multi: true});
  });

  try {
    Messages._dropIndex({chatId: 1});
  } catch (e) {
    console.log(e);
  }
};

// 01.06.02
const migrateAt10602 = () => {
  const selector = {
    inReply: {$exists: true},
    reply: {$exists: false},
  };

  const fields = {
    inReply: 1,
  };

  Messages.find(selector, {fields}).forEach(({_id, inReply}) => {
    const reply = Messages.findOne(inReply, {fields: {text: 1, owner: 1, createdAt: 1}});

    if (reply) {
      reply.text = reply.text.replace(/(([^\s]+\s\s*){20})(.*)/m, '$1');
      const modifier = {
        $set: {reply},
      };

      return Messages.update(_id, modifier);
    }

    return null;
  });
};

// 01.06.03
const migrateAt10603 = () => {
  // ['chatId, chatType, likesCount, inReply, replyText, likesUsers'];

  const selector = {
    $or: [
      {chatId: {$exists: true}},
      {chatType: {$exists: true}},
      {inReply: {$exists: true}},
      {replyText: {$exists: true}},
    ],
  };

  const modifier = {
    $unset: {
      chatType: '',
      inReply: '',
      replyText: '',
    },
  };

  Messages.update(selector, modifier, {multi: true});
};

// 01.06.04
const migrateAt10604 = () => {
  Chats.find({}).forEach(({_id}) => {
    const options = {fields: {createdAt: 1}, sort: {createdAt: -1}, limit: 1};
    const message = Messages.findOne({chat: _id}, options);

    if (message) {
      return Chats.update(_id, {$set: {lastAt: message.createdAt}});
    }

    return null;
  });
};

// 01.06.07
// Stream Chats should be renamed
const migrateAt10607 = () => {
  Chats.find({type: Chats.TYPES.STREAM}).forEach(({_id, subject}) => {
    const streamData = Streams.findOne(subject);

    if (streamData && streamData.programId) {
      const programData = Programs.findOne(streamData.programId);

      if (programData && programData.title) {
        const modifier = {
          name: `${streamData.title.trim()} (${programData.title.trim()})`,
        };

        Chats.update(_id, {$set: modifier});
      }
    }
    return null;
  });
};

// 01.06.08
// Change type order (map GROUP and PRIVATE into one bunch)
const migrateAt10608 = () => {
  const remapGoupsAndPrivate = () => {
    const typeOrder = Chats.TYPES_ORDER.GROUP || Chats.TYPES_ORDER.PRIVATE;
    const selector = {type: {$in: [Chats.TYPES.GROUP, Chats.TYPES.PRIVATE]}};
    Chats.update(selector, {$set: {typeOrder}, $unset: {typeOpder: ''}}, {multi: true});
  };

  const remapStreams = () => {
    const typeOrder = Chats.TYPES_ORDER.STREAM;
    const selector = {type: Chats.TYPES.STREAM};
    Chats.update(selector, {$set: {typeOrder}, $unset: {typeOpder: ''}}, {multi: true});
  };

  const remapPrograms = () => {
    const typeOrder = Chats.TYPES_ORDER.PROGRAM;
    const selector = {type: Chats.TYPES.PROGRAM};
    Chats.update(selector, {$set: {typeOrder}, $unset: {typeOpder: ''}}, {multi: true});
  };

  remapPrograms();
  remapStreams();
  remapGoupsAndPrivate();
};

// 01.06.09
// Bind Chats of Programs and Streams for Autobindable roles
const migrateAt10609 = () => {
  const autobindRoles = ['programs-manage', 'moderator', 'users-manage'];

  Meteor.users.find({roles: {$in: autobindRoles}}).forEach(({_id, profile}) => {
    const userName = extractUserName(profile);
    const addModifier = {
      $push: {stuffUsers: _id},
      $inc: {stuffCount: 1},
      $set: {[`stuffNames.${_id}`]: userName},
    };

    const selector = {
      type: {$in: [Chats.TYPES.PROGRAM, Chats.TYPES.STREAM]},
      stuffUsers: {$ne: _id},
    };
    Chats.update(selector, addModifier, {multi: true});
  });
};

// 01.06.27
// Remap all the chats subject
const migrateAt10627 = () => {
  const selector = {
    type: {
      $in: [Chats.TYPES.PROGRAM, Chats.TYPES.STREAM],
    },
  };
  const fields = {subject: 1, stuffUsers: 1, type: 1};

  const chatsMap = {};
  Chats.find(selector, {fields}).forEach(({_id, subject, type}) => {
    chatsMap[subject] = chatsMap[subject] || {subject, type, ids: []};
    chatsMap[subject].ids.push(_id);
  });

  const chatsList = _.map(chatsMap, (v) => v);

  const autobindRoles = ['tasks-review', 'tasks-assign', 'moderator', 'users-manage'];
  const adminUsersIds = Meteor.users.find({role: {$in: autobindRoles}}).map((v) => v._id);

  const remapNextChat = () => {
    if (!chatsList.length) {
      Updates.remove({type: 'CHAT'});
      return;
    }

    const next = chatsList.pop();

    if (!next.ids.length > 1) {
      remapNextChat();
    }

    Chats.remove({_id: {$in: next.ids}}, () => {
      const title = ((next.type === Chats.TYPES.PROGRAM ? Programs : Streams)
        .findOne(next.subject) || {title: ''}).title;
      const usersSelector = next.type === Chats.TYPES.PROGRAM ?
        {'profile.programs': next.subject} : {'profile.streams': next.subject};

      const users = _.union(Meteor.users.find(usersSelector).map((user) => user._id), adminUsersIds);
      const chat = (createChat(next.subject, next.type, title, null, users) || {}).newChatId
        || next.subject;

      Messages.update({chat: {$in: next.ids}}, {$set: {chat}}, {multi: true}, () => {
        remapNextChat();
      });
    });
  };
  remapNextChat();
};

// 01.06.28
// Remap all the chats stuff
const migrateAt10628 = () => {
  const selector = {
    type: {
      $in: [Chats.TYPES.GROUP, Chats.TYPES.PRIVATE],
    },
  };
  const fields = {stuffUsers: 1};
  const chatsList = Chats.find(selector, {fields}).fetch();

  const remapNextChat = () => {
    if (!chatsList.length) {
      return;
    }

    const next = chatsList.pop();
    const usersMap = getGenerateUsersMap(next.stuffUsers);

    Chats.update(next._id, {$set: {stuffNames: {}}}, {}, () => {
      Chats.update(next._id, {$set: usersMap}, {}, () => {
        remapNextChat();
      });
    });
  };

  remapNextChat();
};

// 01.06.29
// Add Program title to Streams Chats names
const migrateAt10629 = () => {
  const fields = {_id: 1, subject: 1};
  const chatsList = Chats.find({type: Chats.TYPES.STREAM}, {fields}).fetch();

  const streamsMap = _.reduce(Streams.find({}).fetch(), (memo, {_id, title, programId}) => {
    return _.extend(memo, {[`${_id}`]: {title, programId}});
  }, {});

  const programsMap = _.reduce(Streams.find({}).fetch(), (memo, {_id, title}) => {
    return _.extend(memo, {[`${_id}`]: {title}});
  }, {});

  const getChatName = (subject) => {
    const streamData = Streams._cache[subject] || {};
    const programData = Programs._cache[streamData.programId] || {};

    return `${streamData.title || 'Поток без названия'} (${programData.title || 'Программа без названия'})`;
  };

  const remapNextChat = () => {
    if (!chatsList.length) {
      return;
    }

    const next = chatsList.pop();
    const name = getChatName(next.subject);

    Chats.update(next._id, {$set: {name}}, {}, () => {
      remapNextChat();
    });
  };

  remapNextChat();
};

export default function () {
  // 01.02.00
  Migrations.add({
    version: 10200,
    name: 'Merge chat messages streamId programId roomId into chatId',
    up: migrateAt10200,
  });

  // 01.06.00
  Migrations.add({
    version: 10600,
    name: 'Create Chats based on Programs and Streams and etc',
    up: migrateAt10600,
  });

  // 01.06.01
  Migrations.add({
    version: 10601,
    name: 'map Messages for Chats (chatId will be depricated)',
    up: migrateAt10601,
  });

  // 01.06.02
  Migrations.add({
    version: 10602,
    name: 'map reply into well formated Object',
    up: migrateAt10602,
  });

  // 01.06.03
  Migrations.add({
    version: 10603,
    name: 'remove depricated props',
    up: migrateAt10603,
  });

  // 01.06.04
  Migrations.add({
    version: 10604,
    name: 'expand last message for every Chat',
    up: migrateAt10604,
  });

  // 01.06.07
  Migrations.add({
    version: 10607,
    name: 'Stream Chats should be renamed',
    up: migrateAt10607,
  });

  // 01.06.08
  Migrations.add({
    version: 10608,
    name: 'Change type order (map GROUP and PRIVATE into one bunch) and others',
    up: migrateAt10608,
  });

    // 01.06.09
  Migrations.add({
    version: 10609,
    name: 'Bind Chats of Programs and Streams for Autobindable roles',
    up: migrateAt10609,
  });

  // 01.06.27
  Migrations.add({
    version: 10627,
    name: 'Remap all the chats subject',
    up: migrateAt10627,
  });

  // 01.06.28
  Migrations.add({
    version: 10628,
    name: 'Remap all the chats stuff',
    up: migrateAt10628,
  });

  // 01.06.29
  Migrations.add({
    version: 10629,
    name: 'Add Program title to Streams Chats namesf',
    up: migrateAt10629,
  });
}


// TODO: REMOVE TEST ONLY
// Meteor.startup(() => {
//   migrateAt10609();
// });
