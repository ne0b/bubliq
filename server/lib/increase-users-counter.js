
increaseUsersCounter = (userId, counterName, inc) => {
  let incQuery = {};
  incQuery[`counters.${counterName}`] = inc;

  Meteor.users.update(userId, {
    $inc: incQuery
  });
}

setUsersCounter = (userId, counterName, set) => {
  let setQuery = {};
  setQuery[`counters.${counterName}`] = set;

  Meteor.users.update(userId, {
    $set: setQuery
  });
}

increaseUsersProgramsCounter = (userId, streamId, counterName, inc) => {
  const user = Meteor.users.findOne(userId, { fields: { "counters":1 } });

  let programsCounters = user.counters && user.counters.programsCounters ?
                          user.counters.programsCounters : [];

  let counterIndex = -1;

  if (programsCounters.length > 0) {
    let counterToChange = _.findWhere(programsCounters, { _id: streamId });

    counterIndex = programsCounters.indexOf(counterToChange);
  }

  if (counterIndex >= 0) {
    let incQuery = {};
    incQuery[`counters.programsCounters.${counterIndex}.${counterName}`] = inc;

    Meteor.users.update(userId, {
      $inc: incQuery
    });
  } else {
    let pushQuery = {};
    const givenTasksLikesCount = counterName === 'givenTasksLikesCount' ? 1 : 0;
    const commentsLikesCount = counterName === 'commentsLikesCount' ? 1 : 0;

    pushQuery[`counters.programsCounters`] = {
      _id: streamId,
      givenTasksLikesCount,
      commentsLikesCount
    };

    Meteor.users.update(userId, {
      $push: pushQuery
    });
  }
}
