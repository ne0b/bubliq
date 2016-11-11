Meteor.publish('rules', function () {
  return Rules.find();
});
