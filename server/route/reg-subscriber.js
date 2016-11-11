
Router.route('/reg-subscriber', { where: 'server' })
  .post(function() {
      const req = this.request;
      const res = this.response;

      const clientIp = this.request.connection.remoteAddress;

      const email = req.body["SUB_EMAIL"];

      let reply = "ERROR";

      if (~process.env.ALLOWED_IPS.indexOf(clientIp)) {
        if (email) {
          const regexp = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

          if (regexp.test(email)) {
            let user = Accounts.findUserByEmail(email);

            if (!user) {
              const guestrole = Rolespresets.findOne({"title": "Гость"});
              user = Accounts.createUser({
                email,
                password: Random.id(8)
              });

              Meteor.users.update(user, { $set: {
                "profile.role": guestrole._id,
                "profile.nopassword": true,
                "remoteSubscriber": true
              } });
            } else { user = user._id };

            const guestLetter400 = Letters.findOne({
              "name": "Гостю 4.00"
            });

            Meteor.call("addSentLetterToUser", "Гостю 4.00", user, (error, result) => {
              if (result) {
                Meteor.call('sendDefaultEmail', Meteor.users.findOne(user), guestLetter400.text, guestLetter400.subject, guestLetter400.preheader, result);
              }
            });

            reply = "OK";
          }
        }
      }
      else {
        reply = "ACCESS DENIED";
      }

      res.end(reply);
    });
