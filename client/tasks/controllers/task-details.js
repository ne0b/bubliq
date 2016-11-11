angular.module("bubliq").controller("TaskDetailsCtrl", function ($scope, $reactive, $state, $stateParams, froalaImages, $mdToast, $mdDialog, $mdMedia, $document, $filter, ifExists) {
  var lengthMoreThan = Match.Where(function (x) {
    check(x, String);
    return x.length > 1;
  });

  var ctrl = this;
  $reactive(this).attach($scope);

  this.taskReportMessage = '';

  this.reload = false;

  this.helpers({
    giventask() {
      this.getReactively('reload');

      let giventask = GivenTasks.findOne({_id:$stateParams.taskId});

      $state.title = giventask && giventask.task ? giventask.task.title : '';
      if (giventask && giventask.draft) {
        if (!this.taskReportMessageUpdated) {
          this.taskReportMessage = giventask.draft;
        }
        else {
          this.taskReportMessageUpdated = false;
        }
      }

      if (ifExists(giventask, "subscribers") && $scope.$root.currentUser) {
        this.userIsSubscribed = giventask.subscribers.includes($scope.$root.currentUser._id);
      }

      return giventask;
    }
  });

  ctrl.dataReady = false;
  const givenTaskData = this.subscribe('givenTaskData', () => {
    return [
      $stateParams.taskId
    ]
  }, {
    onReady: function () {
      $scope.$apply(() => {
        ctrl.dataReady = true;

        ctrl.getModerator = $scope.$root.currentUser ? Roles.userIsInRole($scope.$root.currentUser._id, ['moderator']) : false;
        ctrl.getTasksReview = $scope.$root.currentUser ? Roles.userIsInRole($scope.$root.currentUser._id, ['tasks-review']) : false;
      });
    },
    onStop: function (error) {
      if (error) {
        $scope.$apply(() => {
          ctrl.dataReady = 'error';
          ctrl.dataError = error;
        });
      }
    }
  });

  $scope.$on("$destroy", () => {
    givenTaskData.stop();
  });

  this.taskcomment = "";

  this.sendReport = function(event) {
    this.giventask.report = { message: this.taskReportMessage };
    check(this.giventask.report.message, lengthMoreThan);

    angular.element($document).find('textarea[froala="tasksDetails.froalaDesc"]').froalaEditor('edit.off');
    angular.element(event.target).parent().attr("disabled", "disabled");
    angular.element(event.target).attr("disabled", "disabled");

    Meteor.call('sendReport', $stateParams.taskId, this.giventask.report.message, function (error, result) {
      if(error){
        angular.element($document).find('textarea[froala="tasksDetails.froalaDesc"]').froalaEditor('edit.on');
        angular.element(event.target).parent().removeAttr("disabled");
        angular.element(event.target).removeAttr("disabled");
        $mdToast.show(
          $mdToast.simple()
            .textContent('Не удалось отправить отчет!')
            .position("bottom right")
            .hideDelay(3000)
        );
      } else {
        $mdToast.show(
          $mdToast.simple()
            .textContent('Отчет отправлен!')
            .position("bottom right")
            .hideDelay(3000)
        );
        angular.element($document).find('textarea[froala="tasksDetails.froalaDesc"]').froalaEditor('edit.on');
        angular.element(event.target).parent().removeAttr("disabled");
        angular.element(event.target).removeAttr("disabled");

        $scope.$apply(() => {
          ctrl.reportEditMode = false;
        });
      }
    });
  };

  this.reportEditMode = false;

  this.reportEditor = function() {
    if(this.reportEditMode){
      this.reportEditMode = false;
    } else {
    this.reportEditMode = true;
    }
  };

  this.sendComment = function(event) {
    check(ctrl.taskcomment, lengthMoreThan);

    angular.element($document).find('textarea[froala="tasksDetails.froalaComment"]').froalaEditor('edit.off');
    angular.element(event.target).parent().attr("disabled", "disabled");
    angular.element(event.target).attr("disabled", "disabled");

    Meteor.call('sendComment', $stateParams.taskId, ctrl.taskcomment, ctrl.inReplyToCommentId, function (error, result) {
      if(error){
        angular.element($document).find('textarea[froala="tasksDetails.froalaComment"]').froalaEditor('edit.on');
        angular.element(event.target).parent().removeAttr("disabled");
        angular.element(event.target).removeAttr("disabled");

        $mdToast.show(
          $mdToast.simple()
            .textContent('Не удалось отправить комментарий!')
            .position("bottom right")
            .hideDelay(3000)
        );
      } else {
        angular.element($document).find('textarea[froala="tasksDetails.froalaComment"]').froalaEditor('edit.on');
        angular.element(event.target).parent().removeAttr("disabled");
        angular.element(event.target).removeAttr("disabled");

        $mdToast.show(
          $mdToast.simple()
            .textContent('Комментарий отправлен!')
            .position("bottom right")
            .hideDelay(3000)
        );

        $scope.$apply(() => {
          ctrl.taskcomment = '';
          ctrl.inReplyToUser = null;
          ctrl.inReplyToCommentId = null;
        });
      }
    });
  };

  this.inReplyToCommentId = null;
  this.inReplyToUser = null;
  this.replyToComment = (user, messageId) => {
    this.inReplyToUser = user;
    this.inReplyToCommentId = messageId;

    this.setCommentAsActive(messageId);
  };

  this.removeReplyTo = () => {
    this.inReplyToUser = null;
    this.inReplyToCommentId = null;
  };

  this.inEditMode = [];

  this.openCommentEditor = (index) => {
    this.inEditMode[index] = !this.inEditMode[index];
  };

  this.activeComments = [];
  this.setCommentAsActive = (index) => {
    const prevValue = this.activeComments[index];
    this.activeComments = [];
    this.activeComments[index] = !prevValue;

    if (this.inEditMode.length > 0) this.inEditMode = [];
  }

  this.editComment = (editedComment, index, event) => {
    check(editedComment, lengthMoreThan);

    angular.element($document).find('textarea[froala="tasksDetails.froalaComment"]').froalaEditor('edit.off');
    angular.element(event.target).parent().attr("disabled", "disabled");
    angular.element(event.target).attr("disabled", "disabled");

    Meteor.call('editComment', $stateParams.taskId, index, editedComment, function (error, result) {
      if(error){
        angular.element($document).find('textarea[froala="tasksDetails.froalaComment"]').froalaEditor('edit.on');
        angular.element(event.target).parent().removeAttr("disabled");
        angular.element(event.target).removeAttr("disabled");
      } else {
        angular.element($document).find('textarea[froala="tasksDetails.froalaComment"]').froalaEditor('edit.on');
        angular.element(event.target).parent().removeAttr("disabled");
        angular.element(event.target).removeAttr("disabled");

        ctrl.inEditMode[index] = false;

        $scope.$apply;
      }
    });
  };

  this.deleteComment = (index) => {
    Meteor.call('deleteComment', $stateParams.taskId, index);

    this.setCommentAsActive(index);
  };

  this.like = (taskId) => {
    Meteor.call("likeGivenTask", taskId);
  };

  this.likeComment = (taskId, commentId) => {
    Meteor.call("likeTaskComment", taskId, commentId, () => {
      $scope.$apply(() => {
        ctrl.reload = !ctrl.reload;
      });
    });
  };

  this.subscribeToComments = (taskId) => {
    Meteor.call("subscribeUserToGivenTask", taskId, (err, result) => {
      const msg = err ? 'Не удалось подписаться!' : result === false ? 'Отписано!' : 'Подписано!';
      $mdToast.show(
        $mdToast.simple()
          .textContent(msg)
          .position("bottom right")
          .hideDelay(3000)
      );
    });
  };

  this.froalaDesc = froalaImages.froalaOptions("Введите отчет", ["bold", "italic", 'strikeThrough', 'insertImage', 'insertVideo', 'emoticons']);

  const saveDraft = () => {
    this.taskReportMessageUpdated = true;
    Meteor.call('sendReportDraft', this.giventask._id, this.taskReportMessage, (err, res) => {
      if (err) {
        $mdToast.show(
          $mdToast.simple()
            .textContent(`Не удалось сохранить черновик ${err.message || err}`)
            .position('bottom right')
            .hideDelay(3000)
        );
      }
    });
  };

  const saveDraftDelayed = _.debounce(saveDraft, 3000);

  this.froalaDesc['events'] = {
      'froalaEditor.contentChanged': (e) => {
        saveDraftDelayed();
      },
  };
  this.froalaComment = froalaImages.froalaOptions("Введите комментарий", ["bold", "italic", 'strikeThrough', 'insertImage', 'insertVideo', 'emoticons']);

  this.sentTime = function(time) {
    return moment(time).locale('ru').format("HH:mm DD.MM");
  };

  this.reportSentTime = function(time) {
    return moment(time).locale('ru').format("HH:mm DD.MM");
  };

  this.editShare = () => {
    $mdDialog.show({
      controller: ShareEditCtrl,
      controllerAs: 'shareEdit',
      templateUrl: 'client/tasks/views/tasks-edit-share-text.html',
      parent: angular.element(document.body),
      clickOutsideToClose: true,
      fullscreen: $mdMedia('sm'),
      locals: {
        text: ctrl.giventask.shareText || ctrl.giventask.report.message
      },
    })
    .then((answer) => {
      if (answer) {
        Meteor.call('editGivenTaskShareText', ctrl.giventask._id, answer);
      }
    });
  };

  this.rateTask = () => {
    if (!this.giventask.grade && this.giventask.grade !== 0)  {
      $mdToast.show(
        $mdToast.simple()
          .textContent('Укажите оценку!')
          .position('bottom right')
          .hideDelay(3000)
      );
      return;
    }

    Meteor.call('rateTask', $stateParams.taskId, this.giventask.grade, (error, result) => {
      if (error) {return}
      $mdToast.show(
        $mdToast.simple()
          .textContent('Оценено!')
          .position('bottom right')
          .hideDelay(3000)
      );
    });
  };
});

function ShareEditCtrl($scope, $reactive, $mdDialog, froalaImages, text) {
  $scope.text = text;

  $scope.froalaDesc = froalaImages.froalaOptions("Введите текст, который будет расшарен", ["bold", "italic", 'strikeThrough', 'insertImage', 'insertVideo', 'emoticons']);

  $scope.save = () => {
    $mdDialog.hide($scope.text);
  };

  $scope.hide = () => {
    $mdDialog.hide();
  };

  $scope.cancel = () => {
    $mdDialog.cancel();
  };
}
