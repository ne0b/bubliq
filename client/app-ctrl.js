angular.module('bubliq').controller('AppCtrl', function($scope, $reactive, $timeout, $mdSidenav, $meteor, $state, $cookies, $filter, scrollLoader, ifExists, keyDownNavigation) {
  var ctrl = this;
  $reactive(this).attach($scope);

  this.sendLetter = (event) => {
    if (event.key.toLowerCase() != event.key.toUpperCase()) keyDownNavigation.send(event.key.toUpperCase()[0]);
  };

  this.subscribe('programTitles');
  this.subscribe('streamTitles');

  this.openMenu = () => {
    if ($mdSidenav('left').isOpen() || $mdSidenav('left').isLockedOpen()) {
      $cookies.put('previousArray', JSON.stringify([]));
      $cookies.put('previousParamsArray', JSON.stringify([]));
    }

    $mdSidenav('left').toggle();
  };

  // Methods used by menuLink and menuToggle directives
  this.isOpen = (section) => {
    return this.openedSection === section;
  };
  this.isSelected = (section) => {
    return this.openedSection === section;
  };
  this.toggleOpen = (section) => {
    this.toggleSelectSection(section);
  };
  this.autoFocusContent = false;
  this.selectSection = (section) => {
    this.openedSection = section;
  };
  this.toggleSelectSection = (section) => {
    this.openedSection = (this.openedSection === section ? null : section);
  };

  this.userIsInRole = (roles) => {
    return $scope.currentUser ? Roles.userIsInRole($scope.currentUser._id, roles) : false;
  };

  $scope.$logout = () => {
    Session.set('impersonatingUser', undefined);
    $meteor.logout().then(
      function() {
        $state.go('login');
      },
      function(err) {}
    );
  };

  $scope.$back = () => {
    let prevStateName = _.last($state.previousArray) || 'index';

    if (prevStateName === 'index') this.openMenu();

    let prevStateParams = _.last($state.previousParamsArray) || {};

    $state.back = true;

    $state.go(prevStateName, prevStateParams);
  };

  $scope.$state = $state;
  $scope.$showTitle = true;

  $scope.$userIsInRole = (roles) => {
    return $scope.currentUser ? Roles.userIsInRole($scope.currentUser._id, roles) : false;
  };

  $scope.$checkRights = () => {
    let currentProgramId = Meteor.settings.public.CURRENT_PROGRAM;
    let validTrial = moment(Meteor.settings.public.CURRENT_PROGRAM_TRIAL_LAST_DAY).diff(moment(), 'seconds') > 0 &&
                           _.findWhere($scope.$root.currentUser.trialPrograms, { _id: currentProgramId });

    return validTrial || $scope.$root.currentUser.paidPrograms.length > 0 || $scope.$userIsInRole(['programs-take-all', 'programs-manage', 'users-manage', 'mentor-assign']);
  };

  this.hasCurrentProgramAndNotManager = () => {
    return !~$scope.$root.currentUser.paidPrograms.indexOf(Meteor.settings.public.CURRENT_PROGRAM) && !this.userIsInRole(['programs-manage', 'users-manage', 'mentor-assign']);
  }

  $scope.getMore = () => {
    scrollLoader.load();
  };

  ctrl.userUpdated = false;
  $scope.$watch('$root.currentUser', function(newValue, oldValue) {
    if (newValue !== oldValue) ctrl.userUpdated = !ctrl.userUpdated;
  });

  this.helpers({
    impersonatingUser() {
      return Session.get("impersonatingUser");
    },
    userId() {
      let userId = $scope.currentUser ? $scope.currentUser._id : 'none';
      return userId;
    },
    programs() {
      return Programs.find({});
    },
    streams() {
      const userUpdated = this.getReactively('userUpdated');

      return getUsersStreams(Streams.find({}, { sort: { programId: 1 } }).fetch());
    },
    messagesCount() {
      const count = Updates.countFor({type: 'CHAT'});
      return count > 99 ? '99+' : count;
    },
    answersCount() {
      const count = Updates.countFor({type: 'ANSWERS'});
      return count > 99 ? '99+' : count;
    }
  });

  function getUsersStreams(streams) {
    if (!$scope.currentUser) return;

    let userStreams = {
      'name': 'streams',
      'title': 'Программы',
      pages: []
    };

    if (Roles.userIsInRole($scope.currentUser._id, ['users-manage', 'moderator', 'tasks-assign'])) {
      userStreams.pages = streams;
      userStreams.pages.map((stream, index) => {
        stream.secondaryTitle = "/ " + getProgramTitle(stream.programId);

        stream.url = `streams({programId:"${stream.programId}", streamId:"${stream._id}"})`;

        return stream
      });
    } else {
      userStreams.pages = ($scope.currentUser.profile.streams || []).map((stream, index) => {
        stream = _.findWhere(streams, { _id:stream }) || {};
        stream.title = getProgramTitle(stream.programId);

        stream.url = `streams({programId:"${stream.programId}", streamId:"${stream._id}"})`;

        return stream
      });
    }

    return userStreams;
  }

  function getProgramTitle(programId) {
    let program = Programs.findOne({
      _id: programId
    });

    return program ? program.title : '';
  }
});
