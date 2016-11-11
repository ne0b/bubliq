angular.module('bubliq').controller('TaskWallCtrl', ['$scope', '$reactive', '$state', '$stateParams', '$mdToast', '$document', 'scrollLoader',
  function ($scope, $reactive, $state, $stateParams, $mdToast, $document) {
    $state.overflowInitial = true;

    var ctrl = this;
    $reactive(this).attach($scope);

    this.limit = 12;
    this.perPage = 4;
    this.isLoading = false;
    this.newComments = [];

    this.moreGivenTasks = () => {
      if(this.canLoadMore && this.isLoading === false){
        this.isLoading = true;
        this.limit += this.perPage;
      }
    };

    this.getModerator = Roles.userIsInRole($scope.currentUser._id, ['moderator']);
    this.getTasksReview = Roles.userIsInRole($scope.currentUser._id, ['tasks-review']);

    this.getStartTime = (time, startAt) => {
      return moment(time).add(startAt-1, 'days').locale('ru').format("dd, DD.MM.YYYY");
    };

    this.stream = Streams.findOne({ _id:$stateParams.streamId });

    Meteor.call("getTaskInfo", $stateParams.taskId, (err, result) => {
      if (result) {
        let program = Programs.findOne({ _id:result.programId });

        $state.title = program ? `${program.title} » ${result.title}`  : '';
        $state.title += this.stream ? ` ${this.getStartTime(this.stream.start, result.start)}` : '';
      }
    });

    this.helpers({
      giventasks() {
        const dataReady = this.getReactively('dataReady');
        const limit = this.getReactively('limit');

        const giventasks = GivenTasks.find({
            "streamId": $stateParams.streamId,
            "taskId": $stateParams.taskId,
            "report": { $exists: true } }, { limit, sort: { "report.reportSendAt": -1 } }).fetch();

        const allGivenTasksCount = GivenTasks.find({
            "streamId": $stateParams.streamId,
            "taskId": $stateParams.taskId,
            "report": { $exists: true } }).count();

        this.canLoadMore = allGivenTasksCount-limit > 0;

        if (giventasks.length%4 == 0 || !this.canLoadMore) {
          this.isLoading = false;
        }

        if(dataReady && giventasks.length == 0){
          this.noGivenTasks = true;
        }
        else if(dataReady && giventasks.length > 0){
          this.noGivenTasks = undefined;
        }

        return giventasks;
      }
    });

    ctrl.dataReady = false;

    const taskWall = this.subscribe('taskWall', () => {
      return [
        $stateParams.streamId,
        $stateParams.taskId,
        this.getReactively('limit')
      ]
    }, {
      onReady: function () {
        $scope.$apply(() => {
          ctrl.dataReady = true;
        });
      },
      onStop: function (error) {
        if (error) {
          $scope.$apply(() => {
            ctrl.dataReady = 'error';
            ctrl.dataError = error;
          });
        }
      }
    });

    $scope.$on("$destroy", () => {
      taskWall.stop();
    });

    this.sendCommentOnEnter = function (taskId, event) {
      if(event.keyCode == 13 && !event.shiftKey && event.target.value.trim().length > 0){
        Meteor.call('sendComment', taskId, "<p>"+event.target.value+"</p>");
        event.target.value = null;
        ctrl.newComments[taskId] = null;
      }
    };

    this.sendCommentOnButton = function (taskId) {
      let text = ctrl.newComments[taskId] || '';

      if(text.trim().length > 0){
        Meteor.call('sendComment', taskId, "<p>"+text+"</p>");
        ctrl.newComments[taskId] = null;
      }
    };

    this.showcomments = {};
    this.showComments = (taskId) => {
      this.showcomments[taskId] = this.showcomments[taskId] ? false : true;
    };

    this.showmore = {};
    this.showMore = (taskId) => {
      this.showmore[taskId] = this.showmore[taskId] ? false : true;
    };

    this.sentTime = function(time) {
      return moment(time).locale('ru').format("HH:mm:ss, DD.MM.YYYY");
    };

    this.like = (taskId) => {
      Meteor.call("likeGivenTask", taskId);
    };

    this.rateTask = function(giventask) {
      if (!giventask.grade && giventask.grade !== 0) {
        $mdToast.show(
          $mdToast.simple()
            .textContent('Укажите оценку!')
            .position('bottom right')
            .hideDelay(3000)
        );
        return;
      }

      Meteor.call('rateTask', giventask._id, giventask.grade, function (error, result) {
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

    this.sentTime = function (time) {
      return moment(time).locale('ru').format("HH:mm, DD.MM.YYYY");
    };
  }]);
