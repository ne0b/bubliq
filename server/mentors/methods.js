
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

export default function() {
  Meteor.methods({
    getMoreMentorUsers(searchString, mentorId, limit, skip) {
      check(searchString, Match.Maybe(String));
      check(mentorId, Match.Maybe(String));
      check(limit, Match.Maybe(Number));
      check(skip, Match.Maybe(Number));

      const user = Meteor.user();

      return getMentorsCursors(user, searchString, mentorId, limit, skip).fetch();
    },
    getMentorUsersCount(searchString, mentorId) {
      check(searchString, Match.Maybe(String));
      check(mentorId, Match.Maybe(String));

      const user = Meteor.user();

      return Meteor.users.find(generateMentorsQuery(user, searchString, mentorId)).count();
    }
  });
}
