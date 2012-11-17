goog.provide('happyball.Square');

goog.require('lime.Sprite');
goog.require('lime.Polygon');

happyball.Square = function(column, row) {
	goog.base(this);

	var x = column*50;
	var y = row*50;

	// check if square is outside of field
	var current_location = happyball.selectedPlayer.game_vars.location;
	var new_x = current_location.column+column;
	var new_y = current_location.row+row;

	if(new_x < 20 && new_y < 10 && new_x > -1 && new_y > -1)
		this.setSize(50,50).setFill(255, 217, 102, .4).setPosition(x, y).setAnchorPoint(0, 0);

	var line_to_player = happyball.createLine(3, 25, 25, (-x)+25, (-y)+25).setFill('#000').setHidden(true);
	this.appendChild(line_to_player);

	// Mousehover function
	goog.events.listen(this, 'mouseover', function(e) { 
		line_to_player.setHidden(false);

		var key = goog.events.listen(this.getParent().getParent().getParent(), 'mousemove', function(e) {
			if (!this.hitTest(e))
			{
				line_to_player.setHidden(true);
				goog.events.unlistenByKey(key);
			}	

		},null,this);
		
	});

	// Click event
	goog.events.listen(this,['mousedown','touchstart'],function(e){
		happyball.selectedPlayer.createMove(column, row);
		e.event.stopPropagation();
	},false,this);
}
goog.inherits(happyball.Square, lime.Sprite);