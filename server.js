var express = require("express");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 9080;

server.listen(port);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/bin/happyball/happyball.html');
});

app.get('/happyball.js', function (req, res) {
  res.sendfile(__dirname + '/bin/happyball/happyball.js');
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

/*      data.game_state.turn++;
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

      }*/
      var teams = calculateMovesForTime(data.team,other_player.team,10);
      
      data.team = teams[0];
      data.other_team = teams[1];

      other_player.team = teams[1];
      other_player.other_team = teams[0];

      console.log(teams[0]);
      console.log(teams[1]);

      socket.emit('new_turn', data);
      socket.broadcast.to(socket.room_id).emit('new_turn', other_player);

      rooms[socket.room_id].complete = false;
    } else {
      rooms[socket.room_id].complete = data;    
    }
  });
  
});

var TOLERANCE = .1, COLLISION_TOLERANCE = .5, TIMELAPSE=.5;
var getPos = function (p, t) {
  var current_x, current_y, next_x, next_y, speed, diff_x, diff_y, dir_x, dir_y, new_x, new_y;
  current_x = p.location.column;
  current_y = p.location.row;
  next_x = p.next_move.column;
  next_y = p.next_move.row;
  speed = p.stats.speed;
  diff_x = next_x - current_x;  //pos goes right, neg goes left
  diff_y = next_y - current_y;  //pos goes up, neg goes down
  new_x = current_x;
  new_y = current_y;
  //Calculate direction for x and y
  if(diff_x !== 0)
    dir_x = diff_x / (Math.abs(diff_x));
  else
    dir_x = 1;
  if(diff_x !== 0)
    dir_y = diff_y / (Math.abs(diff_y));
  else 
    dir_y = 1;
  //y coordinate movement
  if (Math.abs(diff_y) > TOLERANCE) { 
    new_y = current_y + (t*speed*dir_y);
    //Make sure next move does not go past target location.
    if(dir_y > 0 && new_y > next_y)
      new_y = next_y;
    else if(dir_y < 0 && new_y < next_y)
      new_y = next_y;
    //if next move is within tolerance set it to next_y
    if(Math.abs(new_y - next_y) <= TOLERANCE)
      new_y = next_y;
  }
  //x coordinate movement
  if (Math.abs(diff_x) > TOLERANCE) {  
    new_x = current_x + (t*speed*dir_x);
    //Make sure next move does not go past target location.
    if(dir_x > 0 && new_x > next_x)
      new_x = next_x;
    else if(dir_x < 0 && new_x < next_x)
      new_x = next_x;
    //if next move is within tolerance set it to next_y
    if(Math.abs(new_x - next_x) <= TOLERANCE)
      new_x = next_x;
  }
  return {column: new_x, row: new_y};
}

var moveTeam = function (team, t) {
  var team_new_pos = [];
  for (var i = team.length - 1; i >= 0; i--) {
    team_new_pos[i] = getPos(team[i],t);
  }
  return team_new_pos;
}

var calculateMoves = function (offense,defense,t) {
  var off_pos, def_pos, off_collision_x, off_collision_y, def_collision_x, def_collision_y;
  off_pos = moveTeam(offense,t);
  def_pos = moveTeam(defense,t);
  
  //go through next moves and determine if we accept the new position or not based on obsticals

  //Check if their is a collision between 2 players
  for (var i = off_pos.length-1; i >= 0; i--) {
    off_collision_x = false;
    off_collision_y = false;
    def_collision_x = false;
    def_collision_y = false;
    for (var j = def_pos.length-1; j >=0; j--) {
      // Offense vs Defense Collision detect     
      // On X Axis
      if(Math.abs(off_pos[i].column - def_pos[j].column) < COLLISION_TOLERANCE) {
        off_collision_x = true;
      }
      // On Y Axis
      if(Math.abs(off_pos[i].row - def_pos[j].row) < COLLISION_TOLERANCE) {
        off_collision_y = true;
      }
      // Defense vs Offense Collision detect     
      // On X Axis
      if(Math.abs(def_pos[i].column - off_pos[j].column) < COLLISION_TOLERANCE) {
        def_collision_x = true;
      }
      // On Y Axis
      if(Math.abs(def_pos[i].row - off_pos[j].row) < COLLISION_TOLERANCE) {
        def_collision_y = true;
      }
      // Offense vs Offense Collision detect 
      if(i !== j) {
        // On X Axis
        if(Math.abs(off_pos[i].column - off_pos[j].column) < COLLISION_TOLERANCE) {
          off_collision_x = true;
        }
        // On Y Axis
        if(Math.abs(off_pos[i].row - off_pos[j].row) < COLLISION_TOLERANCE) {
          off_collision_y = true;
        }
      }
      // Defense vs Defense Collision detect
      if(i !== j) {
        if(Math.abs(def_pos[i].column - def_pos[j].column) < COLLISION_TOLERANCE) {
          def_collision_x = true;
        }
        if(Math.abs(def_pos[i].row - def_pos[j].row) < COLLISION_TOLERANCE) {
          def_collision_y = true;
        }
      }
    }
    // Collision logic
    if(!def_collision_y) {
      defense[i].location.row = def_pos[i].row;
    }
    if(!def_collision_x) {
      defense[i].location.column = def_pos[i].column;
    }
    if(!off_collision_y) {
      offense[i].location.row = off_pos[i].row;
    }
    if(!off_collision_x) {
      offense[i].location.column = off_pos[i].column;
    }
  }
  return [offense,defense];
}

var calculateMovesForTime = function (offense,defense,time) {
  var teams = [];
  for (var i = time-1; i >=0; i--) {
    teams = calculateMoves(offense,defense,TIMELAPSE);
    offense = teams[0];
    defense = teams[1];
  }
  return [offense, defense];
}