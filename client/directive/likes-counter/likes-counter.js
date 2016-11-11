angular.module('bubliq')
  .directive('likesCounter', function() {
    return {
      scope: {
        counterName: '=',
        likesCount: '='
      },
      templateUrl: 'client/directive/likes-counter/likes-counter.html'
    };
  });
