import {Rolespresets} from '/model/rolespresets';

export default function () {
  const allRolespresetsCursor = Rolespresets.find();

  const watchForRolespresets = () => {
    const rolespresetsObserve = allRolespresetsCursor.observe({
      added: function(document) {
        Rolespresets._cache[document._id] = document;
      },
      changed: function(document) {
        Rolespresets._cache[document._id] = document;
      },
      removed: function(oldDocument) {
        Rolespresets._cache = _.omit(Rolespresets._cache, oldDocument._id);
      }
    });

    return [
      rolespresetsObserve
    ]
  };

  let watchers = watchForRolespresets();
  Meteor.setInterval(() => {
   if (watchers && watchers[0].stop) {
     watchers.forEach((watcher) => {
       watcher.stop();
     });
   }
   watchers = watchForRolespresets();
  }, 10 * 60 * 1000);
}
