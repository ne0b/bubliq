import {Meteor} from 'meteor/meteor';
import {Updates} from '/model/updates';
import {WebApp} from 'meteor/webapp';

/**
 * Registers new Event
 * @param  {String}  user             Users's Id
 * @param  {String}  options.type     Event type (req)
 * @param  {String}  options.subject  Subject Id
 * @param  {AnyVal}  options.info     Additional info
 * @param  {Number}  options.count    Inc count (1 by default)
 * @return  {[type]}  [description]
 */
const registerEvent = (users, {type, subject, info, count = 1}) => {
  if (!users) {
    return false;
  }

  const usersList = _.isArray(users) ? _.chain(users).compact().uniq().value() : [users];
  const selector = {type, subject};
  const modifier = info ? {$inc: {count}, $set: {info}} : {$inc: {count}, $unset: {info: ''}};

  const applyNextUpdate = () => {
    if (!usersList.length) {
      return;
    }

    const user = usersList.pop();
    Updates.upsert(_.extend(selector, {user}), modifier, (err) => {
      if (err) {
        throw new Meteor.Error(err);
      }

      applyNextUpdate();
    });
  };

  applyNextUpdate();
};

/**
 * Decreases count for event
 * @param  {String}         user          User Id
 * @param  {Object|String}  idOrSelector  Object selector or Id
 * @param  {Number}         _count        counts to decrease on
 * @return  {Void}          None
 */
const disposeEvent = (user, _selector, _count) => {
  const selector = _.pick(_selector, '_id', 'type', 'subject');
  selector.user = user;

  try {
    if (_.isNumber(_count)) {
      const count = _count > 0 ? (-1 * _count) : _count || (-1);
      Updates.update(selector, {$unset: {info: ''}, $inc: {count}});
    } else {
      Updates.remove(selector);
    }
  } catch (e) {
    return false;
  }

  return true;
};

/**
 * Replaces record
 * @param  {String}         user          User Id
 * @param  {Object|String}  idOrSelector  Object selector or Id
 * @param  {Object}         _data         new record data
 * @return  {Void}          None
 */
const replaceEvent = (user, idOrSelector, _data = {}) => {
  if (!user && !idOrSelector) {
    return false;
  }

  try {
    const selector = {user};
    if (_.isObject(idOrSelector)) {
      _.extend(selector, _.pick(idOrSelector, 'type', 'subject'));
    } else if (_.isString(idOrSelector)) {
      _.extend(selector, {_id: idOrSelector});
    } else {
      return false;
    }

    const data = _.pick(_data, 'count', 'info', 'type', 'subject');
    Updates.update(selector, data);
  } catch (e) {
    return false;
  }

  return true;
};


/**
 * Sets up watcher for getting count < 0 issues
 * @return  {[type]}  [description]
 */
const setupUpdatesWatcher = () => {
  Updates.find({}).observe({
    changed(doc) {
      if ((doc.count || 0) < 0) {
        Updates.update(doc._id, {$set: {count: 0}});
      }
    },
  });
};

export default function () {
  Updates._ensureIndex({user: true}, {background: true});

  setupUpdatesWatcher();

  Updates.registerEvent = registerEvent;
  Updates.disposeEvent = disposeEvent;
  Updates.replaceEvent = replaceEvent;

  // Serve routing and send 0 bytes sw.js file for
  // ServiceWorker registartion
  WebApp.rawConnectHandlers.use((req, res, next) => {
    if (req._parsedUrl.pathname.toLowerCase() === '/sw.js') {
      res.setHeader('Cache-Control', 'public, max-age=31557600');
      res.setHeader('Content-Type', 'text/javascript');
      return res.end('');
    }
    return next();
  });
}
