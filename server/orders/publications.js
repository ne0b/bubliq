
import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';
import {Orders} from '/model/orders';

export default function () {
  Meteor.publish('payment', function () {
    return Orders.find({ customerNumber: this.userId });
  });
}
