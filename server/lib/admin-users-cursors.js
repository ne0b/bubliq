getAdminUsersCursors = (limit, searchString, selectedRoles, selectedWithoutPrograms, selectedWithPrograms, selectedMentors, selectedStreams, unsubscribed, rulesAccepted, createdDateFrom, createdDateTo, createdTimeFrom, createdTimeTo, verified, withReferals) => {
  return [
    Meteor.users.find(generateAdminUsersQuery(searchString, selectedRoles,
      selectedWithoutPrograms, selectedWithPrograms, selectedMentors,
      selectedStreams, unsubscribed, rulesAccepted, createdDateFrom,
      createdDateTo, createdTimeFrom, createdTimeTo, verified, withReferals), {
      fields: {
        emails: 1,
        profile: 1,
        roles: 1,
        createdAt: 1,
        unsubscribed: 1,
        referalsCount: 1
      },
      limit: limit,
      sort: {
        createdAt: -1
      }
    }),
    Rolespresets.find({}, {
      fields: {
        title: 1,
        rights: 1
      }
    }),
    Programs.find({}, {
      title: 1
    }),
    Streams.find({}, {
      title: 1,
      programId: 1
    })
  ]
}
