import {Mongo} from 'meteor/mongo';

const Orders = new Mongo.Collection('orders');

if (global || window) {
  const g = (global || window);
  g.Orders = Orders;
}

export {Orders};
