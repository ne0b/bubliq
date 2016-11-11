import {Meteor} from 'meteor/meteor';

export default function() {
  Meteor.methods({
    addStar(star) {
      this.unblock();
      if (!Roles.userIsInRole(this.userId, ['programs-manage'])) throw new Meteor.Error('not-authorized');

      check(star, {
        title: String,
        streamId: String,
        captain: String
      });

      const starDB = Stars.findOne({ title: star.title, streamId: star.streamId });

      if (!starDB) {
        star.createdAt = new Date();
        
        const streamDB = Streams._cache[star.streamId];

        star.programId = streamDB ? streamDB.programId : "deleted";

        Stars.insert(star);
      } else throw new Meteor.Error('already-exists');
    },
    editStar(star) {
      this.unblock();
      if (!Roles.userIsInRole(this.userId, ['programs-manage'])) throw new Meteor.Error('not-authorized');

      check(star, {
        _id: String,
        title: String,
        streamId: String,
        programId: String,
        createdAt: Date,
        captain: String,
        '$$hashKey': Match.Maybe(String)
      });

      let starDB = Stars.findOne({ _id: { $ne: star._id }, title: star.title, streamId: star.streamId });

      if (!starDB) {
        starDB = Stars.findOne(star._id);

        if (starDB) {
          Meteor.users.update(starDB.captain, { $pull: { captainInStars:star._id } });

          Meteor.users.update(star.captain, { $addToSet: { captainInStars:star._id } });

          Stars.update(star._id, { $set: { title: star.title, captain: star.captain } });
        }
      } else throw new Meteor.Error('already-exists');
    },
    removeStar(starId) {
      if (!Roles.userIsInRole(this.userId, ['programs-manage'])) throw new Meteor.Error('not-authorized');

      check(starId, String);

      Meteor.users.update({ "profile.stars": starId }, { $pull: { "profile.stars": starId } }, { multi: true });

      Meteor.users.update({ "captainInStars": starId }, { $pull: { "captainInStars": starId } }, { multi: true });

      Stars.remove(starId);
    }
  });
}
