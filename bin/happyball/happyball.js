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
goog.require('lime.ASSETS.player_idle.plist')
goog.require('lime.animation.MoveBy');
goog.require('happyball.Player');

var GAME_TYPES = [{
		name: 'offense',
		positions: [{
				distance: 2,
				speed: 1,
				skill: 2,
				position: 'center'
			},{
				distance: 2,
				speed: 1,
				skill: 2,
				position: 'center'
			}, {
				distance: 4,
				speed: 2,
				skill: 1,
				position: 'running back'
			}, {
				distance: 3,
				speed: 2,
				skill: 2,
				position: 'receiver'
			}, {
				distance: 1,
				speed: 1,
				skill: 5,
				position: 'qb'
			}
		]
	}, {
		name: 'defense',
		positions: [{
				distance: 2,
				speed: 1,
				skill: 2,
				position: 'end'
			}, {
				distance: 4,
				speed: 2,
				skill: 1,
				position: 'safety'
			}, {
				distance: 3,
				speed: 2,
				skill: 2,
				position: 'safety'
			}, {
				distance: 3,
				speed: 2,
				skill: 2,
				position: 'line back'
			}, {
				distance: 3,
				speed: 2,
				skill: 2,
				position: 'line back'
			}
		]
	}
];

// entrypoint
happyball.start = function(){

	happyball.my_team = [];
	happyball.game = {
		turn: 1,
		stage: 1,
		score: 0,
		points: 0,
		turn_end: false
	};

	// Game window
	var director = new lime.Director(document.body, 1400, 1024);
	director.makeMobileWebAppCapable();
	director.setDisplayFPS(false);    

	// Main game scene
	var gamescene = new lime.Scene;

	// HUD
	var hud_layer = new lime.Layer();
	gamescene.appendChild(hud_layer);

	// hud BACKGROUND
	var header_bg = new lime.Sprite().setSize(1400, 102).setFill('assets/header_bg.png').setPosition(10, 30).setAnchorPoint(0,0);
	hud_layer.appendChild(header_bg);

	// Top lgoo
	var logo = new lime.Sprite().setSize(269, 157).setFill('assets/logo.png').setPosition(100, 10).setAnchorPoint(0,0);
	hud_layer.appendChild(logo);

	// Game layer
	var game_layer = new lime.Layer();
	gamescene.appendChild(game_layer);

	var field = new lime.Sprite().setSize(1400, 555).setFill('assets/field.png').setPosition(0, 185).setAnchorPoint(0,0);
	game_layer.appendChild(field);

	// Players sprite sheet
	happyball.player_sprites = new lime.SpriteSheet('assets/p.png', lime.ASSETS.player_idle.plist);

	happyball.generateTeam();
	for (var i = happyball.my_team.length - 1; i >= 0; i--) {
		var x = 200 + happyball.my_team[i].location.column*50;
		var y = 220 + happyball.my_team[i].location.row*50;
		happyball.my_team[i].setPosition(x, y)
		game_layer.appendChild(happyball.my_team[i]);
	};

	//goog.events.listen(gamescene,['mousedown','touchstart'],function(e){
	//	happyball.moveToPosition(happyball.selectedPlayer, gamescene.localToNode(e.position,game_layer));
	//	console.log(e.position);
	//})

	// set current scene active
	director.replaceScene(gamescene);

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
	happyball.game.type = 0;

	for(var i=0; i<GAME_TYPES[0].positions.length; i++) {
		var newPlayer = new happyball.Player();
		newPlayer.id = happyball.my_team.length;
		newPlayer.location = happyball.generatePlayerPosition();
		newPlayer.stats = GAME_TYPES[happyball.game.type].positions[i];
		if (newPlayer.stats.position === 'qb') {
			newPlayer.hasBall = 1;
			//happyball.football.location = newPlayer.location;
		}
		happyball.my_team.push(newPlayer);
	}
}

happyball.generatePlayerPosition = function() {
	var pos = {column: 0, row: 0};
	do {
		if(happyball.game.type == 0)
			pos.column = randomFromInterval(0, 9);
		else
			pos.column = randomFromInterval(10, 19);

		pos.row = randomFromInterval(0, 9);

	} while (happyball.isPlayerHere(pos));

	return pos;
}

happyball.isPlayerHere = function(pos) {
	for (var i = 0; i < happyball.my_team.length; i++) {
		if(happyball.my_team[i].location == pos)
			return true;
	};
	return false;
}

happyball.moveToPosition = function(player, pos){
		
	var delta = goog.math.Coordinate.difference(pos,player.getPosition()),
		angle = Math.atan2(-delta.y,delta.x);
	
	//determine the direction    
	var dir = Math.round(angle/(Math.PI*2)*8);
	var dirs = ['e','ne','n','nw','w','sw','s','se'];
	if(dir<0) dir=8+dir;
	dir = dirs[dir];
	
	//move
	var move =new lime.animation.MoveBy(delta).setEasing(lime.animation.Easing.LINEAR).setSpeed(2);
	player.runAction(move);
	
	// show animation
	//var anim = new lime.animation.KeyframeAnimation();
	//anim.delay= 1/7;
	//for(var i=1;i<=7;i++){
	//    anim.addFrame(test.ss.getFrame('walking-'+dir+'000'+i+'.png'));
	//}
   // player.runAction(anim);
	
	// on stop show front facing
	goog.events.listen(move,lime.animation.Event.STOP,function(){
	  //  anim.stop();
		//player.setFill(test.ss.getFrame('walking-s0001.png'));
	})
	
}

//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('happyball.start', happyball.start);

function randomFromInterval(from, to) {
	return Math.floor(Math.random()*(to-from+1)+from);
}