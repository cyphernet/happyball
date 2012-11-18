goog.provide('happyball.Football');

goog.require('lime.Sprite');

happyball.Football = function() {
	goog.base(this);

	this.game_vars = {
		location: 0,
		next_move: -1
	};

	this.setFill('assets/ball_select.png').setSize(28,16).setAnchorPoint(0,0).setPosition(10,28).setRenderer(lime.Renderer.CANVAS);

	var movement = new lime.Sprite();
	this.appendChild(movement);
	
	this.createMove = function(column, row) {
		this.getParent().deselect();
		var x = column*50;
		var y = row*50;
		this.next_move_marker = happyball.createLine(3, 25, 25, x+25, y+25).setFill('#B2D0DD');
		this.appendChild(this.next_move_marker);
		this.game_vars.next_move = {column: this.game_vars.location.column + column, row: this.game_vars.location.row + row};
		this.game_vars.moved = true;
	}

	this.moveToPosition = function() {
		if(this.game_vars.moved) {
			var x = (this.game_vars.location.column - this.getParent().game_vars.location.column)*50+11;
			var y = (this.game_vars.location.row - this.getParent().game_vars.location.row)*50+17;

			var move = new lime.animation.MoveTo(x, y).setEasing(lime.animation.Easing.EASEIN).setSpeed(.2);
			this.runAction(move);

			this.removeChild(this.next_move_marker);
			this.game_vars.moved = false;
		}
	}
}
goog.inherits(happyball.Football, lime.Sprite);