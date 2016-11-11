angular.module("bubliq").controller("IndexCtrl", ['$scope', '$reactive', '$state', '$meteor', '$state', '$cookies', 'TITLES',
  function ($scope, $reactive, $state, $meteor, $state, TITLES) {
    $state.title = TITLES.INDEX_CTRL;

    var indexCtrl = this;
    $reactive(indexCtrl).attach($scope);

    indexCtrl.currentProgramId = Meteor.settings.public.CURRENT_PROGRAM;

    indexCtrl.showMessagesUntil = moment(Meteor.settings.public.CURRENT_PROGRAM_START_DAY).diff(moment(), 'seconds');

    indexCtrl.showMessagesUntilTrial = moment(Meteor.settings.public.CURRENT_PROGRAM_TRIAL_LAST_DAY).diff(moment(), 'seconds');

    indexCtrl.validTrial = moment(Meteor.settings.public.CURRENT_PROGRAM_TRIAL_LAST_DAY).diff(moment(), 'seconds') > 0 &&
                           _.findWhere($scope.$root.currentUser.trialPrograms, { _id: indexCtrl.currentProgramId });
    indexCtrl.programPaid = $scope.$root.currentUser.paidPrograms.indexOf(indexCtrl.currentProgramId) > -1;

    indexCtrl.hideNotPaidMessage = $scope.currentUser ?
        Roles.userIsInRole($scope.currentUser._id, ['tasks-review', 'tasks-assign', 'moderator', 'users-manage'])
        : false;

    indexCtrl.helpers({
      onEmailVerificationLink() {
        return Session.get('onEmailVerificationLink');
      }
    });

    if(indexCtrl.onEmailVerificationLink){
      $state.go('payment');
    }
  }
]);
