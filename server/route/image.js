import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';
import {Random} from 'meteor/random';
import {Meteor} from 'meteor/meteor';

Router.route('/images', {where: 'server'})
  .post(function () {
    const files = this.request.files;
    const res = this.response;

    const folderName = Random.id(7);
    const folderChunk = folderName.slice(0, 2);

    const regex = /\.[^/.]+$/;

    const fileExtention = regex.exec(files[0].filename)[0];

    const fileName = `${Random.id(5)}${fileExtention}`;
    const folderPath = path.join(Meteor.settings.IMAGE_UPLOAD_PATH, folderChunk, folderName);

    mkdirp(folderPath, (err) => {
      if (!err) {
        fs.chown(folderPath, 1001, 1001);

        const filePath = `${folderPath}/${fileName}`;

        fs.writeFile(filePath, files[0].data, 'binary', (err) => {
          if (err) {
            throw new Meteor.Error(err);
          }

          const resp = {link: `/files/images/${folderChunk}/${folderName}/${fileName}`};
          res.end(JSON.stringify(resp));
        });
      } else throw new Meteor.Error(err);
    });
  });

Router.onBeforeAction(function (req, res, next) {
  const files = []; // Store files in an array and then pass them to request.
  const image = {}; // crate an image object

  if (req.method === 'POST' && req.url === '/images') {
    const busboy = new Busboy({ headers: req.headers });
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      image.mimeType = mimetype;
      image.encoding = encoding;
      image.filename = filename;

      // buffer the read chunks
      const buffers = [];

      file.on('data', (data) => {
        buffers.push(data);
      });

      file.on('end', () => {
        // concat the chunks
        image.data = Buffer.concat(buffers);
        // push the image object to the file array
        files.push(image);
      });
    });

    busboy.on('field', (fieldname, value) => {
      req.body[fieldname] = value;
    });

    busboy.on('finish', () => {
      // Pass the file array together with the request
      req.files = files;
      next();
    });
    // Pass request to busboy
    req.pipe(busboy);
  } else {
    this.next();
  }
});
