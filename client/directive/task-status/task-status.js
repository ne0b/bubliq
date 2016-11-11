angular.module('bubliq')
  .directive('taskStatus', function() {
    return {
      scope: {
        statusIcon: '='
      },
      templateUrl: 'client/directive/task-status/task-status.html'
    };
  });
