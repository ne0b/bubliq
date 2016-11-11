/**
 * Created by nedelkin on 15.03.16.
 */
angular.module('bubliq').service('scrollLoader', function() {

  var loaderCallback;

  this.set = (cb) => {
    loaderCallback = cb;
  }

  this.load = () => {
    if (loaderCallback) {
      loaderCallback();
    }
  }
  return this;

});