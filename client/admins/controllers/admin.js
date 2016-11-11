angular.module("bubliq").controller("AdminCtrl", ['$scope', '$reactive', '$state', 'TITLES',
  function ($scope, $reactive, $state, TITLES) {
    $state.title = TITLES.ADMIN_CTRL;

    $reactive(this).attach($scope);

    $scope.getUsersManage = () => {
      return $scope.currentUser ? Roles.userIsInRole($scope.currentUser._id, ['users-manage']) : false;
    };
    $scope.getProgramsManage = () => {
      return $scope.currentUser ? Roles.userIsInRole($scope.currentUser._id, ['programs-manage']) : false;
    };
    $scope.getMentorAssign = () => {
      return $scope.currentUser ? Roles.userIsInRole($scope.currentUser._id, ['mentor-assign']) : false;
    };
  }
]);
