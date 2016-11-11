angular.module('bubliq').controller('SortViewCtrl', ['$scope', '$reactive', '$timeout', 'sort',
  function($scope, $reactive, $timeout, sort) {
    let ctrl = this;
    $reactive(this).attach($scope);

    this.sortArray = sort.sortArray;

    $scope.sortBy = this.sortArray[0].value;

    $scope.$watch('sortBy', (value) => {
      this.sort(value);
    });

    this.sort = (sortBy) => {
      sort.send(sortBy);
    };
  }
]);
