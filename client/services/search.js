angular.module('bubliq').service('search', function() {
  let searchCallback;

  this.set = (cb) => {
    searchCallback = cb;
  }

  this.send = (searchValue) => {
    if (searchCallback) {
      searchCallback(searchValue);
    }
  }
  return this;

});
