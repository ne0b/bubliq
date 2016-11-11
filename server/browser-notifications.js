BrowserNotifications.sendNotification = (opts) => {
  let id = BrowserNotifications.insert({
    userId: opts.userId,
    title: opts.title,
    body: opts.body,
    icon: opts.icon
  });

  Meteor.setTimeout(() => {
    BrowserNotifications.remove(id)
  }, 60000);
}

Meteor.publish(null, function() {
  if (!this.userId) {
    return this.ready();
  }
  return BrowserNotifications.find({ userId: this.userId });
});

BrowserNotifications.allow({
  insert: () => false,
  update: (userId, doc) => {
    return userId == doc.userId;
  },
  remove: (userId, doc) => {
    return userId == doc.userId;
  }
});
