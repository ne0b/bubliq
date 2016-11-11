Meteor.methods({
  editAdvert: function (text) {
    check(text, String);

    if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
      throw new Meteor.Error('not-authorized');
    }

    this.unblock();

    var adverts = Adverts.findOne();

    if(adverts){
      Adverts.update(adverts, {$set: {"text": text}});
    } else {
      Adverts.insert({
        text: text
      });
    }
  }
});
