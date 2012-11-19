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
goog.require('lime.animation.RotateBy');
goog.require('lime.SpriteSheet');
goog.require('lime.Button');
goog.require('lime.ASSETS.player.plist')
goog.require('lime.animation.MoveBy');
goog.require('lime.animation.MoveTo');
goog.require('lime.animation.FadeTo');
goog.require('lime.transitions.Dissolve');
goog.require('lime.audio.Audio'); 
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

	// BG
	var start_bg_layer = new lime.Layer();
	startscene.appendChild(start_bg_layer);

	// Background music
	var music = new lime.audio.Audio('https://dl.dropbox.com/u/27691835/music.mp3');
	lime.scheduleManager.scheduleWithDelay(function(){
		if(this.isLoaded() && !this.isPlaying())
			this.play();
	}, music, 10);

	var menu_1_bg = new lime.Sprite().setSize(1400, 1000).setFill('assets/menu1.png').setPosition(0, 0).setAnchorPoint(0,0);
	start_bg_layer.appendChild(menu_1_bg);

	var button_text = (happyball.checkGameExists()) ? 'Join multiplayer game' :'Start multiplayer game';

	var shape = new lime.Circle().setSize(60,60).setFill('#6a1617').setStroke(2, '#000').setPosition(-400, 600);

	var multiplayer_btn = new lime.Button(
		 (new lime.Label).setSize(300, 50).setText(button_text).setFontSize(26).setAnchorPoint(0,0).setPosition(20,-13));

	shape.appendChild(multiplayer_btn);
	startscene.appendChild(shape);

	var flyin = new lime.animation.MoveTo(300, 600).setDuration(.8).setEasing(lime.animation.Easing.EASEINOUT);
	shape.runAction(flyin);

	var fadeinout = new lime.animation.Spawn(
	    new lime.animation.FadeTo(0),
	    new lime.animation.FadeTo(100)
    );

    var keepturning = new lime.animation.Loop(fadeinout);

	var multiplayerscene = new lime.Scene;

	var menu_2_bg = new lime.Sprite().setSize(1400, 1000).setFill('assets/menu2.png').setPosition(0, 0).setAnchorPoint(0,0);
	multiplayerscene.appendChild(menu_2_bg);

	var multiplayer_txt = (happyball.host) ? 'Send this link to a friend to play with them!' : 'Waiting for player.'
	var multiplayer_info = new lime.Label().setText(multiplayer_txt).setFontSize(26).setFontColor('#000').setFill('#ccc').
		setSize(550,60).setAlign('center').setPadding(10, 20).setAnchorPoint(0,0).setPosition(300, 400);
	multiplayerscene.appendChild(multiplayer_info);
	
	// Main game scene
	var gamescene = new lime.Scene();

	// BG
	var bg_layer = new lime.Layer();
	gamescene.appendChild(bg_layer);

	var game_bg = new lime.Sprite().setSize(1400, 1000).setFill('assets/game_bg.png').setPosition(0, 0).setAnchorPoint(0,0);
	bg_layer.appendChild(game_bg);

	// HUD
	var hud_layer = new lime.Layer();
	gamescene.appendChild(hud_layer);

	// hud BACKGROUND
	var header_bg = new lime.Sprite().setSize(1394, 102).setFill('assets/header_bg.png').setPosition(3, 30).setAnchorPoint(0,0);
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

	// notification_layer
	happyball.notification_layer = new lime.Layer();
	gamescene.appendChild(happyball.notification_layer);

	var field = new lime.Sprite().setSize(1400, 555).setFill('assets/field.png').setPosition(0, 185).setAnchorPoint(0,0).setRenderer(lime.Renderer.CANVAS);
	happyball.game_layer.appendChild(field);

	// Players sprite sheet
	happyball.player_sprites = new lime.SpriteSheet('assets/player.png', lime.ASSETS.player.plist, lime.parser.ZWOPTEX);

	goog.events.listen(multiplayer_btn, 'click', function() {
		happyball.director.replaceScene(multiplayerscene, lime.transitions.Dissolve, .7);
		happyball.generateRoom(gamescene);
	});

	// set current scene active
	happyball.director.replaceScene(startscene, lime.transitions.Dissolve, .7);
}

happyball.generateTeam = function(opponent) {
	if(opponent !== null) {
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
		game_vars.hasBall = 0;
		game_vars.level = 1;
		game_vars.tackled = 0;
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
		happyball.showMessage('Waiting for opponent');
	}
}

happyball.getFootballVars = function() {
	for (var i = happyball.my_team.length - 1; i >= 0; i--) {
		if(happyball.my_team[i].game_vars.hasBall === 1)
			return happyball.my_team[i].ball.game_vars;
	};
	return null;
}

socket.on('new_turn', function (data) {
	happyball.game = data.game_state;

	// ANIMATE DUDES!
	for (var i = data.team.length - 1; i >= 0; i--) {
		happyball.my_team[i].game_vars = data.team[i];
		happyball.my_team[i].moveToPosition();

		if(happyball.my_team[i].game_vars.hasBall == 1) {
			happyball.my_team[i].ball = happyball.transferBall();
			happyball.my_team[i].appendChild(happyball.my_team[i].ball);
			happyball.my_team[i].ball.game_vars = data.ball;


			var baller = happyball.getBaller();
			var baller_pos = baller.getPosition();
			happyball.my_team[i].ball.setPosition(baller_pos.x, baller_pos.y);

			happyball.my_team[i].ball.game_vars.location.column = happyball.my_team[i].game_vars.location.column;
			happyball.my_team[i].ball.game_vars.location.row = happyball.my_team[i].game_vars.location.row;
			happyball.my_team[i].ball.moveToPosition();
			var player_with_ball = happyball.my_team[i];
		} else {
			//happyball.my_team[i].ball = null;
		}
	};
	
	for (var i = data.other_team.length - 1; i >= 0; i--) {
		happyball.opponent_team[i].game_vars = data.other_team[i];
		happyball.opponent_team[i].moveToPosition();
		if(happyball.opponent_team[i].game_vars.hasBall == 1) {
			happyball.opponent_team[i].ball = happyball.transferBall();
			happyball.opponent_team[i].appendChild(happyball.opponent_team[i].ball);
			happyball.opponent_team[i].ball.game_vars = data.ball;
			// set to old guy

			var baller = happyball.getBaller();
			var baller_pos = baller.getPosition();
			happyball.opponent_team[i].ball.setPosition(baller_pos.x, baller_pos.y);


			// going to new guy
			happyball.opponent_team[i].ball.game_vars.location.column = happyball.opponent_team[i].game_vars.location.column;
			happyball.opponent_team[i].ball.game_vars.location.row = happyball.opponent_team[i].game_vars.location.row;
			happyball.opponent_team[i].ball.moveToPosition();
			var player_with_ball = happyball.my_team[i];
		} else {
			//happyball.opponent_team[i].ball = null;
		}
	};

	if(!player_with_ball) {
		var ball = happyball.getBall();
		ball.game_vars = data.ball;
		ball.moveToPosition();

		// End round!
	}

	happyball.game.turn_end = false;
	happyball.hideMessage();
});

happyball.transferBall = function() {
	for (var i = happyball.my_team.length - 1; i >= 0; i--) {
		if(happyball.my_team[i].ball) {
			var ball = happyball.my_team[i].ball;
			ball.game_vars.moved = true;
			happyball.my_team[i].removeChild(ball);
			happyball.my_team[i].ball = null;
			return ball;
		}
	};

	for (var i = happyball.opponent_team.length - 1; i >= 0; i--) {
		if(happyball.opponent_team[i].ball) {
			var ball = happyball.opponent_team[i].ball;
			happyball.opponent_team[i].ball = null;
			return ball;
		}
			
	};

	return null;
}

happyball.getBall = function() {
	for (var i = happyball.my_team.length - 1; i >= 0; i--) {
		console.log(happyball.my_team[i].ball);
		if(happyball.my_team[i].ball)
			return happyball.my_team[i].ball;
	};

	for (var i = happyball.opponent_team.length - 1; i >= 0; i--) {
		if(happyball.opponent_team[i].ball) 
			return happyball.opponent_team[i].ball;
	};

	return null;
}

happyball.getBaller = function() {
	for (var i = happyball.my_team.length - 1; i >= 0; i--) {
		console.log(happyball.my_team[i].ball);
		if(happyball.my_team[i].ball)
			return happyball.my_team[i];
	};

	for (var i = happyball.opponent_team.length - 1; i >= 0; i--) {
		if(happyball.opponent_team[i].ball) 
			return happyball.opponent_team[i];
	};

	return null;
}

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
		if(team[i].location.column == pos.column && team[i].location.row == pos.row)
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

	if(single_player) {
		happyball.director.replaceScene(gamescene, lime.transitions.Dissolve, .7);
		happyball.generateTeam(null);
		happyball.renderTeam(happyball.my_team);
	}
	//Generate our team
	socket.on('opponent', function (data) {
		if(happyball.host) {
			happyball.director.replaceScene(gamescene, lime.transitions.Dissolve, .7);
			happyball.generateTeam(null);
			happyball.renderTeam(happyball.my_team);
			var color = (happyball.game.type == 0) ? 'blue' : 'orange';
			happyball.alert('You are '+color+' '+GAME_TYPES[happyball.game.type].name, 2000);
		}
	});

	socket.on('team', function (data) {
		if(!happyball.host) {
			happyball.director.replaceScene(gamescene, lime.transitions.Dissolve, .7);
			happyball.generateTeam(data.game_state.type);
			happyball.renderTeam(happyball.my_team);
			var color = (happyball.game.type == 0) ? 'blue' : 'orange';
			happyball.alert('You are '+color+' '+GAME_TYPES[happyball.game.type].name, 2000);
		}
		happyball.opponent_team = happyball.createTeam(data.team, false);
		happyball.renderTeam(happyball.opponent_team);
	});
}

happyball.showMessage = function(text) {
	var size = text.length * 30;

	happyball.message_label = new lime.Label().setText(text)
				.setFontSize(30).setFontColor('#000').setFill('#fff000').setStroke(2,'#000')
				.setSize(size, 80).setAlign('center').setPadding(3).setAnchorPoint(0,0).setPosition(650-size/2, 250).setRenderer(lime.Renderer.CANVAS);
	happyball.notification_layer.appendChild(happyball.message_label);
}

happyball.hideMessage = function() {
	happyball.notification_layer.removeChild(happyball.message_label);
}

happyball.alert = function(text, time) {

	var size = text.length * 30;

	happyball.alert_label = new lime.Label().setText(text)
				.setFontSize(30).setFontColor('#000').setFill('#fff000').setStroke(2,'#000')
				.setSize(size, 80).setAlign('center').setPadding(3).setAnchorPoint(0,0).setPosition(650-size/2, 250).setRenderer(lime.Renderer.CANVAS);
	happyball.notification_layer.appendChild(happyball.alert_label);

	lime.scheduleManager.callAfter(function(){
		var fadeout = new lime.animation.FadeTo(0);
		happyball.alert_label.runAction(fadeout);
		goog.events.listen(fadeout,lime.animation.Event.STOP,function(){
			happyball.notification_layer.removeChild(happyball.alert_label);
		});
	}, happyball, time);
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