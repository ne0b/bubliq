angular.module('bubliq')
  .directive('socialLink', function() {
    return {
      scope: {
        socialLinkTo: '='
      },
      templateUrl: 'client/directive/social-link/social-link.html',
      link: function (scope, element) {
        scope.socialLinkName = scope.socialLinkTo;

        if (~scope.socialLinkTo.indexOf('twitter.com')) scope.socialLinkName = 'Twitter';
        if (~scope.socialLinkTo.indexOf('vk.com')) scope.socialLinkName = 'VK';
        if (~scope.socialLinkTo.indexOf('facebook.com')) scope.socialLinkName = 'Facebook';
        if (~scope.socialLinkTo.indexOf('instagram.com')) scope.socialLinkName = 'Instagram';
        if (~scope.socialLinkTo.indexOf('ok.ru')) scope.socialLinkName = 'Одноклассники';
      }
    };
  });
