angular.module("bubliq").controller("ProfileViewCtrl", function ($scope, $reactive, $state, $stateParams, $mdToast, $document, TITLES, immediateInterval) {
  $state.title = TITLES.PROFILE_VIEW_CTRL;

  var ctrl = this;
  $reactive(this).attach($scope);

  this.limit = 40;
  this.infiniteTasks = {
    numLoaded_: 0,
    toLoad_: 0,
    getItemAtIndex: function(index) {
      if (index > this.numLoaded_) {
        this.fetchMoreItems_(index);
        return null;
      }

      if(ctrl.tasks){
        return ctrl.tasks[index];
      } else {
        return null;
      }
    },
    getLength: function() {
      return ctrl.infiniteTasksLength;
    },
    fetchMoreItems_: function(index) {
      if(ctrl.tasks.length !== ctrl.infiniteTasksLength && ctrl.notLoading){
        ctrl.notLoading = false;
        ctrl.limit += 10;
        this.toLoad_ = ctrl.limit;
      }
    }
  };

  this.helpers({
    user() {
      return Meteor.users.findOne($stateParams.userId, {transform: transformUser});
    },
    tasks() {
      let giventasks;
      ctrl.infiniteTasksLength = GivenTasks.find({ userId:$stateParams.userId }).count();

      if(ctrl.infiniteTasksLength){
        this.canLoadMore = ctrl.infiniteTasksLength-this.limit >= 10;

        giventasks = this.canLoadMore ?
                     GivenTasks.find({ userId:$stateParams.userId }, { limit: this.limit }).fetch() :
                     GivenTasks.find({ userId:$stateParams.userId }).fetch();

        ctrl.infiniteTasks.numLoaded_ = giventasks.length;
      }

      return giventasks;
    },
    sameUser() {
      return $stateParams.userId === Meteor.userId();
    }
  });

  const userTaskData = this.subscribe('userTaskData', () => {
    return [
      $stateParams.userId,
      this.getReactively('limit')
    ]
  });
  const userProfileData = this.subscribe('userProfileData', () => {
    return [
      $stateParams.userId
    ]
  });

  Tracker.autorun(() => {
    if (userTaskData.ready() && userProfileData.ready() && !ctrl.dataReady) $scope.$apply(() => {
      ctrl.dataReady = true;
    });
    ctrl.notLoading = userTaskData.ready();
  });

  $scope.$on("$destroy", () => {
    userTaskData.stop();
    userProfileData.stop();
  });

  this.getStream = (streamId) => {
    return Streams.findOne({ _id: streamId });
  };

  this.getProgram = (programId) => {
    return Programs.findOne({ _id: programId });
  };

  this.rateUser = (event) => {
    Meteor.call('rateUser', $stateParams.userId, this.users[0].profile.contextgrade, function (error, result) {
      if(error){
      } else {
        $mdToast.show(
          $mdToast.simple()
            .textContent('Оценено!')
            .position("bottom right")
            .hideDelay(3000)
        );
      }
    });
  };

  this.openChat = () => {
    Meteor.call('openChat', 'PRIVATE', '', [$stateParams.userId], null, (err, res) => {
      if (err) {
        const toast = $mdToast.simple()
          .textContent('Невозможно открыть личный чат с участником')
          .position('bottom right')
          .hideDelay(3000);

        return $mdToast.show(toast);
      }

      const chatId = res.existedChatId || res.newChatId;
      return $state.go('chatdetails', {chatId});
    });
  };

  this.getUsersManage = () => {
    return $scope.currentUser ? Roles.userIsInRole($scope.currentUser._id, ['users-manage']) : false;
  };
  this.getTasksReview = () => {
    return $scope.currentUser ? Roles.userIsInRole($scope.currentUser._id, ['tasks-review']) : false;
  };
  this.getUsersViewAll = () => {
    return $scope.currentUser ? Roles.userIsInRole($scope.currentUser._id, ['users-view-all']) : false;
  };
  this.getUsersViewOwn = () => {
    return $scope.currentUser ? Roles.userIsInRole($scope.currentUser._id, ['users-view-own']) : false;
  };

  function transformUser(user) {
    const {_id, profile} = user;

    profile.avatar = Meteor.users.getAvatarProps(_id, true);

    let {birthday, birthmonth, birthyear} = profile;

    const doRange = (value, min = 1, max = 9999) => {
      if (!_.isNumber(value)) {return undefined;}

      return Math.min(Math.max(value, min), max);
    };

    birthday = doRange(birthday, 1, 31);
    birthmonth = doRange(birthmonth, 1, 12);
    birthyear = doRange(birthyear);

    const fstring = birthday && birthmonth && birthyear ? 'D MMMM YYYY' :
      birthday && birthmonth ? 'D MMMM' :
      birthmonth && birthyear ? 'MMMM YYYY' :
      birthyear ? 'YYYY' : (profile.birthday = '');

    if (fstring.length) {
      const momentDate = moment({y: birthyear, M: birthmonth - 1, d: birthday});
      profile.birthday = momentDate.isValid() ? momentDate.format(fstring) : '';
    };


    const devices = {
      desktop : {name: 'с компьютера', icon: 'fa-laptop'},
      tv      : {name: 'smart tv',     icon: 'fa-television'},
      tablet  : {name: 'с планшета',   icon: 'fa-tablet'},
      phone   : {name: 'с телефона',   icon: 'fa-mobile'}
    };

    let lastDevice = devices[profile.lastDevice] || devices.desktop;
    let stateColor = profile.online ? '#1B998B' : '#2D3047';

    let lastActivity = profile.online ? 'online' :
      (profile.lastActivity >= new Date()) ? 'только что' :
      (profile.lastActivity && moment(profile.lastActivity).fromNow()) || '';

    let latestStream;

    if (profile.streams && (profile.streams || []).length)
      latestStream = Streams.findOne({ _id: { $in: profile.streams } }, { sort: { start: -1 } });

    let counters = {};

    counters.program = latestStream ? Programs.findOne(latestStream.programId) : "";

    latestStream = latestStream ?
          _.findWhere(user.counters.programsCounters, { _id: latestStream._id }) : 0;

    counters.givenTasksLikesCount = (latestStream && latestStream.givenTasksLikesCount) || 0;

    counters.commentsLikesCount = (latestStream && latestStream.commentsLikesCount) || 0;

    let ruser = _.extend(user, {profile, lastDevice, stateColor, lastActivity, counters});

    return ruser;
  }
});
