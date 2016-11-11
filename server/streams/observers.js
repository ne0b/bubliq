import {Streams} from '/model/streams';

export default function () {
  const allStreamsCursor = Streams.find();

  const watchForStreams = () => {
    const streamsObserve = allStreamsCursor.observe({
      added: function(document) {
        Streams._cache[document._id] = document;
      },
      changed: function(document) {
        Streams._cache[document._id] = document;
      },
      removed: function(oldDocument) {
        Streams._cache = _.omit(Streams._cache, oldDocument._id);
      }
    });

    return [
      streamsObserve
    ]
  };

  let watchers = watchForStreams();
  Meteor.setInterval(() => {
   if (watchers && watchers[0].stop) {
     watchers.forEach((watcher) => {
       watcher.stop();
     });
   }
   watchers = watchForStreams();
  }, 10 * 60 * 1000);
}
