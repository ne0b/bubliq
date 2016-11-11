import {Meteor} from 'meteor/meteor';
import {Rolespresets} from '/model/rolespresets';

export const getContactsCursors = (user, filterObject, searchString, limit, skip) => {
  return Meteor.users.find(generateContactsQuery(user, filterObject, searchString), {
    fields: {
      profile: 1,
      normalized: 1,
      firstLetter: 1,
      roles: 1
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

    const rolepreset = Rolespresets._cache[user.profile.role];
    profile.roleName = (rolepreset && user.roles && user.roles.includes('tasks-review')) ?
      `(${rolepreset.title})` : '';

    profile.fullname = [profile.name || '', profile.lastname || '', profile.roleName].join(" ").replace(/\s+/g, " ").trim();

    let ruser = _.extend(user, {
      profile
    });

    return ruser;
  }
}

export const getContactsSearchQuery = (searchString) => {
  const searchPhrase = Meteor.users.genSearchTerm(searchString);
  if (searchPhrase.length > 2) {
    return {ftss: {$regex: `^${searchPhrase}`}};
  }

  return {};
};

export const generateContactsQuery = (user, filterObject, searchString) => {
  // TODO refac. Replace $ne with something else.
  const query = {_id: {$ne: user._id}, 'emails.verified': true};

  if (filterObject === 'stream' || filterObject === 'program') {
    const key = `${filterObject}s`;
    const searchIds = _.compact(user.profile[key] || []);
    const idsLength = searchIds.length;

    if (idsLength) {
      query[`profile.${key}`] = idsLength === 1 ? searchIds[0] : {$in: searchIds};
    }
  }

  return _.extend({}, query, getContactsSearchQuery(searchString));
};
