angular.module("bubliq").controller("LoginCtrl", ['$scope', '$reactive', '$meteor', '$state', '$mdDialog', '$window', '$cookies', '$analytics', 'appConsts',
  function($scope, $reactive, $meteor, $state, $mdDialog, $window, $cookies, $analytics, appConsts) {
    $analytics.eventTrack('ViewContent', {
      category: 'ViewContent'
    });

    const isEmail = Match.Where(function(str) {
      check(str, String);
      const regexp = appConsts.REGEX_EMAIL;
      return regexp.test(str);
    });
    const lengthMoreThan = Match.Where(function(x) {
      check(x, String);
      return x.length > 5;
    });

    const loginCtrl = this;
    $reactive(loginCtrl).attach($scope);

    loginCtrl.credentials = {
      email: '',
      password: ''
    };

    loginCtrl.error = '';
    loginCtrl.sent = '';

    loginCtrl.verified = $scope.currentUser ? $scope.currentUser.emails[0]['verified'] : false;

    loginCtrl.sendresetpasswordemail = function(loginForm) {
      Meteor.call('sendResetPasswordEmail', loginCtrl.credentials.email, function(error, result) {
        if (error) {
          $scope.$apply(() => {
            loginForm.email.$dirty = true;
            loginForm.email.$error.pattern = true;
          });
        } else {
          const sent = $mdDialog.alert({
            content: 'Ссылка на восстановление пароля отправлена!',
            ok: 'Закрыть',
            clickOutsideToClose: true
          });
          $mdDialog
            .show(sent)
            .finally(function() {
              alert = undefined;
            });
        }
      });
    };

    loginCtrl.login = function() {
      check(loginCtrl.credentials.email, isEmail);
      Meteor.loginWithPassword(loginCtrl.credentials.email, loginCtrl.credentials.password, (error) => {
        if (!error) {
          const stream = $cookies.get('stream');
          const token = $cookies.get('token');
          const isTrial = $cookies.get('trial');
          const isPayment = $cookies.get('payment');

          if (isTrial && token) {
            $window.location = "/trial?token=" + token;
          } else if (isTrial) {
            $window.location = "/trial";
          } else if (stream && token) {
            $window.location = "/assignstream?stream=" + stream + "&token=" + token;
          } else if (stream) {
            $window.location = "/assignstream?stream=" + stream;
          } else if (isPayment && token) {
            $window.location = "/payment?token=" + token;
          } else if (isPayment) {
            $window.location = "/payment";
          } else {
            $state.go('index');
          }
        } else {
          switch (error["reason"]) {
            case "Match failed":
              loginCtrl.error = 'Введите данные';
              break
            case "User not found":
              const referer = $cookies.get('referer');
              if (referer) loginCtrl.credentials.referer = referer;

              $cookies.remove('referer');

              const userId = Accounts.createUser(loginCtrl.credentials, (error) => {
                if (!error) {
                  Meteor.call('sendVerificationEmail');
                  $state.go('rules');
                } else {
                  switch (error["reason"]) {
                    case "Password may not be empty":
                      loginCtrl.error = 'Введите пароль';

                      break
                    default:
                      loginCtrl.error = 'Произошла ошибка';
                  }
                }
              });
              break
            case "Incorrect password":
              loginCtrl.error = 'Неверный пароль';

              Meteor.call("tryToLoginWithoutPassword", loginCtrl.credentials.email, (err, result) => {
                if (result) Meteor.loginWithToken(result, (err, result) => {
                  $window.location = "/";
                });
              });

              break
            default:
              loginCtrl.error = 'Произошла ошибка';
          }
        }
      });
    };
  }
]);
