import {Mongo} from 'meteor/mongo';
import {Meteor} from 'meteor/meteor';

const BrowserNotifications = new Mongo.Collection('browserNotifications');

if (Meteor.isClient) {
  BrowserNotifications.find().observe({
    added: (doc) => {
      BrowserNotifications.remove(doc._id, (err, count) => {
        if (count) {
          Notification.requestPermission((p) => {
            return new Notification(
              doc.title,
              {
                body: doc.body,
                icon: doc.icon,
              }
            );
          });
        }
      });
    },
  });
}

if (global || window) {
  const g = (global || window);
  g.BrowserNotifications = BrowserNotifications;
}

export {BrowserNotifications};
