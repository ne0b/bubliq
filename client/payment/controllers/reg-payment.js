angular.module("bubliq").controller("RegPaymentCtrl", ['$scope', '$reactive',
  function ($scope, $reactive) {
    $scope.merchantIdReg = Meteor.settings.public.MERCHANT_ID_REG;
  }
]);
