angular.module("bubliq").controller("MentorCtrl", ['$scope', '$meteor', '$state', 'TITLES',
  function ($scope, $meteor, $state, TITLES) {
    $state.title = TITLES.MENTOR_CTRL;

    $scope.getTasksReview = function(user) {
      return Roles.userIsInRole($scope.currentUser._id, ['tasks-review']);
    };
    $scope.getTasksAssign = function(user) {
      return Roles.userIsInRole($scope.currentUser._id, ['tasks-assign']);
    };
  }
]);
