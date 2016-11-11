angular.module("bubliq").controller("AdminStreamsCtrl",
['$scope', '$reactive', '$state', '$stateParams', '$timeout', '$mdToast', '$document', '$mdDialog', '$mdMedia', 'froalaImages', 'TITLES',
  function ($scope, $reactive, $state, $stateParams, $timeout, $mdToast, $document, $mdDialog, $mdMedia, froalaImages, TITLES) {
    var ctrl = this;

    $reactive(this).attach($scope);

    this.searchCT = '';

    this.helpers({
      stream() {
        let stream = Streams.findOne({ _id: $stateParams.streamId })

        $state.title = `${TITLES.ADMIN_CTRL} » ${TITLES.ADMIN_STREAMS_CTRL}`

        $state.title += stream ? ` » ${stream.title}` : '';

        if (stream) stream.coordinator = Meteor.users.findOne(stream.coordinator, { transform: setFullName });

        if (stream) stream.trainer = Meteor.users.findOne(stream.trainer, { transform: setFullName });

        return stream;
      },
      stars() {
        return Stars.find({ streamId: $stateParams.streamId });
      },
      coordinators() {
        const coordinatorRole = Rolespresets.findOne({ "title": "Координатор" }) || {};

        return Meteor.users.find({ "profile.role": coordinatorRole._id }, { transform: setFullName });
      },
      trainers() {
        const trainerRole = Rolespresets.findOne({ "title": "Тренер" }) || {};

        return Meteor.users.find({ "profile.role": trainerRole._id }, { transform: setFullName });
      },
      captains() {
        const captainRole = Rolespresets.findOne({ "title": "Капитан" }) || {};

        return Meteor.users.find({ "profile.role": captainRole._id }, { transform: setFullName });
      }
    });

    function setFullName(user) {
      if (user) user.fullname = `${user.profile.name} ${user.profile.lastname} ${user.emails[0].address}`;

      return user;
    }

    ctrl.dataReady = false;
    const streamEdit = this.subscribe('streamEdit', () => {
      return [
        $stateParams.streamId
      ]
    }, {
      onReady: function () {
        $scope.$apply(() => {
          ctrl.dataReady = true;
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
      streamEdit.stop();
    });

    const lengthMoreThan = Match.Where(function (x) {
      check(x, String);
      return x.length > 5;
    });
    const valueMoreThan = Match.Where(function (x) {
      check(x, Number);
      return x > 0;
    });

    this.showEditStar = (ev, star) => {
      $mdDialog.show({
        controller: AdminStarEditCtrl,
        templateUrl: 'client/admins/views/admin-edit-star-dialog.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose: true,
        fullscreen: $mdMedia('sm'),
        locals: {
          star: angular.copy(star),
          streamId: this.stream._id,
          captains: this.captains
        }
      })
      .then((answer) => {
        if (answer) {
          answer.captain = answer.captain ? answer.captain._id : null;

          if(!answer._id){
            Meteor.call('addStar', answer, (err) => {
              const msg = err ? 'Не удалось сохранить' : 'Сохранено!';
              $mdToast.show(
                $mdToast.simple()
                  .textContent(msg)
                  .position("bottom right")
                  .hideDelay(3000)
              );
            });
          } else {
            Meteor.call('editStar', answer, (err) => {
              const msg = err ? 'Не удалось сохранить' : 'Сохранено!';
              $mdToast.show(
                $mdToast.simple()
                  .textContent(msg)
                  .position("bottom right")
                  .hideDelay(3000)
              );
            });
          }
        }
      });
    };

    this.deleteStar = (starId) => {
      Meteor.call('removeStar', starId);
    };

    this.searchCoordinator = (searchText) => {
      return (searchText === "+") ? this.coordinators : _.filter(this.coordinators, (coordinator) => {
        return ~coordinator.profile.name.toLowerCase().indexOf(searchText.toLowerCase());
      });
    };

    this.searchTrainer = (searchText) => {
      return (searchText === "+") ? this.trainers : _.filter(this.trainers, (trainer) => {
        return ~trainer.profile.name.toLowerCase().indexOf(searchText.toLowerCase());
      });
    };

    this.editStream = () => {
      this.stream.coordinator = this.stream.coordinator ? this.stream.coordinator._id : null;
      this.stream.trainer = this.stream.trainer ? this.stream.trainer._id : null;

      Meteor.call('editStream', this.stream, (err, result) => {
        if (!err) {
          $mdToast.show(
            $mdToast.simple()
              .textContent('Сохранено!')
              .position("bottom right")
              .hideDelay(3000)
          );
        }
      });

      this.stream.coordinator = Meteor.users.findOne(this.stream.coordinator, { transform: setFullName });
      this.stream.trainer = Meteor.users.findOne(this.stream.trainer, { transform: setFullName });
    };
  }
]);

function AdminStarEditCtrl($scope, $reactive, $document, $mdDialog, $mdToast, star, streamId, captains) {
  const lengthMoreThan = Match.Where(function (x) {
    check(x, String);
    return x.length > 5;
  });

  const stream = Streams.findOne(streamId);

  const program = Programs.findOne(stream.programId);

  const streamsIds = Streams.find({ programId: program._id }).fetch().map((stream) => {
    return stream._id
  });

  const starsIds = Stars.find({ streamId: { $in: streamsIds } }).fetch().map((star) => {
    return star._id
  });

  $scope.notAssignedCaptains = _.filter(captains, (captain) => {
    return _.difference(starsIds, captain.captainInStars).length === starsIds.length;
  });
  $scope.assignedCaptains = _.filter(captains, (captain) => {
    return _.difference(starsIds, captain.captainInStars).length !== starsIds.length;
  });

  $scope.star = star || {};
  $scope.star.streamId = streamId;

  if ($scope.star) $scope.star.captain = Meteor.users.findOne($scope.star.captain, { transform: setFullName });

  function setFullName(user) {
    if (user) user.fullname = `${user.profile.name} ${user.profile.lastname} ${user.emails[0].address}`;

    return user;
  }

  $scope.searchCap = (searchText) => {
    return (searchText === "+") ? captains : _.filter(captains, (captain) => {
      return ~captain.fullname.toLowerCase().indexOf(searchText.toLowerCase());
    });
  };

  $scope.editStar = function () {
    check($scope.star.title, lengthMoreThan);

    $mdDialog.hide($scope.star);
  };

  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
}
