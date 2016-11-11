angular.module('bubliq').directive('toggleAnswerActiveOnClick', ['$reactive', function () {
    return {
        restrict: 'A',
        scope: {
          toggleAnswerActiveOnClick: '=',
          answerId: '='
        },
        link: function (scope, element, attrs) {
          element.on('click', function () {
            const answersList = scope.$parent.$parent.$parent.answersList;
            const answer = scope.$parent.answer;
            const answerId = scope.answerId;

            scope.$apply(() => {
              const isActive = answersList.activeAnswers[answerId];
              const likesLoaded = answersList.likesLoaded[answerId];

              answersList.activeAnswers = [answerId];

              if (!isActive) answersList.activeAnswers[answerId] = true;

              if (scope.toggleAnswerActiveOnClick === 'likes' && !likesLoaded && answer.likesCount > 10) {
                answersList.loadingLikes[answerId] = true;

                Meteor.call('getMoreAnswerLikes', answerId, (err, result) => {
                  if (result) {
                    answer.likesUsers = result;
                    answersList.likesLoaded[answerId] = true;
                    answersList.loadingLikes[answerId] = false;
                  }
                });
              }
            });
          });
        }
    };
}]);
