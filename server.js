var express = require("express");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 9080;

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
    var other_player = rooms[socket.room_id].complete;
    if(other_player) {

      data.game_state.turn++;
      other_player.game_state.turn++;

      // Move both teams players
      for (var i = data.team.length - 1; i >= 0; i--) {
        if(data.team[i].next_move != -1)
          data.team[i].location = data.team[i].next_move;
      
        if(other_player.team[i].next_move != -1)
         other_player.team[i].location = other_player.team[i].next_move;
       
        data.team[i].next_move = -1;
        other_player.team[i].next_move = -1;
      };

      var ball = null;
      //Move Da balls
      if(data.ball.next_move != -1) {
        ball = data.ball;
      } else if (other_player.ball.next_move != -1) {
        ball = other_player.ball;
      }
    
      if(ball) {
        data.ball.location =  ball.next_move;
        other_player.ball.location = ball.next_move;
        data.ball.next_move = -1;
        other_player.ball.next_move = -1;

        for (var i = data.team.length - 1; i >= 0; i--) {
          data.team[i].hasBall =  0;
          other_player.team[i].hasBall =  0;
          //Ball Catching super simple logic
          if(data.team[i].location === ball.location)
            data.team[i].hasBall = 1;
          else if(other_player.team[i].location === ball.location)
            other_player.team[i].hasBall = 1;
          
          console.log(ball.location + ' :: ' + data.team[i].location + ' ' + data.team[i].hasBall + ' : ' + other_player.team[i].location + ' '  + other_player.team[i].hasBall);
        }

      }

      data.other_team = other_player.team;
      other_player.other_team = data.team;
      socket.emit('new_turn', data);
      socket.broadcast.to(socket.room_id).emit('new_turn', other_player);

      rooms[socket.room_id].complete = false;
    } else {
      rooms[socket.room_id].complete = data;    
    }
  });
  
});