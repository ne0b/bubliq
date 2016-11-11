angular.module("bubliq").controller("RulesCtrl", ['$scope', '$reactive', '$state', '$timeout', '$analytics',
  function ($scope, $reactive, $state, $timeout, $analytics) {
    $analytics.eventTrack('Lead', {
      category: 'Lead'
    });

    var vm = this;
    $reactive(vm).attach($scope);

    Meteor.call('getRules', (err, result) => {
      if (result) $scope.$apply(() => {
        vm.dataReady = true;
        vm.rules = result;
      });
    });

    vm.acceptRules = function () {
      Meteor.call('acceptRules');
      $timeout(function() {
        $state.go('profile');
      }, 200);
    };
  }
]);
