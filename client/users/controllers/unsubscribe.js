angular.module("bubliq").controller("UnsubscribeCtrl", ['$scope', '$reactive', '$stateParams',
  function ($scope, $reactive, $stateParams) {
    var unsubscribeCtrl = this;
    $reactive(this).attach($scope);

    if($stateParams.sentletter){
      Meteor.call("unsubscribeUser", $stateParams.sentletter, function (error, result) {
        if(!error){
          unsubscribeCtrl.dataReady = true;
        } else {
          unsubscribeCtrl.dataReady = 'error';
          unsubscribeCtrl.dataError = error.error;
        }
        $scope.$apply();
      });
    } else {
      unsubscribeCtrl.dataReady = 'error';
      unsubscribeCtrl.dataError = 'Не указан ID факта отправки';
    }
  }
]);
