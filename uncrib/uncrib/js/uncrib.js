// button to get new tiles
// print new points to the cht log or make a grid showing all turn scores and total
// put chat log behind a button for mobile; only show the last message for a second

//events

//network definitions
const localAddress = '192.168.1.124'
const localPort = '8080'
const publicAddress = '184.167.236.159'


window.addEventListener('load', function() {
	var lastTouch = {x:0, y:0};
	
	var touchstartHandler = function(e) {
		lastTouch.x = e.touches[0].clientX;
		lastTouch.y = e.touches[0].clientY;
	}

	var touchmoveHandler = function(e) {
		var touchX = e.touches[0].clientX;
		var touchY = e.touches[0].clientY;
		var dx = touchX - lastTouch.x;
		var dy = touchY - lastTouch.y;
		lastTouch.x = touchX;
		lastTouch.y = touchY;

		e.preventDefault(); //prevent scrolling, scroll shade, and refresh
		board.updateSize(board.x + dx,board.y + dy,Qengine.boardRow, Qengine.boardCol, tileHeight + 2*tilePadding, tileWidth + 2*tilePadding,board.clickAreas)
		return;
	}

  document.addEventListener('touchstart', touchstartHandler, {passive: false });
  document.addEventListener('touchmove', touchmoveHandler, {passive: false });
  console.log('added');
  document.getElementById('gameBoard').addEventListener('click', checkClick);
  document.getElementById('title').addEventListener('click', titleFunction);
  document.getElementById('middle').addEventListener('click', allowAudio);
});
var clickable=[]
var selected=[]
var userList=[]
var oldUserList=[]
var uncrib=undefined
// colors
var spectatorColor = "#444444";
var notYourTurnColor = "#ffffff";
var yourTurnColor = "#0000ff";
var gameStatus=0

$('#submit').click(function(){
	var data = {
		message:$('#message').val()         
	}
	socket.send(JSON.stringify(data)); 
	$('#message').val('');
	return false;
});

document.getElementById('title').style.color = '#ff0000'
function titleFunction(){
	let title = document.getElementById('title')
	if ( title.style.color == 'rgb(255, 0, 0)' ){
		title.style.color = '#00ff00';
		socket.emit('ready', {ready: true});
	} else {
		title.style.color = '#ff0000';
		socket.emit('ready', {ready: false});
	}
	return false;
}

var soundsAllowed = false;
var ding = new Audio('../sounds/echoed-ding.mp3');
function allowAudio(){
	if (!soundsAllowed){
		ding.load();
		soundsAllowed = true;
	}
}

var canvas = document.getElementById("gameBoard");
var ctx = canvas.getContext("2d");
class game {
	constructor(ctx,socket){
		//constants
		this.ctx=ctx
		this.socket=socket
		this.cards=new Deck({suit:['♥','♦','♣','♠'], number:['A',2,3,4,5,6,7,8,9,10,'J','Q','K']})
		this.centerCard=undefined
		this.tossButton=undefined
		this.counted= new Button(ctx.canvas.width/10,ctx.canvas.height/2,ctx.canvas.height/5,ctx.canvas.height/20,'counted',22)
		this.counted.click=function(){
			socket.emit('counted')
		}
		this.cardsOnTable=[]
	}
	resizeCanvas(){
		canvas.width = window.innerWidth - $('#sidebar').width() - 50;
		canvas.height = window.innerHeight - 2;
		console.log('canvas resized to: ', canvas.width, canvas.height);
		this.resizeDrawings();
	}
	resizeDrawings(){
		this.tileWidth = 80; //* window.devicePixelRatio;
		this.tileHeight = 80; //* window.devicePixelRatio;
		this.tilePadding = this.tileWidth/20;
		this.tileFontSize = 30; //* window.devicePixelRatio;
		//board.updateSize(canvas.width/2,canvas.height/2,Qengine.boardRow, Qengine.boardCol, tileHeight + 2*tilePadding, tileWidth + 2*tilePadding,board.clickAreas)
		//for(var i = 0; i < myTiles.length; i++){
		//	myTiles[i].updateSize((canvas.width/2) + (tileWidth + 20) * (i-2) , canvas.height - (tileHeight + 20), tileHeight, tileWidth);
		//}
	}

	gameDraw(){
		clickable = [[],[]]; //first object is top layer, last is bottom layer
		this.ctx.textAlign="center";
		this.ctx.textBaseline = "middle";
		this.ctx.font = "25px Comic Sans MS"
		//console.log('draw: ', clickable );
		this.ctx.clearRect(0,0,this.ctx.canvas.width, this.ctx.canvas.height);
		if(gameStatus==2){
			if(this.tossButton.visible){
				clickable[0].push(this.tossButton)
			}
		}
		if(gameStatus==4){
			if(myTurn){
				clickable[0].push(this.counted)
				this.tossButton.visible=true
			}
		}
		//cards
		//center Card
		if(this.centerCard!=undefined){
			//if(this.m.length>0){
			clickable[0].push(this.centerCard)
			//}
			//else{clickable.push(this.myCards)}
		}
		//my cards
		if(this.myCards!=undefined){
			if(this.myCards.length>0){
				clickable[0].splice(clickable[0].length,0,...this.myCards)
			}
			//else{clickable.push(this.myCards)}
		}
		//tablecards
		if(this.cardsOnTable.length>0){
			clickable[0].splice(clickable[0].length,0,...this.cardsOnTable)
		}
		//draw cards

	}
}

class Button {
	constructor(x, y, width, height, text = "button", fontSize = 50, fillColor='#ffe0b3', outlineColor='#000000', textColor='#000000', textOutlineColor='#000000', textSlant = false){
		this.updateSize(x,y,width,height);
		this.fillColor = fillColor;
		this.outlineColor = outlineColor;
		this.textColor = textColor;
		this.textOutlinecolor = textOutlineColor;
		this.fontSize = fontSize;
		this.text = text;
		this.textSlant = textSlant;
		this.visible = true;
	}
	
	updateSize(x,y,width,height){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.clickArea = {minX: x - width/2, minY: y - height/2, maxX: x + width/2, maxY: y + height/2};
	}
	
	draw(ctx){
		if(this.visible){
			ctx.save();
			ctx.fillStyle = this.fillColor;
			ctx.strokeStyle = this.outlineColor;
			roundRect(ctx, this.clickArea.minX, this.clickArea.minY, this.width, this.height, this.width/8, this.fillColor != undefined, this.outlineColor != undefined);

			//draw number
			ctx.font = '' + this.fontSize + "px Arimo" //Arial Black, Gadget, Arial, sans-serif";
			ctx.fillStyle = this.textColor;
			ctx.strokeStyle = this.textOutlineColor;
			ctx.translate(this.x, this.y);
			if(this.textSlant){
				ctx.rotate(Math.atan(this.height/this.width));
			}
			if(this.textColor != undefined){
				multiLine(ctx,this.text,this.fontSize,0)//;this.width);
			}
			if(this.textOutline != undefined){
				ctx.strokeText(this.text, 0, 0);
			}
			ctx.restore();
		}
	}
	click(){
		console.log('not overloaded yet')
	}
} 



//socket stuff
var socket = io(publicAddress); //try public address //"24.42.206.240" for alabama
var trylocal = 0;
var currentTurn=-1
socket.on('connect_error',function(error){
	console.log("I got an error!", error);
	console.log("socket to:", socket.disconnect().io.uri, "has been closed.");
	if(!trylocal){ //prevent loops
		var internalShortAddress = ''+localAddress+':'+localPort;
		var internalAddress = 'http://'+internalShortAddress+'/';
		if(window.location.href != internalAddress){
			window.location.replace(internalAddress);
		}
		socket.io.uri = internalShortAddress;
		console.log("Switching to local url:", socket.io.uri);
		console.log("Connecting to:",socket.connect().io.uri);
		trylocal = 1;
	}
});

socket.on('reconnect', function(attempt){
	console.log("reconnect attempt number:", attempt);
});

socket.on('connect', function(){
	//get userName
	console.log("Connection successful!");
	if(localStorage.userName === undefined){
		changeName(socket.id);
	} else {
		socket.emit('userName', localStorage.userName);
	}
	
	if(localStorage.id !== undefined){
		socket.emit('oldId', localStorage.id);
	}
	localStorage.id = socket.id;
});

function changeName(userId){
	if(userId == socket.id){
		var userName = null;
		do{
			userName = prompt('Enter username: ');
			//console.log(userName);
			if ((userName == null || userName == "") && localStorage.userName !== undefined){
				userName = localStorage.userName;
			}
		} while (userName === null);
		localStorage.userName = userName;
		socket.emit("userName", localStorage.userName);
	}
}

socket.on("message",function(message){  
	/*
		When server sends data to the client it will trigger "message" event on the client side , by 
		using socket.on("message") , one cna listen for the ,message event and associate a callback to 
		be executed . The Callback function gets the dat sent from the server 
	*/
	//console.log("Message from the server arrived")
	message = JSON.parse(message);
	//console.log(message); /*converting the data into JS object */
	
	$('#chatlog').append('<div style="color:'+message.color+'">'+message.data+'</div>'); /*appending the data on the page using Jquery */
	$('#response').text(message.data);
	//$('#chatlog').scroll();
	$('#chatlog').animate({scrollTop: 1000000});
});

socket.on('userList',function(data){
	oldUserList=userList
	userList=data
	var userListString = '';
	//console.log('userList')
	//userList = [];
	for( var i = 0; i < data.length; i++ ){
		//userList.push(data[i])
		var header = 'div id="userListDiv'+ i + '"';
		var click = 'onclick="changeName(' + "'" + data[i].id + "'" + ')"';
		var color = ' style="color: ' + data[i].color + ';"'
		var string = '' + data[i].userName;
		var ender = '</div>';
		if(data[i].score!= undefined){
			if(data[i].color != spectatorColor){
				string = string + " " + userList[i].score; 
				if(data[i].color == yourTurnColor){
					currentTurn=i
				};
				if(data[i].id == socket.id){
					if(soundsAllowed && !myTurn && data[i].color == yourTurnColor){
						ding.play(); //play ding when it becomes your turn
					} 
					myTurn = data[i].color == yourTurnColor; //update old status
					gameStatus=data[i].gameState
					myUserlistIndex = i;
					myUserlistString = string;
				}
			}
		}
		userListString = userListString + '<' + header + click + color + '>' + string + ender;
		//console.log( "player", data[i].userName, "myTurn", myTurn, "id", data[i].id, socket.id, "color", data[i].color, yourTurnColor);
	}
	document.getElementById('userlist').innerHTML = userListString;
	console.table(data);
});

socket.on('showBoard',function(data){
	showboard(data)
});
socket.on("cards",function(data){
	console.log(data)
	uncrib.centerCard=uncrib.cards.createCard(ctx,data.center[0])
	uncrib.centerCard.updateSize(ctx.canvas.width/2,ctx.canvas.height/2)
	uncrib.myCards=makeCenteredCards(data.hand,ctx.canvas.height)
	uncrib.cardsOnTable=makeCenteredCards(data.table,0)
	if(uncrib.tossButton==undefined){
		uncrib.tossButton=new Button(ctx.canvas.width/10,ctx.canvas.height/2,ctx.canvas.height/5,ctx.canvas.height/20,'Throw '+(uncrib.myCards.length-6)+' cards to the crib',18)
		uncrib.tossButton.click=function(){
			if(selected.length==uncrib.myCards.length-6){
				let toSend=[]
				for(i in selected){
					toSend.push(selected[i].id)
				}
				uncrib.tossButton.visible=false
				socket.emit('toss',toSend)
				selected=[]
			}else console.log ("you should toss "+(uncrib.myCards.length-6)+' cards')
		}
	}
});
function showboard(data){
	$('#title').css('color', data.titleColor);
	$('#content').css('display', data.displayTitle);
	$('#gameBoard').css('display', data.displayGame);
	console.log('board shown')
	uncrib = new game(ctx,socket)
	drawAll()
	uncrib.resizeCanvas();
}
function makeCenteredCards(hand,y){
	let CenteredCards=[]
	let half=Math.floor(hand.length/2);
	//let width=
	let spacing = this.ctx.canvas.width/10;
	for(i in hand){
		let newcard=uncrib.cards.createCard(ctx,hand[i])
		newcard.updateSize(ctx.canvas.width/2+(i-half+.5)*spacing,y)
		newcard.click=function(){
			if(gameStatus==3){
				socket.emit('play',this.id)
			}else{
				if(selected.indexOf(this)==-1){
					selected.push(this)
				}else{
					selected.splice(selected.indexOf(this),1)
				}
				newY=this.y<ctx.canvas.height/2?ctx.canvas.height:0;
				this.updateSize(this.x,newY)
			}
		}
		CenteredCards.push(newcard)
	}
	return CenteredCards
}
function checkClick(event){
	let foundClick = false;
	let i;
	let area;
	let offset = $('#gameBoard').position();
	let scale = {x: canvas.width / $('#gameBoard').width(), y: canvas.height/ $('#gameBoard').height()};
	//console.log('click', {x: event.clientX, y: event.clientY});
	//console.log('scale:', scale)
	var click = {x: event.clientX*scale.x - offset.left, y: event.clientY*scale.y - offset.top};
	console.log('adjusted click: ', click);
	if (!foundClick) {
		for( i = 0; i < clickable.length; i += 1){
			for(var j = 0; j < clickable[i].length; j++){
				if( clickable[i][j].clickArea ){
					area = clickable[i][j].clickArea;
					//console.log(area);
					if( click.x  < area.maxX){
						if( click.x > area.minX){
							if( click.y < area.maxY){
								if( click.y > area.minY){
									clickable[i][j].click()
									foundClick = true;
								}
							}
						}
					}
				} else {
					console.log('no click area');
				}
			}
			if(foundClick){break;}
		}
	}
}
function drawAll(){
	uncrib.gameDraw()
	for( var i = clickable.length-1; i >= 0; i -= 1){
		for(var j = 0; j < clickable[i].length; j++){
			clickable[i][j].draw(ctx);
		}
	}
	setTimeout(drawAll, 100); //repeat

}
function multiLine(ctx,text,fontSize,x){
	var lineHeight = Math.floor(fontSize*1.5);
	var lines = text.split('\n');
	var offsetHeight=0
	if(lines.length>1){
		offsetHeight=-lineHeight/2
		//ctx.textAlign='start'
		for (var i = 0; i<lines.length; i++){
		    ctx.fillText(lines[i], -x/2.1, offsetHeight+(i*lineHeight) )
		}
	}else{ctx.fillText(text,0,fontSize*.09);}
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.save()
  if (typeof radius === 'undefined') {
	radius = 5;
  }
  if (typeof radius === 'number') {
	radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
	var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
	for (var side in defaultRadius) {
	  radius[side] = radius[side] || defaultRadius[side];
	}
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
  	ctx.fillStyle=fill
	ctx.fill();
  }
  if (stroke) {
  	ctx.strokeStyle=stroke
	ctx.stroke();
  }
  ctx.restore()
}
function polygon(ctx, x, y, radius, sides, startAngle, anticlockwise) {
	if (sides < 3) return;
	var a = (Math.PI * 2)/sides;
	a = anticlockwise?-a:a;
	ctx.save();
	ctx.translate(x,y);
	ctx.rotate(startAngle);
	ctx.moveTo(radius,0);
	for (var i = 1; i < sides; i++) {
		ctx.lineTo(radius*Math.cos(a*i),radius*Math.sin(a*i));
	}
	ctx.closePath();
	ctx.restore();
}

function throw3(){
	socket.emit('toss',uncrib.myCards.slice(0,3))
	console.log(uncrib.myCards)
}