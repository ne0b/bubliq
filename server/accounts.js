Accounts.onCreateUser(function(options, user) {
  const guestrole = Rolespresets.findOne({
    "title": "Гость"
  });

  user.profile = {
    "rulesAccepted": false,
    "role": guestrole._id,
    "programs": [],
    "streams": []
  };
  user.counters = {};
  user.referer = options.referer;
  user.referals = [];
  user.referalsCount = 0;
  user.paidPrograms = [];
  user.trialPrograms = [];
  user.normalized = '🿿 🿿';
  return user;
});
Accounts.onLogin(function() {
  const guestrole = Rolespresets.findOne({
    "title": "Гость"
  });
  const currentUser = Meteor.user();

  if (currentUser.profile.rulesAccepted && currentUser.emails[0].verified && currentUser.profile.role === guestrole._id) {
    const freerole = Rolespresets.findOne({
      "title": "Зевака"
    });

    Meteor.users.update(currentUser, {
      $set: {
        "profile.role": freerole._id,
        "profile.tasksnotify": true,
        "profile.pushTasksNotify": true,
        "profile.pushCommentsNotify": true,
        "profile.pushLikesNotify": true,
        "profile.privacy": "public"
      }
    });
    let roles = [];
    roles.push('programs-view-all');
    roles.push('programs-view-free');
    roles.push('programs-take-free');
    Roles.addUsersToRoles(currentUser._id, roles);
  }
});
