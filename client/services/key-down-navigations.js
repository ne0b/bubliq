angular.module('bubliq').service('keyDownNavigation', function() {
  this.navigationCallback = false;

  this.set = (cb) => {
    this.navigationCallback = cb;
  }

  this.send = (key) => {
    if (this.navigationCallback) {
      this.navigationCallback(key);
    }
  }
  return this;

});
