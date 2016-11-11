import {Meteor} from 'meteor/meteor';
import {Tracker} from 'meteor/tracker';


let updaterInterval = null;

// find which property document's property means user is in tab
const activePropertyName = (() => {
  const vendorProps = ['hidden', 'webkitHidden', 'mozHidden', 'msHidden'];
  return _.find(vendorProps, (prop) => prop in document);
}).call();


const updaterHandler = () => {
  if (Meteor.userId() && !document[this._activePropertyName]) {
    Meteor.call('tickUserActivity', (navigator && navigator.userAgent));
  }
};

// lets track if user is logged!
// after one has logged in we shoukd track his activity every 30 sec
// otherwise clear interval, until next login
// we have to use Meteor[interval] due to unnecessary recalculations
Tracker.autorun(() => {
  if (Meteor.userId()) {
    updaterHandler();
    updaterInterval = Meteor.setInterval(updaterHandler, 1000 * 30);
  } else if (updaterInterval) {
    Meteor.clearInterval(updaterInterval);
  }
});

export default {};
