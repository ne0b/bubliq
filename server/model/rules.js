import sanitizeHtml from 'sanitize-html';

Meteor.methods({
  getRules() {
    return Rules.findOne({ object: "portal" });
  },

  editPortalRules: function (text) {
    check(text, String);

    text = sanitizeHtml(text, sanitizeOptions);

    if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
      throw new Meteor.Error('not-authorized');
    }
    this.unblock();

    const rules = Rules.findOne({ object: "portal" });

    if(rules){
      Rules.update(rules, {$set: {"text": text}});
    } else {
      Rules.insert({
        object: "portal",
        text: text
      });
    }
  },
  editProgramRules: function (text) {
    check(text, String);

    text = sanitizeHtml(text, sanitizeOptions);

    if (!Roles.userIsInRole(this.userId, ['programs-manage'])) {
      throw new Meteor.Error('not-authorized');
    }
    this.unblock();

    const rules = Rules.findOne({ object: "program" });

    if(rules){
      Rules.update(rules, {$set: {"text": text}});
    } else {
      Rules.insert({
        object: "program",
        text: text
      });
    }
  },
  acceptProgramRules: function () {
    this.unblock();
    const currentUser = Meteor.user();

    const expaidrole = Rolespresets.findOne({"title": "ExRookie"});
    if(currentUser.profile && currentUser.profile.role !== expaidrole._id){
      Meteor.users.update(currentUser, {$set: {"profile.programRulesAccepted": true}});
    }
  }
});
