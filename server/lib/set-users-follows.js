setUsersFollows = (user, users) => {
  let usersFollows = user.follows && user.follows.follows ? user.follows.follows : [];
  let usersFollowers = user.follows && user.follows.followers ? user.follows.followers : [];

  usersFollows = _.chain(usersFollows).union(users).uniq()
                           .filter((usr) => usr !== user._id).value();

  usersFollowers = _.chain(usersFollowers).union(users)
                           .filter((usr) => usr !== user._id).uniq().value();

  Meteor.users.update(user._id, { $set: { "follows.follows": usersFollows,
                                      "follows.followers": usersFollowers } });
}
