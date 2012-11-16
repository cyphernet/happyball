goog.provide('happyball.Square');

goog.require('lime.Sprite');

happyball.Square = function(column, row) {
	goog.base(this);

	var x = column*50;
	var y = row*50;

	// check if square is outside of field
	var current_location = happyball.selectedPlayer.location;
	var new_x = current_location.column+column;
	var new_y = current_location.row+row;

	if(new_x < 19 && new_y < 10 && new_x > -1 && new_y > -1)
		this.setSize(50,50).setFill(255, 217, 102, .4).setPosition(x, y).setAnchorPoint(0, 0);
}
goog.inherits(happyball.Square, lime.Sprite);