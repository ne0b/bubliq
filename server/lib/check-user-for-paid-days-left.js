checkUserForPaidDaysLeft = (currentUser, streamId, taskId) => {
  const task = Tasks._cache[taskId];
  const stream = Streams._cache[streamId];
  const program = Programs._cache[task.programId];

  if (program && !program.free) {
    let currentProgramId = Meteor.settings.public.CURRENT_PROGRAM;
    let validTrial = moment(Meteor.settings.public.CURRENT_PROGRAM_TRIAL_LAST_DAY).diff(moment(), 'seconds') > 0 &&
                           _.findWhere(currentUser.trialPrograms, { _id: currentProgramId });

    return !validTrial;
  }

  return false;
}
