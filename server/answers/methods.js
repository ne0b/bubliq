import {Meteor} from 'meteor/meteor';
import lib from './lib';

lib();

export default function() {
  Meteor.methods({
    getMoreAnswers(limit, skip) {
      check(limit, Number);
      check(skip, Number);

      this.unblock();

      const stubUserId = this.userId;

      // kick off unauthorized
      if (!stubUserId) return;

      return getAnswersCursor(limit+5, skip, stubUserId).fetch();
    },
    getNewAnswers(difference) {
      check(difference, Number);

      this.unblock();

      const stubUserId = this.userId;

      // kick off unauthorized
      if (!stubUserId) return;

      return getAnswersCursor(difference, 0, stubUserId).fetch();
    },
    getMoreAnswerLikes(answerId) {
      check(answerId, String);

      this.unblock();

      // kick off unauthorized
      if (!this.userId) return;

      const answer = Answers.findOne({ _id:answerId },
        { fields:
          {
            likesUsers: 1
          }
        });

      likes = answer.likesUsers.map((user) => {
        let like = {};

        like.userId = user;

        like.owner = Meteor.users.findOne(user, { fields: { profile: 1 } });

        const { profile } = like.owner;

        like.owner.profile.fullname = [profile.name || '', profile.lastname || ''].join(" ").replace(/\s+/g, " ").trim();

        return like;
      });

      return likes;
    },
    markAnswerAsRead(answerId, read) {
      check(answerId, String);
      check(read, Boolean);

      this.unblock();

      const userId = this.userId;

      // kick off unauthorized
      if (!userId) return;

      const answer = Answers.findOne({ _id:answerId, userId }, { fields: { read:1 } });

      if (answer && answer.read !== read) {
        Answers.update({ _id:answerId, userId }, { $set: { read } });

        if (read) {
          Updates.disposeEvent(this.userId, { type: 'ANSWERS' }, -1);
        } else {
          Updates.registerEvent(userId, { type: 'ANSWERS' });
        }
      }
    },
    markAllAnswersAsRead() {
      this.unblock();

      // kick off unauthorized
      if (!this.userId) return;

      Answers.update({userId: this.userId, read: false}, {$set:{"read": true}}, {multi: true});

      Updates.disposeEvent(this.userId, { type: 'ANSWERS' });
    },
    markAllAnswersAsReadInNotifications() {
      this.unblock();

      // kick off unauthorized
      if (!this.userId) return;

      Answers.update({userId: this.userId, readInNotifications: { $exists: false }}, {$set:{"readInNotifications": true}}, {multi: true});
    }
  });
}
