Meteor.publish('adverts', function () {
  return Adverts.find();
});
