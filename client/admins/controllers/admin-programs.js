angular.module("bubliq").controller("AdminProgramsCtrl",
['$scope', '$reactive', '$state', '$timeout', '$mdToast', '$document', '$mdDialog', '$mdMedia', 'froalaImages', 'TITLES',
  function ($scope, $reactive, $state, $timeout, $mdToast, $document, $mdDialog, $mdMedia, froalaImages, TITLES) {
    $state.title = `${TITLES.ADMIN_CTRL} » ${TITLES.ADMIN_PROGRAMS_CTRL}`;

    var adminPrograms = this;

    $reactive(adminPrograms).attach($scope);

    adminPrograms.dataReady = false;
    const programTitles = adminPrograms.subscribe('programTitles', () => {}, {
      onReady: function () {
        adminPrograms.dataReady = true;
        $scope.$apply();
      },
      onStop: function (error) {
        if (error) {
          adminPrograms.dataReady = 'error';
          adminPrograms.dataError = error;
          $scope.$apply();
        }
      }
    });

    $scope.$on("$destroy", () => {
      programTitles.stop();
    });

    adminPrograms.helpers({
      programs() {
        return Programs.find({}, {fields: {title: 1}});
      }
    });

    var lengthMoreThan = Match.Where(function (x) {
      check(x, String);
      return x.length > 5;
    });
    var valueMoreThan = Match.Where(function (x) {
      check(x, Number);
      return x > 0;
    });

    adminPrograms.taskOrder = '+start';

    adminPrograms.sortByType = function () {
      if(adminPrograms.taskOrder == '+type'){
        adminPrograms.taskOrder = '-type';
      } else {
        adminPrograms.taskOrder = '+type';
      }
    };

    adminPrograms.sortByStart = function () {
      if(adminPrograms.taskOrder == '+start'){
        adminPrograms.taskOrder = '-start';
      } else {
        adminPrograms.taskOrder = '+start';
      }
    };

    adminPrograms.sortByDuration = function () {
      if(adminPrograms.taskOrder == '+duration'){
        adminPrograms.taskOrder = '-duration';
      } else {
        adminPrograms.taskOrder = '+duration';
      }
    };

    adminPrograms.sortByEnd = function () {
      if(adminPrograms.taskOrder == '+end'){
        adminPrograms.taskOrder = '-end';
      } else {
        adminPrograms.taskOrder = '+end';
      }
    };

    adminPrograms.selectedIndex = 0;

    adminPrograms.newProgram = {
      title: '',
      desc: '',
      goals: '',
      tasks: [],
      streams: [],
      free: false
    };

    adminPrograms.deleteTask = function (task) {
      adminPrograms.newProgram.tasks.splice(adminPrograms.newProgram.tasks.indexOf(task), 1);
    };

    adminPrograms.deleteStream = function (stream) {
      adminPrograms.newProgram.streams.splice(adminPrograms.newProgram.streams.indexOf(stream), 1);
    };

    adminPrograms.addProgram = function () {
      check(adminPrograms.newProgram.title, lengthMoreThan);

      Meteor.call('addProgram', adminPrograms.newProgram, JSON.parse(angular.toJson(adminPrograms.newProgram.tasks)), JSON.parse(angular.toJson(adminPrograms.newProgram.streams)));

      $mdToast.show(
        $mdToast.simple()
          .textContent('Сохранено!')
          .position("bottom right")
          .hideDelay(3000)
      );

      adminPrograms.newProgram = {
        title: '',
        desc: '',
        goals: '',
        tasks: [],
        streams: [],
        free: false
      };

      adminPrograms.selectedIndex = 0;
    };

    adminPrograms.deleteProgram = function (programId) {
      $mdDialog.show({
        controller: DeleteProgramCtrl,
        controllerAs: 'deleteProgram',
        templateUrl: 'client/admins/views/admin-delete-program-dialog.html',
        parent: angular.element(document.body),
        clickOutsideToClose:true,
        fullscreen: $mdMedia('sm'),
        locals: {
          programId: programId
        }
      })
      .then(function(answer) {
        if (answer) {
          $mdDialog.show({
            controller: DeleteProgressCtrl,
            controllerAs: 'deleteProgress',
            templateUrl: 'client/admins/views/admin-delete-progress-dialog.html',
            parent: angular.element(document.body),
            fullscreen: $mdMedia('sm'),
            locals: {
              programId: answer
            }
          });
        }
      }, function() {});
    };

    adminPrograms.froalaDesc = froalaImages.froalaOptions('Введите описание');
    adminPrograms.froalaGoals = froalaImages.froalaOptions('Введите цели');

    adminPrograms.showEditTask = function(ev, task) {
      $mdDialog.show({
        controller: AdminTaskEditCtrl,
        templateUrl: 'client/admins/views/admin-edit-task-dialog.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose:true,
        fullscreen: $mdMedia('sm'),
        locals: {
          task: task
        }
      })
      .then(function(answer) {
        if(answer){
          if(adminPrograms.newProgram.tasks.indexOf(task) === -1){
            adminPrograms.newProgram.tasks.push(answer);
          } else {
            adminPrograms.newProgram.tasks[adminPrograms.newProgram.tasks.indexOf(task)] = answer;
          }
        }
      }, function() {});
    };

    adminPrograms.showEditStream = function(ev, stream) {
      $mdDialog.show({
        controller: AdminStreamEditCtrl,
        templateUrl: 'client/admins/views/admin-edit-stream-dialog.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose:true,
        fullscreen: $mdMedia('sm'),
        locals: {
          stream: stream
        }
      })
      .then(function(answer) {
        if(answer){
          if(adminPrograms.newProgram.streams.indexOf(stream) === -1){
            adminPrograms.newProgram.streams.push(answer);
          } else {
            adminPrograms.newProgram.streams[adminPrograms.newProgram.streams.indexOf(stream)] = answer;
          }
        }
      }, function() {});
    };

    adminPrograms.copyProgram = function (programId) {
      $mdDialog.show({
        controller: CopyProgramCtrl,
        controllerAs: 'copyProgram',
        templateUrl: 'client/admins/views/admin-copy-program-dialog.html',
        parent: angular.element(document.body),
        clickOutsideToClose:true,
        fullscreen: $mdMedia('sm'),
        locals: {
          programId: programId
        }
      });
    };
  }
]);

function CopyProgramCtrl($scope, $mdDialog, programId) {
  this.copyProgram = function () {
    Meteor.call('copyProgram', programId);
    $mdDialog.hide();
  };

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
}

function DeleteProgramCtrl($scope, $mdDialog, programId) {
  this.deleteProgram = function () {
    $mdDialog.hide(programId);
  };

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
}

function DeleteProgressCtrl($scope, $mdDialog, $reactive, programId) {
  const ctrl = this;

  ctrl.currentProgress = 10;
  ctrl.currentAction = `Удаляю потоки и программу у пользователей.<br />
                        Удаляю чаты. Удаляю ответы в чатах.`;

  Meteor.call('deleteProgramStepOne', programId, (err, result) => {
    if (result) {
      ctrl.currentProgress = result;
      ctrl.currentAction = `Удаляю лайки и ответы выданных заданий и комментариев.`

      Meteor.call('deleteProgramStepTwo', programId, (err, result) => {
        if (result) {
          ctrl.currentProgress = result;
          ctrl.currentAction = `Удаляю задания.`

          Meteor.call('deleteProgramStepThree', programId, (err, result) => {
            if (result) {
              ctrl.currentProgress = result;
              ctrl.currentAction = `Удаляю выданные задания.`

              Meteor.call('deleteProgramStepFour', programId, (err, result) => {
                if (result) {
                  ctrl.currentProgress = result;
                  ctrl.currentAction = `Удаляю потоки.`

                  Meteor.call('deleteProgramStepFive', programId, (err, result) => {
                    if (result) {
                      ctrl.currentProgress = result;
                      ctrl.currentAction = `Удаляю программу.`

                      Meteor.call('deleteProgramStepSix', programId, (err, result) => {
                        if (result) {
                          ctrl.currentProgress = result;
                          ctrl.currentAction = `Удаление завершено!`

                          ctrl.done = true;
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });

  $scope.hide = function() {
    $mdDialog.hide();
  };
}

function AdminTaskEditCtrl($scope, $document, $mdDialog, task) {
  if(!task){
    task = {
      title: '',
      type: 'Обычное',
      desc: '',
      start: 1,
      duration: 1,
      maxgrade: 0,
      periodic: false
    }
  }

  var lengthMoreThan = Match.Where(function (x) {
    check(x, String);
    return x.length > 5;
  });
  var valueMoreThan = Match.Where(function (x) {
    check(x, Number);
    return x > 0;
  });

  $scope.types = [
    'Обычное',
    'Шеринг',
    'Цели',
    'Привычки'
  ]

  $scope.newTaskValues = {
    title: task.title,
    type: task.type,
    desc: task.desc,
    start: task.start,
    duration: task.duration,
    maxgrade: task.maxgrade,
    periodic: task.periodic
  }

  $scope.autorun(function() {
    $scope.newTaskValues.end = $scope.getReactively('newTaskValues.start') + $scope.getReactively('newTaskValues.duration');
  });

  $scope.editTask = function () {
    check($scope.newTaskValues.title, lengthMoreThan);
    check($scope.newTaskValues.duration, valueMoreThan);

    $mdDialog.hide($scope.newTaskValues);
  };

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $scope.froalaDesc = {
    inlineMode: false,
    placeholder: "Введите описание",
  }
}

function AdminStreamEditCtrl($scope, $document, $mdDialog, stream) {
  if(!stream){
    stream = {
      title: '',
      start: moment().startOf('day').toDate()
    }
  }

  var lengthMoreThan = Match.Where(function (x) {
    check(x, String);
    return x.length > 5;
  });
  var valueMoreThan = Match.Where(function (x) {
    check(x, Number);
    return x > 0;
  });

  $scope.newStreamValues = {
    title: stream.title,
    start: stream.start
  }

  $scope.editStream = function () {
    check($scope.newStreamValues.title, lengthMoreThan);

    $mdDialog.hide($scope.newStreamValues);
  };

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
}
