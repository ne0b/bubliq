angular.module("bubliq").controller("MentorUsersCtrl", ['$scope', '$reactive', '$state', 'scrollLoader', 'TITLES', 'search', 'immediateInterval',
  function ($scope, $reactive, $state, scrollLoader, TITLES, search, immediateInterval) {
    $state.title = `${TITLES.MENTOR_CTRL} » ${TITLES.MENTOR_USERS_CTRL}`;
    var ctrl = this;
    $reactive(this).attach($scope);

    this.dataReady = true;
    this.loadCount = 50;
    this.mentorId = $scope.currentUser._id;
    this.search = '';

    this.loadingUsers = false;

    this.setSearch = (searchValue) => {
      check(searchValue, String);
      this.search = searchValue;

      this.initiateUsersReload();
    };
    search.set(this.setSearch);

    this.initiateUsersReload = () => {
      this.loadingUsers = false;
      this.dataReady = false;
      this.topIndex = 0;

      this.infiniteUsers.numLoaded_ = 0;
      this.infiniteUsers.toLoad_ = ctrl.loadCount;
      this.usersCount = 0;

      immediateInterval.set(this.loadUsersCount, 5000);
      this.loadMoreUsers(0, true);
    };

    this.users = [];

    this.infiniteUsers = {
      numLoaded_: 0,
      toLoad_: 50,
      getItemAtIndex: function(index) {
        if (index > this.numLoaded_ && this.toLoad_ < ctrl.usersCount) this.fetchMoreItems_(index);

        return (ctrl.users && index < this.numLoaded_) ? ctrl.users[index] : null;
      },
      getLength: function() {
        return ctrl.usersCount;
      },
      fetchMoreItems_: function(index) {
        if (this.toLoad_ < index && ctrl.loadingUsers === false) {
          this.toLoad_ += (ctrl.loadCount > ctrl.usersCount - this.toLoad_) ?
                            ctrl.usersCount - this.toLoad_ : ctrl.loadCount;

          ctrl.loadMoreUsers(this.numLoaded_);
        }
      }
    };

    this.loadMoreUsers = (skip, reset) => {
      if (reset) ctrl.users = [];
      ctrl.loadingUsers = true;

      ctrl.call("getMoreMentorUsers", ctrl.search, ctrl.mentorId, ctrl.loadCount, skip, (err, result) => {
        ctrl.dataReady = true;

        if (result && ctrl.loadingUsers) {
          ctrl.users = _.union(ctrl.users, result);

          ctrl.infiniteUsers.numLoaded_ = ctrl.infiniteUsers.toLoad_;

          ctrl.loadingUsers = false;
        }
      });
    };
    this.loadMoreUsers(0, true);

    this.loadUsersCount = () => {
      ctrl.call("getMentorUsersCount", ctrl.search, ctrl.mentorId, (err, result) => {
        if (result) {
          ctrl.usersCount = result;
        }
      });
    };
    immediateInterval.set(this.loadUsersCount, 5000);

    this.showOwn = () => {
      this.mentorId = $scope.currentUser._id;

      this.initiateUsersReload();
    };
    this.showAll = () => {
      this.mentorId = null;

      this.initiateUsersReload();
    };
  }
]);
