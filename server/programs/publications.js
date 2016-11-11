import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';

export default function () {
  Meteor.publish("programTitles", function(){
    return Programs.find({}, {fields: {title: 1, free: 1}});
  });

  Meteor.publish("programEdit", function(programId){
    check(programId, String);

    if(!Roles.userIsInRole(this.userId, ['programs-manage'])) return this.ready();

    return [
      Programs.find(programId),
      Tasks.find({programId}),
      Streams.find({programId})
    ]
  });
}
