angular.module('bubliq')
  .directive('referalFab', ['selectOnClickOther', 'ngClipboard', '$mdToast', '$window', function(selectOnClickOther, ngClipboard, $mdToast, $window) {
    return {
      scope: {
        userId: '='
      },
      templateUrl: 'client/directive/referal-fab/referal-fab.html',
      link: function (scope, element) {
        scope.referalLink = `http://spacebagel.com/?r=${scope.$root.currentUser._id}`;

        const referalLink = element.find('#referallink');

        scope.linkClosed = true;

        scope.toggleReferalLink = () => {
          if (scope.linkClosed) {
            selectOnClickOther('referallink');

            ngClipboard.toClipboard(scope.referalLink);

            const userAgent = $window.navigator.userAgent;

            if (!userAgent.match(/(iPad|iPhone|iPod)/i)) {
              $mdToast.show(
                $mdToast.simple()
                  .textContent('Ссылка скопирована!')
                  .position("bottom right")
                  .hideDelay(3000)
              );
            }
          }

          scope.linkClosed = !scope.linkClosed;
        };
      }
    };
  }]);
