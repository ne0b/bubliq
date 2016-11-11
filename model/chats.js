import {Mongo} from 'meteor/mongo';
import {Meteor} from 'meteor/meteor';

const Messages = new Mongo.Collection('messages');
const Chats = new Mongo.Collection('chats');

Chats.TYPES = {
  PUBLIC: 'PUBLIC',
  GROUP: 'GROUP',
  PROGRAM: 'PROGRAM',
  STREAM: 'STREAM',
  PRIVATE: 'PRIVATE',
};

Chats.TYPES_ORDER = {
  GROUP: 2,
  PROGRAM: 0,
  STREAM: 1,
  PRIVATE: 2,
};

const getHexColorById = (id) => {
  const hexCode = (parseInt(
    parseInt(id, 36)
      .toExponential()
      .slice(2, -5)
    , 10) & 0xFFFFFF).toString(16).toUpperCase();
  return `#${hexCode}`;
};

const getHashVersion = (updateHash = false) => {
  const hashParts = [];
  if (typeof(location) !== 'undefined') {
    hashParts.push(location.pathname.replace(/\//gi, '-'));
  }

  if (updateHash) {
    hashParts.push(Meteor.uuid());
  }

  hashParts.push(new Date().getDate());
  return hashParts.join('_');
};

Chats.getAvatarProps = ({_id, type, person}) => {
  const relId = person || _id;
  const color = getHexColorById(relId);
  const style = {backgroundColor: color, color: 'white'};

  const hashv = getHashVersion();

  if (type === Chats.TYPES.PRIVATE) {
    if (Meteor.isDevelopment) {
      const src = `/avatars/${relId}/thumb?v=${hashv}`;
      return {color, style, src};
    }

    if (relId) {
      const idxChunk = relId.slice(0, 2).toLowerCase();
      const src = `/files/avatars/${idxChunk}/${relId}_thumb.png?v=${hashv}`;
      return {color, style, src};
    }

    const src = '/images/anonymous.png';
    return {color, style, src};
  }

  const CHATS_TYPES_ICONS = {
    GROUP: 'people',
    PROGRAM: 'chrome_reader_mode',
    STREAM: 'folder_shared',
  };

  const icon = CHATS_TYPES_ICONS[type];
  return {color, style, icon};
};

if (global || window) {
  const g = (global || window);
  g.Messages = Messages;
  g.Chats = Chats;
}

export {Messages, Chats};
