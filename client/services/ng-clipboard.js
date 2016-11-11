
angular.module('bubliq').factory('ngClipboard', function($compile,$rootScope,$document) {
  return {
    toClipboard: function(element){
      const copyElement = angular.element('<span id="ngClipboardCopyId">'+element+'</span>');
      const body = $document.find('body').eq(0);
      body.append($compile(copyElement)($rootScope));

      const ngClipboardElement = angular.element(document.querySelector('#ngClipboardCopyId'));
      const range = document.createRange();

      range.selectNode(ngClipboardElement[0]);

      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);

      const successful = document.execCommand('copy');

      window.getSelection().removeAllRanges();

      copyElement.remove();
    }
  }
});
