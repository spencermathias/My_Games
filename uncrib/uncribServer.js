//server on
//path to files
var express = require("express");
var http = require("http");
var io = require("socket.io");
//var Qengine = require('./MooseServer1/js/questionEngine.js')

var app = express();
app.use(express.static("./uncrib")); //working directory
//Specifying the public folder of the server to make the html accesible using the static middleware

var socket = 8080;
//var server = http.createServer(app).listen(8080); //Server listens on the port 8124
var server = http.createServer(app).listen(socket,"0.0.0.0",511,function(){console.log(__line,"Server connected to socket: "+socket);});//Server listens on the port 8124
io = io.listen(server);
/*initializing the websockets communication , server instance has to be sent as the argument */
var uncrib = undefined;
var minPlayers = 2;
var maxPlayers = 6;

var allClients = [];
var players = [];
var plength = 0;
var spectators = [];
var currentTurn = 0;



var gameMode = {
    LOBBY: 0,
    PLAY: 1,
	THROW: 2,
    TABLE: 3,
    COUNT: 4,
    END: 5
};

var playerStatus = {
	PLAYER: 0,
	SPECTATOR: 1
}
//
var gameStatus = gameMode.LOBBY;

// colors
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


var cards = undefined
var card=undefined
var i=undefined

var userList=[]
var countedCrib=false

console.log("Server Started!");

function defaultUserData(){
	return {
		userName: "Unknown",
		hand: [],
		tableCards:[],
		color: notReadyColor,
		ready: false,
		score: 0
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
        let i = allClients.indexOf(socket);
        if(i >= 0){ allClients.splice(i, 1); }
		i = spectators.indexOf(socket);
        if(i >= 0){ spectators.splice(i, 1); }
        if(gameStatus!=gameMode.LOBBY){
        	let i = players.indexOf(socket)
        	if(i >= 0){players.disconnected=true}
        }
		updateUsers();
        //players are only removed if kicked
    });
	
	socket.on('oldId', function(id){
		console.log(__line, "oldID:", id);
		for(var i = 0; i < allClients.length; i++){
			if(gameStatus!=gameMode.LOBBY){
				if(players[i].id == id){
					console.log(__line, "found old player!", players[i].userData.username, socket.userData.userName);
					let j = uncrib.spectators.indexOf(socket);
					if (j >= 0){
						uncrib.spectators.splice(j, 1)
					}else {
						console.log(__line, "new player");
					};
					socket.userData = players[i].userData;
					players[i] = socket;
				} 
			} else {
				console.log(__line, "game not started");
			}
		}
		updateUsers()
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
            closeGame();//????
        } else if(data.message === "start") {
            console.log(__line,"forced start");
            gameStart();
        } else if(data.message.toLowerCase() === "kick"){
			console.log(__line, "clearing players");
			uncrib.kickPlayers()
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
    socket.on("echo",function(data){
    	let call=data.call
    	let dataOut=data.dataOut
    	if(call=="echo"){
    		call='message'
    		dataOut={
				data: "break loop",
				color: gameErrorColor
			};
    	}
    	socket.emit(call,dataOut)
    });
    socket.on("toss",function(cards){
    	console.log(__line,socket.userData.userName+' tossed')
    	console.log(__line,gameStatus)
    	if(gameStatus===gameMode.THROW){
    		let tossValid=uncrib.validToss(cards,socket)
    		console.log(tossValid)
    		if(tossValid){
    			console.log('valid')
    			uncrib.toss(cards,socket)
    		}
    		sendCards(socket,uncrib)
    		updateUsers(socket)
    	}
    });
    socket.on("play",function(card){
    	if(gameStatus===gameMode.TABLE){
    		if(players[currentTurn].id==socket.id){
	    		if(uncrib.tableCount+uncrib.cards.values[card]<32){
	    			let cardInHand=socket.userData.hand.indexOf(card)
					if(cardInHand==-1){
						console.log(__line,'not in hand')
					}else{
						socket.userData.tableCards.push(socket.userData.hand.splice(cardInHand,1).pop())
						socket.userData.score-=uncrib.playCard(card)
						console.log(__line,card+' was played')
						uncrib.nextTurn()
					};
	    		}
	    	}else{message(socket,'not your turn',notYourTurnColor)}
    	}
    });
    socket.on("counted",function(){
    	if(gameStatus===gameMode.COUNT){
			if(socket.id==players[currentTurn].id){
				if(currentTurn==uncrib.dealer){
					if(uncrib.crib.length){
						uncrib.countHand(uncrib.dealer,uncrib.crib)
						uncrib.cards.returnCards(uncrib.crib)
						uncrib.cards.returncard(uncrib.centerCard.pop())
						uncrib.crib=[]
						uncrib.centerCard=[]
					}else{
						uncrib.startToss()
					}
				}else{
					currentTurn++
		    		currentTurn%=plength
		    		uncrib.countHand(currentTurn,players[currentTurn].userData.tableCards)
		    		uncrib.cards.returnCards(players[currentTurn].userData.tableCards)
		    		players[currentTurn].userData.tableCards=[]
		    		updateUsers()
				}
			}
    	}

    })
});


function checkStart() {	
    if( gameStatus === gameMode.LOBBY) {
        var readyCount = 0;
        allClients.forEach(function(client) {
            if( client.userData.ready ) {
                readyCount++;
            }
        });
        if((readyCount == allClients.length||readyCount==maxPlayers) && readyCount >= minPlayers) {
            gameStart();
        }
    }
}
function getvalues(cards){
	let values=[]
	for(i=0;i<cards.totalCards;i++){
		let number=cards.getProperties(i).number
		if(typeof number =="number"){
			values.push(number)
		}else if(number=="A"){
			values.push(1)
		}else{values.push(10)}
	}
	return values
}
class game{
	constructor(allClients){
		this.cards = new Deck({suit:['♠','♥','♦','♣'], number:['A',2,3,4,5,6,7,8,9,10,'J','Q','K']})
		this.cards.values=getvalues(this.cards)
		this.spectators=[]
		this.dealer=0
		currentTurn=-1
		this.tableCount=0
		this.number2throw=Math.floor(6/(allClients.length))
		this.numberOfhandForHand=6+this.number2throw
		console.log(__line,'numberOfcardsForHand',this.numberOfhandForHand)
		this.createplayers(allClients,this.cards)
		plength=players.length
		this.crib=[]
		this.cardsOnTable=[]
		this.centerCard=[]
		this.startToss()
		//updateUsers()
	}
	createplayers(allClients,cards){
		players=[]
		allClients.forEach(function(client){ 
			if(client.userData.ready){
				let player=client;
				players.push(player);
				console.log(players[players.length-1].userData);
			} else {
				client.userData.color = spectatorColor;
			}
		});
		//players=currentplayers
	}
	sendPersonalData(){
		players.forEach(function(player) {
			let Hand=player.userData.hand
			console.log(__line,Hand)
			player.emit("hand", Hand)
		})
	}
	startToss(){
		let i=6
		for(let player in players){
			players[player].userData.color=notReadyColor
			players[player].userData.hand=this.cards.deal(this.numberOfhandForHand)
			players[player].userData.tableCards=[]
			i-=this.number2throw
			players[player].userData.score+=30
			if(players[player].userData.score>119){
				this.gameEnd()
				break
			}
		}
		this.crib=[]
		this.crib=this.cards.deal(i)
		this.cardsOnTable=[]
		this.dealer++
		this.dealer%=plength
		currentTurn=this.dealer
		gameStatus=gameMode.THROW
		sendCards2All(this)
		updateUsers()
		message(io.sockets,' '+players[this.dealer].userData.userName+' dealt')
		console.log(' '+players[currentTurn].userData.userName+' dealt')
	}
	validToss(receivedCards,socket){
		let i=0
		console.log('socket hand',socket.userData.hand)
		for(card in receivedCards){
			console.log('card'+card+' receivedCards[card]'+receivedCards[card])
			let cardInHand=socket.userData.hand.indexOf(receivedCards[card])
			if(cardInHand==-1){return false}else{i+=1};
		}
		console.log(__line,i)
		if(i==this.number2throw){
			console.log(__line,'made it to end')
			return true
		}else{
			return false
		}
	}

	toss(receivedCards,socket){
		socket.userData.color=readyColor
		for(card in receivedCards){
			let cardInHand=socket.userData.hand.indexOf(receivedCards[card])
			console.log(__line,'tossing '+cardInHand)
			this.crib.push(socket.userData.hand.splice(cardInHand,1).pop())
		}
		sendCards(socket,this)
		if(this.crib.length==6){
			this.startTable()
		}
	}
	startTable(){
		for(player in players){
			players[player].userData.color=notYourTurnColor
			players[player].userData.ready=false
		}
		this.tableCount=0
		currentTurn=this.dealer
		this.nextTurn()
		updateUsers()
		this.centerCard=this.cards.deal()
		gameStatus=gameMode.TABLE
	}
	nextTurn(){
		console.log('currentTurn',currentTurn)
		console.log(__line,currentTurn,'nextTurn started')
		currentTurn +=1
		currentTurn%=plength
		if(this.nocards()){
			this.startCount()
		}else{
			let passed=players[currentTurn].userData.ready
			console.log(__line,'passed previously=',passed)
			if(!passed){
				let currentCards=players[currentTurn].userData.hand
				let under31=false
				for(card in currentCards){
					console.log(__line,currentCards[card])
					console.log(__line,this.cards.values[currentCards[card]])
					under31|=(this.tableCount+this.cards.values[currentCards[card]])<32
					if(under31){
						break;
					};
				}
				if(!under31){
					players[currentTurn].userData.ready=true
					passed=true
				}
			}
			if(!passed){
				console.log(__line,'player '+currentTurn+' has card under 31')
				message(io.sockets,"It is "+players[currentTurn].userData.userName+"'s turn",gameColor)
				sendCards2All(this)
				updateUsers()
			}else{
				if(this.allpassed(currentTurn)){
					console.log(__line,'prior score:'+players[currentTurn].userData.score)
					players[currentTurn].userData.score-=1
					console.log(__line,'decrament by one: '+players[currentTurn].userData.score)
					for(player in players){
						players[player].userData.ready=false
					}
					this.tableCount=0
					this.cardsOnTable=[]
					message(io.sockets,'current tableCount is'+this.tableCount,gameColor)
				}else{
					console.log(__line,'not allpassed')
				}
				this.nextTurn()
			}
		}
	}
	allpassed(currentTurn){
		let pass=true
		for(i=1;i<plength;i++){
			let userData=players[(currentTurn+i)%plength].userData
			pass&=userData.ready
			if(!pass){break};
		}
		return pass
	}
	nocards(){
		for(player in players){
			if(players[player].userData.hand.length>0){return false}
		}
		return true
	}
	playCard(card){
		let score=0
		if(this.cardsOnTable.length>1){
			//pairs
			score+=this.checkPair(card,this.cardsOnTable)
			//runs
			score+=this.checkRuns(card,this.cardsOnTable)
			//31 or 15
		}
		score+=this.checkTableCount(card)
		console.log(__line,'score out from tableCards: '+score)
		return score
	}
	checkRuns(card,tableCards){
		let newList=tableCards.slice()
		newList.push(card)
		newList=newList.map(x=>x%this.cards.cardDesc.number.length)
		let currentCheck=newList.splice(newList.length-2,2)
		let score=0
		while(newList.length){
			currentCheck.push(newList.pop())
			let len=currentCheck.length
			let minCard=Math.min(...currentCheck)
			if(len-Math.max(...currentCheck)+minCard==1){
				let currentCheckZeroed=currentCheck.map(x=>x-minCard)
				let reducedValue=(len-1)*(len%2)+(len%4>>1)
				if(currentCheckZeroed.reduce((sum, next) => sum ^ next)==reducedValue){
					score=len
				}else{
					return score
				}
			}
		}
		return score
	}
	checkPair(card,tableCards,iterations=0){
		let check1=this.cards.getProperties(card).number
		let newList=tableCards.slice()
		let newCard=newList.pop()
		let check2=this.cards.getProperties(newCard).number
		if(check1==check2){
			return iterations*2+this.checkPair(newCard,newList,iterations+1)
		}else{
			return iterations*2
		}
	}
	checkTableCount(card){
		this.tableCount+=this.cards.values[card]
		message(io.sockets,'current tableCount is'+this.tableCount,gameColor)
		if(this.tableCount==31){
			for(player in players){
				players[player].userData.ready=false
			}
			this.tableCount=0
			this.cardsOnTable=[]
			message(io.sockets,'current tableCount is'+this.tableCount,gameColor)
			return 2
		}else{
			this.cardsOnTable.push(card)
			if(this.tableCount==15){return 2}else{return 0}
		}
	}
	startCount(){
		gameStatus=gameMode.COUNT
		updateUsers()
		currentTurn=(this.dealer+1)%plength
		this.countHand(currentTurn,players[currentTurn].userData.tableCards)
	}
	countHand(player,cards){
		console.log(__line,'_________________'+players[player].userData.userName+'_________________')
		let hand=cards.slice()
		let score=this.knobbs(this.centerCard,hand)
		console.log('knobbs:'+score)
		hand.push(this.centerCard.slice().pop())
		hand.sort((a, b) => a - b)
		score+=this.countSuit(hand)
		console.log('suit:'+score)
		hand=hand.map(x=>x%this.cards.cardDesc.number.length)
		hand.sort((a, b) => a - b)
		score+=this.count15(hand.map(x=>this.cards.values[x]))
		console.log('15s:'+score)
		let pairs=this.countPair(hand)
		score+=pairs.score
		console.log('pairs:'+score)
		score+=this.countRuns(pairs)
		console.log('runs:'+score)
		players[player].userData.score-=score
		message(io.sockets,''+players[player].userData.userName+' got -'+score+' points')
		showHand(cards)
		
		
		//send counts to players
		//update team scores
	}
	knobbs(centerCard,hand){
		let mod=this.cards.cardDesc.number.length
		let suit=Math.trunc(centerCard/mod)
		let score=0
		for(let i in hand){
			if(hand[i]%mod==10){
				score+=Math.trunc(hand[i]/mod)==suit
			};
		}
		return score
	}
	countSuit(hand){
		let score=0
		let j=1
		let holdScore=0
		let tempSuit=this.cards.getProperties(hand[0]).suit
		for(i=1;i<hand.length;i++){
			if(tempSuit==this.cards.getProperties(hand[i]).suit){
				j++
				if(j>3){score=j+holdScore};
			}else{
				tempSuit=this.cards.getProperties(hand[i]).suit
				holdScore=score
				j=1
			}
		}
		return score
	}
	countPair(hand){
		let currentHand=hand.slice()
		let card=0
		let pairs={no:[],cards:{},score:0}
		let tempScore=0
		let i=1
		while(currentHand.length){
			card=currentHand.pop()
			tempScore=this.checkPair(card,currentHand)
			i=1
			if(tempScore==0){
				pairs.no.push(card)
			}else{
				pairs.score+=tempScore
				pairs.no.push(card)
				tempScore/=2
				while(tempScore&&i<20){
					tempScore-=i++
					currentHand.pop()
				}
				pairs.cards[card]=i
			}
		}return pairs
	}
	countRuns(pairs){
		let run=pairs.no
		let card=-1
		let score=0
		let tempScore=0
		let temprun=[]
		while(run.length){
			card=run.pop()
			temprun=[]
			tempScore=this.checkRuns(card,run)
			if(tempScore!=0){
				temprun=run.splice(run.length-tempScore+1,tempScore+1)
				temprun.push(card)
				for(card in pairs.cards){
					if(temprun.indexOf(card*1)!=-1){
						tempScore*=pairs.cards[card]
					}
				}
				score+=tempScore
			}
		}return score
	}
	count15(handValues,total=0){
		handValues.sort((a, b) => a - b)
		console.log(__line,handValues)
		let score=0
		let sum=handValues.reduce((sum,val)=>sum+val,0)
		if(total+sum>15){
			if (handValues.length>1){
				for(let i=handValues.length-1; i>=0;i-- ){
					let subtotal=total+handValues[i]
					console.log(handValues[i])
					if(subtotal==15){
						score+=2
						continue
					}else{
						let index=handValues.findIndex(x=>x+subtotal>15)
						if(index==0){
							return score
						}else{
							score+=this.count15(handValues.slice(0,index),subtotal)
							handValues.pop()
						}
					}
				}
				return score
			}
		}else if (total+sum==15){
			return 2
		}else{return 0}
	}
	updateGameplayers(){
		//userList=[]
		players.forEach(function(client){
			if(!client.disconnected){
				if(client.id==players[currentTurn].id){
					client.userData.color=yourTurnColor
				}else{
					client.userData.color=notYourTurnColor
				}
				let data=getUserSendData(client)
				userList.push(data);
			}
		});
		spectators.forEach(function(client){
			userList.push(getUserSendData(client));
		});
	}
	kickPlayers(){
		for(var i = plength-1; i >= 0; i--){
			if(players[i].disconnected){
				message( io.sockets, "" + players[i].userData.userName + " has been kicked!", chatColor);
				players.splice(i, 1);
			}
		}
		if( plength < minPlayers) {
			closeGame();
		} else {
			updateTurnColor();
		}
	}
	gameEnd(){
		message(io.sockets, "THE GAME HAS ENDED", gameColor);
		closeGame()
	}
}
function gameStart() {
	console.log(__line,"gameStart");
	message(io.sockets, "THE GAME HAS STARTED", gameColor);
	updateBoard(io.sockets, readyTitleColor, true)//changes board to play state
	gameStatus=gameMode.PLAY
	uncrib=new game(allClients)
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
    userList = [];
	if(uncrib == undefined){
		allClients.forEach(function(client){
			userList.push(getUserSendData(client));
		});
	} else {
		uncrib.updateGameplayers()
	}
    console.log(__line,"----------------Done Sending List----------------");
	
	io.sockets.emit('userList', userList);
}

function getUserSendData(client){
	console.log(__line,"userName:", client.userData.userName, " |ready:", client.userData.ready, "|status:", client.userData.color, "|score:", client.userData.score);
	return{
		gameState:gameStatus,
		id: client.id,
		userName: client.userData.userName,
		color: client.userData.color,
		table: client.userData.tableCards,
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


function sendCards(socket,game){
	let cardsOut={center:game.centerCard,hand:socket.userData.hand,table:game.cardsOnTable} 
	console.log(cardsOut)
	socket.emit("cards",cardsOut);
}
function sendCards2All(game){
	for(player in players){
		sendCards(players[player],game)
	}
}
function showHand(hand){
	uncrib.cardsOnTable=hand
	sendCards2All(uncrib)
	updateUsers()
}
function updateTurnColor(){
	if(plength > 0){
		players.forEach(function(player){
			player.userData.color = notYourTurnColor;
		});
		players[currentTurn%plength].userData.color = yourTurnColor;
		console.log(__line,'update turn color');
		updateUsers();
	}
}



function closeGame() {
    console.log(__line,"gameEnd");
    //updateBoard(io.sockets, notReadyTitleColor, false);
	message(io.sockets, "THE GAME HAS been removed from server", gameColor);
	uncrib=[]
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
	returnCards(hand){
		for (let aCard in hand){
			this.returncard(hand[aCard])
		}
	}
	returncard(cardID){
		let index=0
		if(this.pile.length>0){
			index = Math.floor(Math.random()*this.pile.length)
			this.pile.splice(index,0,cardID)
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