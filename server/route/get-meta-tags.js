const iconv = require('iconv-lite');

Router.route('/shares/:_id', {where: 'server'})
  .get(function () {
    const req = this.request;
    const res = this.response;

    if (~req.headers["user-agent"].indexOf("PhantomJS")) {
      let reply = '';

      const taskId = this.params._id;

      function parseImgUrls(text) {
        let urls = /<img.*?src="([^">]*\/([^">]*?))".*?>/g,
            imgUrls = [];

        if(text){
          let tempText = text;

          while ( m = urls.exec(tempText) ) {
            imgUrls.push( m[1] );
            break
          }

          if(imgUrls && imgUrls.length > 0) {
            let url = imgUrls[0];
            if(url.indexOf("://") === -1){
              url = Meteor.absoluteUrl().replace(/\/$/, '')+url;
            }
            return url;
          } else {
            return Meteor.absoluteUrl('logo.png');
          }
        }
      }

      if (taskId) {
        const giventask = GivenTasks.findOne(taskId, { fields: { taskId:1, shareText:1 } });

        if (giventask && giventask.shareText) {
          const task = Tasks._cache[giventask.taskId];

          if (task) {
            reply = `<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="fragment" content="!"><meta property="og:type" content="website"><meta property="og:url" content="${Meteor.absoluteUrl()}shares/${taskId}"><meta property="og:title" content="${task.shareTitle || task.title}"><meta property="og:description" content="${String(giventask.shareText).replace(/<[^>]+>/gm, '')}"><meta property="og:image" content="${parseImgUrls(giventask.shareText)}"><meta property="fb:app_id" content="451946515003291"></head>`
          }
        }
      }

      res.end(iconv.encode(reply, 'utf8'));
    }
    else {
      this.next();
    }
  });
