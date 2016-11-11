angular.module("bubliq").controller("MentorReviewCtrl", function ($scope, $reactive, $state, $stateParams, TITLES) {
  $state.title = TITLES.MENTOR_CTRL;

  var ctrl = this;
  $reactive(this).attach($scope);

  this.helpers({
    users() {
      return getUsersWithAvatars(Meteor.users.find({_id:$stateParams.userId}));
    },
    tasks() {
      return getGivenTasksWithStreams(GivenTasks.find({userId:$stateParams.userId}, {sort: {createdAt: -1}}));
    }
  });

  ctrl.dataReady = false;
  const userProfileData = this.subscribe('userProfileData', () => {
    return [
      $stateParams.userId
    ]
  }, {
    onReady: function () {
      ctrl.dataReady = true;
      $scope.$apply();
    },
    onStop: function (error) {
      if (error) {
        ctrl.dataReady = 'error';
        ctrl.dataError = error;
        $scope.$apply();
      }
    }
  });

  $scope.$on("$destroy", () => {
    userProfileData.stop();
  });

  this.starttime = function(time, startAt) {
    return moment(time).add(startAt-1, 'days').locale('ru').format("DD.MM, dd");
  };

  this.endtime = function(time, endAt) {
    return moment(time).add(endAt-1, 'days').locale('ru').format("DD.MM, dd");
  };

  const getUsersWithAvatars = (users) => {
    return users.map((user) => {
      if (user.profile) {
        user.profile.avatar = Meteor.users.getAvatarProps(user._id);
      }
      return user;
    });
  }

  function getGivenTasksWithStreams(giventasks){
    return giventasks.map(function (giventask) {
       giventask.task = Tasks.findOne({ _id: giventask.taskId }, {fields: {"title": 1, "start": 1, "end": 1, "required": 1}});

       giventask.stream = Streams.findOne({ _id: giventask.streamId }, {fields: {"start": 1}});

       if(giventask.task && giventask.stream && giventask.report && giventask.report.reportSendAt){
         timeDifference = moment(giventask.report.reportSendAt)
            .diff(moment(giventask.stream.start).add(giventask.task.end-1, 'days')
                                                .add(43200, 'seconds'), 'seconds');
       }

       if (giventask.report && ((giventask.grade || giventask.grade === 0) && giventask.grade >= 0)) {
         giventask.statusIcon = {
           color: 'green',
           status: 'Отчет принят',
           icon: 'action:ic_done_24px'
         };
       } else if (giventask.report && (!giventask.grade && giventask.grade !== 0) && timeDifference > 0) {
         giventask.statusIcon = {
           color: 'red',
           status: 'Отчет отправлен после срока сдачи',
           icon: 'maps:ic_local_post_office_24px'
         };
       } else if (giventask.report && (!giventask.grade && giventask.grade !== 0) && timeDifference <= 0) {
         giventask.statusIcon = {
           color: 'rgb(63,81,181)',
           status: 'Отчет не оценен',
           icon: 'maps:ic_local_post_office_24px'
         };
       } else if (giventask.report && giventask.grade && giventask.grade < 0) {
         giventask.statusIcon = {
           color: 'red',
           status: 'Отчет не принят',
           icon: 'content:ic_clear_24px'
         };
       } else if (giventask.grade && giventask.grade < 0) {
         giventask.statusIcon = {
           color: 'red',
           status: 'Задание просрочено',
           icon: 'content:ic_clear_24px'
         };
       } else {
         giventask.statusIcon = {
           color: 'rgb(63,81,181)',
           status: 'Отчет не отправлен',
           icon: 'action:ic_help_24px'
         };
       }

      return giventask
    });
  }
});
