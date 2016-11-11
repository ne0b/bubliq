
angular.module('bubliq').service('immediateInterval', function($interval) {

 let immediateInterval;

 this.set = (cb, interval) => {
   cb();

   $interval.cancel(immediateInterval);

   immediateInterval = $interval(cb, interval);
 }

 return this;

});
