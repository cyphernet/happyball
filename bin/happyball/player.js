goog.provide('happyball.Player');

goog.require('lime.Sprite');
goog.require('happyball.Menu');
goog.require('happyball.Square');

happyball.Player = function() {
	goog.base(this);

	


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
	var player_menu = new happyball.Menu().setHidden(true);
	this.appendChild(player_menu);

	var movement = new lime.Sprite();
	this.appendChild(movement);
	
	this.select = function() {
		if(happyball.selectedPlayer)
			happyball.selectedPlayer.deselect();

		happyball.selectedPlayer = this;
		player_menu.setHidden(false);
	}
	this.deselect = function() {
		player_menu.setHidden(true);
		movement.removeAllChildren();
	}

	this.showMovement = function() {
		player_menu.setHidden(true);
		
		for (var i = 1; i <= this.stats.distance; i++) {
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
		light.setHidden(false);

		var key = goog.events.listen(this.getParent(), 'mousemove', function(e) {
			if (!this.hitTest(e))
			{
				light.setHidden(true);
				goog.events.unlistenByKey(key);
			}	

		},null,this);
		
	});
	
	goog.events.listen(this,['mousedown','touchstart'],function(e){
		this.select();
		e.event.stopPropagation();
	},false,this)
}
goog.inherits(happyball.Player, lime.Sprite);