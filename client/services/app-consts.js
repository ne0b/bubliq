angular.module('bubliq').service('appConsts', function() {
  this.anonymousAvatarPath = "/images/anonymous_avatar.png";
  this.REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
});
