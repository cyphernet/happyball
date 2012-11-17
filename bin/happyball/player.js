goog.provide('happyball.Player');

goog.require('lime.Sprite');
goog.require('happyball.Menu');
goog.require('happyball.Square');

happyball.Player = function(my_player) {
	var player_menu;
	
	goog.base(this);

	this.game_vars = {
		id: 0,
		level: 1,
		location: 0,
		next_move: -1,
		hasBall: 0,
		moved: false
	};

	if(my_player)
		var color = (happyball.game.type == 0) ? 'right_blue' : 'left_orange';
	else
		var color = (happyball.game.type == 0) ? 'left_orange' : 'right_blue';

	this.setFill(happyball.player_sprites.getFrame('idle_'+color+'_1.png'));
	this.setAnchorPoint(0, 0);
	
	
	// show if player is selected
	var light = new lime.Sprite().setSize(50,50).setFill(255, 217, 102, .4).setPosition(0, 0).setAnchorPoint(0, 0).setHidden(true);
	this.appendChild(light);

	// Create a menu for the player
	this.createMenu = function () {
		player_menu = new happyball.Menu(this);
	}

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
			this.game_vars.next_move = {column: this.game_vars.location.column + column, row: this.game_vars.location.row + row};
			this.game_vars.moved = true;
		}

		this.showMovement = function(distance) {
			this.removeChild(player_menu);
			
			for (var i = 1; i <= distance; i++) {
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

	this.showIdle = function() {
		var anim = new lime.animation.KeyframeAnimation();
		anim.delay= .3;
		for(var i=1;i<=4;i++){
			anim.addFrame(happyball.player_sprites.getFrame('idle_'+color+'_'+i+'.png').
				setSize(50,50));
		}
		for(var i=4;i>=1;i--){
			anim.addFrame(happyball.player_sprites.getFrame('idle_'+color+'_'+i+'.png').
				setSize(50,50));
		}

		this.runAction(anim);
	}

	this.moveToPosition = function() {
		var x = 200 + this.game_vars.location.column*50;
		var y = 220 + this.game_vars.location.row*50;

		var move = new lime.animation.MoveTo(x, y).setEasing(lime.animation.Easing.EASEINOUT).setSpeed(.5);
		this.runAction(move);

		// show animation
		var running = new lime.animation.KeyframeAnimation();
		running.delay = 1/7;
		for(var i=1;i<=8;i++){
		    running.addFrame(happyball.player_sprites.getFrame('running_'+color+'_'+i+'.png'));
		}
		this.runAction(running);
		
		goog.events.listen(move,lime.animation.Event.STOP,function(){
			running.stop();
			console.log(this);
			this.targets[0].showIdle();
		})

		this.removeChild(this.next_move_marker);
		this.game_vars.moved = false;
	}

	this.showIdle();
}
goog.inherits(happyball.Player, lime.Sprite);