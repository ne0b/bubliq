angular.module('bubliq')
  .directive('menuToggle', ['$timeout', '$mdUtil', function($timeout, $mdUtil) {
    return {
      scope: {
        section: '='
      },
      templateUrl: 'client/common/partials/menu-toggle.tmpl.html',
      link: function($scope, $element) {
        let controller = $element.parent().controller();

        $scope.isOpen = () => {
          return controller.isOpen($scope.section);
        };
        $scope.toggle = () => {
          controller.toggleOpen($scope.section);
        };

        $mdUtil.nextTick(function() {
          $scope.$watch(
            function() {
              return controller.isOpen($scope.section);
            },
            function(open) {
              let $ul = $element.find('ul');

              let targetHeight = open ? getTargetHeight() : 0;
              $timeout(function() {
                $ul.css({
                  height: targetHeight + 'px'
                });
              }, 0, false);

              function getTargetHeight() {
                let targetHeight;
                $ul.addClass('no-transition');
                $ul.css('height', '');
                targetHeight = $ul.prop('clientHeight');
                $ul.css('height', 0);
                $ul.removeClass('no-transition');
                return targetHeight;
              }
            }
          );
        });
      }
    };
  }])

.directive('menuLink', function() {
  return {
    scope: {
      section: '='
    },
    templateUrl: 'client/common/partials/menu-link.tmpl.html',
    link: function($scope, $element) {
      let controller = $element.parent().controller();

      $scope.isSelected = () => {
        return controller.isSelected($scope.section);
      };

      $scope.focusSection = () => {
        // set flag to be used later when
        // $locationChangeSuccess calls openPage()
        controller.autoFocusContent = true;
        controller.openMenu();
      };
    }
  };
});
