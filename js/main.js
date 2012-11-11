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
	var COLOR_MOVEMENT = '#FFD966';
	var COLOR_MOVEMENT_HOVER = '#E2C05A';
	var COLOR_OPPONENT = '#FF007A';

	var TEAM_SIZE = 6;
	
	var my_team = [];
	var game = {
		turn: 1,
		stage: 1,
		score: 0,
		points: 0,
		room: 0
	};
	var socket = io.connect();
	var game_id = null;

	// Game objects
	function Player() {
		this.id = 0;
		this.level = 1;
		this.location = 0;
		this.move = function (target) {
			console.log(this.id + ' moved');
			$($('.field_square')[this.location]).html('');
			this.location = target;
			placePlayer(this.id, this.stats.position, this.location);
			resetMovementField();
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
				my_team[player_index].move($(".field_square").index(this));
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
	var menu = '<div id="menu" style="height: 130px; width: 80px; position:absolute; background-color:#B7B7B7;display:none;"><div>Menu</div><div id="move">move</div></div>';
	$('body').append(menu);
	
	// Action logic
	$('#move').click(function(){
		var player_index = $('#menu').attr('player');
		my_team[player_index].showMovement();
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
	var hud = '<div style="float:right;">Happyball<div id="hud"></div><div id="game_log"><pre></pre></div></div>';
	$('body').append(hud);

	// Game start
	generateRoom();

	$(".player").hover(
		function () {
			$(this).css('background-color', COLOR_PLAYER_HOVER);
		},
		function () {
			$(this).css('background-color', COLOR_PLAYER);
		}
	);
	
	$(".player").click(function(){
		var pos = $(this).offset();
		var g = $(this).width()/2;
		$('#menu').show();
		$('#menu').offset({top: pos.top+g, left: pos.left+g});
		var player_id = $(this).attr('player_id');

		$('#menu').attr('player', player_id);
	});
	
	function generateTeam(opponent) {
		if(opponent !== null) {
			if(opponent)
				game.type = 1;
			else
				game.type = 0;
		} else {
			game.type = randomFromInterval(0, GAME_TYPES.length-1);
		}

		for(var i=0; i<TEAM_SIZE; i++) {
			var newPlayer = new Player();
			newPlayer.id = my_team.length;
			newPlayer.location = generatePlayerPosition();
			newPlayer.stats = GAME_TYPES[game.type].positions[randomFromInterval(0, GAME_TYPES[game.type].positions.length-1)];
			my_team.push(newPlayer);
		}

		console.log('generateTeam');
		socket.emit('team', {
			room_id: game_id,
			name: $('#name').val(),
			team: my_team,
			game_state: game
		});
	}

	function generatePlayerPosition() {
		var pos = 0;
		do {
			if(game.type == 'offense')
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

	function renderTeam(team) {
		if(team == my_team)
			var color = COLOR_PLAYER;
		else
			var color = COLOR_OPPONENT;
		for (var i = 0; i < team.length; i++) {
			placePlayer(team[i].id, team[i].stats.position, team[i].location, color);
		};
		renderHUD();
	}

	function placePlayer(id, name, pos, color) {
		$($('.field_square')[pos]).html('<div player_id="'+id+'" class="player" style="background-color:'+color+';width:'+PLAYER_SIZE+'px;height:'+PLAYER_SIZE+'px;">'+name+'</div>');
	}

	function showSquare(square, current_row) {
		var target_row = Math.floor((square/FIELD_WIDTH)+1);

		if(current_row == -1 || current_row == target_row) {
			if(!isPlayerHere(square)) {
				$($(".field_square")[square]).css('background-color', COLOR_MOVEMENT);
				$($(".field_square")[square]).addClass('move_to');
				return true;
			}
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
		game_stats += '<tr><td>ID</td><td>Level</td><td>Location</td><td>Position</td></tr>';
		for (var i = 0; i < my_team.length; i++) {
			game_stats += '<tr><td>'+my_team[i].id+'</td><td>'+my_team[i].level+'</td><td>'+my_team[i].location+'</td><td>'+my_team[i].stats.position+'</td></tr>';
		};
		game_stats += '</table>';
		$('#hud').html(game_stats);
	}

	function generateRoom() {
		var host = true;

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

		console.log('init');
		socket.emit('init', {
			room_id: game_id,
			user_id: user_id,
			name: $('#name').val()
		});

		game_log('Game start.');
		game_log('Waiting for opponent.');

		socket.on('opponent', function (data) {
			console.log('opponent');
			console.log(data);

			if(host) {
				generateTeam(null);
				renderTeam(my_team);
				game_log($('#name').val()+' is on '+GAME_TYPES[game.type].name);
			}
		});

		socket.on('team', function (data) {
			console.log('team');
			console.log(data);
			if(!host) {
				generateTeam(data.game_state.type.name);
				renderTeam(my_team);
				game_log($('#name').val()+' is on '+GAME_TYPES[data.game_state.type].name);
			}
			renderTeam(data.team);
			game_log(data.name+' is on '+GAME_TYPES[data.game_state.type].name);
		});
	}

	function game_log(text) {
		var d = new Date();
		var date = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
		$('#game_log').append('['+date+'] '+text+'<br/>');
	}

	function createId() {
		var num = randomFromInterval(1000, 9000);
		var ts = Math.round((new Date()).getTime() / 1000);
		return num+ts;
	}
});