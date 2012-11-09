var my_team = [];
(function () {

	"use strict";
	var FIELD_HEIGHT = 10;
	var FIELD_WIDTH = 10;
	
	
	function Player() {
		this.id = 0;
		this.playerClass = 'player';
		this.level = 1;
		this.speed = 1;
		this.skill = 1;
		
		this.location = 0;
		this.move = function () {
			console.log(this.id + ' moved');
		};
	}

	$('body').append('<div id="field"></div>');
	var table = '<table>';
	for(var i=0; i<FIELD_HEIGHT; i++) {
		table+='<tr>';
		for(var j=0; j<FIELD_WIDTH; j++) {
			table+='<td align="center" class="field_square" style="border: 2px solid; width:100px;background-color:#58B442;height:100px;"></td>';
		}
		table+='</tr>';

	}
	table+='</table>';
	$('#field').html(table);
	
	var menu = '<div id="menu" style="height: 130px; width: 80px; position:absolute; background-color:#B7B7B7;display:none;"><div>Menu</div><div id="move">move</div></div>';
	$('body').append(menu);
	
	$('#move').click(function(){
		var player_position = my_team[$('#menu').attr('player')].location;
		
		$($(".field_square")[player_position+1]).css('background-color', '#FFD966');
		$($(".field_square")[player_position-1]).css('background-color', '#FFD966');
		$($(".field_square")[player_position-FIELD_WIDTH]).css('background-color', '#FFD966');
		$($(".field_square")[player_position+FIELD_WIDTH]).css('background-color', '#FFD966');
		
		
		//my_team[$('#menu').attr('player')].move();
	});

	$(".field_square").hover(
		function () {
			$(this).css('background-color', '#FF913D');
		},
		function () {
			$(this).css('background-color', '#58B442');
		}
	);
	
	for(var i=0; i<6; i++) {
	
		var pos = Math.floor((Math.random()*(FIELD_HEIGHT*FIELD_WIDTH))+0);
		var new_player = new Player();
		new_player.id = my_team.length;
		new_player.location = pos;
		my_team.push(new_player);
		
		$($('.field_square')[pos]).html('<div player_id="'+new_player.id+'" class="player" style="background-color:#00A3BB;width:50px;height:50px;"></div>');
	}
	
	$(".player").hover(
		function () {
			$(this).css('background-color', '#FF007A');
		},
		function () {
			$(this).css('background-color', '#00A3BB');
		}
	);
	
	$(".player").click(function(){
		var pos = $(this).offset();
		var g = $(this).width()/2;
		$('#menu').offset({top: pos.top+g, left: pos.left+g});
		$('#menu').show();
		var player_id = $(this).attr('player_id');

		$('#menu').attr('player', player_id);
	});

}());