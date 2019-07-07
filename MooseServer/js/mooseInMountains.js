// button to get new tiles
// print new points to the cht log or make a grid showing all turn scores and total
// put chat log behind a button for mobile; only show the last message for a second

//events

//network definitions
const localAddress = '192.168.1.124'
const localPort = '8080'
const publicAddress = 'localhost:8080'//184.167.236.159'


window.addEventListener('load', function() {
	var lastTouch = {x:0, y:0};
	
	var touchstartHandler = function(e) {
		lastTouch.x = e.touches[0].clientX;
		lastTouch.y = e.touches[0].clientY;
		//console.log(lastTouch);
		// if(!soundsAllowed){
			// console.log('allow sounds');
			// ding.play();
			// //ding.pause();
			// soundsAllowed = true;
		// }
	}

	var touchmoveHandler = function(e) {
		var touchX = e.touches[0].clientX;
		var touchY = e.touches[0].clientY;
		var dx = touchX - lastTouch.x;
		var dy = touchY - lastTouch.y;
		lastTouch.x = touchX;
		lastTouch.y = touchY;

		e.preventDefault(); //prevent scrolling, scroll shade, and refresh
		board.x += dx;
		board.y += dy;
		return;
	}

  document.addEventListener('touchstart', touchstartHandler, {passive: false });
  document.addEventListener('touchmove', touchmoveHandler, {passive: false });
  console.log('added');
  document.getElementById('gameBoard').addEventListener('click', checkClick);
  document.getElementById('title').addEventListener('click', titleFunction);
  document.getElementById('middle').addEventListener('click', allowAudio);
});

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


//update in update size as well
var tileWidth = 40;
var tileHeight = 40;
//var tileWidth = 80 //* window.devicePixelRatio;
//var tileHeight = 40 //* window.devicePixelRatio;
var tileFontSize = 30 //* window.devicePixelRatio;
var tilePadding = 5;
var allTiles = [];
var serverTiles = [];
var selected = undefined;
var highlightME = undefined;
var scoreIsValid = false;	
var newbox = undefined;
var newbox1 = undefined;
var newbox2 = undefined;
var drawState = 2;

var canvas = document.getElementById("gameBoard");
var ctx = canvas.getContext("2d");
//var cards = new Deck({mean:['U','D','L','R','N','N'],dif:['U','D','R','L']})
var cards = new Deck({mean:[{x:0,y:-1},{x:0,y:1},{x:1,y:0},{x:-1,y:0},0,0],dif:[{x:0,y:-1},{x:0,y:1},{x:1,y:0},{x:-1,y:0}]})
//console.log('ctx', ctx);
//console.log(canvas.width, canvas.height);


class Button {
	constructor(x, y, width, height, text = "button", fillColor, outlineColor, textColor, textOutlineColor, fontSize = 50, textSlant = false){
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
				ctx.fillText(this.text,0,0);
			}
			if(this.textOutline != undefined){
				ctx.strokeText(this.text, 0, 0);
			}
			ctx.restore();
		}
	}
	
	click(){
		//TODO: show the posible move locations
		let validselect=false
		validselect=validselect||validMove(addcord(getcord(reBoardState,myUserlistIndex),this.cord,-1))
		validselect=validselect||reBoardState[this.cord.y][this.cord.x]!=-1
		if(validselect){
			selected=this
			selected.visible=true
		}else{
			console.log("This button has not been overloaded yet!");
		}
	}
} 

class Tile extends Button{
	constructor(tileData, x,y,width,height,fontSize,cord){
		var text = -1;
		if(tileData != undefined){
			text = tileData.number
		}
		super(x,y,width,height,text,defaultTileColor,'#000000','#000000',undefined,fontSize,false);
		this.tileData = tileData;
		this.visible = (text >= 0);
		this.highlightColor = "";
		this.cord=cord
	}
	
	drawOutline(color){
		this.highlightColor = color;
	}
	
	updateData(tileData){
		this.tileData = tileData;
		if(tileData != undefined){
			this.text = this.tileData
			this.visible = (this.tileData >= 0);
		}
	}
	
	draw(ctx){
		if(this.highlightColor != ""){
			//console.log(this.highlightColor);
			ctx.save();
			ctx.fillStyle = this.highlightColor;
			roundRect(ctx, this.x-(this.width/2 + tilePadding), this.y-(this.height/2 + tilePadding), this.width+2*tilePadding, this.height+2*tilePadding, this.width/8,true, false);
			ctx.restore();
			this.highlightColor = "";
		}
		//super.draw(ctx);
		if(this.visible){
			if(userList){
				for( let i = 0; i<userList.length; i++){
					if(userList[i].boardID == this.tileData){
						drawPerson(ctx,this.x,this.y,90,90, userList[i].color);
						//if (i==myUserlistIndex) {selected=this}
					}
				}
			}
		}
	}
}

function arrowdraw(ctx,x,y,width,height,path){
	ctx.save();	
	var dotRadius = width*0.05;
	if(path.length == 0){
		ctx.fillStyle='red';
		ctx.beginPath();
		ctx.moveTo(x,y);
		ctx.arc(
			x,y, 
			dotRadius, 0, 2 * Math.PI, false);
		ctx.fill();
		ctx.restore();
		return;
	} 
	//parse path (directions)
	dmax=parsePath(path)
	
	
	var oneArrowWidth = width*0.4
	var oneArrowHeight = height*0.4
	var arrowLength = dotRadius*2;
	var totArrowHeight = 1
	var totArrowWidtht = 1
	
	if ((dmax.maxx-dmax.minx)!=0){
		totArrowWidtht = Math.min((dmax.maxx-dmax.minx)*oneArrowWidth,width*0.9)
		oneArrowWidth = (totArrowWidtht-dotRadius)/(dmax.maxx-dmax.minx)
	}
	if ((dmax.maxy-dmax.miny)!=0){
		totArrowHeight = Math.min((dmax.maxy-dmax.miny)*oneArrowHeight,height*0.9)
		oneArrowHeight = totArrowHeight/(dmax.maxy-dmax.miny)
	}
	
	//draw
	
	var dotColor = '#000000';
	var lineColor = '#000000';
	
	ctx.fillStyle = dotColor;
	ctx.strokeStyle = lineColor;
	ctx.lineWidth = dotRadius;
	
	var curX = x-totArrowWidtht/2-dmax.minx*oneArrowWidth
	var curY = y-totArrowHeight/2-dmax.miny*oneArrowHeight
	//Lines
	ctx.beginPath();
	ctx.moveTo(curX,curY)
	for(var i = 0; i<path.length; i++){
		var c = path[i];
		switch(c){
			case 'U':ctx.lineTo(curX,curY-=oneArrowHeight);break;
			case 'R':ctx.lineTo(curX+=oneArrowWidth,curY); break;
			case 'D':ctx.lineTo(curX,curY+=oneArrowHeight); break;
			case 'L':ctx.lineTo(curX-=oneArrowWidth,curY); break;
		}
	}
	ctx.stroke();
	//arrow
	ctx.beginPath();
	ctx.moveTo(curX,curY)
	var wRatio = .7;
	switch(path[path.length-1]){
		case 'U':
			ctx.lineTo(curX-arrowLength*wRatio,curY);
			ctx.lineTo(curX,curY-arrowLength);
			ctx.lineTo(curX+arrowLength*wRatio,curY);
		break;
		case 'R':
			ctx.lineTo(curX,curY+arrowLength*wRatio);
			ctx.lineTo(curX+arrowLength,curY);
			ctx.lineTo(curX,curY-arrowLength*wRatio)			
		break;
		case 'D':
			ctx.lineTo(curX+arrowLength*wRatio,curY);
			ctx.lineTo(curX,curY+arrowLength);
			ctx.lineTo(curX-arrowLength*wRatio,curY);
		break;
		case 'L':
			ctx.lineTo(curX,curY-arrowLength*wRatio);
			ctx.lineTo(curX-arrowLength,curY);
			ctx.lineTo(curX,curY+arrowLength*wRatio);
		break;	
	}
	ctx.fillStyle = 'red';
	ctx.fill();
	//dots
	
	for(var i = path.length-1; i>=0; i--){
		ctx.beginPath();
		ctx.fillStyle = 'black';
		var c = path[i];
		switch(c){
			case 'U':ctx.moveTo(curX,curY+=oneArrowHeight);break;
			case 'R':ctx.moveTo(curX-=oneArrowWidth,curY); break;
			case 'D':ctx.moveTo(curX,curY-=oneArrowHeight); break;
			case 'L':ctx.moveTo(curX+=oneArrowWidth,curY); break;
		}
		ctx.arc(
			curX,curY, 
			dotRadius, 0, 2 * Math.PI, false);
		if(i==0){ctx.fillStyle='purple'}
		ctx.fill()
	}
	
	ctx.restore();
}


function cord2dpath(cord){
	let path=''
	for(i=0;i<Math.abs(cord.x);i++){
		let c=Math.sign(cord.x)
		if (c<0) {path+='L'
		}else{if (c>0) {path+='R'}}
	}
	for(i=0;i<Math.abs(cord.y);i++){
		let c=Math.sign(cord.y)
		if (c<0) {path+='U'
		}else{if (c>0) {path+='D'}}
	}
	return path
}
class paun{
	constructor(Iconfilepath, x,y,width,height,startCord, color){
		this.svg = document.getElementById("moose")
		//this.original = (new XMLSerializer).serializeToString(this.svg)
		//let colored1 = this.svg//.replace(/#D4AF37/g,'#ff0000')
		this.image=new Image()
		this.image.src= Iconfilepath;
		

		//this.image.src= this.svg;

		this.updateSize(x,y,width,height)
		this.x=startCord.x
		this.y=startCord.y
		//this.icon=Iconfilepath
		this.visible=true
		this.path=''
	}

	updateSize(x,y,width,height,direction){
		this.locationX=x
		this.locationY=y
		this.width = width;
		this.height = height;
		this.clickArea = {minX: x - width/2, minY: y - height/2, maxX: x + width/2, maxY: y + height/2};
	}

	draw(ctx){
		if(this.visible){
			ctx.save();
			//ctx.fillStyle = this.icon;
			//ctx.strokeStyle = this.outlineColor;
			//debugger;
			//roundRect(ctx, this.clickArea.minX, this.clickArea.minY, this.width, this.height, this.radius, this.fillColor != undefined, this.outlineColor != undefined);
			//this.image = document.getElementById(this)
			
			ctx.drawImage(this.image,this.locationX,this.locationY,this.width,this.height)
			
			ctx.restore();
		}
	}
	move(direction){

	}
}

class doubleButton{
	constructor(tileData, x,y,width,height,Deck){
		this.arrowbv = [];
		this.arrowgv = [];
		this.arrowb = '';
		this.arrowg = '';

		this.tileData = Deck.getProperties(tileData);
		this.tileData.ID=tileData

		this.arrowb=addcord(this.tileData.mean,this.tileData.dif)
		this.arrowg=addcord(this.tileData.mean,this.tileData.dif,-1)
		
		if (cord2dpath(this.arrowb)!=''){
			this.arrowb=cord2dpath(this.tileData.mean)+cord2dpath(this.tileData.dif)
		}

		if(cord2dpath(this.arrowg)!=''){
			this.arrowg=cord2dpath(this.tileData.mean)+cord2dpath(addcord({x:0,y:0},this.tileData.dif,-1))
		}

		//console.log(this.arrowb)
		//console.log(this.arrowg)
		/*if(tileData != undefined){
			cards.getproperties(tileData)
			arrowb = cards.getproperties(tileData);
			arrowg = tileData.options.green;
			this.visible = true;
		} else {
			this.visible = false;
		}
		*/
		
		this.subButtons = [
			new ButtonHalf(x-width/4,y,width/2, height,'L',this.arrowb,'#0000ff','#000000','#000000',undefined,undefined,this),
			new ButtonHalf(x+width/4,y,width/2, height,'R',this.arrowg,'#00ff00','#000000','#000000',undefined,undefined,this)
		];
		this.tileData = tileData;
		this.highlightColor = "";
		
	}
	
	drawOutline(color){ //TODO: move to sub buttons
		this.highlightColor = color;
	}
	click(direction){
		//console.log("This button has not been overloaded yet!");
		let tile={ID:-1,path:''}
		tile.ID=this.tileData
		if(direction=='L'){
			tile.path=this.arrowb
		}else{tile.path=this.arrowg}
		console.log(tile)
		socket.emit("recieveTile",tile)
		// send cardID to the server and option chosen
	}
}

class ButtonHalf{
	constructor(x, y, width, height, direction, shape = {x:0,y:0}, fillColor, outlineColor, shapeColor, textOutlineColor, fontSize = 50,parent){
		this.updateSize(x,y,width,height,direction);
		this.fillColor = fillColor;
		this.outlineColor = outlineColor;
		//this.textColor = textColor;
		this.textOutlinecolor = textOutlineColor;
		this.fontSize = fontSize;
		this.shape = shape;
		this.direction = direction;
		this.visible = true;
		this.parent=parent
	}
	
	updateSize(x,y,width,height,direction){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		var rad = Math.min(this.width, this.height)/5;
		switch(direction) {
			case 'U': this.radius = {tl: rad, tr: rad, br: 0, bl: 0}; break;
			case 'R': this.radius = {tl: 0, tr: rad, br: rad, bl: 0}; break;
			case 'D': this.radius = {tl: 0, tr: 0, br: rad, bl: rad}; break;
			case 'L': this.radius = {tl: rad, tr: 0, br: 0, bl: rad}; break;
			default: this.radius = {tl: 0, tr: 0, br: 0, bl: 0};
		}
		this.clickArea = {minX: x - width/2, minY: y - height/2, maxX: x + width/2, maxY: y + height/2};
	}
	
	
	draw(ctx){
		if(this.visible){
			ctx.save();
			ctx.fillStyle = this.fillColor;
			ctx.strokeStyle = this.outlineColor;
			//debugger;
			roundRect(ctx, this.clickArea.minX, this.clickArea.minY, this.width, this.height, this.radius, this.fillColor != undefined, this.outlineColor != undefined);
			
			var dotColor = '#000000';
			var dotRadius = this.width*0.05;
			
			var lineColor = '#000000';
			var arrowLength = dotRadius*1.5;
			
			var twoArrowWidth = this.width*0.8;
			var oneArrowWidth = twoArrowWidth/2;
			
			var twoArrowHeight = this.width*0.8;
			var oneArrowHeight = twoArrowWidth/2;
			
			//draw arrows
			arrowdraw(ctx,this.x,this.y,this.width, this.height, this.shape)
			ctx.restore();
		}
	}
	
	click(){
		console.log("This button half");
		this.parent.click(this.direction)
		}	
}


/*
class MoveTile extends Tile	{
	constructor(tileData, x,y,width,height,fontSize){
		super(tileData, x,y,width,height,fontSize);
	}
	
	click(){
		if(selected != undefined){ //switch
			console.log("switch", selected.tileData, this.tileData);
			if(selected.tileData != undefined){
				var tempNumber = selected.tileData.number;
				var tempOwner = selected.tileData.owner;
				var tempId = selected.tileData.id;
				selected.updateData(this.tileData);
				this.updateData({owner: tempOwner, number: tempNumber, id: tempId})
				selected = undefined;
			} else {
				this.tileData = undefined;
			}
		} else { //select
			selected = this;
		}
		
		//updatePlayValidity();
		//console.log("I am tile of number: " + this.tileData.number + " and Id: " + this.tileData.id, this);
	}
}
*/
class SubmitButton extends Button{
	constructor(y,width,text,type){
		super(300,y,width,100,text,"#ffff00","#000000","#00ff00")
		this.type=type
	}
	click(){
		if(this.visible){
			var sendState = getTileData(newState);	
			console.log("sending to server"); 
			switch(this.type){
				case 'dist':
					if (selected.text!=-1){
						socket.emit('recieveDistanceQuestion',selected.text)
					}
				break;
				case 'yesNo':
					if (selected.string!=undefined){
						socket.emit('recieveYesNoQuestion',selected.string)
					}
				break;
				case 'move':
					let movement=addcord(selected.cord,getcord(reBoardState,myUserlistIndex),-1)
					socket.emit('recieveMove',movement)
					selected.visible=false
				break;
				case 'found':
					socket.emit("foundMoose")
				break
			}
		}
	}
}

function getTileData( state ){
	var sendState = [];
	for(var row = 0; row < state.length; row++){
		var line = [];
		for(var col = 0 ; col < state[row].length; col++){
			line.push(state[row][col].tileData);
		}
		sendState.push(line);
	}
	return sendState;
}

class Board {
	constructor(x, y, rows, columns, rowThickness, columnThickness){
		this.x = x;
		this.y = y;
		this.rows = rows;
		this.columns = columns;
		this.rowThickness = rowThickness;
		this.columnThickness = columnThickness;
		this.borderColor = '#ffebcd';
		this.backgroundColor = '#8B4513';
		this.lineColor = '#ffebcd';
		this.lineWidth = 2;
		
	}
	
	updateFromServer(recievedBoardState){
		reBoardState=recievedBoardState
		this.rows = recievedBoardState.length;
		if(recievedBoardState.length > 0){
			this.columns = recievedBoardState[0].length;
		}
		
		if(boardState.length != recievedBoardState.length || boardState[0].length != recievedBoardState[0].length){ //new boardState if different size
			boardState = [];
			if(recievedBoardState.length > 0 && recievedBoardState[0].length > 0){
				for(var row = 0; row < recievedBoardState.length; row++){
					var line = [];
					for(var col = 0; col < recievedBoardState[0].length; col++){
						line.push(new Tile(newBlankTile(), 0, 0, tileHeight, tileWidth, tileFontSize,{x:col,y:row}));
					}
					boardState.push(line);
				}
			}
		}
		
		for(var row = 0; row < recievedBoardState.length; row++){
			for(var col = 0; col < recievedBoardState[0].length; col++){
				/*if(boardState[row][col].tileData.id != recievedBoardState[row][col].id){
					boardState[row][col].fillColor = newServerTileColor;
				} else {
					boardState[row][col].fillColor = defaultTileColor;
				}
				*/
				boardState[row][col].updateData(recievedBoardState[row][col]);
			}
		}
	}
	
	draw(ctx){
		if (this.rows > 0 && this.columns >0){

			ctx.save()
			var bh = this.rows*this.rowThickness;
			var bw = this.columns*this.columnThickness;
			//console.log(xPos, yPos, rows, columns, rowThickness, columnThickness)
			//console.log(xPos, yPos,bw, bh);
			var xMin = this.x - bw/2;
			var xMax = this.x + bw/2;
			var yMin = this.y - bh/2;
			var yMax = this.y + bh/2;

			
			//border
			ctx.fillStyle = this.borderColor;
			var border = Math.min(this.rowThickness, this.columnThickness);
			ctx.fillRect(xMin - border, yMin - border, bw + 2*border, bh + 2*border);
			
			ctx.font = '' + this.rowThickness*0.9 +"px Comic Sans MS";
			ctx.fillStyle = this.backgroundColor;
			ctx.textAlign = "center";
			ctx.fillText('N',this.x,this.y-bw/2-(this.rowThickness)/2*.8)
			ctx.fillText('S',this.x,this.y+bw/2+(this.rowThickness)/2)
			ctx.fillText('W',this.x-bh/2-this.columnThickness/2,this.y)
			ctx.fillText('E',this.x+bh/2+this.columnThickness/2,this.y)
			
			//background
			ctx.fillStyle = this.backgroundColor;
			ctx.fillRect(xMin,yMin,bw, bh);
			//center marker
			ctx.fillStyle = this.lineColor;
			ctx.fillRect(this.x - 0.5*this.rowThickness, this.y - 0.5*this.columnThickness, this.columnThickness, this.rowThickness);
			//lines
			ctx.strokeStyle = this.lineColor;
			ctx.lineWidth = this.lineWidth;
			for (var x = xMin; x <= xMax; x += this.columnThickness) {
				ctx.moveTo(0.5 + x, 0.5 + yMin);
				ctx.lineTo(0.5 + x, 0.5 + yMax);
			}

			for (var y = yMin; y <= yMax; y += this.rowThickness) {
				ctx.moveTo(0.5 + xMin, 0.5 + y);
				ctx.lineTo(0.5 + xMax, 0.5 + y);
			}
			ctx.stroke();
			var y = yMin;
			for (var i = 0; i < this.rows; i++) {
				var x = xMin;
				for(var j = 0; j < this.columns; j++){
					boardState[i][j].updateSize(x+this.columnThickness/2, y+this.rowThickness/2, tileWidth, tileHeight);
					//newState[i][j].updateSize(x+this.columnThickness/2, y+this.rowThickness/2, tileWidth, tileHeight);
					
					/*if(newState[i][j].tileData.id != blankTile.id && boardState[i][j].tileData.id != blankTile.id){
						newState[i][j].drawOutline('#ff0000');
					}*/
					//shapes[1].push(newState[i][j]);//middle layer
					shapes[2].push(boardState[i][j]); //bottom layer
					x += this.columnThickness;
				}
				y += this.rowThickness;
			}
			//drawPerson(ctx,this.x+this.columnThickness,this.y,90,90,'#ff0000');
			ctx.restore();
		}
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

socket.on('allTiles', function(inAllTiles){
	allTiles = inAllTiles;
});
socket.on('currentTurn',function(currentTurn){
	currentTurn=currentTurn
	if(currentTurn==myUserlistIndex){
		drawState=1
	}else{drawState=2}
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

/*Initializing the connection with the server via websockets */
var myTiles = [];
var theirTiles = [];
var boardState = [[]];
var reBoardState=[[]];
var newState = [[]];
var board = new Board(canvas.width/2, canvas.height/2, boardState.length, boardState[0].length, tileHeight+2*tilePadding, tileWidth+2*tilePadding);
//var submitButton = new SubmitButton();
var shapes = [[],[],[]];
var userList = [];
var spectatorColor = "#444444";
var yourTurnColor = "#0000ff";
var newTileColor = "#ffff00";
var placeholderColor = '#444444';
var validPlayColor = '#00ff00';
var invalidPlayColor = '#ff0000';
var defaultTileColor = '#ffe0b3';
var newServerTileColor = '#aae0b3';
var myTurn = false;
var myUserlistIndex = 0;
var myUserlistString = "";
var Moose=undefined



Moose=new paun('../images/moose-clipart-Moose-Silhouette.svg',435,398,90,90,{x:5,y:5})

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
	var userListString = '';
	userList = data;
	for( var i = 0; i < data.length; i++ ){
		var header = 'div id="userListDiv'+ i + '"';
		var click = 'onclick="changeName(' + "'" + data[i].id + "'" + ')"';
		var color = ' style="color: ' + data[i].color + ';"'
		var string = '' + data[i].userName;
		var ender = '</div>';
		
		if(data[i].color != spectatorColor){
			string = string + " " + data[i].score;
			
			if(data[i].id == socket.id){
				if(soundsAllowed && !myTurn && data[i].color == yourTurnColor){
					ding.play(); //play ding when it becomes your turn
				} 
				myTurn = data[i].color == yourTurnColor; //update old status
				
				myUserlistIndex = i;
				myUserlistString = string;
			}
		}
		
		userListString = userListString + '<' + header + click + color + '>' + string + ender;
		//console.log( "player", data[i].userName, "myTurn", myTurn, "id", data[i].id, socket.id, "color", data[i].color, yourTurnColor);
	}
	document.getElementById('userlist').innerHTML = userListString;
	console.table(data);
});

socket.on('showBoard',function(data){
	$('#title').css('color', data.titleColor);
	$('#content').css('display', data.displayTitle);
	$('#gameBoard').css('display', data.displayGame);
	resizeCanvas();
});

socket.on('tiles', function(tiles){
	serverTiles = tiles;
	for (var i = 0; i < newState.length; i++){ //clear whats on board
		for (var j = 0; j < newState[i].length; j++){
			newState[i][j].updateData(newBlankTile());
		}
	}
	myTiles = []; //delete my tiles
	for(var i = 0; i < serverTiles.length; i++){
		//console.log(cards)
		var tile = new doubleButton(tiles[i], (canvas.width/2) + (tileWidth*2 + 20) * (i-(tiles.length-1)/2) , canvas.height - (tileHeight + 20), tileWidth*2, tileHeight, cards);
		//tile.fillColor = newTileColor;
		//tile.drawOutline(placeholderColor); //placeholder outline
		shapes[0].concat(tile.subButtons);//1st layer
		myTiles.push(tile);
	}
	
	//resizeDrawings();
	console.log('tiles updated: ', myTiles);
});
socket.on('playedTiles',function (tiles){
	theirTiles=[];//delete tiles
	for(let i=0; i<tiles.length;i++){
		if (tiles[i]!=-1){
			let tile = new doubleButton(tiles[i], (canvas.width/2) + (tileWidth*2 + 20) * (i-(tiles.length-1)/2) , (tileHeight + 20), tileWidth*2, tileHeight, cards);
			//shapes[0].concat(tile.subButtons)
			theirTiles.push(tile)
		}
	}
})

socket.on('boardState', function(recievedBoardState){
	board.updateFromServer(recievedBoardState);
	
	if(newState.length != recievedBoardState.length || newState[0].length != recievedBoardState[0].length){ //clear new state if different size
		//TODO: move tiles in newState back to hand
		newState = [];
		if(boardState.length > 0 && boardState[0].length > 0){
			for(var row = 0; row < boardState.length; row++){
				var line = [];
				for(var col = 0; col < boardState[0].length; col++){
					//var tile = new MoveTile(newBlankTile(), 0, 0, tileHeight, tileWidth, tileFontSize);
					//tile.fillColor = newTileColor;
					//line.push(tile);
					//line.push(newBlankTile());
				}
				newState.push(line);
			}
		}
	}
	
	//updatePlayValidity();
});
/*
function updatePlayValidity(){
	var check = validTilesToPlay(serverTiles, getTileData(newState), getTileData(boardState), allTiles);
	if(check.error.length == 0){
		$('#userListDiv'+myUserlistIndex)[0].innerHTML = (myUserlistString + " + " + check.score);
	} else {
		$('#userListDiv'+myUserlistIndex)[0].innerHTML = (myUserlistString);
	}
	scoreIsValid = check.error.length == 0;
	//console.log("check", check);
}
*/
function checkClick(event){
	var foundClick = false;
	var i;
	var area;
	var offset = $('#gameBoard').position();
	var scale = {x: canvas.width / $('#gameBoard').width(), y: canvas.height/ $('#gameBoard').height()};
	//console.log('click', {x: event.clientX, y: event.clientY});
	//console.log('scale:', scale)
	var click = {x: event.clientX*scale.x - offset.left, y: event.clientY*scale.y - offset.top};
	console.log('adjusted click: ', click);
	for( i = 0; i < shapes.length; i += 1){
		for(var j = 0; j < shapes[i].length; j++){
			if( shapes[i][j].clickArea ){
				area = shapes[i][j].clickArea;
				//console.log(area);
				if( click.x  < area.maxX){
					if( click.x > area.minX){
						if( click.y < area.maxY){
							if( click.y > area.minY){
								shapes[i][j].click()
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
	if(!foundClick){
		selected = undefined;
	}
}


var yesNoAsk=new SubmitButton(canvas.height*3/4,300,"yes or No?",'yesNo')
var distance2moose=new SubmitButton(canvas.height/2,300,"Distance?",'dist')
var movePiece=new SubmitButton(canvas.height/4,300,"move","move")
var endgame=new SubmitButton(150,300,"I'm on the moose",'found')

//drawing stuff

function draw(){
	shapes = [[],[],[]]; //first object is top layer, second is middle, last is bottom layer
	ctx.textAlign="center";
	ctx.textBaseline = "middle";
	//console.log('draw: ', shapes );
	ctx.clearRect(0,0,canvas.width, canvas.height);
	if(endgame!=undefined){
		shapes[0] = shapes[0].concat(endgame)
	}
	for(var i = 0; i < myTiles.length; i++){
		shapes[0] = shapes[0].concat( myTiles[i].subButtons );//1st layer
	}
	for(var i = 0; i < theirTiles.length; i++){
		shapes[0] = shapes[0].concat( theirTiles[i].subButtons );//1st layer
	}
	//var radius = (Math.min(canvas.width, canvas.height-140)/2)-50;
	switch(drawState){
		case 1:
			if(boardState.length > 0){
				board.x=canvas.width-(board.columns+3)*board.columnThickness/2
				board.draw(ctx);
			}
			if(movePiece!=undefined){
				shapes[0] = shapes[0].concat(movePiece)
			}
			if(distance2moose != undefined){
				shapes[0] = shapes[0].concat(distance2moose)
			}
			if(yesNoAsk!=undefined){
				shapes[0] = shapes[0].concat(yesNoAsk)
			}
			for( var i = shapes.length-1; i >= 0; i -= 1){
				//if(i==0 && shapes[0].length > 0){debugger;}
				for(var j = 0; j < shapes[i].length; j++){
					shapes[i][j].draw(ctx);
				}
			}
			if(selected!=undefined){
				if (selected.visible==true){
					selected.drawOutline('#005500')
				}

			}
			//canvas.width-board.columnThickness
		break;
		case 2:
			//board
			if(boardState.length > 0){
				board.x=canvas.width/2
				board.draw(ctx);
			}
			//player tiles
			for(var i = 0; i < myTiles.length; i++){
				//if(myTurn){
				/*if(scoreIsValid){
					myTiles[i].drawOutline(validPlayColor);
				} else {
					myTiles[i].drawOutline(invalidPlayColor);
				}*/		//} else {
				//	myTiles[i].drawOutline('#444444'); //placeholder outline
				//}
				
				shapes[0] = shapes[0].concat( myTiles[i].subButtons );//1st layer
			}
			
			//selected outline
			if(selected!=undefined){
				if (selected.visible==true){
					selected.drawOutline('#005500')
				}

			}
			//place questions on board 

			
			//button
			/*
			if(myTurn){
				submitButton.visible = true;
				shapes[0].push(submitButton);
			} else {
				submitButton.visible = false;
			}
			*/
			//draw cards
			for( var i = shapes.length-1; i >= 0; i -= 1){
				//if(i==0 && shapes[0].length > 0){debugger;}
				for(var j = 0; j < shapes[i].length; j++){
					shapes[i][j].draw(ctx);
				}
			}
		break
	}
	setTimeout(draw, 100); //repeat
}
draw();

function resizeCanvas(){
	canvas.width = window.innerWidth - $('#sidebar').width() - 50;
	canvas.height = window.innerHeight - 2;
	console.log('canvas resized to: ', canvas.width, canvas.height);
	resizeDrawings();
}

function resizeDrawings(){
	tileWidth = 80; //* window.devicePixelRatio;
	tileHeight = 80; //* window.devicePixelRatio;
	tilePadding = tileWidth/20;
	tileFontSize = 30; //* window.devicePixelRatio;
	board.x = canvas.width/2;
	board.y = canvas.height/2;
	board.rowThickness = tileHeight + 2*tilePadding;
	board.columnThickness = tileWidth + 2*tilePadding;
	movePiece.updateSize(movePiece.x,board.y/2,movePiece.width,movePiece.height)
	distance2moose.updateSize(distance2moose.x,board.y,distance2moose.width,distance2moose.height)
	yesNoAsk.updateSize(yesNoAsk.x,board.y*3/2,yesNoAsk.width,yesNoAsk.height)

	
	for(var i = 0; i < myTiles.length; i++){
		myTiles[i].updateSize((canvas.width/2) + (tileWidth + 20) * (i-2) , canvas.height - (tileHeight + 20), tileHeight, tileWidth);
	}
	//submitButton.updateSize(canvas.width/2, 60, tileWidth*4, tileHeight);
}

/*
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object 
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
 
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == 'undefined') {
	stroke = true;
  }
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
	ctx.fill();
  }
  if (stroke) {
	ctx.stroke();
  }
}
/*
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
}*/

function drawPerson(ctx, x, y, width, height, color){
	ctx.save();
	//ctx.strokeStyle="rgba(0,0,0,0)";
	ctx.miterLimit=4;
	//ctx.font="normal normal 400 normal 15px / 21.4286px ''";
	//ctx.font="   15px ";
	ctx.translate(x-(width/2),y-(height/2));
	ctx.scale(width/512, height/512);

	//ctx.save();
	//ctx.font="   15px ";
	//ctx.save();
	ctx.fillStyle=color;
	//ctx.font="   15px ";
	ctx.beginPath();
	ctx.moveTo(250.882,22.802);
	ctx.bezierCurveTo(227.516,25.837,206.329,53.246,206.329,88.737);
	ctx.bezierCurveTo(206.329,108.295,213.1,125.593,223.024,137.552);
	ctx.lineTo(234.864,151.815);
	ctx.lineTo(216.647,155.239);
	ctx.bezierCurveTo(203.747,157.664,194.289,164.479,186.204,175.575);
	ctx.bezierCurveTo(178.119,186.672,171.938,202.133,167.606,219.95);
	ctx.bezierCurveTo(159.763,252.23,158.038,291.643,157.764,326.386);
	ctx.lineTo(200.632,326.386);
	ctx.lineTo(212.403,484.222);
	ctx.bezierCurveTo(242.297,490.97,274.214,490.732,303.005,484.247);
	ctx.lineTo(313.419,326.387);
	ctx.lineTo(354.235,326.387);
	ctx.bezierCurveTo(354.208,291.218,353.758,251.261,346.651,218.737);
	ctx.bezierCurveTo(342.733,200.803,336.793,185.365,328.611,174.394);
	ctx.bezierCurveTo(320.426,163.424,310.531,156.649,296.048,154.405);
	ctx.lineTo(277.456,151.525);
	ctx.lineTo(289.192,136.821);
	ctx.bezierCurveTo(298.687,124.924,305.124,107.824,305.124,88.739);
	ctx.bezierCurveTo(305.124,50.901,281.469,22.895,255.725,22.895);
	ctx.closePath();
	ctx.fill();
	//ctx.stroke();
	//ctx.restore();
	//ctx.restore();
	ctx.restore();
}