goog.provide('happyball.Player');

goog.require('lime.Sprite');
goog.require('happyball.Menu');
goog.require('happyball.Square');

happyball.Player = function(my_player) {
	goog.base(this);

	this.game_vars = {
		id: 0,
		level: 1,
		location: 0,
		next_move: -1,
		hasBall: 0,
		moved: false
	};

	this.setFill(happyball.player_sprites.getFrame('idle_right_1.png'));
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

	this.runAction(anim);
	
	// show if player is selected
	var light = new lime.Sprite().setSize(50,50).setFill(255, 217, 102, .4).setPosition(0, 0).setAnchorPoint(0, 0).setHidden(true);
	this.appendChild(light);

	// Create a menu for the player
	var player_menu = new happyball.Menu();

	var movement = new lime.Sprite();
	this.appendChild(movement);
	
	if(my_player) {
		this.select = function() {
			if(!this.game_vars.moved) {
				if(happyball.selectedPlayer)
					happyball.selectedPlayer.deselect();

				happyball.selectedPlayer = this;
				this.appendChild(player_menu);
			}
		}

		this.deselect = function() {
			this.removeChild(player_menu);
			movement.removeAllChildren();
			happyball.selectedPlayer = null;
		}

		this.createMove = function(column, row) {
			this.deselect();
			var x = column*50;
			var y = row*50;
			this.next_move_marker = happyball.createLine(3, 25, 25, x+25, y+25).setFill('#B69E67');
			this.appendChild(this.next_move_marker);
			this.game_vars.next_move = {column: column, row: row};
			this.game_vars.moved = true;
		}

		this.showMovement = function() {
			this.removeChild(player_menu);
			
			for (var i = 1; i <= this.game_vars.stats.distance; i++) {
				// east
				var sq = new happyball.Square(i, 0);
				movement.appendChild(sq);

				// south
				var sq = new happyball.Square(0, i);
				movement.appendChild(sq);

				// north
				var sq = new happyball.Square(0, i*-1);
				movement.appendChild(sq);

				// west
				var sq = new happyball.Square(i*-1, 0);
				movement.appendChild(sq);

				var sq = new happyball.Square(i, i);
				movement.appendChild(sq);

				var sq = new happyball.Square(i, i*-1);
				movement.appendChild(sq);

				var sq = new happyball.Square(i*-1, i*-1);
				movement.appendChild(sq);

				var sq = new happyball.Square(i*-1, i);
				movement.appendChild(sq);
			};
		}

		// Mousehover function
		goog.events.listen(this, 'mouseover', function(e) { 
			if(!this.game_vars.moved)
				light.setHidden(false);

			var key = goog.events.listen(this.getParent(), 'mousemove', function(e) {
				if (!this.hitTest(e))
				{
					if(!this.game_vars.moved)
						light.setHidden(true);
					goog.events.unlistenByKey(key);
				}	

			},null,this);
			
		});
		
		goog.events.listen(this,['mousedown','touchstart'],function(e){
			if(!this.game_vars.moved)
				this.select();
			e.event.stopPropagation();
		},false,this);
	}

	this.moveToPosition = function() {
		var x = 200 + this.game_vars.location.column*50;
		var y = 220 + this.game_vars.location.row*50;

		this.setPosition(x, y);
		this.removeChild(this.next_move_marker);
		this.moved = false;
	}
}
goog.inherits(happyball.Player, lime.Sprite);