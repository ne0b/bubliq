Meteor.startup(function () {
  Spiderable.debug = true;

  SSR.compileTemplate('taskNotify', Assets.getText('task-notify.html'));

  Template.taskNotify.helpers({});

  SSR.compileTemplate('defaultEmail', Assets.getText('default-email.html'));

  Template.defaultEmail.helpers({});
});
