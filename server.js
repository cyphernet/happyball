var express = require("express");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 80;

server.listen(port);

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

var rooms = {};

io.sockets.on('connection', function (socket) {

  socket.on('init', function (data) {
    socket.userData = data;
    socket.room_id = data.room_id;

    rooms[socket.room_id] = {};

    socket.join(socket.room_id);
    socket.broadcast.to(data.room_id).emit('opponent', data);
  });

  socket.on('team', function (data) {
    socket.gameData = data;

    rooms[socket.room_id].complete = false;

    socket.broadcast.to(socket.room_id).emit('team', data);
  });

  socket.on('msg', function (data) {
    socket.broadcast.to(socket.room_id).emit('chat', data);
  });

  socket.on('end_turn', function (data) {
    if(rooms[socket.room_id].complete) {

      data.game_state.turn++;
      for (var i = data.team.length - 1; i >= 0; i--) {
        if(data.team[i].next_move != -1)
          data.team[i].location = data.team[i].next_move;
        data.team[i].next_move = -1;
      };

      rooms[socket.room_id].complete.game_state.turn++;
      for (var i = rooms[socket.room_id].complete.team.length - 1; i >= 0; i--) {
        if(rooms[socket.room_id].complete.team[i].next_move != -1)
          rooms[socket.room_id].complete.team[i].location = rooms[socket.room_id].complete.team[i].next_move;
        rooms[socket.room_id].complete.team[i].next_move = -1;
      };

      data.other_team = rooms[socket.room_id].complete.team;
      rooms[socket.room_id].complete.other_team = data.team;
      socket.emit('new_turn', data);
      socket.broadcast.to(socket.room_id).emit('new_turn', rooms[socket.room_id].complete);

      rooms[socket.room_id].complete = false;
    } else {
      rooms[socket.room_id].complete = data;    
    }
  });
  
});