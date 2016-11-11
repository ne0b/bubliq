angular.module('bubliq').controller('TasksListCtrl', ['$scope', '$reactive', '$state', '$filter', '$timeout', 'currentUser', 'TITLES', 'immediateInterval',
  function ($scope, $reactive, $state, $filter, $timeout, currentUser, TITLES, immediateInterval) {
    $state.title = TITLES.TASKS_LIST_CTRL;

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
      tasks() {
        let giventasks;
        ctrl.infiniteTasksLength = GivenTasks.find({ userId:$scope.currentUser._id }).count();

        if(ctrl.infiniteTasksLength){
          this.canLoadMore = ctrl.infiniteTasksLength-this.limit >= 10;

          giventasks = this.canLoadMore ?
                       GivenTasks.find({ userId:$scope.currentUser._id }, { limit: this.limit }).fetch() :
                       GivenTasks.find({ userId:$scope.currentUser._id }).fetch();

          ctrl.infiniteTasks.numLoaded_ = giventasks.length;
        }

        return giventasks;
      }
    });

    const userTaskData = this.subscribe('userTaskData', () => {
      return [
        $scope.currentUser._id,
        this.getReactively('limit')
      ]
    });

    Tracker.autorun(() => {
      if (userTaskData.ready() && !ctrl.dataReady) $scope.$apply(() => {
        ctrl.dataReady = true;
      });
      ctrl.notLoading = userTaskData.ready();
    });

    $scope.$on("$destroy", () => {
      userTaskData.stop();
    });
  }]);
