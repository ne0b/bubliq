angular.module("bubliq").controller("AdminRolesManageCtrl", ['$scope', '$reactive', '$state', '$mdMedia', '$mdDialog', 'TITLES',
  function($scope, $reactive, $state, $mdMedia, $mdDialog, TITLES) {
    $state.title = `${TITLES.ADMIN_CTRL} » ${TITLES.ADMIN_ROLES_MANAGE_CTRL}`;

    var ctrl = this;

    $reactive(this).attach($scope);

    this.helpers({
      rolespresets() {
        return Rolespresets.find({});
      }
    });

    ctrl.dataReady = false;
    const rolespresets = this.subscribe('rolespresets', () => {}, {
      onReady: function() {
        $scope.$applyAsync(() => {
          ctrl.dataReady = true;
        });
      },
      onStop: function(error) {
        if (error) {
          $scope.$applyAsync(() => {
            ctrl.dataReady = 'error';
            ctrl.dataError = error;
            $scope.$apply();
          });
        }
      }
    });

    $scope.$on("$destroy", () => {
      rolespresets.stop();
    });

    this.deleteRolePreset = (rolePreset) => {
      Meteor.call("deleteRolePreset", rolePreset._id);
    };

    this.showEditRole = (ev, role) => {
      $mdDialog.show({
        controller: RoleEditCtrl,
        controllerAs: 'roleEdit',
        templateUrl: 'client/admins/views/admin-role-edit-dialog.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose: true,
        fullscreen: $mdMedia('sm'),
        locals: {
          role: role
        }
      });
    };
  }
]);

function RoleEditCtrl($scope, $reactive, $document, $mdDialog, role) {
  const lengthMoreThan = Match.Where(function(x) {
    check(x, String);
    return x.length > 2;
  });

  $reactive(this).attach($scope);

  this.rolePreset = role ? {
    _id,
    title,
    weight,
    rights
  } = role : {
    _id: false,
    title: null,
    weight: null,
    rights: {
      usersmanage: false,
      mentorassign: false,
      programsmanage: false,
      moderator: false,
      usersviewall: false,
      usersviewown: false,
      programsviewall: false,
      programsviewfree: false,
      tasksreview: false,
      tasksassign: false,
      programstakeall: false,
      programstakefree: false
    }
  };

  this.editRole = () => {
    check(this.rolePreset.title, lengthMoreThan);

    Meteor.call("editRolePreset", this.rolePreset);

    $mdDialog.hide();
  };

  this.hide = () => {
    $mdDialog.hide();
  };
  this.cancel = () => {
    $mdDialog.cancel();
  };
}
