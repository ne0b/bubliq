angular.module("bubliq").controller("AssignStreamCtrl", ['$scope', '$reactive', '$cookies',
  function ($scope, $reactive, $cookies) {
    var ctrl = this;
    $reactive(this).attach($scope);

    var stream = $cookies.get('stream');
    var token = $cookies.get('token');

    if(stream){
      $cookies.remove('stream');
      Meteor.call('assignStreamToUser', stream);

      if(token){
        $cookies.remove('token');
        Accounts.verifyEmail(token, function (error) {
          if(!error){
            Meteor.call("sendEmailOnVerificationLink");
          }
        });
      }
    }

    this.acceptRules = () => {
      Meteor.call('markInstructionAsRead');
    };
  }
]);
