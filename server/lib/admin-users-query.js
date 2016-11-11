generateAdminUsersQuery = (searchString, selectedRoles, selectedWithoutPrograms, selectedWithPrograms, selectedMentors, selectedStreams, unsubscribed, rulesAccepted, createdDateFrom, createdDateTo, createdTimeFrom, createdTimeTo, verified, withReferals) => {
  if (searchString == null) searchString = '';

  withReferals = withReferals ? 1 : 0;

  if (selectedRoles == null || (selectedRoles && selectedRoles.length == 0)) {
    var roles = Rolespresets.find({});
    var allRoles = [];
    roles.forEach((role) => {
      allRoles.push(role._id);
    });
  }
  selectedRoles = (selectedRoles && selectedRoles.length > 0) ? selectedRoles : allRoles;

  if (selectedWithoutPrograms == null) selectedWithoutPrograms = [];

  selectedWithPrograms = (selectedWithPrograms && selectedWithPrograms.length > 0) ? {
    "profile.programs": {
      $in: selectedWithPrograms
    }
  } : {};

  if (selectedMentors == null) selectedMentors = [];

  selectedStreams = (selectedStreams && selectedStreams.length > 0) ? {
    "profile.streams": {
      $in: selectedStreams
    }
  } : {};

  let mentorQuery = {
    "profile.mentor": {
      $nin: []
    }
  };

  if (selectedMentors.length > 0) {
    if (selectedMentors.indexOf("true") !== -1 && selectedMentors.indexOf("false") !== -1) {
      mentorQuery = {
        "profile.mentor": {
          $nin: []
        }
      };
    } else if (selectedMentors.indexOf("true") !== -1) {
      mentorQuery = {
        "profile.mentor": {
          $exists: true
        }
      };
    } else if (selectedMentors.indexOf("false") !== -1) {
      mentorQuery = {
        "profile.mentor": {
          $exists: false
        }
      };
    }
  }

  const unsubscribedQuery = unsubscribed ? {
    "unsubscribed": {
      $exists: true
    }
  } : {};

  const rulesAcceptedQuery = rulesAccepted ? {
    "profile.rulesAccepted": true
  } : {};

  const createdFrom = createdDateFrom ? {
    createdAt: {
      $gte: new Date(moment(createdDateFrom).format("YYYY-MM-DD") + " " + createdTimeFrom)
    }
  } : {};

  const createdTo = createdDateTo ? {
    createdAt: {
      $lte: new Date(moment(createdDateTo).format("YYYY-MM-DD") + " " + createdTimeTo)
    }
  } : {};

  return query = {
    $and: [{
        _id: {
          $ne: this.userId
        }
      }, {
        "emails.verified": verified
      }, getSearchQuery(searchString), {
        "profile.role": {
          $in: selectedRoles
        }
      }, {
        "profile.programs": {
          $nin: selectedWithoutPrograms
        }
      },
      {
        referalsCount: { $gte: withReferals }
      },
      selectedWithPrograms,
      selectedStreams,
      mentorQuery,
      unsubscribedQuery,
      rulesAcceptedQuery,
      createdFrom,
      createdTo
    ]
  };
};
