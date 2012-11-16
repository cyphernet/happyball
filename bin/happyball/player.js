goog.provide('happyball.Player');

goog.require('lime.Sprite');

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
	
	// show if monster is selected
	var light = new lime.Circle().setSize(6,6).setFill('#f90').setPosition(0,-40).setHidden(true);
	this.appendChild(light);
	
	this.select = function(){
		if(happyball.selectedPlayer)
			happyball.selectedPlayer.deselect();
		light.setHidden(false);
		happyball.selectedPlayer = this;
	}
	this.deselect = function(){
		light.setHidden(true);
	}
	
	goog.events.listen(this,['mousedown','touchstart'],function(e){
		this.select();
		e.event.stopPropagation();
	},false,this)
}
goog.inherits(happyball.Player, lime.Sprite);