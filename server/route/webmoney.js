
// Tehera are no such Package
// Meteor.log.rule('Mongo', {
//   enable: true,
//   filter: ['*'], /* Filters: 'ERROR', 'FATAL', 'WARN', 'DEBUG', 'INFO', '*' */
//   client: false, /* This allows to call, but not execute on Client */
//   server: true   /* Calls from client will be executed on Server */
// });

import {Logger} from '/model/logger';

// Получение логин токена
Router.route('/getlogintoken', {where: 'server'})
  .post(function() {
      const res = this.response;

      const reply = Accounts._generateStampedLoginToken();

      res.end(JSON.stringify(reply));
    });

// Проверка платежа с регистрацией
Router.route('/checkorder', {where: 'server'})
  .post(function() {
    let req = this.request;
    let res = this.response;
    let reply = '';
    let data = req.body;

    const params = _.pick(data || {},
      'LMI_MERCHANT_ID',
      'LMI_PAYMENT_NO',
      'LMI_SYS_PAYMENT_ID',
      'LMI_SYS_PAYMENT_DATE',
      'LMI_PAYMENT_AMOUNT',
      'LMI_CURRENCY',
      'LMI_PAID_AMOUNT',
      'LMI_PAID_CURRENCY',
      'LMI_PAYMENT_SYSTEM',
      'LMI_SIM_MODE');

    const localLog = Logger.define('checkorder', params);
    localLog.info('route called');


    if(req.body){
      let hashString = '';

      let LMI_MERCHANT_ID = req.body["LMI_MERCHANT_ID"];
      hashString += LMI_MERCHANT_ID ? LMI_MERCHANT_ID : '';

      let LMI_PAYMENT_NO = req.body["LMI_PAYMENT_NO"];
      hashString += LMI_PAYMENT_NO ? ";"+LMI_PAYMENT_NO : ';';

      let LMI_SYS_PAYMENT_ID = req.body["LMI_SYS_PAYMENT_ID"];
      hashString += LMI_SYS_PAYMENT_ID ? ";"+LMI_SYS_PAYMENT_ID : ';';

      let LMI_SYS_PAYMENT_DATE = req.body["LMI_SYS_PAYMENT_DATE"];
      hashString += LMI_SYS_PAYMENT_DATE ? ";"+LMI_SYS_PAYMENT_DATE : ';';

      let LMI_PAYMENT_AMOUNT = req.body["LMI_PAYMENT_AMOUNT"];
      hashString += LMI_PAYMENT_AMOUNT ? ";"+LMI_PAYMENT_AMOUNT : ';';

      let LMI_CURRENCY = req.body["LMI_CURRENCY"];
      hashString += LMI_CURRENCY ? ";"+LMI_CURRENCY : ';';

      let LMI_PAID_AMOUNT = req.body["LMI_PAID_AMOUNT"];
      hashString += LMI_PAID_AMOUNT ? ";"+LMI_PAID_AMOUNT : ';';

      let LMI_PAID_CURRENCY = req.body["LMI_PAID_CURRENCY"];
      hashString += LMI_PAID_CURRENCY ? ";"+LMI_PAID_CURRENCY : ';';

      let LMI_PAYMENT_SYSTEM = req.body["LMI_PAYMENT_SYSTEM"];
      hashString += LMI_PAYMENT_SYSTEM ? ";"+LMI_PAYMENT_SYSTEM : ';';

      let LMI_SIM_MODE = req.body["LMI_SIM_MODE"];
      hashString += LMI_SIM_MODE ? ";"+LMI_SIM_MODE : ';';

      let LMI_SECRET_KEY = "";
      hashString += LMI_SECRET_KEY ? ";"+LMI_SECRET_KEY : ';';

      hashString = CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(hashString)));

      let order = Orders.findOne({ orderNumber: parseInt(LMI_PAYMENT_NO) });

      if (order) {
        const user = order ? Meteor.users.findOne({ _id: order.customerNumber }) : false;

        if(LMI_MERCHANT_ID == Meteor.settings.public.MERCHANT_ID &&
            user && validatePriceWithUser(LMI_PAYMENT_AMOUNT, user)){
          reply = 'YES';
        }
        else {
          reply = 'NO';
        }
      }
      else {
        const user = Accounts.findUserByEmail(req.body["LOCAL_PAYER_EMAIL"]);

        if(LMI_MERCHANT_ID == Meteor.settings.public.MERCHANT_ID_REG
            && ((!user && validatePrice(LMI_PAYMENT_AMOUNT)) ||
                (user && validatePriceWithUser(LMI_PAYMENT_AMOUNT, user)))) {
          reply = 'YES';
        } else {
          reply = 'NO';
        }
      }
    } else {
      localLog.error('No req.body data provided');
    }

    data["REPLY"] = reply;

    res.end(reply);
  });

// Подтверждение платежа+регистрация
Router.route('/paymentaviso', {where: 'server'})
  .post(function() {
    let req = this.request;
    let res = this.response;
    let reply = '';
    let data = req.body;

    const params = _.pick(req.body || {},
      'LMI_MERCHANT_ID',
      'LMI_PAYMENT_NO',
      'LMI_SYS_PAYMENT_ID',
      'LMI_SYS_PAYMENT_DATE',
      'LMI_PAYMENT_AMOUNT',
      'LMI_CURRENCY',
      'LMI_PAID_AMOUNT',
      'LMI_PAID_CURRENCY',
      'LMI_PAYMENT_SYSTEM',
      'LMI_SIM_MODE',
      'LMI_HASH',
      'LOCAL_REFERER',
      'LOCAL_PAYER_EMAIL');

    const localLog = Logger.define('paymentaviso', params);
    localLog.info('route called');

    if(req.body){
      let hashString = '';

      let LMI_MERCHANT_ID = req.body["LMI_MERCHANT_ID"];
      hashString += LMI_MERCHANT_ID ? LMI_MERCHANT_ID : '';

      let LMI_PAYMENT_NO = req.body["LMI_PAYMENT_NO"];
      hashString += LMI_PAYMENT_NO ? ";"+LMI_PAYMENT_NO : ';';

      let LMI_SYS_PAYMENT_ID = req.body["LMI_SYS_PAYMENT_ID"];
      hashString += LMI_SYS_PAYMENT_ID ? ";"+LMI_SYS_PAYMENT_ID : ';';

      let LMI_SYS_PAYMENT_DATE = req.body["LMI_SYS_PAYMENT_DATE"];
      hashString += LMI_SYS_PAYMENT_DATE ? ";"+LMI_SYS_PAYMENT_DATE : ';';

      let LMI_PAYMENT_AMOUNT = req.body["LMI_PAYMENT_AMOUNT"];
      hashString += LMI_PAYMENT_AMOUNT ? ";"+LMI_PAYMENT_AMOUNT : ';';

      let LMI_CURRENCY = req.body["LMI_CURRENCY"];
      hashString += LMI_CURRENCY ? ";"+LMI_CURRENCY : ';';

      let LMI_PAID_AMOUNT = req.body["LMI_PAID_AMOUNT"];
      hashString += LMI_PAID_AMOUNT ? ";"+LMI_PAID_AMOUNT : ';';

      let LMI_PAID_CURRENCY = req.body["LMI_PAID_CURRENCY"];
      hashString += LMI_PAID_CURRENCY ? ";"+LMI_PAID_CURRENCY : ';';

      let LMI_PAYMENT_SYSTEM = req.body["LMI_PAYMENT_SYSTEM"];
      hashString += LMI_PAYMENT_SYSTEM ? ";"+LMI_PAYMENT_SYSTEM : ';';

      let LMI_SIM_MODE = req.body["LMI_SIM_MODE"];
      hashString += LMI_SIM_MODE ? ";"+LMI_SIM_MODE : ';';

      let LMI_SECRET_KEY = "";
      hashString += LMI_SECRET_KEY ? ";"+LMI_SECRET_KEY : ';';

      let LMI_HASH = req.body["LMI_HASH"];

      hashString = CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(hashString)));

      function setNewUserRoles(userId, roleDB) {
        let roles = [];

        if(roleDB.rights.usersmanage) roles.push('users-manage');
        if(roleDB.rights.mentorassign) roles.push('mentor-assign');
        if(roleDB.rights.programsmanage) roles.push('programs-manage');
        if(roleDB.rights.moderator) roles.push('moderator');
        if(roleDB.rights.usersviewall) roles.push('users-view-all');
        if(roleDB.rights.usersviewown) roles.push('users-view-own');
        if(roleDB.rights.programsviewall) roles.push('programs-view-all');
        if(roleDB.rights.programsviewfree) roles.push('programs-view-free');
        if(roleDB.rights.tasksreview) roles.push('tasks-review');
        if(roleDB.rights.tasksassign) roles.push('tasks-assign');
        if(roleDB.rights.programstakeall) roles.push('programs-take-all');
        if(roleDB.rights.programstakefree) roles.push('programs-take-free');

        Roles.setUserRoles(userId, roles);
      }

      function checkAndSetParamsForUser(user, roleDB, freerole, guestrole, expaidrole) {
        if (user.profile && (user.profile.role === freerole._id
                              || user.profile.role === guestrole._id
                              || user.profile.role === expaidrole._id)) {
          let userParams = user.profile.role === guestrole._id ?
          {
            "profile.role": roleDB._id,
            "profile.tasksnotify": true,
            "profile.pushTasksNotify": true,
            "profile.pushCommentsNotify": true,
            "profile.pushLikesNotify": true,
            "profile.privacy": "public"
          } : {
            "profile.role": roleDB._id
          };

          Meteor.users.update(user._id, {
            $set: userParams
          });

          setNewUserRoles(user._id, roleDB);
        }
      }

      function localISOString(d) {
          var pad = function (n){return n<10 ? '0'+n : n;}, tz = d.getTimezoneOffset(), tzs = (tz>0?"-":"+") + pad(parseInt(Math.abs(tz/60)));

          if (tz%60 != 0) tzs += pad(Math.abs(tz%60));

          if (tz === 0) tzs = 'Z';

           return d.getFullYear()+'-'
                + pad(d.getMonth()+1)+'-'
                + pad(d.getDate())+'T'
                + pad(d.getHours())+':'
                + pad(d.getMinutes())+':'
                + pad(d.getSeconds()) + tzs;
      };

      function markUserAsPaid(user, LMI_PAYMENT_AMOUNT) {
        const userDB = Meteor.users.findOne(user);

        if (fullPrices.includes(LMI_PAYMENT_AMOUNT)) {
          Meteor.users.update(user, { $push: { paidPrograms: paymentProgram._id } });

          if (basePrices.includes(LMI_PAYMENT_AMOUNT)) {
            const rookieLetter401 = Letters.findOne({
              "name": "Rookie 4.01"
            });
            Meteor.call("addSentLetterToUser", "Rookie 4.01", user, (error, result) => {
              if (result) {
                Meteor.call('sendDefaultEmail', userDB, rookieLetter401.text, rookieLetter401.subject, rookieLetter401.preheader, result);
              }
            });
          }
        }
        else {
          let trialProgram = _.findWhere(userDB.trialPrograms, { _id: paymentProgram._id });

          if (trialProgram) {
            userDB.trialPrograms[userDB.trialPrograms.indexOf(trialProgram)] = {
              _id: paymentProgram._id,
              free: false,
              periodId: getCurrentPeriod(),
              addedAt: new Date()
            }

            Meteor.users.update(user, { $set: {
              trialPrograms: userDB.trialPrograms
            } });
          } else {
            trialProgram = {
              _id: paymentProgram._id,
              free: false,
              periodId: getCurrentPeriod(),
              addedAt: new Date()
            }

            Meteor.users.update(user, { $addToSet: {
              trialPrograms: trialProgram
            } });
          }
        }

        const currentTime = localISOString(new Date());

        if (basePrices.includes(LMI_PAYMENT_AMOUNT) &&
            ((req.body["LOCAL_ENTRANCE_TIME"] && moment(currentTime).diff(req.body["LOCAL_ENTRANCE_TIME"]) <= Meteor.settings.public.TIME_UNTIL_BONUS_EXPIRES) ||
            (!req.body["LOCAL_ENTRANCE_TIME"] && moment(currentTime).diff(localISOString(userDB.createdAt)) <= Meteor.settings.public.TIME_UNTIL_BONUS_EXPIRES))) {
          const rookieLetter402 = Letters.findOne({
            "name": "Rookie 4.02"
          });
          Meteor.call("addSentLetterToUser", "Rookie 4.02", user, (error, result) => {
            if (result) {
              Meteor.call('sendDefaultEmail', userDB, rookieLetter402.text, rookieLetter402.subject, rookieLetter402.preheader, result);
            }
          });
        }
      }

      let user;

      const paymentProgram = Programs.getPaymentProgram();
      const { properties } = paymentProgram;

      const basePrices = [
        `${properties.priceBase1}.00`,
        `${properties.priceBase2}.00`
      ]

      const fullPrices = [
        `${properties.priceBase1}.00`,
        `${properties.priceBase2}.00`,
        `${properties.priceTrial0Sur1}.00`,
        `${properties.priceTrial1Pre}.00`,
        `${properties.priceTrial1Sur1}.00`,
        `${properties.priceTrial1Sur2}.00`,
        `${properties.priceTrial2Sur1}.00`,
        `${properties.priceTrial2Sur2}.00`
      ];

      const trialPrices = [
        `${properties.priceTrial1}.00`,
        `${properties.priceTrial2}.00`
      ];

      if ((LMI_MERCHANT_ID == Meteor.settings.public.MERCHANT_ID ||
          LMI_MERCHANT_ID == Meteor.settings.public.MERCHANT_ID_REG)
          && LMI_HASH && LMI_HASH == hashString) {
        let freerole = Rolespresets.findOne({"title": "Зевака"});
        let guestrole = Rolespresets.findOne({"title": "Гость"});
        let expaidrole = Rolespresets.findOne({"title": "ExRookie"});

        let roleDB = fullPrices.includes(LMI_PAYMENT_AMOUNT) ?
                     Rolespresets.findOne({"title": "Rookie"}) : freerole;

        let order = Orders.findOne({ orderNumber: parseInt(LMI_PAYMENT_NO) });

        if (order) {
          user = Meteor.users.findOne({ _id: order.customerNumber });

          if(user){
            checkAndSetParamsForUser(user, roleDB, freerole, guestrole, expaidrole);
            if (user.referer) {
              Meteor.users.update({ $and: [
                                      { _id: user.referer },
                                      { $or: [
                                          { referals:
                                            { $elemMatch:
                                              { $or: [
                                                  { _id: { $ne: user._id } },
                                                  {
                                                    programId: { $ne: paymentProgram._id },
                                                    paymentSum: { $ne: parseInt(LMI_PAYMENT_AMOUNT) }
                                                  }
                                                ]
                                              }
                                            }
                                          },
                                          { referals: [] }
                                        ]
                                      }
                                    ]
                                  },
                                  { $addToSet:
                                    { referals:
                                      {
                                        _id: user._id,
                                        paymentDate: new Date(),
                                        paymentSum: parseInt(LMI_PAYMENT_AMOUNT),
                                        programId: paymentProgram._id
                                      }
                                    },
                                    $inc: { referalsCount: 1 }
                                  });
            }

            user = user._id;

            markUserAsPaid(user, LMI_PAYMENT_AMOUNT);

            Orders.update(order, { $set: {
              sum: parseInt(LMI_PAYMENT_AMOUNT),
              paid: true
            } });

            Orders.update({ customerNumber: user,
                            programId: paymentProgram._id,
                            trial: true }, { $set: {
              sum: Meteor.settings.public.PRICE_TRIAL,
              paid: true
            } });
          }
        }
        else {
          user = Accounts.findUserByEmail(req.body["LOCAL_PAYER_EMAIL"]);

          if (user) {
            checkAndSetParamsForUser(user, roleDB, freerole, guestrole, expaidrole);

            user = user._id;
          }
          else {
            user = Accounts.createUser({
              email: req.body["LOCAL_PAYER_EMAIL"],
              password: Random.id(8)
            });

            Accounts.sendVerificationEmail(user, req.body["LOCAL_PAYER_EMAIL"]);

            Meteor.call("addSentLetterToUser", "Гостю 0.00", user);

            try {
              const loginToken = JSON.parse(req.body["LOCAL_LOGIN_TOKEN"]);

              Accounts._insertLoginToken(user, loginToken);
            }
            catch (e) {
              Logger.error(e.message);
            }

            let userParams = {
              "profile.role": roleDB._id,
              "profile.tasksnotify": true,
              "profile.pushTasksNotify": true,
              "profile.pushCommentsNotify": true,
              "profile.pushLikesNotify": true,
              "profile.privacy": "public",
              "profile.nopassword": true
            }

            Meteor.users.update(user, {
              $set: userParams
            });

            setNewUserRoles(user, roleDB);
          }

          if (req.body["LOCAL_REFERER"]) {
            Meteor.users.update({ $and: [
                                    { _id: req.body["LOCAL_REFERER"] },
                                    { $or: [
                                        { referals:
                                          { $elemMatch:
                                            { $or: [
                                                { _id: { $ne: user._id } },
                                                {
                                                  programId: { $ne: paymentProgram._id },
                                                  paymentSum: { $ne: parseInt(LMI_PAYMENT_AMOUNT) }
                                                }
                                              ]
                                            }
                                          }
                                        },
                                        { referals: [] }
                                      ]
                                    }
                                  ]
                                },
                                { $addToSet:
                                  { referals:
                                    {
                                      _id: user,
                                      paymentDate: new Date(),
                                      paymentSum: parseInt(LMI_PAYMENT_AMOUNT),
                                      programId: paymentProgram._id
                                    }
                                  },
                                  $inc: { referalsCount: 1 }
                                });

            Meteor.users.update(user, { $set: { referer: req.body["LOCAL_REFERER"] } });
          }

          markUserAsPaid(user, LMI_PAYMENT_AMOUNT);

          Orders.insert({
            orderNumber: incrementCounter('orderIds', 'orderId'),
            customerNumber: user,
            sender_email: req.body["LOCAL_PAYER_EMAIL"],
            sum: parseInt(LMI_PAYMENT_AMOUNT),
            paid: true,
            programId: paymentProgram._id,
            trial: trialPrices.includes(LMI_PAYMENT_AMOUNT)
          });
        }
      }
    } else {
      localLog.error('No req.body data provided');
    }

    res.end(reply);
  });
