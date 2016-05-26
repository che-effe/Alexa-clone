var http = require('http');
var fs = require('fs');
var gm = require('gm');
var url = require('url');

http.createServer(function (request, response) {
  var urlParts = url.parse(request.url).path.substring(1).split('/');
  var type = urlParts[0];
  var subtype = urlParts[1];
  var deviceName = urlParts[2];
  var width = urlParts[3];
  var height = urlParts[4];
  var max = Math.max(width, height);
  var reqAsset = 'public/images/' +
   type + '/' +
   subtype + '/' +
   deviceName + '.png';

  fs.readFile(reqAsset, function (err, data) {
    if (err) {
      response.writeHead(404);
      response.end();
    } else {
      if (!isNaN(width) && !isNaN(height)) {
        response.writeHead(200, { 'content-type': 'image/png' });
        gm(reqAsset).
          resize(max, max).
          crop(width, height, 0, 0).
          stream(function (err, stdout, stderr) {
            if (err) {
              console.log(err);
            } else {
              stdout.pipe(response);
            }
          });
      } else {
        response.writeHead(400, { 'content-type': 'text/plain' });
        response.end();
      }

    }
  });
}).listen(1337, '127.0.0.1');
