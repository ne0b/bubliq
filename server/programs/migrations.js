import {Meteor} from 'meteor/meteor';
import {Migrations} from 'meteor/percolate:migrations';

import {Programs} from '/model/programs';

// 01.06.32 set params to current programs
const migrateAt10632 = () => {
  Programs.update("thNTCCEoPqvncdpcx", {
    $set: {
      properties: {
        isCurrent: true,
        isNext: false,
        startDate: "2016-10-01T00:00:00+03:00",
        priceBase1: 3490,
        priceBase2: 4280,
        date0: "2016-07-19T00:00:00+03:00",
        date1: "2016-10-02T17:00:00+03:00",
        date2: "2016-10-10T23:59:59+03:00",
        date3: "2016-10-12T00:00:00+03:00",
        dateTrial0: "",
        priceTrial0: 0,
        priceTrial0Sur1: 4350,
        priceTrial1: 347,
        priceTrial1Pre: 3143,
        priceTrial1Sur1: 3680,
        priceTrial1Sur2: 3933,
        priceTrial2: 347,
        priceTrial2Sur1: 3933,
        priceTrial2Sur2: 3933
      }
    }
  });

  Programs.update("h5XprRqY2W44NDhwd", {
    $set: {
      properties: {
        isCurrent: false,
        isNext: true,
        startDate: "2016-11-26T00:00:00+03:00",
        priceBase1: 3490,
        priceBase2: 4280,
        date0: "2016-10-12T00:00:00+03:00",
        date1: "2016-11-23T00:00:00+03:00",
        date2: "2016-11-30T00:00:00+03:00",
        date3: "2016-12-07T00:00:00+03:00",
        dateTrial0: "2016-11-23T00:00:00+03:00",
        priceTrial0: 0,
        priceTrial0Sur1: 4350,
        priceTrial1: 347,
        priceTrial1Pre: 3143,
        priceTrial1Sur1: 3680,
        priceTrial1Sur2: 3933,
        priceTrial2: 347,
        priceTrial2Sur1: 3933,
        priceTrial2Sur2: 3933
      }
    }
  });
};

export default function () {
  // 01.06.32
  Migrations.add({
    version: 10632,
    name: 'set params to current programs',
    up: migrateAt10632
  });
}
