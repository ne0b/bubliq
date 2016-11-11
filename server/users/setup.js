import {Meteor} from 'meteor/meteor';
import {WebApp} from 'meteor/webapp';
import path from 'path';
import fs from 'fs';

Meteor.users.genSearchTerm = (searchString) => {
  return (!_.isString(searchString)) ? '' :
    searchString.toLowerCase().replace(/[^\wа-яё]|_|кэп|капитан|тренер/gi, '');
};

export default function () {
  // /avatars/:userId/:size
  WebApp.connectHandlers.use((req, res, next) => {
    const chunks = _.compact(req._parsedUrl.pathname.split('/'));

    if (chunks.length < 2 || chunks[0].toLowerCase() !== 'avatars') {
      return next();
    }

    const userId = chunks[1];
    const size = chunks.length > 2 ? chunks[2].toLowerCase() : 'cropped';
    const rootPath = Meteor.settings.AVATARS_UPLOAD_PATH;
    const folderName = userId.slice(0, 2).toLowerCase();

    let worker = null;

    try {
      const filename = path.join(rootPath, folderName, `${userId}_${size}.png`);
      worker = fs.createReadStream(filename);
    } catch (err) {
      res.writeHead(503);
      return res.end(err.message || err.toString());
    }

    worker.on('open', () => worker.pipe(res));
    worker.on('error', () => {
      res.writeHead(301, {Location: '/images/anonymous.png'});
      res.end();
    });
  });

  const Users = Meteor.users;
  Users._ensureIndex({'profile.programs': 1}, {background: true});
  Users._ensureIndex({'profile.streams': 1}, {background: true});
  Users._ensureIndex({'profile.stars': 1}, {background: true});
  Users._ensureIndex({'trialPrograms._id': 1}, {background: true});
  Users._ensureIndex({paidPrograms: 1}, {background: true});
  Users._ensureIndex({normalized: 1}, {background: true});
  Users._ensureIndex({roles: 1}, {background: true});
  Users._ensureIndex({'emails.verified': 1}, {background: true});
  Users._ensureIndex('ftss', {background: true});
  // Users._ensureIndex('terms', {background: true});
  Users._ensureIndex({createdAt: 1}, {background: true});
}
