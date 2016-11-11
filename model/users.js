import {Meteor} from 'meteor/meteor';

Meteor.methods({
  acceptRules() {
    Meteor.users.update(Meteor.user(), {$set: {'profile.rulesAccepted': true}});
  },
});

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


Meteor.users.getAvatarProps = (id, updateHash = false) => {
  const hexCode = getHexColorById(id);
  const color = `${hexCode}`;
  const style = {'background-color': color};

  const hashv = getHashVersion(updateHash);

  if (Meteor.isDevelopment) {
    const dateHash = new Date().getDate();
    const thumb = `/avatars/${id}/thumb?v=${hashv}`;
    const cropped = `/avatars/${id}/cropped?v=${hashv}`;
    return {color, style, url: {thumb, cropped}};
  }

  if (id) {
    const idxChunk = id.slice(0, 2).toLowerCase();
    const thumb = `/files/avatars/${idxChunk}/${id}_thumb.png?v=${hashv}`;
    const cropped = `/files/avatars/${idxChunk}/${id}_cropped.png?v=${hashv}`;
    return {color, style, url: {thumb, cropped}};
  }

  const thumb = '/images/anonymous.png';
  const cropped = '/images/anonymous.png';
  return {color, style, url: {thumb, cropped}};
};

Meteor.users.extractUserName = ({name, lastname}, unresolved = '') => {
  const fullname = _.compact([name, lastname]).join(' ').trim();
  return fullname.length === 0 ? unresolved : fullname;
};

Meteor.users.extractLivingArea = ({town, country}) => {
  return _.compact([town, country]).join(', ').trim();
};

const Users = Meteor.users;

if (global || window) {
  const g = (global || window);
  g.Users = Users;
}

export {Users};
