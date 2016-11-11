angular.module('bubliq').controller('AnswersListCtrl', ['$scope', '$reactive', '$state', '$filter', '$mdToast', 'scrollLoader', 'immediateInterval', 'TITLES',
  function ($scope, $reactive, $state, $filter, $mdToast, scrollLoader, immediateInterval, TITLES) {
    $state.title = TITLES.ANSWERS_LIST_CTRL_TITLE;

    var ctrl = this;
    $reactive(this).attach($scope);

    this.activeAnswers = [];
    this.loadingLikes = [];
    this.likesLoaded = [];

    this.loadCount = 50;
    this.loadingAnswers = false;
    this.canLoadMore = true;

    this.answers = [];

    this.infiniteAnswers = {
      numLoaded_: 0,
      toLoad_: 0,
      getItemAtIndex: function(index) {
        if (index > this.numLoaded_ && this.toLoad_ < ctrl.infiniteAnswersLength) this.fetchMoreItems_(index);

        return (ctrl.answers && index < this.numLoaded_) ? ctrl.answers[index] : null;
      },
      getLength: function() {
        return ctrl.infiniteAnswersLength;
      },
      fetchMoreItems_: function(index) {
        if (this.toLoad_ < index && ctrl.loadingAnswers === false && ctrl.canLoadMore) {
          this.toLoad_ += (ctrl.loadCount > ctrl.infiniteAnswersLength - this.toLoad_) ?
                            ctrl.infiniteAnswersLength - this.toLoad_ : ctrl.loadCount;

          ctrl.loadMoreAnswers(this.numLoaded_);
        }
      }
    };

    this.loadMoreAnswers = (skip) => {
      skip = skip || 0;
      ctrl.loadingAnswers = true;

      ctrl.call("getMoreAnswers", ctrl.loadCount, skip, (err, result) => {
        ctrl.dataReady = true;

        if (result && ctrl.loadingAnswers) {
          ctrl.canLoadMore = result.length - ctrl.loadCount > 0;
          ctrl.answers = _.union([], ctrl.answers, result.splice(0, ctrl.loadCount));

          ctrl.infiniteAnswers.numLoaded_ = ctrl.answers.length;
          ctrl.infiniteAnswersLength = ctrl.canLoadMore ? ctrl.answers.length+5 : ctrl.answers.length;

          ctrl.loadingAnswers = false;
        }
      });
    };
    this.loadMoreAnswers();

    this.loadNewAnswers = (difference) => {
      ctrl.call("getNewAnswers", difference, (err, result) => {
        if (result) result.forEach((answer) => {
          if (!_.findWhere(ctrl.answers, { _id: answer._id })) ctrl.answers = _.union([], [answer], ctrl.answers);
        });
      });
    };

    this.helpers({
      answersCount() {
        const count = Updates.countFor({type: 'ANSWERS'});

        if (ctrl.dataReady && count > this.oldCount) this.loadNewAnswers(count-this.oldCount);

        this.oldCount = count;

        return count > 99 ? '99+' : count;
      }
    });

    this.showmore = {};
    this.showMore = (answerId) => {
      this.showmore[answerId] = this.showmore[answerId] ? false : true;
    };

    this.markAsRead = (answerId, index, read) => {
      Meteor.call('markAnswerAsRead', answerId, read, (error, result) => {
        if(!error){
          if (ctrl.answers[index]) ctrl.answers[index].read = read;

          const resp = read ? 'Ответ прочитан!' : 'Ответ не прочитан!';

          $mdToast.show(
            $mdToast.simple()
              .textContent(resp)
              .position("bottom right")
              .hideDelay(3000)
          );
        }
      });
    };

    this.markAllAsRead = () => {
      Meteor.call('markAllAnswersAsRead', (error, result) => {
        if(!error){
          ctrl.answers = ctrl.answers.map((answer) => {
            answer.read = true;
            return answer
          });

          $mdToast.show(
            $mdToast.simple()
              .textContent('Все ответы прочитаны!')
              .position("bottom right")
              .hideDelay(3000)
          );
        }
      });
    };
  }]);
