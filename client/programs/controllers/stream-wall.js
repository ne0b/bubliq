angular.module('bubliq').controller('StreamWallCtrl', ['$scope', '$reactive', '$state', '$stateParams', '$filter', 'immediateInterval',
  function ($scope, $reactive, $state, $stateParams, $filter, immediateInterval) {
    $state.overflowInitial = true;

    var ctrl = this;
    $reactive(this).attach($scope);

    this.limit = 10;
    this.skip = 0;
    this.isLoading = false;
    this.canLoadMore = true;
    this.tasks = [];
    this.streamId = $stateParams.streamId;

    this.moreTasks = () => {
      if(this.canLoadMore && this.isLoading === false) this.loadTasks();
    };

    ctrl.dataReady = false;

    let program = Programs.findOne({ _id:$stateParams.programId });
    $state.title = program ? program.title : '';

    this.loadTasks = () => {
      this.isLoading = true;
      Meteor.call("getStreamWallTasks", $stateParams.programId, $stateParams.streamId,
                                        this.limit, this.skip, (err, result) => {
        if (result) {
          this.canLoadMore = result.length - this.limit > 0;
          this.tasks = _.union([], this.tasks, result.splice(0, this.limit));
          this.isLoading = false;

          $scope.$apply(() => {
            ctrl.dataReady = true;
          });
        }
      });
      this.skip += this.limit;
    }
    this.loadTasks();

    this.showmore = {};
    this.showMore = (taskId) => {
      this.showmore[taskId] = this.showmore[taskId] ? false : true;
    };
  }]);
