angular.module("bubliq").controller("ProfileEditCtrl", function ($scope, $reactive, $state, $mdDialog, $mdToast, $document, TITLES, ifNotExists) {
  $state.title = TITLES.PROFILE_EDIT_CTRL;

  const lengthMoreThan = Match.Where(function (x) {
    check(x, String);
    return x.length > 1;
  });

  var profileEdit = this;
  $reactive(this).attach($scope);

  this.helpers({
    user() {
      return $scope.currentUser ? Meteor.users.findOne($scope.currentUser._id, {transform: transformUser}) : {};
    }
  });

  const userProfileData = this.subscribe('userProfileData', () => {
    return []
  }, {
    onReady: function () {
      this.dataReady = true;
      $scope.$apply();
    },
    onStop: function (error) {
      if (error) {
        this.dataReady = 'error';
        this.dataError = error;
        $scope.$apply();
      }
    }
  });

  $scope.$on("$destroy", () => {
    userProfileData.stop();
  });

  let tempProfile = _.pick(profileEdit.user.profile, 'name', 'lastname',
  'birthday', 'birthmonth', 'birthmonth', 'birthyear', 'country', 'town',
  'about', 'wishlist', 'socialLinks', 'tasksnotify',
  'pushTasksNotify', 'pushCommentsNotify', 'pushLikesNotify');

  profileEdit.userProfile = {
    name: tempProfile.name || '',
    lastname: tempProfile.lastname || '',
    birthday: tempProfile.birthday || 1,
    birthmonth: tempProfile.birthmonth || 1,
    birthyear: tempProfile.birthyear || 1940,
    country: tempProfile.country || '',
    town: tempProfile.town || '',
    about: tempProfile.about || '',
    wishlist: tempProfile.wishlist || [],
    socialLinks: tempProfile.socialLinks || [],
    tasksnotify: ifNotExists(tempProfile.tasksnotify),
    pushTasksNotify: ifNotExists(tempProfile.pushTasksNotify),
    pushCommentsNotify: ifNotExists(tempProfile.pushCommentsNotify),
    pushLikesNotify: ifNotExists(tempProfile.pushLikesNotify)
  }

  $scope.$watch('profileEdit.userProfile.birthday', function() {
    if(profileEdit.userProfile.birthday > 31){
      profileEdit.userProfile.birthday = 31;
    } else if (profileEdit.userProfile.birthday < 0) {
      profileEdit.userProfile.birthday = -profileEdit.userProfile.birthday;
    }
  });

  $scope.$watch('profileEdit.userProfile.birthmonth', function() {
    if(profileEdit.userProfile.birthmonth > 12){
      profileEdit.userProfile.birthmonth = 12;
    } else if (profileEdit.userProfile.birthmonth < 0) {
      profileEdit.userProfile.birthmonth = -profileEdit.userProfile.birthmonth;
    }
  });

  $scope.$watch('profileEdit.userProfile.birthyear', function() {
    if(profileEdit.userProfile.birthyear > moment().subtract(18, 'years').year()){
      profileEdit.userProfile.birthyear = moment().subtract(18, 'years').year();
    } else if (profileEdit.userProfile.birthyear < 0) {
      profileEdit.userProfile.birthyear = -profileEdit.userProfile.birthyear;
    }
  });

  profileEdit.setProfileAvatar = () => {
    profileEdit.user.profile.avatar = {};

    Meteor.call('setProfileAvatar', profileEdit.myCroppedImage, (err) => {
      if (err) {
        const emsg = err.error === 204
          ? 'Ошибка при вызове сервера, попробуйте очистить кэш браузера и обновить страницу'
          : `Ошибка при сохранении изображения: ${err.message || err.toString()}`;
        return $mdToast.show(
          $mdToast.simple()
            .textContent(emsg)
            .position('bottom right')
            .hideDelay(3000)
        );
      }

      Meteor.defer(() =>
        $scope.$apply(() => {
          profileEdit.cropImgSrc = undefined;
          profileEdit.myCroppedImage = '';
          profileEdit.avatarEdit = false;

          profileEdit.user.profile.avatar = Meteor.users.getAvatarProps(profileEdit.user._id, true);
        })
      );

      $mdToast.show(
        $mdToast.simple()
          .textContent('Изображение обновлено!')
          .position('bottom right')
          .hideDelay(3000)
      );
    });
  };

  profileEdit.updateProfile  = function () {
    profileEdit.addWish(false);
    const addSocialLink = profileEdit.addSocialLink(false);

    if (addSocialLink !== false) {
      Meteor.call('updateProfile', profileEdit.userProfile, function (error, result) {
        if(error){
          $mdToast.show(
            $mdToast.simple()
              .textContent('Не удалось сохранить!')
              .position("bottom right")
              .hideDelay(3000)
          );
        } else {
          $mdToast.show(
            $mdToast.simple()
              .textContent('Сохранено!')
              .position("bottom right")
              .hideDelay(3000)
          );
        }
      });
    }
  };

  profileEdit.addWish = function (call) {
    if (profileEdit.newWish) {
      check(profileEdit.newWish, lengthMoreThan);

      profileEdit.userProfile.wishlist = _.union([], profileEdit.userProfile.wishlist, [profileEdit.newWish]);
      profileEdit.newWish = '';

      if (call !== false)
        Meteor.call('updateProfileWishlist', profileEdit.userProfile.wishlist, function (error, result) {
          if(error){
          } else {
            $mdToast.show(
              $mdToast.simple()
                .textContent('Желание добавлено!')
                .position("bottom right")
                .hideDelay(3000)
            );
          }
        });
    }
  };

  profileEdit.addSocialLink = function (call) {
    if (profileEdit.newSocialLink) {
      const regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
      if (!regexp.test(profileEdit.newSocialLink)) {
        $mdToast.show(
          $mdToast.simple()
            .textContent('Введите корректную ссылку!')
            .position("bottom right")
            .hideDelay(3000)
        );
        return false;
      };

      profileEdit.userProfile.socialLinks = _.union([], profileEdit.userProfile.socialLinks, [profileEdit.newSocialLink]);
      profileEdit.newSocialLink = '';

      if (call !== false)
        Meteor.call('updateProfileSocialLinks', profileEdit.userProfile.socialLinks, function (error, result) {
          const msg = error ? 'Не удалось добавить ссылку' : 'Ссылка добавлена!';
          $mdToast.show(
            $mdToast.simple()
              .textContent(msg)
              .position("bottom right")
              .hideDelay(3000)
          );
        });
    }
  };

  profileEdit.removeSocialLink = function (index) {
    profileEdit.userProfile.socialLinks.splice(index, 1);

    Meteor.call('updateProfileSocialLinks', profileEdit.userProfile.socialLinks, function (error, result) {
      const msg = error ? 'Не удалось удалить ссылку' : 'Ссылка удалена!';
      $mdToast.show(
        $mdToast.simple()
          .textContent(msg)
          .position("bottom right")
          .hideDelay(3000)
      );
    });
  };

  profileEdit.removeWish = function (index) {
    profileEdit.userProfile.wishlist.splice(index, 1);

    Meteor.call('updateProfileWishlist', profileEdit.userProfile.wishlist, function (error, result) {
      if(error){
      } else {
        $mdToast.show(
          $mdToast.simple()
            .textContent('Желание удалено!')
            .position("bottom right")
            .hideDelay(3000)
        );
      }
    });
  };

  profileEdit.addWishOnEnter = function (event) {
    if(event.keyCode == 13){
      profileEdit.addWish();
    }
  };

  profileEdit.addSocialLinkOnEnter = function (event) {
    if(event.keyCode == 13){
      profileEdit.addSocialLink();
    }
  };

  profileEdit.addProfileImage = (files) => {
    if (files.length > 0) {
      let reader = new FileReader();

      reader.onload = (e) => {
        $scope.$apply(() => {
          profileEdit.cropImgSrc = e.target.result;
          profileEdit.myCroppedImage = '';
        });
      };

      reader.readAsDataURL(files[0]);
    }
    else {
      profileEdit.cropImgSrc = undefined;
    }
  };

  profileEdit.avatarEditable = () => {
    if(profileEdit.avatarEdit){
      profileEdit.avatarEdit = false;
    } else {
      profileEdit.avatarEdit = true;
    }
  };

  profileEdit.sendverificationemail  = function () {
    if($scope.currentUser && !$scope.currentUser.emails[0]['verified']){
      Meteor.call('sendVerificationEmail');
      var sent = $mdDialog.alert({
        content: 'Ссылка для активации учетной записи отправлена!',
        ok: 'Закрыть',
        clickOutsideToClose: true
      });
      $mdDialog
        .show( sent )
        .finally(function() {
          alert = undefined;
        });
    }
  };

  function transformUser(user) {
    if (user.profile) {
      user.profile.avatar = Meteor.users.getAvatarProps(user._id, true);
    }

    return user;
  }
});
