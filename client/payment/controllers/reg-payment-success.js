angular.module("bubliq").controller("RegPaymentSuccessCtrl", ['$scope', '$cookies', '$state',
  function ($scope, $cookies, $state) {
    const lengthMoreThan = Match.Where(function(x) {
      check(x, String);
      return x.length > 5;
    });

    const ctrl = this;

    try {
      const loginToken = JSON.parse($cookies.get('logintoken'));

      $cookies.remove('logintoken');

      Meteor.loginWithToken(loginToken.token, (err, result) => {
        if (err) $state.go('index');
      });
    }
    catch (e) {}

    this.setPassword = () => {
      check(this.password, lengthMoreThan);

      Meteor.call('setUserPassword', this.password, (err, result) => {
        if (result) $state.go('index');
      });
    };
  }
]);
