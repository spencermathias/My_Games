//server on
//path to files
var express = require("express");
var http = require("http");
var io = require("socket.io");
var Qengine = require('./MooseServer1/js/questionEngine.js')
//var shared = require('./MooseServer1/js/shared1.js'); 

var app = express();
app.use(express.static("./MooseServer1")); //working directory
//Specifying the public folder of the server to make the html accesible using the static middleware

var socket = 8080;
//var server = http.createServer(app).listen(8080); //Server listens on the port 8124
var server = http.createServer(app).listen(socket,"0.0.0.0",511,function(){console.log(__line,"Server connected to socket: "+socket);});//Server listens on the port 8124
io = io.listen(server);
/*initializing the websockets communication , server instance has to be sent as the argument */

var numberOfTilesForHand=4
var minPlayers = 2;
var maxPlayers = 20;
var gameMaxMove=2

var allClients = [];
var players = [];
var spectators = [];

var currentTurn = 0;

var boardRows = 9;
var boardColumns = 9;
var boardState = [];

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
//
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
var AllPlayedCards=[]
var playedCards = []
var moose=''
var cards = undefined
var partTurn=2
var turnOrder=[]
var TurnCount=-1

console.log("Server Started!");

function defaultUserData(){
	return {
		userName: "Unknown",
		tiles: [],
		color: notReadyColor,
		ready: false,
		ID:-1,
		yourTurn:' ',
		lastPlayed:-1
	}
}

io.sockets.on("connection", function(socket) {
    socket.userData = defaultUserData();
    
    allClients.push(socket);
    if (gameStatus === gameMode.LOBBY) {
        socket.userData.color = notReadyColor;
    } else {
		spectators.push(socket);
        socket.userData.color = spectatorColor;
        updateBoard(socket, notReadyTitleColor, true);
		updateUsers(socket);
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
				if(Qengine.players[i]){
					socket.emit('tiles', {tiles:socket.userData.tiles,chosen:Qengine.players[i].lastPlayed});
				}
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
        console.log(__line,"added new user: " + socket.userData.userName);
		message(io.sockets, "" + socket.userData.userName + " has joined!", serverColor);
        updateUsers();
    });

    socket.on("ready", function(ready) {
        if (gameStatus === gameMode.LOBBY){
            socket.userData.ready = ready.ready;
			if (socket.userData.ready === true) {
				socket.userData.color = readyColor;
				updateBoard(socket, readyTitleColor , false);
			} else {
				socket.userData.color = notReadyColor;
				updateBoard(socket, notReadyTitleColor , false);
			}
            checkStart();
			console.log(__line,"" + socket.userData.userName + " is ready: " + ready.ready);
            updateUsers();
        }
    });
	
	socket.on("recieveTile", function(tile){
		if (gameStatus === gameMode.PLAYTILE){
			if (playedCards[socket.userData.ID]<0){
				//add to playing order
				turnOrder.push(socket.userData.ID)
				//record tile
				playedCards[socket.userData.ID]=tile.ID
				console.log(__line,'recieved moose tile',tile)
				Qengine.moveMoose(tile,socket.userData.ID)
				//remove the selected tile form players hand
				let theTiles=socket.userData.tiles
				theTiles.splice(theTiles.findIndex(ID => ID === tile.ID),1)
				socket.userData.tiles=theTiles.concat(cards.deal())
				updateUsers()
				sendPersonalData()
				console.log(__line,'these are the tiles played so far'+playedCards)
				checkmoose()
			}
		}
	});
	
	socket.on("recieveMove", function(movement){
		console.log(__line,'gameStatus',gameStatus)
		if (gameStatus === gameMode.MOVEORQUESTION){
			console.log(__line,socket.userData.ID)
			console.log(__line,"currentTurn "+currentTurn)
			if(socket.userData.ID==currentTurn){
				console.log(__line,"recieved move")
				if(Qengine.validMove(currentTurn,movement)){
					let distancemoved=Qengine.validMove(currentTurn,movement,true)
					console.log(__line,'validMove')
					Qengine.maxMove=Qengine.maxMove-distancemoved
				}
				console.log(__line,'Qengine.maxMove',Qengine.maxMove)
				determineNextTurnState(Qengine.maxMove,socket.userData.ID)
			}else{
				console.log(__line,'outofTurn');
				message( socket, 'It is not your turn!', gameErrorColor);
			}
		}
			//check if it is current player turn
				//t: check if valid position
					//t: move, update board, send to all players, increment current player turn
	});
	
	
	socket.on("foundMoose", function(){
		console.log('found moose')
		let current=socket.userData.ID
		if(Qengine.distance(Qengine.moose.cord,Qengine.players[current].cord)==0){
			message(socket,'you win', gameColor)
			message(io.sockets,socket.userData.userName+' wins')
			gameEnd()
		}else{
			message(io.sockets,'moose is located: x'+Qengine.moose.cord.x+' y'+Qengine.moose.cord.y)
			message(io.sockets,socket.userData.userName+' loses')
			gameEnd()
		}

	});

	socket.on("recieveDistanceQuestion", function(locationString){
		if (gameStatus === gameMode.MOVEORQUESTION){
			if(socket.userData.ID==currentTurn){
				if(partTurn==2){
					let mooseDist=Qengine.distanceParse(locationString+',moose')
					moosecall='The moose is '+mooseDist+" away from "+locationString 
					message( io.sockets, moosecall , gameColor);
					nextTurn()
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
		let answer=Qengine.solveStr(text)
		console.log(__line,'yesno answer',answer)
		if(answer=='0'||answer=='1'){
			if(answer=='1'){
				message(io.sockets,'true',gameColor)
			}else{message(io.sockets,'false',gameColor)}
		}else{
			message(io.sockets,'error',gameColor)
		}
		Qengine.maxMove-=1
		if(Qengine.maxMove<1){nextTurn()}else{
			socket.emit('currentTurn',Qengine.maxMove)
			updateUsers()
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
function checkmoose() {	
    if( gameStatus === gameMode.PLAYTILE) {
        console.log(__line,'turn order length is '+turnOrder.length)
        if(turnOrder.length == players.length) {
            turnOrder.push(-1)
            AllPlayedCards.push(playedCards)
            playedCards=Array(players.length).fill(-1)
            gameStatus = gameMode.MOVEORQUESTION//moveORquestion();
            TurnCount=-1
            nextTurn()
        }
    }
}
function gameStart() {
	console.log(__line,"gameStart");
	message(io.sockets, "THE GAME HAS STARTED", gameColor);
	gameStatus = gameMode.PLAYTILE; //wait for every one to chose a tile via recieveTile
	//reset players
	Qengine.resetIt()//returns bord to default
	Qengine.maxMove=gameMaxMove
	AllPlayedCards=[]
	//make deck to play with
	cards=new Deck({mean:[{x:0,y:-1},{x:0,y:1},{x:1,y:0},{x:-1,y:0},0,0],dif:[{x:0,y:-1},{x:0,y:1},{x:1,y:0},{x:-1,y:0}]})
	let playerCount=0
	allClients.forEach(function(client){ 
		if(client.userData.ready){
			client.userData.ID=playerCount++
			//deal cards
			client.userData.tiles=cards.deal(numberOfTilesForHand)
			playedCards.push(-1)
			players.push(client);
			Qengine.players[client.userData.ID]={
				userName:client.userData.userName,
				color:colorlist[client.userData.ID],
				cord:{x:undefined,y:undefined},
				lastPlayed:{ID:-1,color:undefined,path:undefined}
			}
		} else {
			client.userData.color = spectatorColor;
		}
	});
	AllPlayedCards.push(playedCards)
	playedCards=[]
	setStartPosition();
	updateBoard(io.sockets, readyTitleColor, true); //changes screen from lobby to board
	currentTurn = -2
    playedCards = Array(players.length).fill(-1)
	sendPersonalData()
	nextTurn()
	//wait for turn plays
}
function sendPersonalData(){
	players.forEach(function(player) {
		
		let personalData={
			tiles:player.userData.tiles,
			chosen:{path:undefined,color:undefined}
		}
		if(Qengine.players[player.userData.ID].lastPlayed.ID!=-1){
			personalData.chosen.path=Qengine.players[player.userData.ID].lastPlayed.path
			personalData.chosen.color=Qengine.players[player.userData.ID].lastPlayed.color
		}
		console.log(__line,personalData)
		player.emit("tiles", personalData)
	})
}
function setStartPosition(){ //set all positions on the board to -1 to indicate no tile
	//place starting pawns
	let angle = (2*Math.PI)/(Qengine.players.length)
	console.log(Qengine.players)
	for(i = 0; i<Qengine.players.length; i++){
		let yplace = Math.round(((boardRows-1)/2)*Math.cos(i*angle)+(boardRows-1)/2)
		let xplace = Math.round(((boardRows-1)/2)*Math.sin(i*angle)+(boardRows-1)/2)
		Qengine.players[i].cord={x:xplace,y:yplace}
	}
}

function determineNextTurnState(maxMove,playerID){
	console.log(__line,"maxMove",maxMove)
	if(maxMove>0){
		console.log('decide to allow more turn')
		io.sockets.emit('currentTurn',maxMove)
		updateUsers()
	}else{
		console.log(__line,'send to nextTurn()')
		Qengine.maxMove=gameMaxMove
		io.sockets.emit('currentTurn',maxMove)
		nextTurn()
	}
}
function nextTurn(){
	if(checkEnd()){
		gameEnd();
	} else {
		TurnCount +=1 
		currentTurn=turnOrder[TurnCount]
		if(currentTurn==-1||currentTurn===undefined){
			console.log("movemose")	
			currentTurn=-1
			io.sockets.emit('currentTurn',currentTurn)
			gameStatus=gameMode.PLAYTILE
			message( io.sockets, 'time to move moose' , gameColor)
			turnOrder=[]
			Qengine.maxMove=gameMaxMove
			for(let i=0;i<players.length;i++){
				players[i].userData.yourTurn=""
				Qengine.players[i].lastPlayed.ID=-1
			}
			updateUsers()
			sendPersonalData()
		}else{
			for(let i=0;i<players.length;i++){
				players[i].userData.yourTurn=""
			}
			console.log("It is " + players[currentTurn].userData.userName + "'s turn!")
			players[currentTurn].userData.yourTurn='<'
			message(players[currentTurn], "It is your turn!", gameColor);
			message(io.sockets,"It is " + players[currentTurn].userData.userName + "'s turn!", gameColor)
			updateUsers()
			console.log(__line,'update after someone puts tile')
			io.sockets.emit('currentTurn',0)
			console.log(__line,'currentTurn, always 0')
			partTurn=2	 
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
			let data=getUserSendDataWithEngine(client)
			console.log(__line,'engineData',data.engineData)
			userList.push(data);
		});
		spectators.forEach(function(client){
			//userList.push(getUserSendDataWithEngine(client));
		});
	}
    console.log(__line,"----------------Done Sending List----------------");
	
	io.sockets.emit('userList', userList);
}

function getUserSendData(client){
	console.log(__line,"userName:", client.userData.userName, " |ready:", client.userData.ready, "|status:", client.userData.color, "|score:", client.userData.score);
	return{
		id: client.id,
		boardID: client.userData.ID,
		userName: client.userData.userName,
		color: client.userData.color,
		yourTurn: client.userData.yourTurn,
		engineData:undefined
	};
}
function getUserSendDataWithEngine(client){
	console.log(__line,"userName:", client.userData.userName, " |ready:", client.userData.ready, "|status:", client.userData.color, "|score:", client.userData.score);
	return{
		id: client.id,
		boardID: client.userData.ID,
		userName: client.userData.userName,
		color: client.userData.color,
		yourTurn: client.userData.yourTurn,
		engineData:Qengine.getEngineSendData(client.userData.ID)
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


function sendBoardState(emitChoice){
	io.sockets.emit("boardState", Qengine.players);
	
}


function updateTurnColor(){
	if(players.length > 0){
		players.forEach(function(player){
			player.userData.color = notYourTurnColor;
		});
		players[currentTurn%players.length].userData.color = yourTurnColor;
		console.log(__line,'update turn color');
		updateUsers();
	}
}

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


function checkEnd(){
	//return (!playersHaveTiles() || allSkipped());
}

function gameEnd() {
    console.log(__line,"gameEnd");
    //updateBoard(io.sockets, notReadyTitleColor, false);
	message(io.sockets, "THE GAME HAS ENDED", gameColor);
	let showturns=[]
	console.log(__line,'AllPlayedCards',AllPlayedCards)
	console.log(__line, 'Qengine.cardsPlayed',Qengine.cardsPlayed)
	for(round in AllPlayedCards){
		let showRound=[]
		for(player in AllPlayedCards[round]){
			let cardID=AllPlayedCards[round][player]
			console.log(__line,'cardID',cardID)
			if(cardID==-1){
				showRound.push({
					ID:-1,
					path:undefined,
					color:undefined
				})
			}else{
				showRound.push({
					ID:cardID,
					path:Qengine.cardsPlayed[cardID].path,
					color:Qengine.cardsPlayed[cardID].color
				})
			}
		}
		showturns.push(showRound)
	}
	io.sockets.emit('endState', showturns)

    players = [];
	spectators = [];
    allClients.forEach(function(client) {
        client.userData.ready = false;
        //client.userData.color = notReadyColor;
    });
    gameStatus = gameMode.LOBBY;
    nextUserID=-1
    updateUsers();
}
class Deck{
	constructor(cardDesc){
		this.cardDesc = cardDesc //CONST
		this.propKeys = Object.keys(this.cardDesc) //CONST
		
		let constants = [1]
		let constant = 1
		for(let propIndex = this.propKeys.length-1; propIndex >= 0; propIndex--){
			constant *= this.cardDesc[this.propKeys[propIndex]].length
			constants.unshift(constant)
		}
		
		this.totalCards = constants.shift() //first number is the total number of cards
			
		this.divConstants = constants //CONST
		//this.owner='Deck'
		this.pile =[]
		for( let i = 0;i<this.totalCards;i++){this.pile.push(i);}
		this.shuffle(5)
	}
	
	getProperties(cardNum){
		if(cardNum > this.totalCards) return undefined
		
		let cardProp = {}
		
		for(let propIndex = 0; propIndex < this.propKeys.length; propIndex++){
			let currentPropertyKey = this.propKeys[propIndex]  //'color'
			let currentPropertyList = this.cardDesc[currentPropertyKey] //['green','red','blue']
			
			//integer divide to get value
			let valueIndex = Math.floor(cardNum / this.divConstants[propIndex])
			cardProp[currentPropertyKey] = currentPropertyList[valueIndex]
			
			//subtract
			cardNum -= this.divConstants[propIndex]*valueIndex
		}
		
		return cardProp
	}

	getWholeDeck(){
		var wholeDeck=[]
		for(let cardNum = 0; cardNum < this.totalCards; cardNum++){
			wholeDeck.push(this.getProperties(cardNum))
		}
		return wholeDeck
	}

	shuffle(n=1){
		while(n){
			let m = this.pile.length, i;
			while(m){
				i = Math.floor(Math.random() * m--);
				[this.pile[m],this.pile[i]]=[this.pile[i],this.pile[m]]
			}
			n--
		}
	}
	
	deal(n=1){
		let hand=[]
		while(n){
			if(this.pile.length>0){
				hand.push(this.pile.pop());n--;
			}else{
				//send -1 on end of pile
				hand.push(-1);n--;
			}
		}
		return hand
	}

	returncard(cardID){
		let index=0
		if(this.pile.length>0){
			index = Math.floor(Math.random()*this.pile.length)
			this.pile.spice(index,0,cardID)
		}else{
			this.pile.push(cardID)
		}
	}

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