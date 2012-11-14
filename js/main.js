$(function () {

	"use strict";

	// Orange - FF913D
	// #B69E67
	// #B2D0DD
	// #1E4152

	// World constants
	var FIELD_HEIGHT = 20;
	var FIELD_WIDTH = 10;
	var FIELD_SQUARE_SIZE = 50;
	var PLAYER_SIZE = FIELD_SQUARE_SIZE/2;

	var COLOR_FIELD = '#58B442';
	var COLOR_FIELD_HOVER = '#4E9F3B';
	var COLOR_PLAYER = '#00A3BB';
	var COLOR_PLAYER_HOVER = '#008FA4';
	var COLOR_PLAYER_MOVED = '#B69E67';
	var COLOR_MOVEMENT = '#FFD966';
	var COLOR_MOVEMENT_HOVER = '#E2C05A';
	var COLOR_OPPONENT = '#FF007A';

	var TEAM_SIZE = 5;
	
	var my_team = [];
	var football = null;

	var game = {
		turn: 1,
		stage: 1,
		score: 0,
		points: 0,
		turn_end: false
	};
	var socket = io.connect();
	var game_id = null;

	// Game objects
	function Player() {
		this.id = 0;
		this.level = 1;
		this.location = 0;
		this.next_move = -1;
		this.hasBall = 0;
		this.move = function (target) {
			$($('.field_square')[this.location]).html('');
			this.location = target;
			placePlayer(this.id, this.stats.position, this.location, COLOR_PLAYER);

		};

		this.create_move = function (target) {
			resetMovementField();
			this.next_move = target;
			var player_pos = $($('.field_square')[this.location]).offset();
			var next_pos = $($('.field_square')[target]).offset();

			var w = next_pos.left - player_pos.left;
			var h = next_pos.top - player_pos.top;

			if(w > 0) {
				if(h == 0) {
					h = 1;
				} else {
					w = 1;
				}
				var start_pos = player_pos;
			} else if(w < 0) {
				w *= -1;
				var start_pos = next_pos;
			} else if(h > 0) {
				var start_pos = player_pos;
				w = 1;
			} else if(h < 0) {
				var start_pos = next_pos;
				h *= -1;
				w = 1;
			}

			var t = start_pos.top+(PLAYER_SIZE);
			var l = start_pos.left+(PLAYER_SIZE);

			$('#field').append('<div class="next_move_marker" style="position:absolute;top:'+t+'px;left:'+l+'px;width:'+w+'px;height:'+h+'px;border: 1px dashed;"></div>');

			$($('.field_square')[this.location]).find('div').unbind('click');
			$($('.field_square')[this.location]).find('div').css('background-color', COLOR_PLAYER_MOVED);
			renderHUD();
		};

		this.showMovement = function () {
			resetMovementField();
			var current_row = Math.floor((this.location/FIELD_WIDTH)+1);

			// If another player is in the way, stop
			// forward
			for(var i=1; i<=this.stats.distance;i++) {
				if(!showSquare(this.location+i, current_row))
					break;
			}

			// backward
			for(var i=1; i<=this.stats.distance;i++) {
				if(!showSquare(this.location-i, current_row))
					break;
			}

			// up
			for(var i=1; i<=this.stats.distance;i++) {
				if(!showSquare(this.location-(FIELD_WIDTH*i), -1))
					break;
			}

			// down
			for(var i=1; i<=this.stats.distance;i++) {
				if(!showSquare(this.location+(FIELD_WIDTH*i), -1))
					break;
			}

			$('.move_to').click(function(){
				var player_index = $('#menu').attr('player');
				my_team[player_index].create_move($(".field_square").index(this));
			});
		}
	}

	function Football() {
		this.id = 0;
		this.location = -1;
		this.next_move = -1;
		this.move = function (target) {
			$($('.field_square')[this.location]).html('');
			this.location = target;
			placeBall(this.location);
		};

		this.create_move = function (target) {
			resetMovementField();
			this.next_move = target;
			var ball_pos = $($('.field_square')[this.location]).offset();
			var next_pos = $($('.field_square')[target]).offset();

			var w = next_pos.left - ball_pos.left;
			var h = next_pos.top - ball_pos.top;

			if(w > 0) {
				if(h == 0) {
					h = 1;
				} else {
					w = 1;
				}
				var start_pos = ball_pos;
			} else if(w < 0) {
				w *= -1;
				var start_pos = next_pos;
			} else if(h > 0) {
				var start_pos = ball_pos;
				w = 1;
			} else if(h < 0) {
				var start_pos = next_pos;
				h *= -1;
				w = 1;
			}

			var t = start_pos.top+(PLAYER_SIZE);
			var l = start_pos.left+(PLAYER_SIZE);

			$('#field').append('<div class="next_move_marker" style="position:absolute;top:'+t+'px;left:'+l+'px;width:'+w+'px;height:'+h+'px;border: 1px dashed;"></div>');

			$($('.field_square')[this.location]).find('div').unbind('click');
			$($('.field_square')[this.location]).find('div').css('background-color', COLOR_PLAYER_MOVED);
			renderHUD();
		};

		this.showMovement = function (player) {
			resetMovementField();
			var current_row = Math.floor((player.location/FIELD_WIDTH)+1);

			// If another player is in the way, stop
			// forward
			for(var i=1; i<=player.stats.skill;i++) {
				if(!showSquare(player.location+i, current_row))
					break;
			}

			// backward
			for(var i=1; i<=player.stats.skill;i++) {
				if(!showSquare(player.location-i, current_row))
					break;
			}

			// up
			for(var i=1; i<=player.stats.skill;i++) {
				if(!showSquare(player.location-(FIELD_WIDTH*i), -1))
					break;
			}

			// down
			for(var i=1; i<=player.stats.skill;i++) {
				if(!showSquare(player.location+(FIELD_WIDTH*i), -1))
					break;
			}

			$('.move_to').click(function(){
				football.create_move($(".field_square").index(this));
			});
		}
	}


	var GAME_TYPES = [{
			name: 'offense',
			positions: [{
					distance: 2,
					speed: 1,
					skill: 2,
					position: 'center'
				},{
					distance: 2,
					speed: 1,
					skill: 2,
					position: 'center'
				}, {
					distance: 4,
					speed: 2,
					skill: 1,
					position: 'running back'
				}, {
					distance: 3,
					speed: 2,
					skill: 2,
					position: 'receiver'
				}, {
					distance: 1,
					speed: 1,
					skill: 5,
					position: 'qb'
				}
			]
		}, {
			name: 'defense',
			positions: [{
					distance: 2,
					speed: 1,
					skill: 2,
					position: 'end'
				}, {
					distance: 4,
					speed: 2,
					skill: 1,
					position: 'safety'
				}, {
					distance: 3,
					speed: 2,
					skill: 2,
					position: 'safety'
				}, {
					distance: 3,
					speed: 2,
					skill: 2,
					position: 'line back'
				}, {
					distance: 3,
					speed: 2,
					skill: 2,
					position: 'line back'
				}
			]
		}
	];

	// Render field
	$('body').append('<div id="field" style="float: left;"></div>');
	var table = '<table>';
	for(var i=0; i<FIELD_HEIGHT; i++) {
		table+='<tr>';
		for(var j=0; j<FIELD_WIDTH; j++) {
			table+='<td align="center" class="field_square" style="border: 2px solid; width:'+FIELD_SQUARE_SIZE+'px;background-color:'+COLOR_FIELD+';height:'+FIELD_SQUARE_SIZE+'px;"></td>';
		}
		table+='</tr>';

	}
	table+='</table>';
	$('#field').html(table);

	// Create menu
	var menu = '<div id="menu" style="height: 130px; width: 80px; position:absolute; background-color:#B7B7B7;display:none;"><div>Menu</div><div id="move">move</div><div id="throw" style="display:none;">throw</div></div>';
	$('body').append(menu);
	
	// Action logic
	$('#move').click(function() {
		var player_index = $('#menu').attr('player');
		my_team[player_index].showMovement();
		$('#menu').hide();
	});

	$('#throw').click(function() {
		var player_index = $('#menu').attr('player');
		my_team[player_index].hasBall = 0;
		football.showMovement(my_team[player_index]);
		$('#menu').hide();
	});

	$(".field_square").hover(
		function () {
			if($(this).hasClass('move_to')) {
				$(this).css('background-color', COLOR_MOVEMENT_HOVER);
			} else {
				$(this).css('background-color', COLOR_FIELD_HOVER);
			}
		},
		function () {
			if($(this).hasClass('move_to')) {
				$(this).css('background-color', COLOR_MOVEMENT);
			} else {
				$(this).css('background-color', COLOR_FIELD);
			}
		}
	);

	// Create HUD
	var hud = '<div style="float:right;"><div style="width: 300px; float:left;"><input id="end_turn" type="button" value="End Turn"/></div><div style="float:left;">Happyball<div style="width: 300px;" id="hud"></div></div><div style="float:left;">Game Log<div id="game_log" style="width: 300px; height: 300px; overflow-y:auto;"></div></div><div style="float:left;">Chat<pre id="chat" style="width: 300px; height: 300px; overflow-y:auto;"></pre><form id="chat_form"><input id="msg" /><input type="submit" /></form></div></div>';
	$('body').append(hud);

	// Game start
	generateRoom();

	$('#end_turn').click(function(){
		if(!game.turn_end) {
			socket.emit('end_turn', {
				name: $('#name').val(), 
				game_state: game,
				team: my_team,
				ball: football
			});
			game.turn_end = true;
			game_log('game_log', 'Waiting for opponent');
		}
	});

	socket.on('new_turn', function (data) {
		game_log('game_log', 'Turn '+data.game_state.turn+'!');
		game = data.game_state;
		for (var i = data.team.length - 1; i >= 0; i--) {
			my_team[i].location = data.team[i].location;
			my_team[i].level = data.team[i].level;
			my_team[i].next_move = data.team[i].next_move;
		};
		$(".player").remove();
		$(".field_square").removeClass("ball_here");
		$(".next_move_marker").remove();
		$(".opponent_player").remove();
		
		renderHUD();
		renderTeam(my_team);
		renderTeam(data.other_team);
		renderBall(data.ball);
		console.log(data.ball);
		game.turn_end = false;
	});


	$('#chat_form').submit(function(){
		game_log('chat', $('#name').val()+': '+$('#msg').val());
		socket.emit('msg', {name: $('#name').val(), msg: $('#msg').val()});
		$('#msg').val('');
		$('#chat').scrollTop($('#chat')[0].scrollHeight);
		return false;
	});

	socket.on('chat', function (data) {
		game_log('chat', data.name+': '+data.msg);
		$('#chat').scrollTop($('#chat')[0].scrollHeight);
	});

	function generateTeam(opponent) {
		if(opponent !== null) {
			if(opponent)
				game.type = 0;
			else
				game.type = 1;
		} else {
			game.type = randomFromInterval(0, GAME_TYPES.length-1);
		}

		for(var i=0; i<TEAM_SIZE; i++) {
			var newPlayer = new Player();
			newPlayer.id = my_team.length;
			newPlayer.location = generatePlayerPosition();
			newPlayer.stats = GAME_TYPES[game.type].positions[i];
			if (newPlayer.stats.position === 'qb') {
				newPlayer.hasBall = 1;
				football.location = newPlayer.location;
			}
			my_team.push(newPlayer);
		}

		socket.emit('team', {
			name: $('#name').val(),
			team: my_team,
			game_state: game
		});
	}

	function generatePlayerPosition() {
		var pos = 0;
		do {
			if(game.type == 0)
				pos = randomFromInterval( 0, ((FIELD_HEIGHT*FIELD_WIDTH)/2) );
			else
				pos = randomFromInterval( ((FIELD_HEIGHT*FIELD_WIDTH)/2), (FIELD_HEIGHT*FIELD_WIDTH) );
		} while (isPlayerHere(pos));

		return pos;
	}

	function isPlayerHere(pos) {
		for (var i = 0; i < my_team.length; i++) {
			if(my_team[i].location == pos)
				return true;
		};
		return false;
	}

	function renderBall (ball) {
		placeBall(ball.location);
	}

	function renderTeam(team) {
		if(team == my_team)
			var color = COLOR_PLAYER;
		else
			var color = COLOR_OPPONENT;
		for (var i = 0; i < team.length; i++) {
			placePlayer(team[i].id, team[i].stats.position, team[i].location, color);
			if (team[i].hasBall === 1) {
				football.location = team[i].location;
				placeBall(team[i].location);
			}

		};
		renderHUD();
		$(".player").hover(
			function () {
				if(my_team[$(this).attr('player_id')].next_move == -1)
					$(this).css('background-color', COLOR_PLAYER_HOVER);
			},
			function () {
				if(my_team[$(this).attr('player_id')].next_move == -1)
					$(this).css('background-color', COLOR_PLAYER);
			}
		);
		
		$(".player").click(function(){
			var pos = $(this).offset();
			var g = $(this).width()/2
			var player_id = $(this).attr('player_id');
			var player = my_team[player_id];
			console.log(player);
			//Create menu based on selected player		
			if (player.stats.position === 'qb' && player.hasBall === 1)	{
				$('#throw').show();
			} else {
				$('#throw').hide();
			}		
			$('#menu').attr('player', player_id);
			$('#menu').offset({top: pos.top+g, left: pos.left+g});
			$('#menu').show();
		});
	}

	function placePlayer(id, name, pos, color) {
		if(color == COLOR_PLAYER)
			var player_div_id = 'player';
		else
			var player_div_id = 'opponent_player';	
		$($('.field_square')[pos]).html('<div player_id="'+id+'" class="'+player_div_id+'" style="background-color:'+color+';width:'+PLAYER_SIZE+'px;height:'+PLAYER_SIZE+'px;">'+name+'</div>');
	}

	function placeBall(pos) {
		console.log(football);
		console.log(pos);
		$($('.field_square')[pos]).addClass('ball_here');
	}

	function showSquare(square, current_row) {
		var target_row = Math.floor((square/FIELD_WIDTH)+1);

		if(current_row == -1 || current_row == target_row) {
			$($(".field_square")[square]).css('background-color', COLOR_MOVEMENT);
			$($(".field_square")[square]).addClass('move_to');
			return true;
		}
		return false;
	}

	function resetMovementField() {
		$(".field_square").removeClass('move_to');
		$(".field_square").css('background-color', COLOR_FIELD);
		$(".field_square").unbind('click');
	}

	function randomFromInterval(from, to) {
		return Math.floor(Math.random()*(to-from+1)+from);
	}

	function renderHUD() {
		var game_stats = '<div>Game</div><table>';
		game_stats += '<tr><td>Type</td><td>'+GAME_TYPES[game.type].name+'</td></tr>';
		game_stats += '<tr><td>Turn</td><td>'+game.turn+'</td></tr>';
		game_stats += '<tr><td>Stage</td><td>'+game.stage+'</td></tr>';
		game_stats += '<tr><td>Score</td><td>'+game.score+'</td></tr>';
		game_stats += '<tr><td>Points</td><td>'+game.points+'</td></tr>';
		game_stats += '</table>';
		game_stats += '<div>Team</div><table>';
		game_stats += '<tr><td>ID</td><td>Level</td><td>Location</td><td>Next Move</td><td>Position</td></tr>';
		for (var i = 0; i < my_team.length; i++) {
			game_stats += '<tr><td>'+my_team[i].id+'</td><td>'+my_team[i].level+'</td><td>'+my_team[i].location+'</td><td>'+my_team[i].next_move+'</td><td>'+my_team[i].stats.position+'</td></tr>';
		};
		game_stats += '</table>';
		$('#hud').html(game_stats);
	}

	function generateRoom() {
		var host = true;
		var single_player = false;

		
		football = new Football();

		if($('#name').val() == '') {
			$('#name').val('Dude-'+randomFromInterval(1, 100));
		}

		if(window.location.hash.substr(1, 1) === "g") {
			game_id = window.location.hash.substr(1, window.location.hash.length);
			host = false;
		} else {
			game_id = 'g'+createId();
			window.location.hash = game_id;
		}

		var user_id = 'u'+createId();

		socket.emit('init', {
			room_id: game_id,
			user_id: user_id,
			name: $('#name').val()
		});

		game_log('game_log', 'Game start.');
		game_log('game_log', 'Waiting for opponent.');

		if(single_player) {
			generateTeam(null);
			renderTeam(my_team);
		}

		socket.on('opponent', function (data) {
			if(host) {
				generateTeam(null);
				renderTeam(my_team);
				game_log('game_log', $('#name').val()+' is on '+GAME_TYPES[game.type].name);
			}
		});

		socket.on('team', function (data) {
			if(!host) {
				generateTeam(data.game_state.type);
				renderTeam(my_team);
				game_log('game_log', $('#name').val()+' is on '+GAME_TYPES[game.type].name);
			}
			renderTeam(data.team);
			game_log('game_log', data.name+' is on '+GAME_TYPES[data.game_state.type].name);
		});
	}

	function game_log(id, text) {
		var d = new Date();
		var date = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
		$('#'+id).append('['+date+'] '+text+'<br/>');
	}

	function createId() {
		var num = randomFromInterval(1000, 9000);
		var ts = Math.round((new Date()).getTime() / 1000);
		return num+ts;
	}
});