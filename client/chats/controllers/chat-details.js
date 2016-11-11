import {mountChatAtNode, unmountChatAtNode} from './chat-details-react';

angular.module('bubliq').controller('ChatDetailsCtrl',
  ['$scope', '$stateParams', '$state', '$mdToast',
  function ($scope, $stateParams, $state, $mdToast) {
    this.node = document.querySelector('#chat');
    const {chatId} = $stateParams;

    mountChatAtNode(this.node, {$state, $scope, $mdToast, chatId});
    $scope.$on('$destroy', () => unmountChatAtNode(this.node));
  }]);
