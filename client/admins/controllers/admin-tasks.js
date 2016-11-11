angular.module("bubliq").controller("AdminTasksCtrl",
['$scope', '$reactive', '$state', '$stateParams', '$timeout', '$mdToast', '$document', '$mdDialog', '$mdMedia', 'froalaImages', 'TITLES',
  function ($scope, $reactive, $state, $stateParams, $timeout, $mdToast, $document, $mdDialog, $mdMedia, froalaImages, TITLES) {
    var ctrl = this;

    $reactive(this).attach($scope);

    this.helpers({
      program() {
        let program = Programs.findOne({_id:$stateParams.programId})

        program.trialToken = Meteor.absoluteUrl(`trial?token=${program.trialToken}`);

        $state.title = `${TITLES.ADMIN_CTRL} » ${TITLES.ADMIN_PROGRAMS_CTRL}`

        $state.title += program ? ` » ${program.title}` : '';

        return program;
      },
      tasks() {
        return Tasks.find({programId:$stateParams.programId});
      },
      streams() {
        return Streams.find({programId:$stateParams.programId});
      }
    });

    ctrl.dataReady = false;
    const programEdit = this.subscribe('programEdit', () => {
      return [
        $stateParams.programId
      ]
    }, {
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
      programEdit.stop();
    });

    this.taskOrder = '+start';

    var lengthMoreThan = Match.Where(function (x) {
      check(x, String);
      return x.length > 5;
    });
    var valueMoreThan = Match.Where(function (x) {
      check(x, Number);
      return x > 0;
    });

    this.sortByType = function () {
      if(this.taskOrder == '+type'){
        this.taskOrder = '-type';
      } else {
        this.taskOrder = '+type';
      }
    };

    this.sortByStart = function () {
      if(this.taskOrder == '+start'){
        this.taskOrder = '-start';
      } else {
        this.taskOrder = '+start';
      }
    };

    this.sortByDuration = function () {
      if(this.taskOrder == '+duration'){
        this.taskOrder = '-duration';
      } else {
        this.taskOrder = '+duration';
      }
    };

    this.sortByEnd = function () {
      if(this.taskOrder == '+end'){
        this.taskOrder = '-end';
      } else {
        this.taskOrder = '+end';
      }
    };

    this.selectedIndex = 0;

    this.editProgram = function () {
      check(this.program.title, lengthMoreThan);

      Meteor.call('editProgram', this.program);

      $mdToast.show(
        $mdToast.simple()
          .textContent('Сохранено!')
          .position("bottom right")
          .hideDelay(3000)
      );
    };

    this.froalaDesc = froalaImages.froalaOptions('Введите описание');
    this.froalaGoals = froalaImages.froalaOptions('Введите цели');

    this.showEditTask = function(ev, task) {
      $mdDialog.show({
        controller: AdminTaskEditCtrl,
        templateUrl: 'client/admins/views/admin-edit-task-dialog.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose:true,
        fullscreen: $mdMedia('sm'),
        locals: {
          task: task,
          programId: this.program._id
        }
      });
    };

    this.showEditStream = function(ev, stream) {
      $mdDialog.show({
        controller: AdminStreamEditCtrl,
        templateUrl: 'client/admins/views/admin-edit-stream-dialog.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose:true,
        fullscreen: $mdMedia('sm'),
        locals: {
          stream: stream,
          programId: this.program._id
        }
      });
    };

    this.deleteTask = function (taskId) {
      $mdDialog.show({
        controller: DeleteTaskCtrl,
        controllerAs: 'deleteTask',
        templateUrl: 'client/admins/views/admin-delete-task-dialog.html',
        parent: angular.element(document.body),
        clickOutsideToClose:true,
        fullscreen: $mdMedia('sm'),
        locals: {
          taskId: taskId
        }
      })
      .then(function(answer) {
        if (answer) {
          $mdDialog.show({
            controller: DeleteTaskProgressCtrl,
            controllerAs: 'deleteProgress',
            templateUrl: 'client/admins/views/admin-delete-progress-dialog.html',
            parent: angular.element(document.body),
            fullscreen: $mdMedia('sm'),
            locals: {
              taskId: answer
            }
          });
        }
      }, function() {});
    };

    this.deleteStream = function (streamId) {
      $mdDialog.show({
        controller: DeleteStreamCtrl,
        controllerAs: 'deleteStream',
        templateUrl: 'client/admins/views/admin-delete-stream-dialog.html',
        parent: angular.element(document.body),
        clickOutsideToClose:true,
        fullscreen: $mdMedia('sm'),
        locals: {
          streamId: streamId
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
              streamId: answer
            }
          });
        }
      }, function() {});
    };
  }
]);

function DeleteTaskCtrl($scope, $mdDialog, taskId) {
  this.deleteTask = function () {
    $mdDialog.hide(taskId);
  };

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
}

function DeleteStreamCtrl($scope, $mdDialog, streamId) {
  this.deleteStream = function () {
    $mdDialog.hide(streamId);
  };

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
}

function DeleteProgressCtrl($scope, $mdDialog, $reactive, streamId) {
  const ctrl = this;

  ctrl.currentProgress = 10;
  ctrl.currentAction = `Удаляю поток и программу у пользователей.`;

  Meteor.call('deleteStreamStepOne', streamId, (err, result) => {
    if (result) {
      ctrl.currentProgress = result;
      ctrl.currentAction = `Удаляю чат. Удаляю ответы в чате.`

      Meteor.call('deleteStreamStepTwo', streamId, (err, result) => {
        if (result) {
          ctrl.currentProgress = result;
          ctrl.currentAction = `Удаляю лайки и ответы выданных заданий и комментариев.`

          Meteor.call('deleteStreamStepThree', streamId, (err, result) => {
            if (result) {
              ctrl.currentProgress = result;
              ctrl.currentAction = `Удаляю выданные задания.`

              Meteor.call('deleteStreamStepFour', streamId, (err, result) => {
                if (result) {
                  ctrl.currentProgress = result;
                  ctrl.currentAction = `Удаляю поток.`

                  Meteor.call('deleteStreamStepFive', streamId, (err, result) => {
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

  $scope.hide = function() {
    $mdDialog.hide();
  };
}

function DeleteTaskProgressCtrl($scope, $mdDialog, $reactive, taskId) {
  const ctrl = this;

  ctrl.currentProgress = 20;
  ctrl.currentAction = `Удаляю лайки и ответы выданных заданий и комментариев.`;

  Meteor.call('deleteTaskStepOne', taskId, (err, result) => {
    if (result) {
      ctrl.currentProgress = result;
      ctrl.currentAction = `Удаляю выданные задания.`

      Meteor.call('deleteTaskStepTwo', taskId, (err, result) => {
        if (result) {
          ctrl.currentProgress = result;
          ctrl.currentAction = `Удаляю задание.`

          Meteor.call('deleteTaskStepThree', taskId, (err, result) => {
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

  $scope.hide = function() {
    $mdDialog.hide();
  };
}

function AdminTaskEditCtrl($scope, $document, $mdDialog, task, programId, froalaImages) {
  if(!task){
    task = {
      _id: null,
      title: '',
      type: 'Обычное',
      desc: '',
      start: 1,
      duration: 1,
      maxgrade: 0,
      periodic: false,
      shareable: false,
      notStandardAdvertMessage: false,
      advertMessage: '',
      shortDesc: '',
      shareTitle: ''
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
    _id: task._id || null,
    title: task.title || '',
    type: task.type || 'Обычное',
    desc: task.desc || '',
    start: task.start || 1,
    duration: task.duration || 1,
    maxgrade: task.maxgrade || 0,
    periodic: task.periodic || false,
    shareable: task.shareable || false,
    notStandardAdvertMessage: task.notStandardAdvertMessage || false,
    advertMessage: task.advertMessage || '',
    shortDesc: task.shortDesc || '',
    shareTitle: task.shareTitle || ''
  }

  $scope.autorun(function() {
    $scope.newTaskValues.end = $scope.getReactively('newTaskValues.start') + $scope.getReactively('newTaskValues.duration');
  });

  $scope.editTask = function () {
    check($scope.newTaskValues.title, lengthMoreThan);
    check($scope.newTaskValues.duration, valueMoreThan);
    check($scope.newTaskValues.start, valueMoreThan);

    if(!task._id){
      Meteor.call('addTask', $scope.newTaskValues, programId);
    } else {
      Meteor.call('editTask', $scope.newTaskValues);
    }

    $mdDialog.hide($scope.newTaskValues);
  };

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  $scope.froalaDesc = froalaImages.froalaOptions('Введите описание');

}

function AdminStreamEditCtrl($scope, $document, $mdDialog, stream, programId) {
  const lengthMoreThan = Match.Where(function (x) {
    check(x, String);
    return x.length > 5;
  });

  $scope.newStreamValues = {
    title: '',
    start: moment().startOf('day').toDate()
  }

  $scope.editStream = function () {
    check($scope.newStreamValues.title, lengthMoreThan);

    Meteor.call('addStream', $scope.newStreamValues, programId);

    $mdDialog.hide($scope.newTaskValues);
  };

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
}
