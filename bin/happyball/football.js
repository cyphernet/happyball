goog.provide('happyball.Football');

goog.require('lime.Sprite');

happyball.Football = function() {
	goog.base(this);

	this.game_vars = {
		location: 0,
		next_move: -1
	};

	this.setFill('assets/ball_select.png').setSize(28,16).setAnchorPoint(0,0).setPosition(10,28);
/*	this.setFill(happyball.player_sprites.getFrame('idle_right_1.png'));
	this.setAnchorPoint(0, 0);
	var anim = new lime.animation.KeyframeAnimation();
	anim.delay= .3;
	for(var i=1;i<=4;i++){
		anim.addFrame(happyball.player_sprites.getFrame('idle_right_'+i+'.png').
			setSize(50,50));
	}
	for(var i=4;i>=1;i--){
		anim.addFrame(happyball.player_sprites.getFrame('idle_right_'+i+'.png').
			setSize(50,50));
	}
	this.runAction(anim);*/
	
	// show if player is selected
/*	var light = new lime.Sprite().setSize(50,50).setFill(255, 217, 102, .4).setPosition(0, 0).setAnchorPoint(0, 0).setHidden(true);
	this.appendChild(light);

	// Create a menu for the player
	var player_menu = new happyball.Menu();
*/
	var movement = new lime.Sprite();
	this.appendChild(movement);
	

	this.createMove = function(column, row) {
		this.deselect();
		var x = column*50;
		var y = row*50;
		this.next_move_marker = happyball.createLine(3, 25, 25, x+25, y+25).setFill('#B69E67');
		this.appendChild(this.next_move_marker);
		this.game_vars.next_move = {column: this.game_vars.location.column + column, row: this.game_vars.location.row + row};
		this.game_vars.moved = true;
	}

	this.moveToPosition = function() {
		var x = 200 + this.game_vars.location.column*50;
		var y = 220 + this.game_vars.location.row*50;

		this.setPosition(x, y);
		this.removeChild(this.next_move_marker);
		this.game_vars.moved = false;
	}
}
goog.inherits(happyball.Football, lime.Sprite);