angular.module('bubliq')
  .directive('showGrade', function() {
    return {
      scope: {
        ratedGrade: '=',
        maxGrade: '=',
        gradeFill: '='
      },
      templateUrl: 'client/directive/show-grade/show-grade.html'
    };
  });
