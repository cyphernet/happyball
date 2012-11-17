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

      var teams = calculateMovesForTime(data.team,other_player.team,10);
      
      data.team = teams[0];
      data.other_team = teams[1];

      other_player.team = teams[1];
      other_player.other_team = teams[0];

      socket.emit('new_turn', data);
      socket.broadcast.to(socket.room_id).emit('new_turn', other_player);

      rooms[socket.room_id].complete = false;
    } else {
      rooms[socket.room_id].complete = data;    
    }
  });
  
});

var TOLERANCE = .01, COLLISION_TOLERANCE = .5, TIMELAPSE=.2, TACKLE_RANGE=.95;
var getPos = function (p, t) {
  var current_x, current_y, next_x, next_y, speed, diff_x, diff_y, dir_x, dir_y, new_x, new_y;
  current_x = p.location.column;
  current_y = p.location.row;
  new_x = current_x;
  new_y = current_y;
  if(p.next_move !== -1 && p.tackled !== 1) {
    next_x = p.next_move.column;
    next_y = p.next_move.row;
    speed = p.stats.speed;
    diff_x = next_x - current_x;  //pos goes right, neg goes left
    diff_y = next_y - current_y;  //pos goes up, neg goes down
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
    if (Math.abs(diff_y) >= TOLERANCE) { 
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
    if (Math.abs(diff_x) >= TOLERANCE) {  
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
    for (var j = def_pos.length-1; j >= 0; j--) {
      // Offense vs Defense Collision detect     
      if(Math.abs(off_pos[i].column - def_pos[j].column) <= COLLISION_TOLERANCE) {
        if(Math.abs(off_pos[i].row - def_pos[j].row) <= COLLISION_TOLERANCE) {
          off_collision_y = true;
        }
      }

      if(Math.abs(off_pos[i].row - def_pos[j].row) <= COLLISION_TOLERANCE) {
        if(Math.abs(off_pos[i].column - def_pos[j].column) <= COLLISION_TOLERANCE) {
          off_collision_x = true;
        }
      }
      // Defense vs Offense Collision detect     
      if(Math.abs(def_pos[i].column - off_pos[j].column) <= COLLISION_TOLERANCE) {
        if(Math.abs(def_pos[i].row - off_pos[j].row) <= COLLISION_TOLERANCE) {
          def_collision_y = true;
        }
        
      }
      if(Math.abs(def_pos[i].row - off_pos[j].row) <= COLLISION_TOLERANCE) {
        if(Math.abs(def_pos[i].column - off_pos[j].column) <= COLLISION_TOLERANCE) {
          def_collision_x = true;
        }
      }
      // Offense vs Offense Collision detect 
      if(i !== j) {
        if(Math.abs(off_pos[i].column - off_pos[j].column) <= COLLISION_TOLERANCE) {
          if(Math.abs(off_pos[i].row - off_pos[j].row) <= COLLISION_TOLERANCE) {
            off_collision_y = true;
          }
        }
        if(Math.abs(off_pos[i].row - off_pos[j].row) <= COLLISION_TOLERANCE) {
          if(Math.abs(off_pos[i].column - off_pos[j].column) <= COLLISION_TOLERANCE) {
            off_collision_x = true;
          }
        }
      }
      // Defense vs Defense Collision detect
      if(i !== j) {
        if(Math.abs(def_pos[i].column - def_pos[j].column) <= COLLISION_TOLERANCE) {
          if(Math.abs(def_pos[i].row - def_pos[j].row) <= COLLISION_TOLERANCE) {
            def_collision_y = true;
          }
        }
        if(Math.abs(def_pos[i].row - def_pos[j].row) <= COLLISION_TOLERANCE) {
          if(Math.abs(def_pos[i].column - def_pos[j].column) <= COLLISION_TOLERANCE) {
            def_collision_x = true;
          }
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
  //Logic determine tackles
  //get player with ball
  var side, player, team, playerIndex, teams = [];

  for(var i = offense.length-1; i>=0; i--) {
    if(offense[i].hasBall === 1) {
      side = 'offense';
      player = offense[i];
      playerIndex = i;
      break;
    }
    else if(defense[i].hasBall === 1) {
      side = 'defense';
      player = defense[i];
      playerIndex = i;
      break;
    }
  }
  if(side == 'defense') {
    team = offense;
  }
  else if(side == 'offense') {
    team = defense;
  }

  for (var i = time-1; i >=0; i--) {
    teams = calculateMoves(offense,defense,TIMELAPSE);
    offense = teams[0];
    defense = teams[1];
    if(team) {
      console.log(team);
      var t = .1;
      var x = player.location.column;
      var y = player.location.row;
      var tackleArray = [[x,y],[x+t,y],[x-t,y],[x,y+t],[x,y-t],[x-t,y-t]];
      player.tackled = (function () {
        for(var j = team.length-1; j>=0; j--) {
          for(var k = tackleArray.length-1; k>=0; k--) {
            console.log(Math.abs(team[j].location.column - tackleArray[k][0]) + ' : ' + Math.abs(team[j].location.row - tackleArray[k][1]));
            if(Math.abs(team[j].location.column - tackleArray[k][0]) <= COLLISION_TOLERANCE && Math.abs(team[j].location.row - tackleArray[k][1]) <= COLLISION_TOLERANCE) {
              console.log('tackled!!');
              return true;
            }
          }
        }
        return false;
      }());
      if(side == 'offense') {
        offense[playerIndex] = player;
      }
      else if (side == 'defense') {
        defense[playerIndex] = player;
      }
      if(player.tackled)
        console.log(player);
    }  
  }

  return [offense, defense];
}

