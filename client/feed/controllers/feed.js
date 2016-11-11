angular.module("bubliq").controller("FeedCtrl", function ($scope, $reactive, $state, immediateInterval, TITLES) {
  $state.title = TITLES.FEED_CTRL_TITLE;

  const ctrl = this;
  $reactive(this).attach($scope);

  this.loadCount = 50;
  this.loadingFeed = false;

  this.feed = [];
  this.feedCount = 0;

  this.infiniteFeed = {
    numLoaded_: 0,
    toLoad_: 0,
    getItemAtIndex: function(index) {
      if (index > this.numLoaded_ && this.toLoad_ < ctrl.feedCount) this.fetchMoreItems_(index);

      return (ctrl.feed && index < this.numLoaded_) ? ctrl.feed[index] : null;
    },
    getLength: function() {
      return ctrl.feedCount;
    },
    fetchMoreItems_: function(index) {
      if (this.toLoad_ < index && ctrl.loadingFeed === false) {
        this.toLoad_ += (ctrl.loadCount > ctrl.feedCount - this.toLoad_) ?
                          ctrl.feedCount - this.toLoad_ : ctrl.loadCount;

        ctrl.loadMoreFeed(this.numLoaded_);
      }
    }
  };

  this.loadMoreFeed = (skip) => {
    ctrl.loadingFeed = true;

    ctrl.call("getMoreFeed", ctrl.loadCount, skip, (err, result) => {
      ctrl.dataReady = true;

      if (result && ctrl.loadingFeed) {
        ctrl.feed = _.union(ctrl.feed, result);

        ctrl.infiniteFeed.numLoaded_ = ctrl.infiniteFeed.toLoad_;

        ctrl.loadingFeed = false;
      }
    });
  };

  this.loadFeedCount = () => {
    this.call("getFeedCount", (err, result) => {
      if (result) {
        if (ctrl.feedCount && result > ctrl.feedCount)
                ctrl.loadNewFeed(result - ctrl.feedCount);

        ctrl.feedCount = (result > ctrl.feedCount) ? result : ctrl.feedCount;
      } else if (result === 0) ctrl.dataReady = true;
    });
  };

  this.loadNewFeed = (difference) => {
    ctrl.call("getNewFeed", difference, (err, result) => {
      if (result) {
        ctrl.feed = result.concat(ctrl.feed);
      }
    });
  };

  immediateInterval.set(this.loadFeedCount, 5000);
});
