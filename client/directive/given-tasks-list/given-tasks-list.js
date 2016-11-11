angular.module('bubliq')
  .directive('givenTasksList', function() {
    return {
      scope: {
        givenTasks: '='
      },
      templateUrl: 'client/directive/given-tasks-list/given-tasks-list.html'
    };
  });
