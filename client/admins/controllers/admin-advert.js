angular.module("bubliq").controller("AdminAdvertCtrl", ['$scope', '$reactive', '$state', '$mdToast', '$document', 'TITLES',
  function ($scope, $reactive, $state, $mdToast, $document, TITLES) {
    $state.title = `${TITLES.ADMIN_CTRL} » ${TITLES.ADMIN_ADVERT_CTRL}`;

    var ctrl = this;

    $reactive(this).attach($scope);

    ctrl.dataReady = false;
    const adverts = this.subscribe('adverts', () => {}, {
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
      adverts.stop();
    });

    this.helpers({
      advert() {
        return Adverts.findOne({});
      }
    });

    this.editAdvert = function () {
      Meteor.call('editAdvert', this.advert.text);

      $mdToast.show(
        $mdToast.simple()
          .textContent('Сохранено!')
          .position("bottom right")
          .hideDelay(3000)
      );
    };
  }
]);
