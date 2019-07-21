//subtract tiles at end
//TODO: be able to turn in tiles and get new ones
//TODO: send current board state to new connections
//subtract remaining tiles

var express = require("express");
var http = require("http");
var io = require("socket.io");
var yesno = require('./MooseServer/js/quick.js')
var shared = require('./MooseServer/js/shared.js'); //get shared functions

//const spawn = require("child_process").spawn;

var app = express();
app.use(express.static("./MooseServer")); //working directory
//Specifying the public folder of the server to make the html accesible using the static middleware

var socket = 8080;
//var server = http.createServer(app).listen(8080); //Server listens on the port 8124
var server = http.createServer(app).listen(socket,"0.0.0.0",511,function(){console.log(__line,"Server connected to socket: "+socket);});//Server listens on the port 8124
io = io.listen(server);
/*initializing the websockets communication , server instance has to be sent as the argument */

var minPlayers = 1;
var maxPlayers = 20;

var allClients = [];
var players = [];
var spectators = [];

var currentTurn = 0;

var boardRows = 9;
var boardColumns = 9;
var boardState = [];

//var tiles = [];
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
var colorlist=[
"#000000","#00ff00","#00ffff","#ff00ff",
"#ff0000","#0000ff","#ffff00","#ffffff"
]
var playedcards=[]
var allPlayedcards = []
var moose=''
var cards = undefined
var partTurn=2


console.log("Server Started!");

function defaultUserData(){
	//nextUserID++
	return {
		userName: "Unknown",
		tiles: [],
		score: 0,
		statusColor: notReadyColor,
		ready: false,
		playedCard: false,
		ID:-1
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
				//updateTurnColor();
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
			if (!socket.userData.playedCard){
				socket.userData.playedCard=true
				if(currentTurn==-1){currentTurn=(socket.userData.ID+players.length-1)%players.length}
				allPlayedcards[socket.userData.ID]=tile.ID
				playedcards.push(tile.ID)
				console.log(tile.ID)
				moose+=tile.path
				yesno.moose=moose
				let theTiles=socket.userData.tiles
				theTiles.splice(theTiles.findIndex(ID => ID === tile.ID),1)
				socket.userData.tiles=theTiles.concat(cards.deal())
				socket.emit("tiles", socket.userData.tiles)
				console.log(playedcards)
				io.sockets.emit('playedTiles',allPlayedcards)
				checkmoose()
			}
		}
	});
	
	socket.on("recieveMove", function(movement){
		if (gameStatus === gameMode.MOVEORQUESTION){
			console.log(socket.userData.ID)
			console.log("currentTurn "+currentTurn)
			if(socket.userData.ID==currentTurn){
				console.log("recieved move")
				if(shared.validMove(movement)){
					console.log('validMove')
					for(let i=0; i<boardState.length; i++){
						console.log(i)
						let x=boardState[i].findIndex(ID => ID === currentTurn)
						if(x!=-1){
							let newLocation = shared.addcord({x:x,y:i},movement)
							newLocation.x%=boardState.length
							newLocation.y%=boardState.length
							console.log(newLocation.x)
							boardState[i][x]=-1
							boardState[newLocation.y][newLocation.x]=currentTurn
							break
						}
					}
				}
				//boardState=shared.validMove(movement,boardState,currentTurn)
				partTurn-=1
				sendBoardState()
				if(partTurn<1){
					nextTurn()
				}
				
			}else{
				console.log(__line,'outofTurn');
				message( socket, 'It is not your turn!', gameErrorColor);
			}
		}
			//check if it is current player turn
				//t: check if valid position
					//t: move, update board, send to all players, increment current player turn
	});
	
	socket.on("recievePlayedCard", function(card){
		if (gameStatus === gameMode.MOVEORQUESTION){
				if(socket.userData.ID==currentTurn){
					//check to see if card has been played 
						//send which choice was selected 
				}else{
				console.log(__line,'outofTurn');
				message( socket, 'It is not your turn!', gameErrorColor);
			}
			//check if it is current player turn
				//send the selected choice for that card to the socket
		}
	});
	
	socket.on("foundMoose", function(){
		var moosecord=shared.parsePath(moose)
		moosecord.y=moosecord.dy
		moosecord.x=moosecord.dx
		moosecord=shared.addcord(moosecord,{x:4,y:4})
		//message(socket,moosecord.y, gameErrorColor)
		console.log('here')
		for(let i=0; i<boardState.length; i++){
			let x=boardState[i].findIndex(ID => ID === socket.userData.ID)
			if(x!=-1){
				let newLocation = shared.addcord({x:x,y:i},moosecord,-1)
				if(newLocation.x===0 && newLocation.y===0){
					message(socket,'you win', gameColor)
					gameEnd()
				}else{
					message(socket,'you lose', gameColor)
					gameEnd()
				}
			}
		}

	});

	socket.on("recieveDistanceQuestion", function(tileID){
		if (gameStatus === gameMode.MOVEORQUESTION){
			if(socket.userData.ID==currentTurn){
				if(partTurn==2){
					if (tileID!=-1){
						var moosecord=shared.parsePath(moose)
						moosecord.y=moosecord.dy
						moosecord.x=moosecord.dx
						moosecord=shared.addcord(moosecord,{x:4,y:4})
						console.log('moosecord',moosecord.x,moosecord.y)
						let mooseDistance={}
						let name=''
						if (tileID>=0) {
							console.log(tileID)
							for(let i=0; i<boardState.length; i++){
								let x=boardState[i].findIndex(function(ID){return (ID == tileID)})
								console.log(i)
								if(x!=-1){
									mooseDistance=shared.addcord({x:x,y:i},moosecord,-1)
									currentTurn++
									currentTurn%=players.length
									name=players[tileID].userData.userName
									console.log(players[tileID].userData.userName,x,i)
									console.log('moosecord',moosecord.x,moosecord.y)
									break
								}
							}
						}else{
							name=''+tileID
							switch(tileID){
								case 'N':
									mooseDistance=shared.addcord({x:4,y:-1},moosecord,-1)
									currentTurn++
									currentTurn%=players.length
									break
								case 'E':
									mooseDistance=shared.addcord({x:9,y:4},moosecord,-1)
									currentTurn++
									currentTurn%=players.length
									break
								case 'S':
									mooseDistance=shared.addcord({x:4,y:9},moosecord,-1)
									currentTurn++
									currentTurn%=players.length
									break
								case 'W':
									mooseDistance=shared.addcord({x:-1,y:4},moosecord,-1)
									currentTurn++
									currentTurn%=players.length
									break
								default:
									console.log("not an option")
							}
						}
						let mooseDist=Math.abs(mooseDistance.x)+Math.abs(mooseDistance.y)
						moosecall='The moose is '+mooseDist+" away from "+name 
						let mooselen=Math.abs(mooseDistance.x)+Math.abs(mooseDistance.y)
						message( io.sockets, moosecall , gameColor);
						nextTurn()
					}
				}
			}else{
				console.log(__line,'outofTurn');
				message( socket, 'It is not your turn!', gameErrorColor);
			}

			//check if it is current player turn
				//check if valid point to check from
					//calculate distance and send to socket
					//increment current players turn
		}
	});
	socket.on('yesnoquestion',function(text){
		message(io.sockets,text, gameColor)
		//message(io.sockets,'true',gameColor)
		let answer=yesno.solveStr(text)
		if(answer=='0'||answer=='1'){
			if(answer=='1'){
				message(io.sockets,'true',gameColor)
			}else{message(io.sockets,'false',gameColor)}
		}else{
			message(io.sockets,'error',gameColor)
		}
		partTurn-=1
		if(partTurn<1){nextTurn()}
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
function checkmoose() {	
    if( gameStatus === gameMode.PLAYTILE) {
        let readyCount = 0;
        allClients.forEach(function(client) {
            if( client.userData.playedCard ) {
                readyCount++;
            }
        });
        console.log(readyCount)
        if(readyCount == players.length) {
            allClients.forEach(function(client) {
            	//client.userData.playedCard = false 
            	})

            firstPlayed=-1
            allPlayedcards=Array(players.length).fill(-1)
            moveORquestion();
            nextTurn()
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
	cards=new shared.Deck({mean:[{x:0,y:-1},{x:0,y:1},{x:1,y:0},{x:-1,y:0},0,0],dif:[{x:0,y:-1},{x:0,y:1},{x:1,y:0},{x:-1,y:0}]})
	moose=''
	playedcards=[]
	let playerCount=0
	allClients.forEach(function(client){ 
		if(client.userData.ready){
			client.userData.ID=playerCount++
			client.userData.statusColor = colorlist[client.userData.ID];
			client.userData.cards = [];
			client.userData.score = 0;
			//client.userData.skippedTurn = false;
			players.push(client);
		} else {
			client.userData.statusColor = spectatorColor;
		}
	});
	
	setUpBoard();
	updateBoard(io.sockets, readyTitleColor, true); //changes screen from lobby to board
	currentTurn = -2//Math.floor(Math.random()*players.length); random starting person
	nextTurn()
	//make deck to play with
	
    allPlayedcards = Array(players.length).fill(-1)

	//deal cards
	players.forEach(function(player) {
		player.userData.tiles=cards.deal(shared.numberOfTilesForHand)
		player.emit("tiles", player.userData.tiles)

		//console.log(__line, "player", player.userData.name,player.userData.tiles);
	});
	


	//updateTurnColor();
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
	let angle = (2*Math.PI)/(players.length)
	
	for(i = 0; i<players.length; i++){
		//console.log(players[i].)
		let yplace = Math.round(((boardRows-1)/2)*Math.cos(i*angle)+(boardRows-1)/2)
		let xplace = Math.round(((boardRows-1)/2)*Math.sin(i*angle)+(boardRows-1)/2)
		console.log('xplace',xplace,'yplace',yplace,'iangle',(i*angle))
		boardState[xplace][yplace]=players[i].userData.ID
	}
	console.log(boardState)
	sendBoardState();
}
function moveORquestion(){
	
	gameStatus = gameMode.MOVEORQUESTION
	//questions.visable=true

	//set up board with questions and move abilities

}
function nextTurn(){
	if(checkEnd()){
		gameEnd();
	} else {
		currentTurn = (currentTurn + 1)%players.length
		if(currentTurn>-1){
			if(!players[currentTurn].userData.playedCard){
				sendBoardState()
				console.log("movemose")
				players[currentTurn].userData.playedCard=false	
				currentTurn=-1
				io.sockets.emit('currentTurn',currentTurn)
				gameStatus=gameMode.PLAYTILE
				message( io.sockets, 'time to move moose' , gameColor)
				partTurn=2
			}else{
				//currentTurn = (currentTurn + 1) % players.length;
				console.log("It is " + players[currentTurn].userData.userName + "'s turn!")
				message(players[currentTurn], "It is your turn!", gameColor);
				message(io.sockets,"It is " + players[currentTurn].userData.userName + "'s turn!", gameColor)
				sendBoardState()
				io.sockets.emit('currentTurn',currentTurn)
				players[currentTurn].userData.playedCard=false
				partTurn=2	
			}
			
		}else{
			io.sockets.emit('currentTurn',-1)
			message( io.sockets, 'time to move moose' , gameColor)
		}
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
		boardID: client.userData.ID,
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
function parse(text){
	text.splice('+')
	
}



function sendBoardState(){
	io.sockets.emit("boardState", boardState);
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
    //updateBoard(io.sockets, notReadyTitleColor, false);

	message(io.sockets, "THE GAME HAS ENDED", gameColor);

	
    players = [];
	spectators = [];
    allClients.forEach(function(client) {
        client.userData.ready = false;
        client.userData.statusColor = notReadyColor;
    });
    gameStatus = gameMode.LOBBY;
    nextUserID=-1
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