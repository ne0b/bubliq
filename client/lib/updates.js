import {Meteor} from 'meteor/meteor';
import {Updates} from '/model/updates';

// -----------------------------------------------------------------------------
// Setup
// -----------------------------------------------------------------------------

// Lets the music play!
const notifySound = (new Audio()).canPlayType('audio/ogg; codecs=vorbis') ?
  new Audio('/sounds/notify.ogg') : new Audio('/sounds/notify.mp3');

// Adds worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// Gets document's Activity keys
const visibilityProps = _.find({
  hidden: {propName: 'hidden', eventName: 'visibilitychange'},
  mozHidden: {propName: 'mozHidden', eventName: 'mozvisibilitychange'},
  msHidden: {propName: 'msHidden', eventName: 'msvisibilitychange'},
  webkitHidden: {propName: 'webkitHidden', eventName: 'webkitvisibilitychange'},
}, (value, key) =>
  typeof document[key] !== 'undefined'
) || {propName: null, eventName: null};

/**
 * Notification abstraction class
 * Implementing standart Browser notifications and WebWorker
 * Plaing sound w HTML5 Audio API
 */
class BubliqNotification {
  constructor(params = {}) {
    this.shouldPalySound = notifySound && params.sound;
    // we could provide next callback actions (fires on click)
    //   handler    [Function]  function to be called on click handler(DOMEvent)
    //   href       [Object]
    //     pathname [String]    pathname as it defined in router
    //     params   [Object]    route params (push state) as it defined in router
    this.shouldBindClick = params.href || params.handler;

    this.options = {
      title: params.title || 'Space Bagel',
      lang: 'ru-RU',
      dir: 'auto',
      icon: params.icon || 'fav-icon.png',
      body: params.text || '',
      tag: params.tag || params.key || params._id || params.title,
    };

    this.requestPermission(() => {
      this.buildMessage(this.options, () => {
        if (this.shouldPalySound) {
          this.playSound();
        }

        if (this.shouldBindClick) {
          const {href, handler} = params;
          this.bindClickEvents({href, handler});
        }

        this.bindAutoclose();
      });
    });
  }

  close() {
    if (this.message) {
      if (this.autocloseTimer) {
        Meteor.clearTimeout(this.autocloseTimer);
      }

      this.message = this.message.close.call(this.message);
    }
  }

  bindAutoclose(timeout = 2000) {
    if (this.message) {
      this.autocloseTimer = Meteor.setTimeout(this.close, timeout);
    }
  }

  bindClickEvents({href, handler}) {
    if (this.message) {
      const onClick = (e) => {
        this.close();

        if (e.chancel) {
          e.chancel();
        }

        if (handler) {
          return handler(e);
        }

        const stateProvider = angular.element(document.body).injector().get('$state');
        window.focus();
        if (stateProvider) {
          Meteor.defer(() =>
            stateProvider.go(href.pathname, href.params)
          );
        }
      };

      this.message.onclick = onClick;
    }
  }

  playSound() {
    if (this.message) {
      notifySound.play();
    }
  }

  buildMessage(options, callback) {
    try {
      this.buildBrowserMessage(options, callback);
    } catch (e) {
      this.buildWorkerMessage(options, callback);
    }
  }

  buildBrowserMessage(options, callback) {
    this.message = new Notification(options.title, options);
    return callback();
  }

  buildWorkerMessage(options, callback) {
    navigator.serviceWorker.ready.then((workerReg) => {
      this.message = workerReg.showNotification(options.title, options);
      return callback();
    });
  }

  requestPermission(callback) {
    Notification.requestPermission((res) => {
      if (res === 'granted') {
        return callback();
      }
    });
  }
}

// -----------------------------------------------------------------------------
// Action helpers
// -----------------------------------------------------------------------------

/**
 * Extracts selector from argument
 * @param  {Object|String}  idOrSelector  argument-selector
 * @return  {Void}  None
 */
const makeSelector = (idOrSelector) => {
  if (_.isObject(idOrSelector)) {
    if (idOrSelector._id) {
      return {_id: idOrSelector._id};
    }
    return _.pick(idOrSelector, 'type', 'subject');
  }

  if (_.isString(idOrSelector)) {
    return {_id: idOrSelector};
  }

  return {};
};

/**
 * Constructs new Notification (see params here: line 27-36)
 * @param  {Object}  params  Notification params
 * @return  {Void}   None
 */
const sendNotification = (params) => {
  return new BubliqNotification(params);
};

/**
 * Disposes Updates
 * @param  {String|Object}  idOrSelector  Event Id or MongoSelector
 * @param  {Number}         count         count to decrease on
 * @return  {Void}          None
 */
const disposeEvent = (idOrSelector, count) => {
  const selector = makeSelector(idOrSelector);

  if (_.size(selector)) {
    Meteor.call('disposeEvent', selector, count);
  }
};


// -----------------------------------------------------------------------------
// Dispatching
// -----------------------------------------------------------------------------

let dispatchers = [];

Updates._getDispatchers = () => dispatchers;

/**
 * Triggers new Notofocation (see sendNotifocation)
 * @param  {...Args}  args  Args
 * @return  {Notification}     Notification class instanse
 */
Updates.sendNotification = (...args) =>
  sendNotification(...args);

/**
 * Disposes event for given Count (see disposeEvent)
 * @param  {...Args}  args  Args
 * @return  {Void}     None
 */
Updates.disposeEvent = (...args) =>
  disposeEvent(...args);

/**
 * Adds new Dispatcher for given Type and Subject
 * Also reruns all Dispatchers for mixed Selector
 * @param  {String}  type     Event type
 * @param  {String}  subject  Event subject (optional)
 * @param  {Function}  handler  Handler that would be called on Event comes id
 * @return  {Void}  None
 */
Updates.addDispatcher = (...args) => {
  const len = args.length;
  if (len < 2) {
    return;
  }

  const type = args[0];
  const subject = len > 2 ? args[1] : null;
  const handler = len > 2 ? args[2] : args[1];

  if (!_.isFunction(handler)) {
    return;
  }

  dispatchers.push({type, subject, handler});

  const selector = subject ? {type, subject} : {type};
  Updates.rerunInitialDispatchers(selector);
};

/**
 * Removes Dispatcher by its Handler
 * @param  {Function}  removeHandler  Handler to remove
 * @return  {Void}  None
 */
Updates.removeDispatcher = (removeHandler) => {
  dispatchers = _.filter(dispatchers, ({handler}) => handler !== removeHandler);
};

/**
 * Counts for given Id or Selector
 * @param  {String|Object}  idOrSelector  Event Id or Selector to count
 * @return  {Number}  total count for all matched Events
 */
Updates.countFor = (idOrSelector) => {
  const eventsList = Updates.find(makeSelector(idOrSelector)).fetch();
  return _.reduce(eventsList, (memo = 0, {count = 0}) => {
    return memo + count;
  }, 0);
};

/**
 * Counts all Events
 * @return  {Number}  Count all
 */
Updates.countAll = () => {
  return Updates.countFor({});
};

/**
 * Runs all possible Dispatchers for given Event
 * Dispatchers with matched Type and Subject run first
 * Then runs Type-matched
 * @param  {Object}   event    Event (DB Object itselfs)
 * @param  {Boolean}  initial  Is running for initial set (like first subscribtion run)
 * @return  {Void}   None
 */
Updates.runDispatchers = (event, initial = false) => {
  const dispatchersToRun = _.chain(dispatchers)
    .filter(({type, subject}) => type === event.type || subject === event.subject)
    .sortBy(({type, subject}) => `${(subject && 1)}${(type && 2)}`)
    .value();

  if (!dispatchersToRun.length) {
    return;
  }

  const active = !document[visibilityProps.propName];
  _.extend(event, {initial, active});

  const runNextDispatcher = () => {
    if (!dispatchersToRun.length) {
      return;
    }

    const dispatcher = dispatchersToRun.shift();
    if (dispatcher && dispatcher.handler) {
      dispatcher.handler(event, sendNotification, disposeEvent, runNextDispatcher);
    }
  };

  runNextDispatcher();
};

/**
 * Reruns all Dispatchers for Events matched given Selector
 * @param  {Object}  selector  events filter
 * @return  {Void}  None
 */
Updates.rerunInitialDispatchers = (selector = {}) => {
  Updates.find(selector).forEach((event) => {
    Updates.runDispatchers(event, true);
  });
};

// -----------------------------------------------------------------------------
// Settings up!
// -----------------------------------------------------------------------------

Meteor.startup(() => {
  // initial recordset (while Subscribtion first fetch)
  let initial = true;

  document.addEventListener(visibilityProps.eventName, () => {
    if (!document[visibilityProps.propName] && !initial) {
      Updates.rerunInitialDispatchers();
    }
  });

  // Starting looking for Updates
  // Set timout for 30sec and wait until initialigation
  // and routing
  Meteor.defer(() => {
    Updates.find({}).observe({
      added(event) {
        Updates.runDispatchers(event, initial);
      },
      changed(current, old) {
        // Handle only if current count > old (event inc+)
        if ((current.count || 0) > (old.count || 0)) {
          const event = current;
          event.count = (current.count) - (old.count || 0);
          Updates.runDispatchers(event);
        }
      },
    });

    // Remove initial prop
    Meteor.defer(() => {
      initial = false;
    });
  });
});
