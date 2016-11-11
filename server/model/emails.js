
Meteor.methods({
  sendVerificationEmail: function() {
    Accounts.sendVerificationEmail(this.userId, Meteor.user().emails[0]["address"]);

    Meteor.call("addSentLetterToUser", "Гостю 0.00", this.userId);
  },
  sendResetPasswordEmail: function(email) {
    check(email, EmailCheck);

    const user = Accounts.findUserByEmail(email);

    if (user) {
      Accounts.sendResetPasswordEmail(user._id, user.emails[0].address);
    }
  },
  sendEmailOnVerificationLink: function() {
    if (!this.userId) throw new Meteor.Error(403, 'Access denied');

    let currentUser = Meteor.users.findOne(this.userId);

    if (currentUser.paidPrograms.length === 0 && currentUser.trialPrograms.length === 0) {
      const guestLetter001 = Letters.findOne({
        "name": "Гостю 0.01"
      });

      Meteor.call("addSentLetterToUser", "Гостю 0.01", this.userId, (error, result) => {
        if (result) {
          Meteor.call('sendDefaultEmail', currentUser, guestLetter001.text, guestLetter001.subject, guestLetter001.preheader, result);
        }
      });
    } else {
      const newLetter110 = Letters.findOne({
        "name": "Rookie/Trial 1.10"
      });

      Meteor.call("addSentLetterToUser", "Rookie/Trial 1.10", this.userId, (error, result) => {
        if (result) {
          Meteor.call('sendDefaultEmail', currentUser, newLetter110.text, newLetter110.subject, newLetter110.preheader, result);
        }
      });
    }
  },
  sendNewTaskNotifications: function(user, task, streamDB, giventask) {
    check(user, Object);
    check(task, Object);
    check(streamDB, Object);
    check(giventask, String);

    if (emailAllowedCheck(user.emails[0].address)) {
      moment.updateLocale('ru', {
        weekdays: [
          "воскресенья", "понедельника", "вторника", "среды", "четверга", "пятницы", "субботы"
        ]
      });

      Meteor.call("addSentLetterToUser", "Уведомление 3.01", user._id, (error, result) => {
        if (result) {
          const html = SSR.render("taskNotify", {
            name: user.profile.name,
            lastname: user.profile.lastname,
            title: task.title,
            deadline: moment(streamDB.start).add(task.end - 1, 'days').locale('ru').format("dddd, DD.MM.YYYY"),
            taskId: giventask,
            userId: user._id,
            sentLetterId: result,
            preheader: task.title
          });

          Meteor.call("sendEmail", Meteor.settings.DEFAULT_SENDER,
            user.emails[0].address, "Новое задание", html, result);
        }
      });
    }
  },
  sendDefaultEmail: function(user, text, subject, preheader, sentLetterId) {
    check(user, Object);
    check(text, String);
    check(subject, Match.Maybe(String));
    check(preheader, Match.Maybe(String));
    check(sentLetterId, Match.Maybe(String));

    if (emailAllowedCheck(user.emails[0].address)) {
      const html = SSR.render("defaultEmail", {
        preheader: preheader,
        text: text,
        sentLetterId: sentLetterId
      });

      Meteor.call("sendEmail", Meteor.settings.DEFAULT_SENDER,
        user.emails[0].address, subject, html, sentLetterId);
    }
  },
  sendEmail: function(from, to, subject, html, sentLetterId) {
    check(from, String);
    check(to, EmailCheck);
    check(subject, Match.Maybe(String));
    check(html, Match.Maybe(String));
    check(sentLetterId, Match.Maybe(String));

    this.unblock();

    const headers = to.indexOf('@mail.ru') === -1 ? {
      'List-Unsubscribe': `<https://entry.spacebagel.com/unsubscribe?sentletter=${sentLetterId}>`
    } : {};

    Email.send({
      from: from,
      to: to,
      subject: subject,
      html: html,
      headers: headers
    });
  },
  addSentLetterToUser: function(letterName, userId) {
    check(letterName, String);
    check(userId, String);

    const letter = Letters.findOne({
      "name": letterName
    });

    const sentLetter = SentLetters.insert({
      "letterId": letter._id,
      "userId": userId,
      "sentAt": new Date()
    });

    const insertSentLetter = {
      $push: {
        sentLetters: {
          "letterId": letter._id,
          "sentLetterId": sentLetter,
          "sentAt": new Date()
        }
      }
    }

    let user = Meteor.users.findOne({
      _id: userId
    });

    if (!user.sentLetters) {
      Meteor.users.update(user, {
        $set: {
          sentLetters: []
        }
      });

      user = Meteor.users.findOne({
        _id: userId
      });
    }

    Meteor.users.update(user, insertSentLetter);

    return sentLetter;
  }
});

Meteor.settings.DEFAULT_SENDER = Meteor.settings.DEFAULT_SENDER ||
  'Космический бублик [develop] <info@spacebagel.com>';

Accounts.emailTemplates.siteName = "Space Bagel";
Accounts.emailTemplates.from = Meteor.settings.DEFAULT_SENDER;
Accounts.emailTemplates.verifyEmail.subject = function(user) {
  const guestLetter000 = Letters.findOne({
    "name": "Гостю 0.00"
  });

  const subject = guestLetter000 ? guestLetter000.subject : 'Подтверждение email адреса для Space Bagel';

  return subject;
};
Accounts.emailTemplates.verifyEmail.html = function(user, url) {
  const guestLetter000 = Letters.findOne({
    "name": "Гостю 0.00"
  });

  const text = guestLetter000 ? guestLetter000.text.replace('url', `<a href="${url.replace(/\#\//, '')}">ссылка</a>`) : '';

  const html = SSR.render("defaultEmail", {
    preheader: "",
    text: text
  });

  return html;
};
Accounts.emailTemplates.resetPassword.subject = function(user) {
  return 'Восстановление пароля для Space Bagel';
};
Accounts.emailTemplates.resetPassword.text = function(user, url) {
  return 'Для восстановления пароля перейдите по ссылке ниже: \r\n' + url.replace(/\#\//, '');
};
