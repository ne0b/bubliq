angular.module('bubliq')
  .directive('showLikes', function() {
    return {
      scope: {
        likes: '=',
        count: '='
      },
      templateUrl: 'client/directive/show-likes/show-likes.html'
    };
  });
