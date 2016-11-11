angular.module('bubliq').service('sort', function() {
  let sortCallback;

  this.set = (callback, array) => {
    sortCallback = callback;

    this.sortArray = array;
  }

  this.send = (sortValue) => {
    if (sortCallback) {
      sortCallback(sortValue);
    }
  }

  return this;
});
