import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';
import {saveAvatarFromBuffer, buildAdminUsersSelector, composeUserSearchTerms} from './lib';
import XLSX from 'xlsx-browserify-shim';

export default function () {
  Meteor.methods({
    tryToLoginWithoutPassword: function(email) {
      const user = Meteor.users.findOne({ "emails.address":email, "profile.nopassword":true }, { fields: { profile:1 } });

      if (user) {
        const loginToken = Accounts._generateStampedLoginToken();

        Accounts._insertLoginToken(user._id, loginToken);

        return loginToken.token;
      }
    },
    subscribeToChannel: function(objectName, chatId) {
      check(objectName, String);
      check(chatId, String);

      const currentUser = Meteor.user();

      if (!currentUser.profile.chatSubscriptions) {
        Meteor.users.update(currentUser, {
          $set: {
            "profile.chatSubscriptions": []
          }
        });
      } else {
        if (currentUser.profile.chatSubscriptions
          .some(subscription => subscription.object === objectName && subscription.chatId === chatId)) {
          throw new Meteor.Error('subscription already exists');
        }
      }

      var user = Meteor.users.findOne({
        _id: this.userId
      });

      switch (objectName) {
        case 'room':
          Meteor.users.update(user, {
            $push: {
              "profile.chatSubscriptions": {
                object: objectName,
                chatId: chatId
              }
            }
          });
          break
        case 'stream':
          Meteor.users.update(user, {
            $push: {
              "profile.chatSubscriptions": {
                object: objectName,
                chatId: chatId
              }
            }
          });
          break
        case 'program':
          Meteor.users.update(user, {
            $push: {
              "profile.chatSubscriptions": {
                object: objectName,
                chatId: chatId
              }
            }
          });
          break
      }
    },
    unsubscribeFromChannel: function(objectName, chatId) {
      check(objectName, String);
      check(chatId, String);

      const currentUser = Meteor.user();

      currentUser.profile.chatSubscriptions.forEach((subscription, index) => {
        if (subscription) {
          if (subscription.object === objectName && subscription.chatId === chatId) {
            let updateSubscription = {};
            updateSubscription["profile.chatSubscriptions." + index] = 1;

            Meteor.users.update(currentUser, {
              $unset: updateSubscription
            });

            const user = Meteor.users.findOne({
              _id: this.userId
            });

            updateSubscription = {};
            updateSubscription["profile.chatSubscriptions"] = null;

            Meteor.users.update(user, {
              $pull: updateSubscription
            });
          }
        }
      });
    },
    editUser: function(userValues) {
      check(userValues, Object);

      if (!Roles.userIsInRole(this.userId, ['users-manage'])) {
        throw new Meteor.Error('not-authorized');
      }

      Meteor.users.update(userValues.userId, { $set: { "profile.role": userValues.role } });

      const user = Meteor.users.findOne({
        _id: userValues.userId
      }, { fields: { roles: 1 } });

      let roles = [];

      if (userValues.rights.usersmanage) {
        roles.push('users-manage');
      }
      if (userValues.rights.mentorassign) {
        roles.push('mentor-assign');
      }
      if (userValues.rights.programsmanage) {
        roles.push('programs-manage');
      }
      if (userValues.rights.moderator) {
        roles.push('moderator');
      }
      if (userValues.rights.usersviewall) {
        roles.push('users-view-all');
      }
      if (userValues.rights.usersviewown) {
        roles.push('users-view-own');
      }
      if (userValues.rights.programsviewall) {
        roles.push('programs-view-all');
      }
      if (userValues.rights.programsviewfree) {
        roles.push('programs-view-free');
      }
      if (userValues.rights.tasksreview) {
        roles.push('tasks-review');
      }
      if (userValues.rights.tasksassign) {
        roles.push('tasks-assign');
      }
      if (userValues.rights.programstakeall) {
        roles.push('programs-take-all');
      }
      if (userValues.rights.programstakefree) {
        roles.push('programs-take-free');
      }

      if (user.roles) {
        Roles.setUserRoles(user._id, roles);
      } else {
        Roles.addUsersToRoles(user._id, roles);
      }
    },
    deleteUser: function(userId) {
      check(userId, String);

      if (!Roles.userIsInRole(this.userId, ['users-manage'])) {
        throw new Meteor.Error('not-authorized');
      }

      GivenTasks.remove({ userId });
      Answers.remove({ userId });

      Answers.remove({
        fromUserId: userId
      });

      Answers.update({ likesUsers:userId }, { $pull: { likesUsers:userId }, $inc: { likesCount:-1 } }, { multi:true });

      Messages.remove({
        owner: userId
      });
      SentLetters.remove({ userId });
      Orders.remove({
        customerNumber: userId
      });
      Likes.remove({ userId });
      Meteor.users.remove(userId);
    },
    assignMentorToUser: function(mentorId, userId) {
      check(mentorId, String);
      check(userId, String);

      if (!Roles.userIsInRole(this.userId, ['mentor-assign'])) {
        throw new Meteor.Error('not-authorized');
      }

      Meteor.users.update(userId, {
        $set: {
          "profile.mentor": mentorId
        }
      });
    },
    rateUser: function(userId, usergrade) {
      check(userId, String);
      check(usergrade, Number);

      if (!Roles.userIsInRole(this.userId, ['tasks-review', 'users-manage'])) {
        throw new Meteor.Error('not-authorized');
      }
      this.unblock();

      Meteor.users.update(Meteor.users.findOne({
        _id: userId
      }), {
        $set: {
          "profile.contextgrade": Math.ceil(usergrade)
        }
      });
    },

    updateProfile(newProfileValues) {
      check(newProfileValues, {
        name: Match.Maybe(String),
        lastname: Match.Maybe(String),
        birthday: Match.Maybe(Number),
        birthmonth: Match.Maybe(Number),
        birthyear: Match.Maybe(Number),
        country: Match.Maybe(String),
        town: Match.Maybe(String),
        about: Match.Maybe(String),
        wishlist: Match.Maybe(Array),
        socialLinks: Match.Maybe(Array),
        tasksnotify: Match.Maybe(Boolean),
        pushTasksNotify: Match.Maybe(Boolean),
        pushCommentsNotify: Match.Maybe(Boolean),
        pushLikesNotify: Match.Maybe(Boolean),
      });

      let normalized = newProfileValues.name ?
                       newProfileValues.name.toLowerCase() : '🿿';

      normalized += newProfileValues.lastname ?
                    ` ${newProfileValues.lastname.toLowerCase()}` : '🿿';

      const firstLetter = newProfileValues.name ? newProfileValues.name.toUpperCase()[0] : "🿿";

      const ftss = composeUserSearchTerms(this.userId, newProfileValues);

      Meteor.users.update(this.userId, {
        $set: {
          "profile.name": newProfileValues.name,
          "profile.lastname": newProfileValues.lastname,
          "profile.birthday": newProfileValues.birthday,
          "profile.birthmonth": newProfileValues.birthmonth,
          "profile.birthyear": newProfileValues.birthyear,
          "profile.country": newProfileValues.country,
          "profile.town": newProfileValues.town,
          "profile.about": newProfileValues.about,
          "profile.wishlist": newProfileValues.wishlist,
          "profile.socialLinks": newProfileValues.socialLinks,
          "profile.tasksnotify": newProfileValues.tasksnotify,
          "profile.pushTasksNotify": newProfileValues.pushTasksNotify,
          "profile.pushCommentsNotify": newProfileValues.pushCommentsNotify,
          "profile.pushLikesNotify": newProfileValues.pushLikesNotify,
          normalized,
          firstLetter,
          ftss,
        },
      });
    },
    updateProfileWishlist: function(wishlist) {
      check(wishlist, Array);

      Meteor.users.update(this.userId, {
        $set: {
          "profile.wishlist": wishlist
        }
      });
    },
    updateProfileSocialLinks: function(socialLinks) {
      const isUrls = Match.Where(function (links) {
        const regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
        let isUrls = true;

        links.forEach((link) => {
          check(link, String);

          if (!regexp.test(link)) {
            isUrls = false;
          }
        });

        return isUrls;
      });

      check(socialLinks, isUrls);

      Meteor.users.update(this.userId, {
        $set: {
          "profile.socialLinks": socialLinks
        }
      });
    },

    setProfileAvatar(base64String) {
      check(base64String, String);

      if (!this.userId) {
        throw new Meteor.Error(403, 'Access denied');
      }

      const wrapAndSaveImageSync = Meteor.wrapAsync(saveAvatarFromBuffer);

      const rawTextBuffer = base64String.split(';base64,')[1];
      if (!rawTextBuffer) {
        throw new Meteor.Error(204, 'No image data (buffer) presented');
      }

      const buffer = new Buffer(rawTextBuffer, 'base64');

      if (buffer) {
        return wrapAndSaveImageSync(buffer, this.userId);
      }
    },

    flagUserAsTrial: function(token) {
      this.unblock();

      if (!this.userId) throw new Meteor.Error(403, 'Access denied');

      const program = Programs.findOne({ trialToken:token }, { fields: { _id:1 } });

      if (program) {
        if (!Meteor.users.find({ _id:this.userId, "trialPrograms._id":program._id }).count()) {
          Meteor.users.update(this.userId, { $push: {
            trialPrograms: {
              _id: program._id,
              free: true,
              addedAt: new Date()
            }
          } });
        }
      }
      else {
        throw new Meteor.Error(403, 'Wrong token');
      }
    },
    markInstructionAsRead: function() {
      this.unblock();

      Meteor.users.update(Meteor.user(), {
        $set: {
          "profile.instructionNotRead": false
        }
      });
    },
    unsubscribeUser: function(sentLetterId) {
      check(sentLetterId, String);

      this.unblock();

      const sentLetter = SentLetters.findOne({
        _id: sentLetterId,
        unsubscribed: {
          $exists: false
        }
      });

      if (sentLetter) {
        SentLetters.update(sentLetter, {
          $set: {
            "unsubscribed": new Date()
          }
        });

        const user = Meteor.users.findOne({
          _id: sentLetter.userId,
          unsubscribed: {
            $exists: false
          }
        });
        if (user) {
          Meteor.users.update(user, {
            $set: {
              "unsubscribed": new Date(),
              "profile.tasksnotify": false
            }
          });
        }
      } else {
        throw new Meteor.Error('Нет такого факта отправки или отписка уже производилась.');
      }
    },

    getUserProfile: function(userId) {
      check(userId, String);
      this.unblock();

      if (!this.userId) throw new Meteor.Error('not-authorized');

      const user = Meteor.users.findOne({ _id:userId, profile: { $exists:true } }, { fields: { profile:1 } });

      return [ user ];
    },
    getUsersReferals: function(userId) {
      check(userId, String);
      const user = Meteor.users.findOne({ _id:userId }, { fields: { referals: 1 } });

      const fetchedUsers = Meteor.users.find({ _id: { $in: user.referals.map((ref) => ref._id) } }, { fields: { profile: 1 } }).fetch();

      const referals = user.referals.map((referal) => {
        const referalUser = _.findWhere(fetchedUsers, { _id: referal._id });

        if (referalUser) {
          const { profile } = referalUser;

          referal.fullname = [profile.name || '', profile.lastname || ''].join(" ").replace(/\s+/g, " ").trim();

          referal.avatar = Meteor.users.getAvatarProps(referal._id);
        }

        referal.paymentDate = moment(referal.paymentDate).locale('ru').format("HH:mm, DD.MM.YYYY")

        return referal;
      });

      return referals;
    },

    adminUsersDataCount(params) {
      check(params, Object);

      if (!this.userId) {
        throw new Meteor.Error(403, 'Access denied');
      }

      if (!Roles.userIsInRole(this.userId, ['users-manage', 'mentor-assign'])) {
        throw new Meteor.Error(403, 'Access denied');
      }

      const selector = buildAdminUsersSelector(this.userId, params);
      const fields = {_id: 1};

      this.unblock();

      return Meteor.users.find(selector, {fields}).count();
    },

    adminUsersDataExport(params) {
      check(params, Object);

      if (!this.userId) {
        throw new Meteor.Error(403, 'Access denied');
      }

      if (!Roles.userIsInRole(this.userId, ['users-manage', 'mentor-assign'])) {
        throw new Meteor.Error(403, 'Access denied');
      }

      const selector = buildAdminUsersSelector(this.userId, params);

      const rolesArray = Rolespresets.find({}, {fields: {title: 1}}).fetch();
      const rolesMap = _.reduce(rolesArray, (memo, {_id, title}) => {
        return _.extend({}, memo, {[`${_id}`]: title || ''});
      });

      const formatedDate = (value) =>
        moment(value).format('YYYY-MM-DD HH:mm:ss');

      const valueOrNothing = (value = '') =>
        (value || '').trim();

      const mentorCache = [];
      const streamsCache = Streams.find({}).fetch();
      const starsCache = Stars.find({}).fetch();

      function Workbook() {
      	if(!(this instanceof Workbook)) return new Workbook();
      	this.SheetNames = [];
      	this.Sheets = {};
      }

      const workbook = new Workbook();

      setCellValue = (value) => {
        const cell = { v: value };

        if(typeof cell.v === 'number') cell.t = 'n';
        else if(typeof cell.v === 'boolean') cell.t = 'b';
        else if(cell.v instanceof Date) {
          cell.t = 'n'; cell.z = XLSX.SSF._table[14];
          cell.v = datenum(cell.v);
        }
        else cell.t = 's';

        return cell;
      }

      setRowValues = (row, array, worksheet, range) => {
        if(range.s.r > row) range.s.r = row;
        if(range.e.r < row) range.e.r = row;

        array.forEach((value, index) => {
          const cell_ref = XLSX.utils.encode_cell({ c:index,r:row });
          if(range.s.c > index) range.s.c = index;
          if(range.e.c < index) range.e.c = index;

          worksheet[cell_ref] = setCellValue(value);
        });

        return [ worksheet, range ];
      }

      createProgramSheet = (program) => {
        let worksheet = {};
        let range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};

        let setRowResult = setRowValues(0, [ 'id', 'Дата регистрации', 'Email', 'Фамилия', 'Имя', 'Место жительства', 'Роль', 'Подписка', 'Триал', 'Профиль', 'Наставник', 'Программа', 'Поток', 'Звездочка' ], worksheet, range);
        worksheet = setRowResult[0];
        range = setRowResult[1];

        let tempSelector = selector;
        tempSelector["profile.programs"] = program._id;

        Meteor.users.find(selector).forEach(({_id, profile, emails, createdAt, unsubscribed}, index) => {
          const currentRow = index+1;

          let mentorName = 'Не задан';

          if (profile && profile.mentor) {
            if (!mentorCache[profile.mentor]) mentorCache[profile.mentor] = Meteor.users.findOne(profile.mentor, { fields: { profile: 1 } });

            const mentor = mentorCache[profile.mentor];

            if (mentor && mentor.profile) {
              mentorName = [mentor.profile.name, mentor.profile.lastname].join(' ').replace(/\s+/g, ' ').trim();
            }
          }

          let streamDB = profile.streams && profile.streams.length ?
                          _.find(streamsCache, ({ _id, programId }) => profile.streams.includes(_id) && program._id === programId) || '' : '';

          let starDB = profile.stars && profile.stars.length ?
                          _.find(starsCache, ({_id, programId}) => profile.stars.includes(_id) && program._id === programId) || '' : '';

          let array = [ _id,
                        formatedDate(createdAt),
                        valueOrNothing(emails && emails[0] && emails[0].address),
                        valueOrNothing(profile && profile.lastname),
                        valueOrNothing(profile && profile.name),
                        valueOrNothing(profile && profile.place),
                        valueOrNothing(profile && profile.role && rolesMap[profile.role]),
                        unsubscribed ? '0' : '1',
                        (profile && profile.trial) ? '1' : '0',
                        `https://entry.spacebagel.com/profile/${ _id }`,
                        mentorName,
                        program.title == 'Без программы' ? '' : program.title || '',
                        streamDB.title || '',
                        starDB.title || ''];

          setRowResult = setRowValues(currentRow, array, worksheet, range);
          worksheet = setRowResult[0];
          range = setRowResult[1];
        });

        worksheet['!merges'] = [];

        if(range.s.c < 10000000) worksheet['!ref'] = XLSX.utils.encode_range(range);

        return worksheet;
      }

      let program = {
        title: 'Без программы',
        _id: []
      }

      workbook.SheetNames.push(program.title);
      workbook.Sheets[program.title] = createProgramSheet(program);

      let programSelector = {};
      if (params.programs && params.programs.length) {
        programSelector["_id"] = params.programs.length === 1
          ? params.programs[0] : {$in: params.programs};
      } else if (params.notprograms && params.notprograms.length) {
        programSelector["_id"] = params.notprograms.length === 1
          ? {$ne: params.notprograms[0]} : {$nin: params.notprograms};
      }
      const programs = Programs.find(programSelector).fetch();

      programs.forEach((program) => {
        workbook.SheetNames.push(program.title);
        workbook.Sheets[program.title] = createProgramSheet(program);
      });

      return XLSX.write(workbook, { bookType:'xlsx', bookSST:false, type:'binary' });
    },

    adminUsersDataImport(file) {
      check(file, String);

      if (!this.userId) throw new Meteor.Error(403, 'Access denied');
      if (!Roles.userIsInRole(this.userId, ['users-manage', 'mentor-assign'])) throw new Meteor.Error(403, 'Access denied');

      const workbook = XLSX.read(file, {type: 'binary'});

      const worksheet = workbook.Sheets["Без программы"];

      if (worksheet) {
        const cols = 14;
        const rows = parseInt(worksheet['!ref'].split(':')[1].replace(/\D/g,''));

        const usersValues = [];

        for (let R = 0; R < rows; R++) {
          const userValue = {};

          for (let C = 0; C < cols; C++) {
            const cell_ref = XLSX.utils.encode_cell({ c:C,r:R });
            userValue[C] = worksheet[cell_ref] ? worksheet[cell_ref].v : '';
          }

          usersValues.push(userValue);
        }

        const programCache = [];
        const streamCache = [];
        const starCache = [];

        usersValues.forEach((user) => {
          if ((user[cols-3] !== '' && user[cols-3] !== 'Программа') ||
              (user[cols-2] !== '' && user[cols-2] !== 'Поток') ||
              (user[cols-1] !== '' && user[cols-1] !== 'Звездочка')) {

            const programQuery = { title:user[cols-3] };
            if (!_.findWhere(programCache, programQuery))
                programCache.push(Programs.findOne(programQuery, { fields: { _id:1, title:1 } }));
            const program = _.findWhere(programCache, programQuery);
            if (!program) throw new Meteor.Error(403, 'Incorrect information');

            const streamQuery = { title:user[cols-2], programId: program._id };
            if (!_.findWhere(streamCache, streamQuery))
                streamCache.push(Streams.findOne(streamQuery, { fields: { _id:1, programId:1, title:1 } }));
            const stream = _.findWhere(streamCache, streamQuery);
            if (!stream) throw new Meteor.Error(403, 'Incorrect information');

            const starQuery = { title:user[cols-1], streamId: stream._id };
            if (!_.findWhere(starCache, starQuery))
                starCache.push(Stars.findOne(starQuery, { fields: { _id:1, streamId:1, title:1 } }));
            const star = _.findWhere(starCache, starQuery);

            if (!star) throw new Meteor.Error(403, 'Incorrect information');
          }
        });

        usersValues.forEach((user) => {
          if ((user[cols-3] !== '' && user[cols-3] !== 'Программа') ||
            (user[cols-2] !== '' && user[cols-2] !== 'Поток') ||
            (user[cols-1] !== '' && user[cols-1] !== 'Звездочка')) {
            const program = _.findWhere(programCache, { title:user[cols-3] });
            const stream = _.findWhere(streamCache, { title:user[cols-2], programId: program._id });
            const star = _.findWhere(starCache, { title:user[cols-1], streamId: stream._id });

            Meteor.users.update({ _id:user[0] },
              { $addToSet: {
                "profile.programs":program._id,
                "profile.streams":stream._id,
                "profile.stars":star._id
               } });
          }
        });
      }
    },

    adminUsersUserFullData(userId) {
      check(userId, String);

      if (!this.userId) {
        throw new Meteor.Error(403, 'Access denied');
      }

      if (!Roles.userIsInRole(this.userId, ['users-manage', 'mentor-assign'])) {
        throw new Meteor.Error(403, 'Access denied');
      }

      return Meteor.users.findOne(userId);
    },

    setUserPassword(newPassword) {
      const lengthMoreThan = Match.Where(function(x) {
        check(x, String);
        return x.length > 5;
      });

      check(newPassword, lengthMoreThan);

      if (!this.userId) throw new Meteor.Error(403, 'Access denied');

      if (Meteor.users.find({ _id:this.userId, "profile.nopassword":true }).count()) {
        Accounts.setPassword(this.userId, newPassword, { logout: false });

        Meteor.users.update(this.userId, { $set: { "profile.nopassword": false } });

        Accounts.sendVerificationEmail(this.userId, Meteor.user().emails[0]["address"]);

        Meteor.call("addSentLetterToUser", "Гостю 0.00", this.userId);

        return true;
      }
      else {
        return false;
      }
    }
  });
}
