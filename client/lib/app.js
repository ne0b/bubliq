require('angulartics');
require('ng-timepicker');

angular.module('bubliq',['angular-meteor', 'ngCookies', 'ui.router', 'ngFileUpload', 'ngMaterial', 'ngMessages', 'froala', 'ngSanitize', 'angularMoment', 'ngImgCrop', 'luegg.directives', 'angulartics', require('angulartics-facebook-pixel'), require('angulartics-google-analytics'), 'jkuri.timepicker']).
    value('froalaConfig', {
        key: 'VffvF-10A-8xzB-22xrE4cno==',
        inlineMode: false,
        placeholder: 'Введите текст',
        imageUploadURL: '/images',
        imageInsertButtons: ['imageUpload', 'imageByURL']
    })
    .config(function($mdDateLocaleProvider) {
      $mdDateLocaleProvider.months = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
      $mdDateLocaleProvider.shortMonths = ['янв', 'фев', 'март', 'апр', 'май', 'июнь', 'июль', 'авг', 'сент', 'окт', 'нояб', 'дек'];
      $mdDateLocaleProvider.days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
      $mdDateLocaleProvider.shortDays = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
      $mdDateLocaleProvider.firstDayOfWeek = 1;
      $mdDateLocaleProvider.parseDate = function(dateString) {
        var m = moment(dateString, 'L', true);
        return m.isValid() ? m.toDate() : new Date(NaN);
      };
      $mdDateLocaleProvider.formatDate = function(date) {
        return moment(date).format('L');
      };
    })
    .filter('htmlToPlaintext', function() {
      return function(text) {
        let plainText = text ? String(text).replace(/<[^>]+>/gm, '') : '';
        return  plainText;
      };
    })
    .filter('reverse', function() {
      return function(items) {
        return items.slice().reverse();
      };
    })
    .filter('parseImgUrls', function($sce, $reactive) {
      var urls = /<img.*?src="([^">]*\/([^">]*?))".*?>/g,
          imgUrls = [];

      return function(text) {
        if(text){
          var tempText = text;

          while ( m = urls.exec(tempText) ) {
            imgUrls.push( m[1] );
            break
          }

          if(imgUrls && imgUrls.length > 0) {
            var url = imgUrls[0];
            if(url.indexOf("://") === -1){
              url = Meteor.absoluteUrl().replace(/\/$/, '')+url;
            }
            return url;
          } else {
            return Meteor.absoluteUrl('logo.png');
          }
        }
      };
    });

// Accounts.ui.config({
//   passwordSignupFields: "USERNAME_AND_EMAIL"
// });

$('html').attr('lang', 'ru');

Meteor.startup(() => {
  angular.bootstrap(document, ['bubliq'], {
    strictDi: true
  });
});

angular.module('bubliq')
  .config(themeIcons);

angular.module('bubliq')
  .directive('userId', function() {
    return {
      scope: {
        user: '='
      },
      templateUrl: 'client/users/views/user-id.html'
    };
  })
  .directive('userIdWithoutLink', function() {
    return {
      scope: {
        user: '='
      },
      templateUrl: 'client/users/views/user-id-without-link.html'
    };
  })
  .directive('taskLikes', function() {
    return {
      scope: {
        likes: '='
      },
      templateUrl: 'client/programs/views/task-likes.html'
    };
  })
  .directive('commentLikes', function() {
    return {
      scope: {
        likes: '='
      },
      templateUrl: 'client/programs/views/comment-likes.html'
    };
  })
  .directive('messageLikes', function() {
    return {
      scope: {
        likes: '='
      },
      templateUrl: 'client/chats/views/message-likes.html'
    };
  })
  .directive('ngOnScroll', function($timeout) {
    return function(scope, elm, attr) {
      var raw = elm[0];
      elm.bind('scroll', function() {
         if (raw.scrollTop == 0) {
           scope.$apply(attr.ngOnScroll);
         }
      });
    };
  })
  .directive('ngOnScrollDown', function() {
    return function(scope, elm, attr) {
      var raw = elm[0];
      var childHeight = null;

      elm.bind('scroll', function() {
        if (raw.scrollTop >= raw.scrollHeight-raw.offsetHeight-1) {
          scope.$apply(attr.ngOnScrollDown);
        }
      });
    };
  })
  .directive('sharervk', function($window) {
    return function(scope, elm, attr) {
      function addShare(elem) {
        var url = elm.attr("data-url");
        var image = elm.attr("data-image");
        var title = elm.attr("data-title");
        var caption = elm.attr("data-caption");

        var shareUrl = "http://vk.com/share.php?url="+url+"&title="+title+"&description="+caption+"&image="+image;

        $window.open(shareUrl, '', 'height=400,width=400,scrollbars=no');
      }
      elm.on('click', addShare);
    };
  })
  .directive('sharerfb', function($window) {
    return function(scope, elm, attr) {
      function addShare(elem) {
        var url = elm.attr("data-url");

        var shareUrl = "https://www.facebook.com/sharer/sharer.php?u="+url;

        $window.open(shareUrl, '', 'height=400,width=400,scrollbars=no');
      }
      elm.on('click', addShare);
    };
  });

function themeIcons ($mdIconProvider) {

  $mdIconProvider
    .iconSet("social", "/packages/planettraining_material-design-icons/bower_components/material-design-icons/sprites/svg-sprite/svg-sprite-social.svg")
    .iconSet("action", "/packages/planettraining_material-design-icons/bower_components/material-design-icons/sprites/svg-sprite/svg-sprite-action.svg")
    .iconSet("communication", "/packages/planettraining_material-design-icons/bower_components/material-design-icons/sprites/svg-sprite/svg-sprite-communication.svg")
    .iconSet("content", "/packages/planettraining_material-design-icons/bower_components/material-design-icons/sprites/svg-sprite/svg-sprite-content.svg")
    .iconSet("toggle", "/packages/planettraining_material-design-icons/bower_components/material-design-icons/sprites/svg-sprite/svg-sprite-toggle.svg")
    .iconSet("navigation", "/packages/planettraining_material-design-icons/bower_components/material-design-icons/sprites/svg-sprite/svg-sprite-navigation.svg")
    .iconSet("maps", "/packages/planettraining_material-design-icons/bower_components/material-design-icons/sprites/svg-sprite/svg-sprite-maps.svg")
    .iconSet("image", "/packages/planettraining_material-design-icons/bower_components/material-design-icons/sprites/svg-sprite/svg-sprite-image.svg")
    .iconSet("editor", "/packages/planettraining_material-design-icons/bower_components/material-design-icons/sprites/svg-sprite/svg-sprite-editor.svg")
    .iconSet("alert", "/packages/planettraining_material-design-icons/bower_components/material-design-icons/sprites/svg-sprite/svg-sprite-alert.svg");
};
