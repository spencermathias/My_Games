//subtract tiles at end
//TODO: be able to turn in tiles and get new ones
//TODO: send current board state to new connections
//subtract remaining tiles

var express = require("express");
var http = require("http");
var io = require("socket.io");
var shared = require('./htmlSpencers/js/shared.js'); //get shared functions

//const spawn = require("child_process").spawn;

var app = express();
app.use(express.static("./htmlSpencers")); //working directory
//Specifying the public folder of the server to make the html accesible using the static middleware

var socket = 8080;
//var server = http.createServer(app).listen(8080); //Server listens on the port 8124
var server = http.createServer(app).listen(socket,"0.0.0.0",511,function(){console.log(__line,"Server connected to socket: "+socket);});//Server listens on the port 8124
io = io.listen(server);
/*initializing the websockets communication , server instance has to be sent as the argument */

var minPlayers = 2;
var maxPlayers = 20;

var allClients = [];
var players = [];
var spectators = [];

var currentTurn = 0;

var boardRows = 9;
var boardColumns = 9;
var boardState = [];

var tiles = [];
var allTiles = [];

var gameMode = {
    LOBBY: 0,
    PLAYTILE: 1,
	MOVEORQUESTION: 2,
    END: 3
};

var playerStatus = {
	PLAYER: 0,
	SPECTATOR: 1
}

var gameStatus = gameMode.LOBBY;

var serverColor = "#ffff00";
var gameColor = "#00ff00";
var gameErrorColor = "#ff0000";
var chatColor = "#ffffff";
var readyColor = "#ffffff";
var notReadyColor = "#ff0000";
var readyTitleColor = "#00ff00";
var notReadyTitleColor = "#ff0000";
var spectatorColor = "#444444";
var notYourTurnColor = "#ffffff";
var yourTurnColor = "#0000ff";


console.log("Server Started!");

function defaultUserData(){
	return {
		userName: "Unknown",
		tiles: [],
		score: 0,
		statusColor: notReadyColor,
		ready: false,
		skippedTurn: false
	}
}

io.sockets.on("connection", function(socket) {
    socket.userData = defaultUserData();

    allClients.push(socket);
    if (gameStatus === gameMode.LOBBY) {
        socket.userData.statusColor = notReadyColor;
    } else {
		spectators.push(socket);
        socket.userData.statusColor = spectatorColor;
        updateBoard(socket, notReadyTitleColor, true);
		updateUsers(socket);
		socket.emit("allTiles", allTiles);
		socket.emit('boardState', boardState);
    }

	message(socket, "Connection established!", serverColor)

    console.log(__line, "Socket.io Connection with client " + socket.id +" established");

    socket.on("disconnect",function() {
		message( io.sockets, "" + socket.userData.userName + " has left.", serverColor);
		message( io.sockets, "Type 'kick' to kick disconnected players", serverColor);
        console.log(__line,"disconnected: " + socket.userData.userName + ": " + socket.id);
        var i = allClients.indexOf(socket);
        if(i >= 0){ allClients.splice(i, 1); }
		var i = spectators.indexOf(socket);
        if(i >= 0){ spectators.splice(i, 1); }
		updateUsers();
        //players are only removed if kicked
    });
	
	socket.on('oldId', function(id){
		console.log(__line, "oldID:", id);
		for(var i = 0; i < players.length; i++){
			if(players[i].id == id){
				console.log(__line, "found old player!", players[i].userData.username, socket.userData.userName);
				var j = spectators.indexOf(socket);
				if(j >= 0){spectators.splice(j, 1)};
				socket.userData = players[i].userData;
				players[i] = socket;
				socket.emit('tiles', socket.userData.tiles);
				updateTurnColor();
			} else {
				console.log(__line, "new player");
			}
		}
	});

    socket.on("message",function(data) {
        /*This event is triggered at the server side when client sends the data using socket.send() method */
        data = JSON.parse(data);

        console.log(__line, "data: ", data);
        /*Printing the data */
		message( socket, "You: " + data.message, chatColor);
		message( socket.broadcast, "" + socket.userData.userName + ": " + data.message, chatColor);

        if(data.message === "end") {
            console.log(__line,"forced end");
            gameEnd();
        } else if(data.message === "start") {
            console.log(__line,"forced start");
            gameStart();
        } else if(data.message.toLowerCase() === "kick"){
			console.log(__line, "clearing players");
			for(var i = players.length-1; i >= 0; i--){
				if(players[i].disconnected){
					message( io.sockets, "" + players[i].userData.userName + " has been kicked!", chatColor);
					players.splice(i, 1);
				}
			}
			if( players.length < minPlayers) {
				gameEnd();
			} else {
				updateTurnColor();
			}
		}
        /*Sending the Acknowledgement back to the client , this will trigger "message" event on the clients side*/
    });

    socket.on("userName", function(userName) {
        socket.userData.userName = userName;
        //socket.userData.ready = false;
        console.log(__line,"added new user: " + socket.userData.userName);
		message(io.sockets, "" + socket.userData.userName + " has joined!", serverColor);
        updateUsers();
    });

    socket.on("ready", function(ready) {
        if (gameStatus === gameMode.LOBBY){
            socket.userData.ready = ready.ready;
			if (socket.userData.ready === true) {
				socket.userData.statusColor = readyColor;
				updateBoard(socket, readyTitleColor , false);
			} else {
				socket.userData.statusColor = notReadyColor;
				updateBoard(socket, notReadyTitleColor , false);
			}
            checkStart();
			console.log(__line,"" + socket.userData.userName + " is ready: " + ready.ready);
            updateUsers();
        }
    });
	
	socket.on("recieveTile", function(tile){
		if (gameStatus === gameMode.PLAYTILE){
			//check if already recieved
				//if not, 
					//set as picked, 
					//change status color
					//place tile on board, 
					//remove tile from player, 
					//pick new tile if any, 
					//update player hand
					//record move
					//
				//if so, do nothing
			//check if everyone has submitted
				//if so, game mode = question or move and update ui to show questions and moves
				//choose first person to go and update status color
		}
	});
	
	socket.on("recieveMove", function(movement){
		if (gameStatus === gameMode.MOVEORQUESTION){
			//check if it is current player turn
				//t: check if valid position
					//t: move, update board, send to all players, increment current player turn
		}
	});
	
	socket.on("recievePlayedCard", function(card){
		if (gameStatus === gameMode.MOVEORQUESTION){
			//check if it is current player turn
				//send the selected choice for that card to the socket
		}
	});
	
	socket.on("recieveDistanceQuestion", function(tile){
		if (gameStatus === gameMode.MOVEORQUESTION){
			//check if it is current player turn
				//check if valid point to check from
					//calculate distance and send to socket
					//increment current players turn
		}
	});
	
});

function checkStart() {	
    if( gameStatus === gameMode.LOBBY) {
        var readyCount = 0;
        allClients.forEach(function(client) {
            if( client.userData.ready ) {
                readyCount++;
            }
        });
        if(readyCount == allClients.length && readyCount >= minPlayers) {
            gameStart();
        }
    }
}

function gameStart() {
	console.log(__line,"gameStart");
	message(io.sockets, "THE GAME HAS STARTED", gameColor);
	gameStatus = gameMode.PLAYTILE; //wait for every one to chose a tile via recieveTile
	//reset players
	players = [];
	spectators = [];
	allClients.forEach(function(client){ 
		if(client.userData.ready){
			client.userData.statusColor = notYourTurnColor;
			client.userData.tiles = [];
			client.userData.score = 0;
			//client.userData.skippedTurn = false;
			players.push(client);
		} else {
			client.userData.statusColor = spectatorColor;
		}
	});
	
	setUpBoard();
	updateBoard(io.sockets, readyTitleColor, true); //changes screen from lobby to board
	currentTurn = Math.floor(Math.random()*players.length); //random starting person

	//console.log(__line,players[currentTurn%players.length].userData.userName + " starts the game!");
	//message(io.sockets, players[currentTurn%players.length].userData.userName + " starts the game!", gameColor);
	
    tiles = makeTiles(); //deck to deal to players
	//console.log(__line, "cards", tiles);
	allTiles = [];
	for(var i =0; i < tiles.length; i++){
		allTiles.push(tiles[i]); //deck to reference cards
	}
	io.sockets.emit("allTiles", allTiles);
	//console.log(__line, "alltiles", allTiles);
	
	players.forEach(function(player) {
		//player.userData.tiles = [];
		dealTiles(player, shared.numberOfTilesForHand);
		//console.log(__line, "player", player.userData.name,player.userData.tiles);
	});
	
	//console.log(__line, "cards", tiles);
	//console.log(__line, "allTiles", allTiles);

	updateTurnColor();
	//wait for turn plays
}

function setUpBoard(){ //set all positions on the board to -1 to indicate no tile
	var row;
	var column;
	boardState = [];
	var boardRow;
	for (row = 0; row < boardRows; row++){
		boardRow = [];
		for (column = 0; column < boardColumns; column++){
			boardRow.push(shared.blankTile.id); //pushes id of tiles to the board
		}
		boardState.push(boardRow);
	}
	
	//TODO: place starting pawns
	sendBoardState();
}

function nextTurn(){
	if(checkEnd()){
		gameEnd();
	} else {
		currentTurn = (currentTurn + 1) % players.length;
		/*if(players[currentTurn].userData.tiles.length != 0){
			console.log("It is " + players[currentTurn].userData.userName + "'s turn!")
			message(players[currentTurn], "It is your turn!", gameColor);
		} else {
			players[currentTurn].userData.skippedTurn = true;
			nextTurn();
		}*/
	}
}

function message(socket, message, color){
	var messageObj = {
		data: "" + message,
		color: color
	};
	socket.emit('message',JSON.stringify(messageObj));
}

function updateUsers(target = io.sockets){
	console.log(__line,"--------------Sending New User List--------------");
    var userList = [];
	if(gameStatus == gameMode.LOBBY){
		allClients.forEach(function(client){
			userList.push(getUserSendData(client));
		});
	} else {
		players.forEach(function(client){
			userList.push(getUserSendData(client));
		});
		spectators.forEach(function(client){
			userList.push(getUserSendData(client));
		});
	}
    console.log(__line,"----------------Done Sending List----------------");
	
	io.sockets.emit('userList', userList);
}

function getUserSendData(client){
	console.log(__line,"userName:", client.userData.userName, " |ready:", client.userData.ready, "|status:", client.userData.statusColor, "|score:", client.userData.score);
	return{
		id: client.id,
		userName: client.userData.userName,
		color: client.userData.statusColor,
		score: client.userData.score
	};
}

function updateBoard(socketSend, titleColor, showBoard) { //switches between title and game screen
    var showBoardMessage = {
        titleColor: titleColor,
        displayTitle: (showBoard === true) ? "none" : "flex",
        displayGame: (showBoard === true) ? "flex" : "none"
    };
    socketSend.emit("showBoard", showBoardMessage);
}




function sendBoardState(){
	io.sockets.emit("boardState", boardState);
}

function makeTiles() { //TODO: integrate into make deck class
    var cards = [];
	var i;
	var tileId = 0;

    cards.push({owner: "deck", options: {blue: 'DR', green: 'DL'}, id: tileId++});
    cards.push({owner: "deck", options: {green: 'DR', blue: 'DL'}, id: tileId++});
	
	cards.push({owner: "deck", options: {blue: 'RU', green: 'RD'}, id: tileId++});
    cards.push({owner: "deck", options: {green: 'RU', blue: 'RD'}, id: tileId++});
	
	cards.push({owner: "deck", options: {blue: 'LU', green: 'LD'}, id: tileId++});
    cards.push({owner: "deck", options: {green: 'LU', blue: 'LD'}, id: tileId++});
	
	cards.push({owner: "deck", options: {blue: 'UR', green: 'UL'}, id: tileId++});
    cards.push({owner: "deck", options: {green: 'UR', blue: 'UL'}, id: tileId++});
	
	cards.push({owner: "deck", options: {blue: 'L', green: 'R'}, id: tileId++});
	cards.push({owner: "deck", options: {blue: 'L', green: 'R'}, id: tileId++});
    cards.push({owner: "deck", options: {green: 'L', blue: 'R'}, id: tileId++});
    cards.push({owner: "deck", options: {green: 'L', blue: 'R'}, id: tileId++});
	
	cards.push({owner: "deck", options: {blue: 'U', green: 'D'}, id: tileId++});
	cards.push({owner: "deck", options: {blue: 'U', green: 'D'}, id: tileId++});
    cards.push({owner: "deck", options: {green: 'U', blue: 'D'}, id: tileId++});
    cards.push({owner: "deck", options: {green: 'U', blue: 'D'}, id: tileId++});
	
	cards.push({owner: "deck", options: {blue: 'DD', green: ''}, id: tileId++});
    cards.push({owner: "deck", options: {green: 'DD', blue: ''}, id: tileId++});
	
	cards.push({owner: "deck", options: {blue: 'UU', green: ''}, id: tileId++});
    cards.push({owner: "deck", options: {green: 'UU', blue: ''}, id: tileId++});
	
	cards.push({owner: "deck", options: {blue: 'LL', green: ''}, id: tileId++});
    cards.push({owner: "deck", options: {green: 'LL', blue: ''}, id: tileId++});
	
	cards.push({owner: "deck", options: {blue: 'RR', green: ''}, id: tileId++});
    cards.push({owner: "deck", options: {green: 'RR', blue: ''}, id: tileId++});

    return cards;
}

function dealTiles(player, amountToBeDelt) {
	var tileToGive;
	var i;
	for( i = 0; i < amountToBeDelt; i+=1) {
		if(tiles.length > 0){
			tileToGive = chooseRandomTile();
			tileToGive.owner = player.id;
			player.userData.tiles.push(tileToGive);
		}
	}
	player.emit("tiles", player.userData.tiles);
}

function chooseRandomTile() {
	if(tiles.length > 0){
		var index = Math.floor(Math.random() * tiles.length);
		var returnTile = tiles[index];
		tiles.splice(index, 1);
		return returnTile;
	}
}

function updateTurnColor(){
	if(players.length > 0){
		players.forEach(function(player){
			player.userData.statusColor = notYourTurnColor;
		});
		players[currentTurn%players.length].userData.statusColor = yourTurnColor;
		console.log(__line,'update turn color');
		updateUsers();
	}
}
/*
function returnTileToDeck(player, tile, tileDeck) {
	var tileIndex = player.userData.tiles.indexOf(tile);
	if (tileIndex >= 0){
		player.userData.tiles.splice(tileIndex, 1);
		tileDeck.push(tile);
		player.emit("tiles", player.userData.tiles);
		return true;
	} else{
		console.log(__line, "tile not found!")
		player.emit("tiles", player.userData.tiles);
		return false;
	}
}*/

function playersHaveTiles(){ //to check end conditions
	var i;
	var have = false;
	for(i=0; i<players.length; i += 1){
		if(players[i].userData.tiles.length > 0){
			have = true;
		}
	}
	return have;
}

/*
function allSkipped(){
	var allSkipped = true; //check if everyone has skipped
	for(var i = 0; i < players.length; i++){
		if(!players[i].userData.skippedTurn){
			allSkipped = false;
		}
	}
	return allSkipped;
}*/

function checkEnd(){
	//return (!playersHaveTiles() || allSkipped());
}

function gameEnd() {
    console.log(__line,"gameEnd");
    updateBoard(io.sockets, notReadyTitleColor, false);

	message(io.sockets, "THE GAME HAS ENDED", gameColor);
	message(io.sockets, "Scores: ", gameColor);
	let total = 0;
	for( var i = 0; i < players.length; i += 1){
		for(var tile = 0; tile < players[i].userData.tiles.length; tile++){
			players[i].userData.score -= players[i].userData.tiles[tile].number;
		}
		message(io.sockets, players[i].userData.userName + ": " + players[i].userData.score + "\n", gameColor);
		total += players[i].userData.score;
	}
	message(io.sockets, "Total score: " + total, gameColor);
	
    players = [];
	spectators = [];
    allClients.forEach(function(client) {
        client.userData.ready = false;
        client.userData.statusColor = notReadyColor;
    });
    gameStatus = gameMode.LOBBY;
    updateUsers();
}



//captures stack? to find and return line number
Object.defineProperty(global, '__stack', {
  get: function(){
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack){ return stack; };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  }
});
//allows to print line numbers to console
Object.defineProperty(global, '__line', {
  get: function(){
    return __stack[1].getLineNumber();
  }
});

//allows input from the console
var stdin = process.openStdin();

stdin.addListener("data", function(d) {
    // note:  d is an object, and when converted to a string it will
    // end with a linefeed.  so we (rather crudely) account for that  
    // with toString() and then trim() 
	var input = d.toString().trim();
    console.log('you entered: [' + input + ']');
	try{
		eval("console.log("+input+")");
	} catch (err) {
		console.log("invalid command");
	}
  });