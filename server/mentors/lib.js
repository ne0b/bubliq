getMentorsCursors = (user, searchString, mentorId, limit, skip) => {
  return Meteor.users.find(generateMentorsQuery(user, searchString, mentorId), {
    fields: {
      profile: 1,
      normalized: 1
    },
    limit,
    skip,
    sort: {
      "normalized": 1
    },
    transform: transformUser
  });

  function transformUser(user) {
    const { profile } = user;

    profile.avatar = Meteor.users.getAvatarProps(user._id);

    const rolepreset = Rolespresets.findOne(user.profile.role);
    profile.roleName = (rolepreset && Roles.userIsInRole(user._id, ['tasks-review'])) ?
      '(' + rolepreset.title + ')' : '';

    profile.fullname = [profile.name || '', profile.lastname || '', profile.roleName].join(" ").replace(/\s+/g, " ").trim();

    let ruser = _.extend(user, {
      profile
    });

    return ruser;
  }
}

generateMentorsQuery = (user, searchString, mentorId) => {
  let query = {};

  if(mentorId){
    query = {
      _id: { $ne: user._id },
      "emails.verified": true,
      "profile.mentor": mentorId
    };
  } else {
    query = {
      _id: { $ne: user._id },
      "emails.verified": true
    };
  }

  if (searchString && searchString.length > 0) {
    query['$or'] = [
      {"emails.address": { '$regex' : '.*' + searchString || '' + '.*', '$options' : 'i' }},
      {"profile.name": { '$regex' : '.*' + searchString || '' + '.*', '$options' : 'i' }},
      {"profile.lastname": { '$regex' : '.*' + searchString || '' + '.*', '$options' : 'i' }}
    ]
  }

  return query;
};
