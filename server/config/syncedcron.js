import {Meteor} from 'meteor/meteor';
import {SyncedCron} from 'meteor/percolate:synced-cron';

// Meteor.log.rule('Mongo',
// {
//   enable: true,
//   filter: ['*'], /* Filters: 'ERROR', 'FATAL', 'WARN', 'DEBUG', 'INFO', '*' */
//   client: false, /* This allows to call, but not execute on Client */
//   server: true   /* Calls from client will be executed on Server */
// });

const BubliqLogger = (opts) => {
  if(opts.message.indexOf('Exception') !== -1){
    let emails = ['revisvv@gmail.com',
                  'eagle.alex@gmail.com'];
    emails.forEach((email) => {
      let user = Meteor.users.findOne({ "emails.address":email });

      if(user){
        let regExp = /"([^']+)"/;
        let jobName = regExp.exec(opts.message)[1];

        let message = "Type: Exception"+"<br/>"
                      +"jobName: "+jobName+"<br/>"
                      +"Trace: "+opts.message.replace('Exception', '')
                                              .replace('"'+jobName+'"', '')
                                              .replace(/\n/g, "<br />").trim();

        Meteor.call('sendDefaultEmail', user, message, opts.tag, "Error");
      }
    });
  }
  console.log(opts.message);
};


export default function () {
  SyncedCron.config({
    logger: BubliqLogger,
    collectionName: 'cronjobs'
  });
}
