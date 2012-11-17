goog.provide('happyball.Menu');

goog.require('lime.Sprite');
goog.require('lime.fill.LinearGradient');

happyball.Menu = function(player) {

	var gradient = new lime.fill.LinearGradient().
	        setDirection(1,0,1,1).
	        addColorStop(0,239,239,239,1).
	        addColorStop(1,148,148,148,1);
	
	// Container holds all the menu items
	var container = new lime.Sprite().setPosition(25, 25).setFill(gradient).setAnchorPoint(0, 0).setStroke(2,'#000');

	// Creates a single menu item with all its functions
	this.createMenuItem = function(txt) {
	
		var men_items = container.getNumberOfChildren();
		var pos_y = men_items*50;

		var menu_item = new lime.Sprite().setPosition(0, pos_y).setAnchorPoint(0, 0);

		var lbl = new lime.Label().setText(txt).setSize(130, 50).setFontSize(24).setFontColor('#c00').setAnchorPoint(0, 0).
	        setAlign('right').setPadding(5, 20).setShadow('#000',2,1,1);
	    menu_item.appendChild(lbl);

        var ball_select = new lime.Sprite().setSize(28, 16).setFill('assets/ball_select.png').setPosition(10, 15).setAnchorPoint(0, 0).setHidden(true);
		
		menu_item.appendChild(ball_select);

		// Hover event
		goog.events.listen(lbl, 'mouseover', function(e) { 
			ball_select.setHidden(false);

			var key = goog.events.listen(this.getParent().getParent().getParent().getParent(), 'mousemove', function(e) {
				if (!this.hitTest(e))
				{
					ball_select.setHidden(true);
					goog.events.unlistenByKey(key);
				}	

			},null,this);
			
		});

		// Click event
		goog.events.listen(lbl,['mousedown','touchstart'],function(e){
			if(txt == 'move' && happyball.selectedPlayer)
				happyball.selectedPlayer.showMovement(player.game_vars.stats.distance);
			if(txt == 'throw')
				happyball.selectedPlayer.showMovement(player.game_vars.stats.skill);
			e.event.stopPropagation();
		},false,lbl);

	    return menu_item;
	}


    var lbl = this.createMenuItem('move');
    container.appendChild(lbl);
    
console.log(player.game_vars);
    if(player.game_vars.hasBall === 1 && player.game_vars.stats.position == 'qb') {

	    var lbl = this.createMenuItem('throw');
	    container.appendChild(lbl);
    }


    var num_children = container.getNumberOfChildren();
    container.setSize(130, num_children*50);

    return container;
}




