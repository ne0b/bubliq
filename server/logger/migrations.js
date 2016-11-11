import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {Logger} from '/model/logger';
import {Migrations} from 'meteor/percolate:migrations';

const migrate010624 = () => {
  const OstrioLogger = new Mongo.Collection('ostrioMongoLogger');

  if (!OstrioLogger.find().count()) {
    return;
  }

  const logsList = OstrioLogger.find({}).fetch();

  const processNextRecord = () => {
    if (!logsList.length) {
      return;
    }

    const item = logsList.pop();
    const record = {
      type: Logger.TYPES[item.level] || Logger.TYPES.INFO,
      message: item.message,
      section: 'app',
      info: item.additional,
      createdAt: item.date,
    };

    Logger.upsert(item._id, {$set: record}, processNextRecord);
  };

  processNextRecord();
};


export default function () {
  Migrations.add({
    version: 10624,
    name: 'Wrap ostrio logger',
    up() {
      migrate010624();
    },
  });
}
