angular.module("bubliq").controller("PaymentCtrl", ['$scope', '$reactive', '$state', 'TITLES', 'ifExists',
  function ($scope, $reactive, $state, TITLES, ifExists) {
    $state.title = TITLES.PAYMENT_CTRL;

    const vm = this;
    $reactive(vm).attach($scope);

    vm.helpers({
      fullOrder() {
        vm.getReactively('dataReady');

        let order = Orders.findOne({ customerNumber: $scope.currentUser._id, paid: false, trial: false, programId: this.currentProgramId });

        return order;
      },
      trialOrder() {
        vm.getReactively('dataReady');

        let order = Orders.findOne({ customerNumber: $scope.currentUser._id, paid: false, trial: true, programId: this.currentProgramId });

        return order;
      }
    });

    vm.dataReady = false;
    const payment = vm.subscribe('payment');

    $scope.$on("$destroy", () => {
      payment.stop();
    });

    Meteor.call('createPaymentOrders', function (error, result) {
      if(!error){
        $scope.$apply(() => {
          vm.paymentProgram = result;

          vm.paymentProgram.properties.startDate = moment(vm.paymentProgram.properties.startDate).format('DD.MM');

          const { properties } = vm.paymentProgram;

          vm.merchantId = Meteor.settings.public.MERCHANT_ID;
          vm.simMode = Meteor.settings.public.MERCHANT_TEST;
          vm.currentProgramId = vm.paymentProgram._id;

          vm.hasCurrentTrialProgram = _.findWhere($scope.$root.currentUser.trialPrograms, { _id: vm.currentProgramId, free: false });
          vm.hasCurrentFreeTrialProgram = _.findWhere($scope.$root.currentUser.trialPrograms, { _id: vm.currentProgramId, free: true });

          vm.standartFormText = vm.hasCurrentFreeTrialProgram ?
                                "Р оплатить игру" :
                                vm.hasCurrentTrialProgram ?
                                "Р за всю игру" :
                                "Р за 6 недель";

          const pre = new Date() > new Date(properties.date0) && new Date() < new Date(properties.date1);
          const sur1 = new Date() > new Date(properties.date1) && new Date() < new Date(properties.date2);
          const sur2 = new Date() > new Date(properties.date2) && new Date() < new Date(properties.date3);

          vm.standartPrice = pre && !vm.hasCurrentTrialProgram ? properties.priceBase1 :
                             pre && vm.hasCurrentTrialProgram ? properties.priceTrial1Pre :
                             sur1 && !vm.hasCurrentTrialProgram && !vm.hasCurrentFreeTrialProgram ? properties.priceBase2 :
                             sur1 && vm.hasCurrentFreeTrialProgram ? properties.priceTrial0Sur1 :
                             sur1 && vm.hasCurrentTrialProgram &&
                             (vm.hasCurrentTrialProgram.addedAt > new Date(properties.date0) &&
                              vm.hasCurrentTrialProgram.addedAt < new Date(properties.date1)) ? properties.priceTrial1Sur1 :
                             sur1 && vm.hasCurrentTrialProgram ? properties.priceTrial2Sur1 :
                             sur2 && vm.hasCurrentTrialProgram &&
                             (vm.hasCurrentTrialProgram.addedAt > new Date(properties.date0) &&
                              vm.hasCurrentTrialProgram.addedAt < new Date(properties.date1)) ? properties.priceTrial1Sur2 :
                             sur2 && vm.hasCurrentTrialProgram ? properties.priceTrial2Sur2 : 4280;
          vm.trialPrice = pre ? properties.priceTrial1 : sur1 ? properties.priceTrial2 : 347;
          vm.trialSurPrice = pre ? properties.priceTrial1Pre : sur1 ? properties.priceTrial2Sur1 : 3933;

          vm.dataReady = true;
        });
      } else{
        $scope.$apply(() => {
          vm.dataError = error.error;
        });
      }
    });
  }
]);
