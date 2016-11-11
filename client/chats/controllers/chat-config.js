import {mountChatConfigAtNode, unmountChatConfigAtNode} from './chat-config-react';

angular.module('bubliq').controller('ChatConfigCtrl',
  ['$scope', '$stateParams', '$state', '$mdToast',
  function ($scope, $stateParams, $state, $mdToast) {
    this.node = document.querySelector('#chat-config');

    const {chatId = 'new'} = $stateParams;

    mountChatConfigAtNode(this.node, {chatId, $state, $scope, $mdToast});
    $scope.$on('$destroy', () => unmountChatConfigAtNode(this.node));
  }]);
