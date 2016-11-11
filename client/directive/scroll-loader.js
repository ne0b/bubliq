angular.module('bubliq').directive('yScrollLoader',
  [function() {
    return {
      scope: {
        load: '&',
        isLoading: '@'
      },
      link: (scope, element) => {
        element.on('scroll', (event) => {
          const scrollTop    = element.scrollTop();
          const scrollHeight = element[0].scrollHeight;
          if (scope.isLoading == 'false' && scrollHeight/scrollTop > 10) {
            scope.$apply(() => {
              scope.load();
            });
          }

        })


      }
    }
  }]);
