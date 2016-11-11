angular.module('bubliq')
  .directive('answersAvatar', function() {
    return {
      scope: {
        answerUserId: '=',
        answerUserAvatar: '=',
        answerUserFullname: '=',
        answerIcon: '=',
        answerTaskRated: '='
      },
      templateUrl: 'client/directive/answers-avatar/answers-avatar.html'
    };
  });
