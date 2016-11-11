import {Meteor} from 'meteor/meteor';
import jimp from 'jimp';
import bufferizeStream from 'stream2buffer';
import mkdirp from 'mkdirp';
import path from 'path';

const AVATAR_SIZE_CROPPED = 512;
const AVATAR_SIZE_THUMB = 96;

export const saveAvatarFromBuffer = (buffer, id, callback) => {
  const throwCallback = (err) =>
    callback(null, err && (err.message || err.toString()));


  const folderName = id.slice(0, 2).toLowerCase();
  const folderPath = path.join(Meteor.settings.AVATARS_UPLOAD_PATH, folderName);

  mkdirp(folderPath, (errFolder) => {
    if (errFolder) {return throwCallback(errFolder);}

    jimp.read(buffer, (errRead, image) => {
      if (errRead) return throwCallback(errRead);

      const croppedPath = path.join(folderPath, `${id}_cropped.png`);
      const thumbPath = path.join(folderPath, `${id}_thumb.png`);

      image
        .scaleToFit(AVATAR_SIZE_CROPPED, AVATAR_SIZE_CROPPED)
        .write(croppedPath, (errCrop) => {
          if (errCrop) if (errRead) return throwCallback(errCrop);

          image
            .scaleToFit(AVATAR_SIZE_THUMB, AVATAR_SIZE_THUMB)
            .write(thumbPath, (errThumb) => throwCallback(errThumb));
        });
    });
  });
};

export const saveAvatarFromStream = (stream, id, callback) => {
  const throwCallback = (err) => {
    return callback(null, err && (err.message || err.toString()));
  };

  bufferizeStream(stream, (err, buffer) => {
    if (err) return throwCallback(err);
    return saveAvatarFromBuffer(buffer, id, callback);
  });
};

export const composeUserSearchTerms = (userIdOrObject, extention = {}) => {
  const getUserData = () => {
    const data = _.isObject(userIdOrObject) ? userIdOrObject :
      Meteor.users.findOne(userIdOrObject, {fields: {profile: 1, emails: 1}}) || {};

    const profile = _.extend({}, data.profile, extention);
    return _.extend({}, data, {profile});
  };

  const data = getUserData();
  if (!data) {
    return [];
  }

  const {profile = {}} = data;
  const {name = '', lastname = ''} = profile;
  const emails = _.map(data.emails || [], (v) => v.address || '');

  return _.chain(([`${name}${lastname}`, `${lastname}${name}`, data._id]).concat(emails))
    .map((v) => Meteor.users.genSearchTerm(v))
    .compact()
    .uniq()
    .value();
};


export const buildAdminUsersSelector = (userId, params = {}) => {
  const selector = {
    _id: {$ne: userId},
  };

  // Programs
  if (params.programs && params.programs.length) {
    selector['profile.programs'] = params.programs.length === 1
      ? params.programs[0] : {$in: params.programs};
  } else if (params.notprograms && params.notprograms.length) {
    selector['profile.programs'] = params.notprograms.length === 1
      ? {$ne: params.notprograms[0]} : {$nin: params.notprograms};
  }

  // Streams
  if (params.streams && params.streams.length) {
    selector['profile.streams'] = params.streams.length === 1
      ? params.streams[0] : {$in: params.streams};
  }

  // Paid Programs
  if (params.paidPrograms && params.paidPrograms.length) {
    selector['paidPrograms'] = params.paidPrograms.length === 1
      ? params.paidPrograms[0] : { $in: params.paidPrograms };
  }

  // Trial Programs Free
  if (params.trialProgramsFree && params.trialProgramsFree.length) {
    selector['trialPrograms._id'] = params.trialProgramsFree.length === 1
      ? params.trialProgramsFree[0] : { $in: params.trialProgramsFree };
    selector['trialPrograms.free'] = true;
  }

  // Trial Programs Paid
  if (params.trialProgramsPaid && params.trialProgramsPaid.length) {
    selector['trialPrograms._id'] = params.trialProgramsPaid.length === 1
      ? params.trialProgramsPaid[0] : { $in: params.trialProgramsPaid };
    selector['trialPrograms.free'] = false;
  }

  // Roles
  if (params.roles && params.roles.length) {
    selector['profile.role'] = params.roles.length === 1
      ? params.roles[0] : {$in: params.roles};
  }

  // Common
  if (params.trial) {selector['profile.trial'] = {$exists: true};}
  if (params.unsub) {selector['profile.unsubscribed'] = {$exists: true};}
  if (params.accepted) {selector['profile.rulesAccepted'] = true;}
  if (params.verified) {selector['emails.verified'] = true;}
  if (params.remoteSubscriber) {selector.remoteSubscriber = true;}
  if (params.referals) {selector.referalsCount = {$gte: 1};}
  if (params.dateFrom) {selector.createdAt = {$gte: params.dateFrom};}
  if (params.dateTo) {selector.createdAt = {$lte: params.dateTo};}
  if (params.hasmentor && !params.hasntmentor) {selector['profile.mentor'] = {$ne: null};}
  if (!params.hasmentor && params.hasntmentor) {selector['profile.mentor'] = null;}

  // Query string
  const searchPhrase = Meteor.users.genSearchTerm(params.query);
  if (searchPhrase.length > 2) {
    return _.extend({}, selector, {ftss: {$regex: `^${searchPhrase}`}});
  }

  return selector;
};

