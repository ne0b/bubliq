Meteor.methods({
  impersonateUser: function(userId) {
    check(userId, String);

    if (!Meteor.users.findOne(userId))
      throw new Meteor.Error(404, 'User not found');
    if (!Roles.userIsInRole(this.userId, ['users-manage']))
      throw new Meteor.Error(403, 'Permission denied');

    this.setUserId(userId);
  }
});
