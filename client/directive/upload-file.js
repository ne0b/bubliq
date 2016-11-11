angular.module('bubliq').directive('uploadFile', function ($reactive, $mdToast, $mdDialog, $mdMedia) {
    return {
        restrict: 'A',
        scope: true,
        link: function (scope, element, attr) {
            element.bind('change', function () {
              const reader = new FileReader();
              reader.onload = function(e) {
                const data = e.target.result;

                const loadingDialog = $mdDialog.show({
                  controller: LoadingCtrl,
                  templateUrl: 'client/admins/views/admin-loading-process.html',
                  parent: angular.element(document.body),
                  clickOutsideToClose: true,
                  fullscreen: $mdMedia('sm'),
                  locals: { text: "Загрузка изменений в базу" }
                });

                Meteor.call('adminUsersDataImport', data, (err) => {
                  $mdDialog.hide(loadingDialog);

                  const msg = err ? 'Ошибка в формате данных' : 'Изменения загружены!';
                  $mdToast.show(
                    $mdToast.simple()
                      .textContent(msg)
                      .position("bottom right")
                      .hideDelay(3000)
                  );

                  element[0].value = "";
                });
              };
              reader.readAsBinaryString(element[0].files[0]);
            });

          function LoadingCtrl($scope, text) {
            $scope.text = text;
          }
        }
    };
});
