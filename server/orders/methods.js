
import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';

import {Orders} from '/model/orders';

export default function () {
  Meteor.methods({
    createPaymentOrders: function () {
      const currentUser = Meteor.user();

      if(!currentUser || !currentUser.profile){
        throw new Meteor.Error('Неверные данные!');
      }

      const sender_email = currentUser.emails[0].address;
      const paymentProgram = Programs.getPaymentProgram();

      const fullOrder = Orders.findOne({ customerNumber: this.userId,
                                         programId: paymentProgram._id,
                                         trial: false });

      if (!fullOrder) {
        Orders.insert({
          orderNumber: incrementCounter('orderIds', 'orderId'),
          customerNumber: this.userId,
          sender_email,
          programId: paymentProgram._id,
          paid: false,
          trial: false
        });
      }

      const trialOrder = Orders.findOne({ customerNumber: this.userId,
                                          programId: paymentProgram._id,
                                          trial: true });

      if (!trialOrder) {
        Orders.insert({
          orderNumber: incrementCounter('orderIds', 'orderId'),
          customerNumber: this.userId,
          sender_email,
          programId: paymentProgram._id,
          paid: false,
          trial: true
        });
      }

      return paymentProgram;
    }
  });
}
