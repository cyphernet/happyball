var express = require("express");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(80);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/'));
  app.use(express.errorHandler({
    dumpExceptions: true, 
    showStack: true
  }));
  app.use(app.router);
});

io.set('log level', 1);

io.sockets.on('connection', function (socket) {

  socket.on('init', function (data) {
    socket.userData = data;
    socket.join(data.room_id);
    socket.broadcast.to(data.room_id).emit('opponent', data);
  });

  socket.on('team', function (data) {
    socket.gameData = data;
    socket.broadcast.to(data.room_id).emit('team', data);
  });
});