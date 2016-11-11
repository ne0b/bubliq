angular.module("bubliq").controller("VerifyCtrl", ['$scope', '$reactive', '$state', '$stateParams',
  function ($scope, $reactive, $state, $stateParams) {
    Session.set('onEmailVerificationLink', 'true');
    Accounts.verifyEmail($stateParams.token, function () {
      Meteor.call("sendEmailOnVerificationLink");
      $state.go('payment');
    });
  }
]);
