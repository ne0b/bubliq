import {mountChatListAtNode, unmountChatListAtNode} from './chat-list-react';

angular.module('bubliq').controller('ChatsListCtrl',
  ['$scope', '$state', '$mdToast',
  function ($scope, $state, $mdToast) {
    this.node = document.querySelector('#chat-list');
    mountChatListAtNode(this.node, {$state, $scope, $mdToast});
    $scope.$on('$destroy', () => unmountChatListAtNode(this.node));
  }]);
