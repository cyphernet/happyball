//set main namespace
goog.provide('happyball');


//get requirements
goog.require('lime.Director');
goog.require('lime.Scene');
goog.require('lime.Layer');
goog.require('lime.Circle');
goog.require('lime.Label');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.FadeTo');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.MoveTo');


// entrypoint
happyball.start = function(){

	var FIELD_HEIGHT = 8;
	var FIELD_WIDTH = 16;
	var FIELD_SQUARE_SIZE = 90;
	var PLAYER_SIZE = FIELD_SQUARE_SIZE/2;

	var director = new lime.Director(document.body);
	var scene = new lime.Scene();

	director.makeMobileWebAppCapable();
	director.setDisplayFPS(false);    

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

	scene.appendChild(playerLayer);



	goog.events.listen(field, ['mousedown','touchstart'], function(e) {         
		console.log('touch');
	});



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
	director.replaceScene(scene);

}


//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('happyball.start', happyball.start);
