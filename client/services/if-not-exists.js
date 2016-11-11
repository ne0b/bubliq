angular.module('bubliq').factory('ifNotExists', function() {
  return (prop = true) => {
    return prop;
  }
});
