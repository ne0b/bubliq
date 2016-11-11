import {Meteor} from 'meteor/meteor';
import {Tracker} from 'meteor/tracker';

angular.module('bubliq').controller('AdminUsersCtrl', ['$scope', '$reactive', '$state', '$mdMedia', '$mdDialog', '$mdToast', 'scrollLoader', '$cookies', '$timeout', 'appConsts', 'ifExists', 'search', 'TITLES',
  function ($scope, $reactive, $state, $mdMedia, $mdDialog, $mdToast, scrollLoader, $cookies, $timeout, appConsts, ifExists, search, TITLES) {
    $state.title = `${TITLES.ADMIN_CTRL} » ${TITLES.ADMIN_USERS_CTRL}`;

    const ctrl = this;
    $reactive(this).attach($scope);

    this.dataReady = false;

    this.programs = [];
    this.notprograms = [];
    this.streams = [];
    this.paidPrograms = [];
    this.trialProgramsFree = [];
    this.trialProgramsPaid = [];
    this.roles = [];
    this.unsub = null;
    this.accepted = null;
    this.verified = null;
    this.remoteSubscriber = null;
    this.referals = null;
    this.dateFrom = null;
    this.dateTo = null;
    this.hasmentor = null;
    this.hasntmentor = null;
    this.query = '';
    this.canAssign = true;

    this.setQuery = (v) => {
      this.query = (v || '').trim();
    };

    search.set(this.setQuery);

    const selectorExcludeCurrent = {_id: {$ne: Meteor.userId()}};

    // -------------------------------------------------------------------------
    // Fetchers
    // -------------------------------------------------------------------------

    const fetchAndApplyUsersList = () => {
      const {limit} = this.scrollCtrl;
      const sort = {normalized: 1};

      const selector = {_id: {$ne: Meteor.userId()}};

      this.scrollCtrl.list = Meteor.users.find(selector, {sort, limit, transform(user) {
        const {profile} = user;

        profile.avatar = Meteor.users.getAvatarProps(user._id);

        profile.rolename = (Rolespresets.findOne(profile.role) || {title: 'Без роли'}).title;
        profile.fullname = Meteor.users.extractUserName(profile, 'Аноним');

        return _.extend({}, user, {profile});
      }}).fetch();

      this.scrollCtrl.count = this.scrollCtrl.list.length;

      const totalUsers = Meteor.users.find(selector).count();
      this.scrollCtrl.hasMore = this.scrollCtrl.count < totalUsers;
    };

    const updateUsersCountInfo = (filter, done) => {
      Meteor.call('adminUsersDataCount', filter, (err, res) => {
        $state.title = `${TITLES.ADMIN_CTRL} » ${TITLES.ADMIN_USERS_CTRL} (${res || 0})`;
        return done && done();
      });
    };

    // -------------------------------------------------------------------------
    // Sunscribtions
    // -------------------------------------------------------------------------

    this.subStars = Meteor.subscribe('adminStars');
    this.subRoles = Meteor.subscribe('rolespresets');

    this.callSubscribe = (filter, limit) => {
      this.scrollCtrl.hasMore = false;
      if (this.sub && this.sub.stop) {
        this.sub.stop();
      }

      this.sub = Meteor.subscribe('adminUsersData', filter, limit, () => {
        // resume observers and rerenders
        Meteor.users._collection.resumeObservers();

        Meteor.defer(() => {
          const doneCallback = () => {
            this.dataReady = true;
            this.scrollCtrl.loading = false;
            this.scrollCtrl.limit = limit;
            fetchAndApplyUsersList();
            $scope.$apply();
          };

          if (this.scrollCtrl.limit === limit) {
            return updateUsersCountInfo(filter, doneCallback);
          }

          return doneCallback();
        });
      });
    };

    const callSubscribeThrottled = _.debounce((filter, limit) => {
      // stop all reactive observers for Collection
      // in the case of chunked updates we'll not have rerenders
      Meteor.users._collection.pauseObservers();

      if (!this.scrollCtrl.loading) {
        this.scrollCtrl.loading = true;
        this.callSubscribe(filter, limit);
      }
    }, 1000);

    // -------------------------------------------------------------------------
    // Scroll Actions Controller
    // -------------------------------------------------------------------------

    this.scrollCtrl = {
      filter: {},
      limit: 50,
      count: 0,
      loading: false,
      hasMore: false,
      list: [],

      getItemAtIndex(index) {
        if (index > this.count) {
          if (this.hasMore) {
            callSubscribeThrottled(this.filter, this.limit + 50, index);
          }
          return null;
        }

        return this.list[index];
      },

      getLength() {
        return this.count + 1;
      },
    };

    // -------------------------------------------------------------------------
    // Reactive actions
    // -------------------------------------------------------------------------

    this.setSearch = (searchValue = '') => {
      this.query = searchValue.trim();
    };

    Tracker.autorun(() => {
      const filter = {
        programs: this.getReactively('programs'),
        notprograms: this.getReactively('notprograms'),
        streams: this.getReactively('streams'),
        paidPrograms: this.getReactively('paidPrograms'),
        trialProgramsFree: this.getReactively('trialProgramsFree'),
        trialProgramsPaid: this.getReactively('trialProgramsPaid'),
        hasmentor: this.getReactively('hasmentor'),
        hasntmentor: this.getReactively('hasntmentor'),
        roles: this.getReactively('roles'),
        unsub: this.getReactively('unsub'),
        accepted: this.getReactively('accepted'),
        verified: this.getReactively('verified'),
        remoteSubscriber: this.getReactively('remoteSubscriber'),
        referals: this.getReactively('referals'),
        dateFrom: this.getReactively('dateFrom'),
        dateTo: this.getReactively('dateTo'),
        query: this.getReactively('query'),
      };

      if (this.scrollCtrl.filter && _.isEqual(this.scrollCtrl.filter, filter)) {
        return false;
      }

      this.scrollCtrl.limit = 50;
      this.scrollCtrl.filter = filter;
      callSubscribeThrottled(this.scrollCtrl.filter, this.scrollCtrl.limit);
    });


    $scope.$on('$destroy', () => this.sub.stop() && this.subRoles.stop() && this.subStars.stop());


    // -------------------------------------------------------------------------
    // Helpers & Actions
    // -------------------------------------------------------------------------

    this.helpers({
      rolesList() {
        return Rolespresets.find({});
      },

      programsList() {
        return Programs.find({}, {transform(doc) {
          const title = (doc.title || '').split(/\s+/i).slice(0, 4).join(' ').trim();
          return _.extend({}, doc, {title});
        }});
      },

      streamsList() {
        return Streams.find({}, {transform(doc) {
          const program = Programs.findOne(doc.programId);
          const programTitle = ((program && program.title) || '').split(/\s+/i).slice(0, 4).join(' ').trim();
          const title = `${(doc.title || '')} (${programTitle})`;
          return _.extend({}, doc, {title});
        }});
      },
    });

    this.exportUsers = () => {
      const loadingDialog = $mdDialog.show({
        controller: LoadingCtrl,
        templateUrl: 'client/admins/views/admin-loading-process.html',
        parent: angular.element(document.body),
        clickOutsideToClose: true,
        fullscreen: $mdMedia('sm'),
        locals: { text: "Генерация файла exportedUsers.xlsx" }
      });

      const filename = 'exportedUsers.xlsx';
      Meteor.call('adminUsersDataExport', this.scrollCtrl.filter, (err, res) => {
        if (res) {
          $mdDialog.hide(loadingDialog);

          function s2ab(s) {
            var buf = new ArrayBuffer(s.length);
            var view = new Uint8Array(buf);
            for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
            return view;
          }

          const blob = new Blob([s2ab(res)],{type:"application/octet-stream"});
          window.saveAs(blob, filename);
        }
      });
    };

    this.showReferals = (user) => {
      $mdDialog.show({
        controller: UserReferalsCtrl,
        controllerAs: 'userReferals',
        templateUrl: 'client/admins/views/admin-show-user-referals.html',
        parent: angular.element(document.body),
        clickOutsideToClose: true,
        fullscreen: $mdMedia('sm'),
        locals: {user},
      });
    };


    this.showEditUser = (ev, userId) => {
      if (!userId) {
        return;
      }

      const runEditDialog = (user) => {
        $mdDialog.show({
          controller: UserEditCtrl,
          controllerAs: 'userEdit',
          templateUrl: 'client/admins/views/admin-edit-user-dialog.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: true,
          fullscreen: $mdMedia('sm'),
          locals: {user},
        })
        .then((answer) => {
          if (answer) {
            Meteor.call('editUser', answer);
          }
        });
      };

      Meteor.call('adminUsersUserFullData', userId, (err, res) => {
        if (res) {
          runEditDialog(res);
        }
      });
    };

    this.impersonateUser = (user) => {
      const name = user.profile && user.profile.name && user.profile.lastname ?
        `${user.profile.name} ${user.profile.lastname}` : user.emails[0].address;

      Session.set('impersonatingUser', name);

      Meteor.call('impersonateUser', user._id, (err) => {
        if (!err) {
          Meteor.connection.setUserId(user._id);
          $state.go('index');
        }
      });
    };

    this.assignTasksToUser = (userId) => {
      ctrl.canAssign = false;

      $mdDialog.show({
        controller: UserTasksAssignCtrl,
        controllerAs: 'userTA',
        templateUrl: 'client/admins/views/admin-assign-tasks-confirm-dialog.html',
        parent: angular.element(document.body),
        clickOutsideToClose: true,
        fullscreen: $mdMedia('sm'),
        locals: {
          userId
        }
      })
      .then((answer) => {
        if (answer) ctrl.canAssign = true;
      });
    };
  },
]);

function UserReferalsCtrl($scope, $reactive, $mdDialog, user) {
  const ctrl = this;

  $scope.user = user;

  Meteor.call('getUsersReferals', user._id, (err, result) => {
    if (result) {
      ctrl.referals = result;
      ctrl.dataReady = true;
    }
  });

  $scope.hide = () => {
    $mdDialog.hide();
  };

  $scope.cancel = () => {
    $mdDialog.cancel();
  };
}

function UserEditCtrl($scope, $reactive, $document, $mdDialog, $filter, $mdMedia, ifExists, user) {
  $reactive(this).attach($scope);

  $scope.userProgramsIds = (user.profile && user.profile.programs) ?
    user.profile.programs : [];

  $scope.userStreamsIds = (user.profile && user.profile.streams) ?
    user.profile.streams : [];

  $scope.userStarsIds = (user.profile && user.profile.stars) ?
    user.profile.stars : [];

  $scope.helpers({
    rolespresets() {
      return Rolespresets.find({});
    },
    usersPrograms() {
      return Programs.find({
        _id: {$in: $scope.userProgramsIds},
      });
    },
    usersStreams() {
      return Streams.find({
        _id: {$in: $scope.userStreamsIds},
      });
    },
    usersStars() {
      return Stars.find({
        _id: {$in: $scope.userStarsIds},
      });
    },
    programs() {
      return Programs.find({
        _id: {$nin: $scope.userProgramsIds},
      });
    },
    streams() {
      return Streams.find({});
    },
    stars() {
      return Stars.find({});
    }
  });

  const mapUserRoles = (userRoles = []) => {
    const rolesMap = {
      usersmanage: 'users-manage',
      mentorassign: 'mentor-assign',
      programsmanage: 'programs-manage',
      moderator: 'moderator',
      usersviewall: 'users-view-all',
      usersviewown: 'users-view-own',
      programsviewall: 'programs-view-all',
      programsviewfree: 'programs-view-free',
      tasksreview: 'tasks-review',
      tasksassign: 'tasks-assign',
      programstakeall: 'programs-take-all',
      programstakefree: 'programs-take-free',
    };

    return _.reduce(rolesMap, (memo, name, key) => {
      return _.extend({}, memo, {[`${key}`]: !!~userRoles.indexOf(name)});
    }, {});
  };

  $scope.newUserValues = {
    userId: user._id,
    role: user.profile.role,
    rights: mapUserRoles(user.roles),
  };

  $scope.changePermissions = () => {
    $scope.newUserValues.rights = Rolespresets.findOne($scope.newUserValues.role).rights;
  };

  $scope.selectedPrograms = [];
  $scope.selectedStreams = [];
  $scope.selectedStars = [];

  $scope.usersPrograms.forEach((program) => {
    const stream = ifExists($scope.usersStreams, 'length') > 0 && getStream(program._id) ?
      getStream(program._id) : null;

    $scope.selectedPrograms.push(program);
    if (stream) {
      $scope.selectedStreams.push(stream._id);

      const star = ifExists($scope.usersStars, 'length') > 0 && getStar(stream._id) ?
        getStar(stream._id) : null;
      if (star) $scope.selectedStars.push(star._id);
    }
  });

  $scope.programStreams = (program) => {
    if (program) {
      return $filter('filter')($scope.streams, {programId: program._id});
    }
  };

  $scope.streamStars = (stream) => {
    if (stream) {
      return $filter('filter')($scope.stars, { streamId: stream });
    }
  };

  $scope.availablePrograms = $scope.programs;

  $scope.addToArray = (program, index) => {
    $scope.selectedPrograms.push(program);
    $scope.availablePrograms.splice(index, 1);
  };

  $scope.removeFromArray = (program, index) => {
    $scope.availablePrograms.push(program);
    $scope.selectedPrograms.splice(index, 1);

    $scope.selectedStreams = [];
    $scope.selectedStars = [];

    if ($scope.usersStreams && $scope.usersStreams.length > 0) {
      $scope.selectedPrograms.forEach((program) => {
        if (getStream(program._id)) $scope.selectedStreams.push(getStream(program._id)._id);
      });
    }
    if ($scope.usersStars && $scope.usersStars.length > 0) {
      $scope.selectedStreams.forEach((stream) => {
        if (getStar(stream)) $scope.selectedStars.push(getStar(stream)._id);
      });
    }
  };

  $scope.editUser = (userMentor) => {
    Meteor.call('addProgramsToUser', $scope.selectedPrograms, $scope.selectedStreams, $scope.selectedStars, user._id);
    $mdDialog.hide($scope.newUserValues);
  };

  $scope.deleteUser = () => {
    $mdDialog.hide();

    $mdDialog.show({
      controller: UserDeleteCtrl,
      controllerAs: 'userDelete',
      templateUrl: 'client/admins/views/admin-delete-user-dialog.html',
      parent: angular.element(document.body),
      clickOutsideToClose: true,
      fullscreen: $mdMedia('sm'),
      locals: {
        user: user
      }
    });
  };

  $scope.hide = () => {
    $mdDialog.hide();
  };
  $scope.cancel = () => {
    $mdDialog.cancel();
  };

  function getStream(programId) {
    return $filter('filter')($scope.usersStreams, {
      programId: programId
    })[0];
  }

  function getStar(streamId) {
    return $filter('filter')($scope.usersStars, { streamId })[0];
  }
}

function UserDeleteCtrl($scope, $mdDialog, user) {
  $scope.user = user;

  $scope.deleteUser = () => {
    Meteor.call('deleteUser', user._id);
    $mdDialog.hide();
  };

  $scope.hide = () => {
    $mdDialog.hide();
  };
  $scope.cancel = () => {
    $mdDialog.cancel();
  };
}

function UserTasksAssignCtrl($scope, $mdDialog, $mdToast, userId) {
  $scope.assignTasks = () => {
    Meteor.call('assignTasksToUser', userId, (err, result) => {
      const msg = err ? err : result ? result : '';

      $mdToast.show(
        $mdToast.simple()
          .textContent(msg)
          .position("bottom right")
          .hideDelay(3000)
      );
    });
    $mdDialog.hide(true);
  };

  $scope.hide = () => {
    $mdDialog.hide(true);
  };
  $scope.cancel = () => {
    $mdDialog.cancel();
  };
}

function LoadingCtrl($scope, text) {
  $scope.text = text;
}
