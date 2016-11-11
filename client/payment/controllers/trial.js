angular.module("bubliq").controller("TrialCtrl", ['$scope', '$reactive', '$cookies',
  function ($scope, $reactive, $cookies) {
    var ctrl = this;
    $reactive(this).attach($scope);

    let isTrial = $cookies.get('trial');
    let token = $cookies.get('token');
    let emtoken = $cookies.get('emtoken');

    if(isTrial === 'true'){
      $cookies.remove('trial');
      $cookies.remove('token');

      Meteor.call('flagUserAsTrial', token, (err, result) => {
        if (!err) {
          $scope.$apply(() => {
            ctrl.trial = true;
          });
        }
        else {
          $scope.$apply(() => {
            ctrl.error = true;
          });
        }
      });

      if(emtoken){
        $cookies.remove('emtoken');
        Accounts.verifyEmail(emtoken, function (error) {
          if(!error){
            Meteor.call("sendEmailOnVerificationLink");
          }
        });
      }
    }
  }
]);
