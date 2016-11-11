import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';

export default function () {
  Meteor.publish("streamTitles", function() {
    return Streams.find({}, {
      fields: {
        title: 1,
        programId: 1,
        start: 1
      }
    });
  });

  Meteor.publish("streamEdit", function(streamId) {
    check(streamId, String);

    if(!Roles.userIsInRole(this.userId, ['programs-manage'])) return this.ready();

    const coordinatorRole = Rolespresets.findOne({ "title": "Координатор" });
    const captainRole = Rolespresets.findOne({ "title": "Капитан" });
    const trainerRole = Rolespresets.findOne({ "title": "Тренер" });

    const stream = Streams._cache[streamId];
    const streamsIds = _.where(_.values(Streams._cache), { programId: stream.programId }).map((stream) => {
      return stream._id
    });

    return [
      Streams.find({ _id: streamId }),
      Stars.find({ streamId: { $in: streamsIds } }),
      Meteor.users.find({ "profile.role": { $in: [coordinatorRole._id, trainerRole._id, captainRole._id] } },
                        { fields: { profile:1, captainInStars:1, emails:1 } }),
      Rolespresets.find({ "title": { $in: ["Координатор", "Тренер", "Капитан"] } })
    ];
  });
}
