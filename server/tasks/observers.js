import {Tasks} from '/model/tasks';

export default function () {
  const allTasksCursor = Tasks.find();

  const watchForTasks = () => {
    const tasksObserve = allTasksCursor.observe({
      added: function(document) {
        Tasks._cache[document._id] = document;
      },
      changed: function(document) {
        Tasks._cache[document._id] = document;
      },
      removed: function(oldDocument) {
        Tasks._cache = _.omit(Tasks._cache, oldDocument._id);
      }
    });

    return [
      tasksObserve
    ]
  };

  let watchers = watchForTasks();
  Meteor.setInterval(() => {
   if (watchers && watchers[0].stop) {
     watchers.forEach((watcher) => {
       watcher.stop();
     });
   }
   watchers = watchForTasks();
  }, 10 * 60 * 1000);
}
