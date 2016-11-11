import {Programs} from '/model/programs';

export default function () {
  const allProgramsCursor = Programs.find();

  const changeCurrentProgram = (program) => {
    Meteor.settings.public.CURRENT_PROGRAM = program._id;
    Meteor.settings.public.CURRENT_PROGRAM_TRIAL_LAST_DAY = program.properties.date3;
  }

  const watchForPrograms = () => {
    const programsObserve = allProgramsCursor.observe({
      added: function(document) {
        Programs._cache[document._id] = document;
        if (document.properties && document.properties.isCurrent) changeCurrentProgram(document);
      },
      changed: function(document) {
        Programs._cache[document._id] = document;
        if (document.properties && document.properties.isCurrent) changeCurrentProgram(document);
      },
      removed: function(oldDocument) {
        Programs._cache = _.omit(Programs._cache, oldDocument._id);
      }
    });

    return [
      programsObserve
    ]
  };

  let watchers = watchForPrograms();
  Meteor.setInterval(() => {
   if (watchers && watchers[0].stop) {
     watchers.forEach((watcher) => {
       watcher.stop();
     });
   }
   watchers = watchForPrograms();
  }, 10 * 60 * 1000);
}
