angular.module("bubliq").controller("ResetPasswordCtrl", ['$scope', '$reactive', '$state', '$meteor', '$stateParams',
  function ($scope, $reactive, $state, $meteor, $stateParams) {
    var lengthMoreThan = Match.Where(function (x) {
      check(x, String);
      return x.length > 5;
    });

    var resetCtrl = this;
    $reactive(resetCtrl).attach($scope);

    resetCtrl.credentials = {
      password: ''
    };

    resetCtrl.helpers({
      resetPasswordToken() {
        return Session.get('resetPasswordToken');
      }
    });

    resetCtrl.resetPassword = function () {
      check(resetCtrl.credentials.password, lengthMoreThan);
      $meteor.resetPassword(resetCtrl.resetPasswordToken, resetCtrl.credentials.password).then(
        function () {
          Session.set('resetPasswordToken', '');
          $state.go('index');
        },
        function (err) {
          resetCtrl.error = 'Введите пароль';
        }
      );
    };
  }
]);
