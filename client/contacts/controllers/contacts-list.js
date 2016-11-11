angular.module('bubliq').controller('ContactsListCtrl', ['$scope', '$reactive', '$state', '$filter', 'scrollLoader', 'appConsts', 'ifExists', '$timeout', 'immediateInterval', 'search', 'sort', 'keyDownNavigation', 'TITLES',
  function($scope, $reactive, $state, $filter, scrollLoader, appConsts, ifExists, $timeout, immediateInterval, search, sort, keyDownNavigation, TITLES) {
    $state.title = TITLES.CONTACTS_LIST_CTRL;

    var ctrl = this;
    $reactive(this).attach($scope);

    this.loadCount = 50;
    this.filterObject = 'stream';
    this.search = '';

    this.loadingUsers = false;
    this.canLoadMore = true;

    this.setSearch = _.debounce((searchValue) => {
      check(searchValue, String);
      this.search = searchValue;

      this.initiateUsersReload();
    }, 300);

    search.set(this.setSearch);

    this.changeFilter = (filterObject) => {
      check(filterObject, String);
      this.filterObject = filterObject;

      this.initiateUsersReload();
    };

    this.filterArray = [{
      title: "Мои потоки",
      value: "stream"
    }, {
      title: "Мои программы",
      value: "program"
    }, {
      title: "Все",
      value: "all"
    }];

    sort.set(this.changeFilter, this.filterArray);

    this.initiateUsersReload = () => {
      this.loadingUsers = false;
      this.canLoadMore = true;
      this.dataReady = false;
      this.topIndex = 0;

      this.infiniteUsers.numLoaded_ = 0;
      this.infiniteUsers.toLoad_ = ctrl.loadCount;
      this.usersCount = 0;

      this.loadMoreUsers(0, true);
    };

    this.users = [];

    this.infiniteUsers = {
      numLoaded_: 0,
      toLoad_: 50,
      getItemAtIndex: function(index) {
        if (index > this.numLoaded_ && this.toLoad_ < ctrl.infiniteUsersLength) this.fetchMoreItems_(index);

        return (ctrl.users && index < this.numLoaded_) ? ctrl.users[index] : null;
      },
      getLength: function() {
        return ctrl.infiniteUsersLength;
      },
      fetchMoreItems_: function(index) {
        if (this.toLoad_ < index && ctrl.loadingUsers === false && ctrl.canLoadMore) {
          this.toLoad_ += (ctrl.loadCount > ctrl.infiniteUsersLength - this.toLoad_) ?
                            ctrl.infiniteUsersLength - this.toLoad_ : ctrl.loadCount;

          ctrl.loadMoreUsers(this.numLoaded_);
        }
      }
    };

    this.loadMoreUsers = (skip, reset) => {
      if (reset) ctrl.users = [];
      ctrl.loadingUsers = true;

      ctrl.call("getMoreContacts", ctrl.filterObject, ctrl.search, ctrl.loadCount, skip, (err, result) => {
        ctrl.dataReady = true;

        if (result && ctrl.loadingUsers) {
          ctrl.canLoadMore = result.length - ctrl.loadCount > 0;
          ctrl.users = _.union([], ctrl.users, result.splice(0, ctrl.loadCount));

          ctrl.infiniteUsers.numLoaded_ = ctrl.users.length;
          ctrl.infiniteUsersLength = ctrl.canLoadMore ? ctrl.users.length+1 : ctrl.users.length;

          ctrl.loadingUsers = false;
        }
      });
    };

    this.lineCheck = (index) => {
      return ifExists(this.users[index + 1], "firstLetter") !==
        ifExists(this.users[index], "firstLetter")
        && ifExists(this.users[index], "firstLetter") !== '🿿';
    };

    this.startingLetterCheck = (index) => {
      return (index == 0 ||
        ifExists(this.users[index - 1], "firstLetter") !==
        ifExists(this.users[index], "firstLetter"))
        && ifExists(this.users[index], "firstLetter") !== '🿿';
    };
  }
]);
