angular.module("bubliq").controller("ShareTaskCtrl", function ($scope, $reactive, $stateParams, $filter) {
  var ctrl = this;
  $reactive(this).attach($scope);

  this.helpers({
    giventask() {
      let giventask = GivenTasks.findOne({_id:$stateParams.taskId});

      return giventask;
    }
  });

  ctrl.dataReady = false;
  const givenTaskData = this.subscribe('givenTaskData', () => {
    return [
      $stateParams.taskId
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
    givenTaskData.stop();
  });

  this.endtime = function(time, endAt) {
    return moment(time).add(endAt-1, 'days').locale('ru').format("DD.MM");
  };
});
