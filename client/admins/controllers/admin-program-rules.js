angular.module("bubliq").controller("AdminProgramRulesCtrl", ['$scope', '$reactive', '$state', '$timeout', '$mdToast', '$document', 'froalaImages', 'TITLES',
  function ($scope, $reactive, $state, $timeout, $mdToast, $document, froalaImages, TITLES) {
    $state.title = `${TITLES.ADMIN_CTRL} » ${TITLES.ADMIN_PROGRAM_RULES_CTRL}`;

    var ctrl = this;

    $reactive(this).attach($scope);

    ctrl.dataReady = false;
    const rules = this.subscribe('rules', () => {}, {
      onReady: function () {
        ctrl.dataReady = true;
        $scope.$apply();
      },
      onStop: function (error) {
        if (error) {
          ctrl.dataReady = 'error';
          ctrl.dataError = error;
          $scope.$apply();
        }
      }
    });

    $scope.$on("$destroy", () => {
      rules.stop();
    });

    this.helpers({
      rules() {
        return Rules.findOne({ object: "program" });
      }
    });

    this.froalaOptions = froalaImages.froalaOptions();

    this.editRules = function () {
      Meteor.call('editProgramRules', this.rules.text);

      $mdToast.show(
        $mdToast.simple()
          .textContent('Сохранено!')
          .position("bottom right")
          .hideDelay(3000)
      );
    };
  }
]);
