//set main namespace
goog.provide('happyball');


//get requirements
goog.require('lime');
goog.require('lime.Circle');
goog.require('lime.Director');
goog.require('lime.Layer');
goog.require('lime.Sprite');
goog.require('lime.fill.Frame');
goog.require('lime.animation.KeyframeAnimation');
goog.require('lime.SpriteSheet');
goog.require('lime.Button');
goog.require('lime.ASSETS.player.plist')
goog.require('lime.animation.MoveBy');
goog.require('lime.transitions.SlideIn');
goog.require('happyball.Player');
goog.require('happyball.Football');

var GAME_TYPES = [{
		name: 'offense',
		positions: [{
				distance: 2,
				speed: 1,
				skill: 2,
				strength: 3,
				position: 'center'
			},{
				distance: 2,
				speed: 1,
				skill: 2,
				strength: 3,
				position: 'center'
			}, {
				distance: 4,
				speed: 2,
				skill: 1,
				strength: 2,
				position: 'running back'
			}, {
				distance: 3,
				speed: 2,
				skill: 2,
				strength: 1,
				position: 'receiver'
			}, {
				distance: 1,
				speed: 1,
				skill: 5,
				strength: 1,
				position: 'qb'
			}
		]
	}, {
		name: 'defense',
		positions: [{
				distance: 2,
				speed: 1,
				skill: 2,
				strength: 2,
				position: 'end'
			}, {
				distance: 4,
				speed: 2,
				skill: 1,
				strength: 1,
				position: 'safety'
			}, {
				distance: 3,
				speed: 2,
				skill: 2,
				strength: 1,
				position: 'safety'
			}, {
				distance: 3,
				speed: 2,
				skill: 2,
				strength: 3,
				position: 'line back'
			}, {
				distance: 3,
				speed: 2,
				skill: 2,
				strength: 3,
				position: 'line back'
			}
		]
	}
];

var socket = io.connect();

// entrypoint
happyball.start = function(){

	happyball.my_team = [];
	happyball.opponent_team = [];
	happyball.game = {
		turn: 1,
		stage: 1,
		score: 0,
		points: 0,
		turn_end: false
	};

	// Game window
	happyball.director = new lime.Director(document.body, 1400, 1000);
	happyball.director.makeMobileWebAppCapable();
	happyball.director.setDisplayFPS(false);

	// Start Menu scene
	var startscene = new lime.Scene;
	
	var start_label = new lime.Label().setText('Happyball is a game').setFontSize(24).setFontColor('#000').setFill('#ccc').
		setSize(1400,120).setAlign('center').setPadding(10, 20).setAnchorPoint(0,0).setPosition(0, 200);

	startscene.appendChild(start_label);

	var button_text = (happyball.checkGameExists()) ? 'Join multiplayer game' :'Start multiplayer game';

    var multiplayer_btn = new lime.Button(
         (new lime.Label).setSize(310, 60).setFill('#1E4152').setText(button_text).setFontSize(26).setPadding(5, 20).
	        setAlign('right').setShadow('#FFF',2,1,1)
     ).setPosition(680, 300);

     startscene.appendChild(multiplayer_btn);

	var multiplayerscene = new lime.Scene;

	var multiplayer_txt = (happyball.host) ? 'Send this link to a friend to play with them!' : 'Waiting for player.'
	var multiplayer_info = new lime.Label().setText(multiplayer_txt).setFontSize(26).setFontColor('#000').setFill('#ccc').
		setSize(1400,500).setAlign('center').setPadding(10, 20).setAnchorPoint(0,0).setPosition(0, 200);
	multiplayerscene.appendChild(multiplayer_info);
	
	// Main game scene
	var gamescene = new lime.Scene();

	// HUD
	var hud_layer = new lime.Layer();
	gamescene.appendChild(hud_layer);

	// hud BACKGROUND
	var header_bg = new lime.Sprite().setSize(1400, 102).setFill('assets/header_bg.png').setPosition(0, 30).setAnchorPoint(0,0);
	hud_layer.appendChild(header_bg);

	// Top logo
	var logo = new lime.Sprite().setSize(269, 157).setFill('assets/logo.png').setPosition(100, 10).setAnchorPoint(0,0);
	hud_layer.appendChild(logo);

	var gradient = new lime.fill.LinearGradient().
	        setDirection(1,0,1,1).
	        addColorStop(0,239,239,239,1).
	        addColorStop(1,148,148,148,1);

    var turn_btn = new lime.Button(
         (new lime.Label).setSize(150, 35).setFill(gradient).setText('end turn').setFontSize(26).setPadding(0, 0).setStroke(1,'#000'),
         (new lime.Label).setSize(150, 35).setFill(239,239,239).setText('end turn').setFontSize(26).setPadding(0, 0).setStroke(1,'#000')
     ).setPosition(500, 105);
    hud_layer.appendChild(turn_btn);

    goog.events.listen(turn_btn, 'click', function() {
		happyball.end_turn(hud_layer);
	});

	// Game layer
	happyball.game_layer = new lime.Layer();
	gamescene.appendChild(happyball.game_layer);

	var field = new lime.Sprite().setSize(1400, 555).setFill('assets/field.png').setPosition(0, 185).setAnchorPoint(0,0);
	happyball.game_layer.appendChild(field);

	// Players sprite sheet
	happyball.player_sprites = new lime.SpriteSheet('assets/player.png', lime.ASSETS.player.plist, lime.parser.ZWOPTEX);

	goog.events.listen(multiplayer_btn, 'click', function() {
		happyball.director.replaceScene(multiplayerscene, lime.transitions.SlideIn);
		happyball.generateRoom(gamescene);
	});

	// set current scene active
	happyball.director.replaceScene(startscene);
}

happyball.generateTeam = function(opponent) {

	if(opponent !== undefined) {
		if(opponent)
			happyball.game.type = 0;
		else
			happyball.game.type = 1;
	} else {
		happyball.game.type = randomFromInterval(0, GAME_TYPES.length-1);
	}

	var my_team = [];
	for(var i=0; i<GAME_TYPES[0].positions.length; i++) {
		var game_vars = {};
		game_vars.id = i;
		game_vars.location = happyball.generatePlayerPosition(my_team);
		game_vars.stats = GAME_TYPES[happyball.game.type].positions[i];
		game_vars.next_move = -1;
		if(game_vars.stats.position === 'qb') {
			game_vars.hasBall = 1;
		}
		my_team.push(game_vars);
	}

	happyball.my_team = happyball.createTeam(my_team, true);
	socket.emit('team', {
		name: 'Anon',
		team: my_team,
		game_state: happyball.game
	});


}

happyball.teamToJson = function(team) {
	var json_team = [];

	for (var i = 0; i < team.length; i++) {
		var player = team[i].game_vars;
		json_team.push(player);
	};

	return json_team;
}

happyball.end_turn = function(hud_layer) {
	if(!happyball.game.turn_end) {
		var team = happyball.teamToJson(happyball.my_team);
		socket.emit('end_turn', {
			name: 'Anon', 
			game_state: happyball.game,
			team: team,
			ball: happyball.getFootballVars()
		});
		happyball.game.turn_end = true;
		happyball.game_log('game_log', 'Waiting for opponent');
	}
}

happyball.getFootballVars = function() {
	for (var i = happyball.my_team.length - 1; i >= 0; i--) {
		if(happyball.my_team[i].game_vars.hasBall === 1)
			return happyball.my_team[i].ball.game_vars;

	return null;
	};
}

socket.on('new_turn', function (data) {
	happyball.game_log('game_log', 'Turn '+data.game_state.turn+'!');
	happyball.game = data.game_state;

	// ANIMATE DUDES!
	for (var i = data.team.length - 1; i >= 0; i--) {
		happyball.my_team[i].game_vars = data.team[i];
		happyball.my_team[i].moveToPosition();
	};
	
	for (var i = data.other_team.length - 1; i >= 0; i--) {
		happyball.opponent_team[i].game_vars = data.other_team[i];
		happyball.opponent_team[i].moveToPosition();
	};


	happyball.game.turn_end = false;
});

happyball.createTeam = function(data, my_team) {
	var team = [];
	for (var i = 0; i < data.length; i++) {
		var newPlayer = new happyball.Player(my_team);
		newPlayer.game_vars = data[i];
		if(newPlayer.game_vars.hasBall === 1) {
			newPlayer.ball = new happyball.Football();
		}
		newPlayer.createMenu();
		team.push(newPlayer);
	};
	return team;
}

happyball.renderTeam = function(team) {
	for (var i = 0; i < team.length; i++) {
		var x = 200 + team[i].game_vars.location.column*50;
		var y = 220 + team[i].game_vars.location.row*50;
		team[i].setPosition(x, y);
		happyball.game_layer.appendChild(team[i]);
		if(team[i].game_vars.hasBall === 1) {
			team[i].appendChild(team[i].ball);
			team[i].ball.game_vars.location = team[i].game_vars.location;
		}
	};
}

happyball.generatePlayerPosition = function(team) {
	var pos = {column: 0, row: 0};
	do {
		if(happyball.game.type == 0)
			pos.column = randomFromInterval(0, 9);
		else
			pos.column = randomFromInterval(10, 19);

		pos.row = randomFromInterval(0, 9);

	} while (happyball.isPlayerHere(pos, team));

	return pos;
}

happyball.isPlayerHere = function(pos, team) {
	for (var i = 0; i < team.length; i++) {
		if(team[i].location == pos)
			return true;
	};
	return false;
}

happyball.createLine = function(size, x1, y1, x2, y2) { 
	var dx = Math.abs(x2-x1); 
	var dy = Math.abs(y2-y1); 
	var width = Math.sqrt(dx*dx+dy*dy)+size; 
	return new lime.Sprite().setSize(width, size).setAnchorPoint(size/2/ width, .5).setRotation(-Math.atan2(y2-y1, x2-x1)*180/Math.PI).setPosition(x1, y1);
}

happyball.checkGameExists = function() {
	happyball.host = true;

	if(window.location.hash.substr(1, 1) === "g") {
		game_id = window.location.hash.substr(1, window.location.hash.length);
		happyball.host = false;
	} else {
		game_id = 'g' + happyball.createId();
	}

	happyball.game.id = game_id;
	if(localStorage.getItem("happyball.user_id")) {
		happyball.user_id = localStorage.getItem("happyball.user_id");
	} else {
		happyball.user_id = 'u' + happyball.createId();
		localStorage.setItem("happyball.user_id", happyball.user_id);
	}

	return !happyball.host;
}

happyball.generateRoom = function(gamescene) {
	var single_player = false;
	
	if(happyball.host) {
		window.location.hash = happyball.game.id;
	}

	socket.emit('init', {
		room_id: happyball.game.id,
		user_id: happyball.user_id,
		name: 'Anon'
	});

	happyball.game_log('game_log', 'Game start.');
	happyball.game_log('game_log', 'Waiting for opponent.');

	if(single_player) {
		happyball.director.replaceScene(gamescene);
		happyball.generateTeam(null);
		happyball.renderTeam(happyball.my_team);
	}
	//Generate our team
	socket.on('opponent', function (data) {
		if(happyball.host) {
			happyball.director.replaceScene(gamescene);
			happyball.generateTeam(null);
			happyball.renderTeam(happyball.my_team);
			happyball.game_log('game_log', 'You are on '+GAME_TYPES[happyball.game.type].name);
		}
	});

	socket.on('team', function (data) {
		if(!happyball.host) {
			happyball.director.replaceScene(gamescene);
			happyball.generateTeam(data.game_state.type);
			happyball.renderTeam(happyball.my_team);
			happyball.game_log('game_log', 'You are on '+GAME_TYPES[happyball.game.type].name);
		}
		happyball.opponent_team = happyball.createTeam(data.team, false);
		happyball.renderTeam(happyball.opponent_team);
		happyball.game_log('game_log', 'opponent is on '+GAME_TYPES[data.game_state.type].name);
	});
}

happyball.game_log = function(id, text) {
	var d = new Date();
	var date = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
	console.log('['+date+'] '+text);
}

happyball.createId = function() {
	var num = randomFromInterval(1000, 9000);
	var ts = Math.round((new Date()).getTime() / 1000);
	return num+ts;
}

//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('happyball.start', happyball.start);

function randomFromInterval(from, to) {
	return Math.floor(Math.random()*(to-from+1)+from);
}