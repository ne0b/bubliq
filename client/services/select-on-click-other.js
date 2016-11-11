angular.module('bubliq').factory('selectOnClickOther', function($timeout, $window) {
  return function(id) {
    $timeout(function() {
      const element = $window.document.getElementById(id);
      if(element && !$window.getSelection().toString()) {
        element.setSelectionRange(0, element.value.length);
      }
    });
  };
});
