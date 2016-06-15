var server = require('http')
             .createServer(function (req, res) {
               res.writeHead(200, {'Content-Type': 'text/plain'});
               res.end('okay');
             });

var io = require('socket.io')(server);

var KirigamiServerBus = require('./bus');

var bus = new KirigamiServerBus();

bus.addHandler('io.connection', function (namespace, message, resolve, reject, next) {
  resolve();
});

var KirigamiIOServer = require('./io');

var kirigami = new KirigamiIOServer(io, bus);

server.listen(5000);
