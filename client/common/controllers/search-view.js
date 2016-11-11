angular.module('bubliq').controller('SearchViewCtrl', ['$scope', '$reactive', '$timeout', '$state', '$document', 'search', 'focus', 'keyDownNavigation',
  function($scope, $reactive, $timeout, $state, $document, search, focus, keyDownNavigation) {
    let ctrl = this;
    $reactive(this).attach($scope);

    this.searchIcon = "action:ic_search_24px";

    this.navigationCallback = keyDownNavigation.navigationCallback;

    this.toggle = () => {
      if (keyDownNavigation.navigationCallback) {
        this.navigationCallback = keyDownNavigation.navigationCallback;
        keyDownNavigation.set(false);
      } else {
        keyDownNavigation.set(this.navigationCallback);
      }

      focus('searchviewid');
      $state.showTitle = !$state.showTitle;

      this.showSearch = !this.showSearch;
      this.searchIcon = this.searchIcon == "action:ic_search_24px" ?
                  "navigation:ic_close_24px" : "action:ic_search_24px";

      search.send('');
    };

    this.search = (event) => {
      if(!ctrl.searchTimeout && !checkKeyCode(event.keyCode)) {
        ctrl.searchTimeout = $timeout(() => {
          search.send(event.target.value.trim());
          ctrl.searchTimeout = null;
        }, 300);
      }
    };

    function checkKeyCode(code){
      const invalidCodes = [17, 91, 18, 16, 20, 93, 37, 38, 39, 40, 27];

      return invalidCodes.includes(code);
    }
  }
]);
