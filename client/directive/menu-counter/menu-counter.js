
angular.module('bubliq')
  .directive('menuCounter', function() {
    return {
      scope: {
        showCount: '=',
      },
      templateUrl: 'client/directive/menu-counter/menu-counter.html'
    };
  });
