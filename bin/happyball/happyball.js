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


// entrypoint
happyball.start = function(){

	var FIELD_HEIGHT = 8;
	var FIELD_WIDTH = 16;
	var FIELD_SQUARE_SIZE = 50;
	var PLAYER_SIZE = FIELD_SQUARE_SIZE/2;

	var director = new lime.Director(document.body);
	director.makeMobileWebAppCapable();
	director.setDisplayFPS(false);    

	var gamescene = new lime.Scene;
	layer = new lime.Layer();
	gamescene.appendChild(layer);

	goog.events.listen(gamescene,['mousedown','touchstart'],function(e){
	    happyball.moveToPosition(happyball.selectedPlayer, gamescene.localToNode(e.position,layer));
	})

	happyball.player_sprites = new lime.SpriteSheet('assets/p.png', lime.ASSETS.player_idle.plist);

	var sprite = happyball.createPlayer().setPosition(100,100);
    layer.appendChild(sprite);

	happyball.selectedPlayer = sprite;
	sprite.select();

    sprite = happyball.createPlayer().setPosition(500,100);
    layer.appendChild(sprite);

    sprite = happyball.createPlayer().setPosition(300,200);
    layer.appendChild(sprite);

    sprite = happyball.createPlayer().setPosition(200,300);
    layer.appendChild(sprite);

    sprite = happyball.createPlayer().setPosition(400,300);
    layer.appendChild(sprite);

/*
	var anim = new lime.animation.KeyframeAnimation();
	anim.delay= .3;
	for(var i=1;i<=4;i++){
	    anim.addFrame(ss.getFrame('idle_right_'+i+'.png').
	        setSize(50,50));
	}
	for(var i=4;i>=1;i--){
	    anim.addFrame(ss.getFrame('idle_right_'+i+'.png').
	        setSize(50,50));
	}
    
    
	sprite.runAction(anim);


	var mapLayer  = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
	

	for(var i=0; i<FIELD_HEIGHT; i++) {

		for(var j=0; j<FIELD_WIDTH; j++) {
			var x = 0 + (j*FIELD_SQUARE_SIZE);
			var y = 0 + (i*FIELD_SQUARE_SIZE);

			var field = new lime.Sprite().setSize(FIELD_SQUARE_SIZE,FIELD_SQUARE_SIZE).setFill('assets/field.png').setPosition(x, y).setAnchorPoint(0, 0);
			mapLayer.appendChild(field);
		}


	}
	scene.appendChild(mapLayer);


	var playerLayer  = new lime.Layer().setPosition(0,0).setRenderer(lime.Renderer.CANVAS).setAnchorPoint(0,0);
	var player = new lime.Sprite().setSize(PLAYER_SIZE, PLAYER_SIZE).setFill('assets/player_right.png').setPosition(0, 0).setAnchorPoint(0, 0);
	playerLayer.appendChild(player);

	var player = new lime.Sprite().setSize(PLAYER_SIZE, PLAYER_SIZE).setFill('assets/player_right.png').setPosition(50, 0).setAnchorPoint(0, 0);
	playerLayer.appendChild(player);

	scene.appendChild(playerLayer);



	goog.events.listen(field, ['mousedown','touchstart'], function(e) {         
		console.log('touch');
	});

	goog.events.listen(field, 'mouseover', function(e) {         
		console.log(this);
	});



*/
/*
	//add some interaction
	goog.events.listen(target,['mousedown','touchstart'],function(e){

		//animate
		target.runAction(new lime.animation.Spawn(
			new lime.animation.FadeTo(.5).setDuration(.2),
			new lime.animation.ScaleTo(1.5).setDuration(.8)
		));

		title.runAction(new lime.animation.FadeTo(1));

		//let target follow the mouse/finger
		e.startDrag();

		//listen for end event
		e.swallow(['mouseup','touchend'],function(){
			target.runAction(new lime.animation.Spawn(
				new lime.animation.FadeTo(1),
				new lime.animation.ScaleTo(1),
				new lime.animation.MoveTo(512,384)
			));

			title.runAction(new lime.animation.FadeTo(0));
		});


	});
*/
	// set current scene active
	director.replaceScene(gamescene);

}

happyball.createPlayer = function(){
    var sprite = new lime.Sprite().setPosition(200,200)
        .setFill(happyball.player_sprites.getFrame('idle_right_1.png'));

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

	sprite.runAction(anim);
	
	// show if monster is selected
	var light = new lime.Circle().setSize(6,6).setFill('#f90').setPosition(0,-40).setHidden(true);
	sprite.appendChild(light);
	
	sprite.select = function(){
	    if(happyball.selectedPlayer)
	        happyball.selectedPlayer.deselect();
	    light.setHidden(false);
	    happyball.selectedPlayer = this;
	}
	sprite.deselect = function(){
	    light.setHidden(true);
	}
	
	// other element for hit area because original images have edges and I didn't crop
	var hitarea = new lime.Sprite().setSize(50,80);
	sprite.appendChild(hitarea);
	
	goog.events.listen(hitarea,['mousedown','touchstart'],function(e){
	    this.select();
	    e.event.stopPropagation();
	},false,sprite)
	
	return sprite;
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
