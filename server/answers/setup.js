// import {Meteor} from 'meteor/meteor';
import {Answers} from '/model/answers';

export default function () {
  Answers._ensureIndex({userId: 1}, {background: true});
  Answers._ensureIndex({fromUserId: 1}, {background: true});
  Answers._ensureIndex({taskId: 1}, {background: true, sparse:true});
  Answers._ensureIndex({commentId: 1}, {background: true, sparse:true});
}
