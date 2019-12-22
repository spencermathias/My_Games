// put chat log behind a button for mobile; only show the last message for a second

//network definitions
const localAddress = 'localhost'//'192.168.1.124'
const localPort = '8080'
const publicAddress = '184.167.236.159'
var moosecordget=false

//events
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
		//board.updateSize(board.x + dx,board.y + dy,Qengine.boardRow, Qengine.boardCol, tileHeight + 2*tilePadding, tileWidth + 2*tilePadding,board.clickAreas)
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

$('#myText')[0].addEventListener('keyup',function(event){
	if (event.keyCode === 13) {
    	// Cancel the default action, if needed
    	event.preventDefault();
    	// Trigger the button element with a click
  		var message=$('#myText').val()
  		if(Qengine.strContain(message,'mooseReset')){moosecordget=true};
  		if(!moosecordget){
  			$('#chatlog').append('<div style="color:#009900">'+message+'</div>'); //appending the data on the page using Jquery 
  			let answer=(Qengine.solveStr(message))
  			if(answer=='0'||answer=='1'){
  				if(answer==true){
	  				$('#chatlog').append('<div style="color:#009900">unofficial test of code </div>')
	  				$('#chatlog').append('<div style="color:#990000">result true</div>'); //appending the data on the page using Jquery 
	  			}else{
	  				$('#chatlog').append('<div style="color:#009900">unofficial test of code</div>');
	  				$('#chatlog').append('<div style="color:#990000">result false</div>');
	  			}
	  		}else{
	  			$('#chatlog').append('<div style="color:#990000">unofficial test of code result error</div>'); //appending the data on the page using Jquery 
	  		}
			$('#response').text(answer);
			//$('#chatlog').scroll();
			$('#chatlog').animate({scrollTop: 1000000})
			dropDownList.push($('#myText').val())
			$('#myText').val('');
			dropDownListIndex=0
  		}else{
	  		if(Qengine.strContain(message,'{')){
                let first=message.indexOf('{')
                let last=message.indexOf('}')+1
                if (last==-1) {
                	console.log('error');
                	let error = 'did not include"}"'
                	$('#chatlog').append('<div style="color:#ff0000">'+error+'</div>'); //appending the data on the page using Jquery 
                }else{
                	let testcord=''
                	try{
                		testcord=JSON.parse(message.substr(first,last))
                		Qengine.moose.cord=testcord
                		testcord.x-=4
                		testcord.y-=4
                		let tested='moose='+message.substr(first,last)
                		$('#chatlog').append('<div style="color:#009900">'+tested+'</div>'); //appending the data on the page using Jquery 
                		moosecordget=false
                		$('#myText').val('');
                	}
                	catch(error){
                		$('#chatlog').append('<div style="color:#ff0000">'+error+'</div>');
                	}
                }
            }else{
            	error='did not include"{"'
            	$('#chatlog').append('<div style="color:#ff0000">'+error+'</div>'); //appending the data on the page using Jquery 
            }
	  	}
	}
	if(event.keyCode===38){
		if(dropDownListIndex==1 && $('#myText').val()!="" && $('#myText').val()!=dropDownList[dropDownList.length-1]){
			dropDownList.push($('#myText').val())
		}
		if (dropDownListIndex<dropDownList.length){
			dropDownListIndex++
			$('#myText').val(dropDownList[dropDownList.length-dropDownListIndex])
		}else{$('#myText').val(dropDownList[0])}
	}
	if(event.keyCode===40){

		if (dropDownListIndex>1){
			dropDownListIndex--
			$('#myText').val(dropDownList[dropDownList.length-dropDownListIndex])
		}else{$('#myText').val(dropDownList[dropDownList.length])}
	}
	//socket.send(JSON.stringify(data)); 
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
var dropDownList=[]
var dropDownListIndex=1
var highlightColor='#005500'
dropDownList.push('mooseReset={"x":4,"y":4}')

var canvas = document.getElementById("gameBoard");
var ctx = canvas.getContext("2d");
var cards = new Deck({mean:[{x:0,y:-1},{x:0,y:1},{x:1,y:0},{x:-1,y:0},0,0],dif:[{x:0,y:-1},{x:0,y:1},{x:1,y:0},{x:-1,y:0}]})

//initialize variables used in game
var myTiles = [];
var theirTiles = [];
var theirNames = [];
var boardState = [[]];

var shapes = [[],[],[]];
var userList = [];
var spectatorColor = "#444444";
var newTileColor = "#ffff00";
var defaultTileColor = '#ffe0b3';
var myTurn = false;
var myUserlistIndex = 0;
var myUserlistString = "";
var myLastChoice=undefined
var movePiece=undefined
var distance2moose=undefined
var yesNoAsk=undefined
var myOptions=[]

//classes
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
		this.playerpiece=undefined
		this.moose=''
		this.validselect=false
	}
	
	drawOutline(color){
		this.highlightColor = color;
		this.validselect=true;
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
		if(this.playerpiece!=undefined){
			ctx.save();
			drawPerson(ctx,this.x,this.y,90,90, Qengine.players[this.playerpiece].color);
			ctx.restore();
			this.playerpiece=undefined
		}
		
		if(this.moose){
			ctx.save();
			drawPerson(ctx,this.x,this.y,10,10,'#000000' );
			ctx.restore();
			this.moose=false
		}
	}
	click(){
		if(this.validselect){
			if(selected.type=='move'){
				if(Qengine.validMove(myUserlistIndex,this.cord)){
					socket.emit('recieveMove',this.cord)
					console.log('sent move')
				}else{console.log('not valid move')}
				this.validselect=false
			}else if(selected.type=='dist'){
				socket.emit("recieveDistanceQuestion",Qengine.players[this.playerpiece].userName)
			}
		}else{
			console.log('this tile is not selected')
		}
		
		
		//let validselect=false

		//validselect=validselect||validMove(Qengine.addcord(getcord(reBoardState,myUserlistIndex),this.cord,-1))
		//validselect=validselect||reBoardState[this.cord.y][this.cord.x]!=-1
		//if(validselect){
		//	selected=this
		//	selected.visible=true
		//}else{
		//	console.log("This button has not been overloaded yet!");
		//}
	}
}

class doubleButton{
	constructor(tileData, x,y,width,height,curentDeck,playerID){
		this.playerID=playerID
		this.arrowbv = [];
		this.arrowgv = [];
		this.arrowb = '';
		this.arrowg = '';
		this.chosen={ID:tileData, path:undefined, color:undefined}

		this.tileData = curentDeck.getProperties(tileData);
		this.tileData.ID=tileData
		//this.chosen={path:undefined,color:undefined}

		this.arrowb=cord2dpath(Qengine.addcord(this.tileData.mean,this.tileData.dif))
		this.arrowg=cord2dpath(Qengine.addcord(this.tileData.mean,this.tileData.dif,-1))
		
		if (cord2dpath(this.arrowb)!=''){
			this.arrowb=cord2dpath(this.tileData.mean)+cord2dpath(this.tileData.dif)
		}

		if(cord2dpath(this.arrowg)!=''){
			this.arrowg=cord2dpath(this.tileData.mean)+cord2dpath(Qengine.addcord({x:0,y:0},this.tileData.dif,-1))
		}
		
		this.subButtons = [
			new ButtonHalf(x-width/4,y,width/2, height,'L',this.arrowb,'#0000ff','#000000','#000000',undefined,undefined,this),
			new ButtonHalf(x+width/4,y,width/2, height,'R',this.arrowg,'#00ff00','#000000','#000000',undefined,undefined,this)
		];
		this.highlightColor = "";
		
	}
	

	click(direction){
		//console.log("This button has not been overloaded yet!");
		if(direction.path!=this.chosen.path){
			if(this.chosen.path!=undefined){
				if(this.chosen.color=='Blue'){
					Qengine.moose.cord=Qengine.addcord(Qengine.moose.cord,this.arrowb,-1)
				}else{
					Qengine.moose.cord=Qengine.addcord(Qengine.moose.cord,this.arrowg,-1)
				}
			}
			this.chosen.path=direction.path
			this.chosen.color=direction.color
			Qengine.moveMoose(this.chosen,this.playerID)
		}else{
			if(this.chosen.color=='Blue'){
				Qengine.moose.cord=Qengine.addcord(Qengine.moose.cord,this.arrowb,-1)
			}else{
				Qengine.moose.cord=Qengine.addcord(Qengine.moose.cord,this.arrowg,-1)
			}
			this.chosen.path=undefined
		}
		//console.log(tile)
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
		if(direction=='L'){
			this.color='Blue'
		}else{this.color='Green'}
		this.sendOnClick={path:shape,color:this.color}
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

	drawOutline(color){ 
		this.highlightColor = color;
	}
	
	draw(ctx){
		if(this.highlightColor != ""){
			//console.log(this.highlightColor);
			ctx.save();
			ctx.fillStyle = this.highlightColor;
			roundRect(ctx, this.x-(this.width/2 + tilePadding), this.y-(this.height/2 + tilePadding), this.width+2*tilePadding, this.height+2*tilePadding, this.radius,true, false);
			ctx.restore();
			this.highlightColor = "";
		}
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
		this.parent.click(this.sendOnClick)
	}	
}

class selectButton extends Button{
	constructor(y,width,text,type){
		super(300,y,width,100,text,"#ffff00","#000000","#00ff00")
		this.type=type
	}
	drawOutline(color){
		this.highlightColor = color;
	}
	click(){
		if(this.visible){
			if(selected!=this){
				selected=this
				highlightApplicable(this.type)
			}else{
				selected=undefined
				myOptions=[]
				board.highlightClickable=false
			}
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
		super.draw(ctx);
	}
}

class Board {
	constructor(x, y, rows, columns, rowThickness, columnThickness){
		this.x = x;
		this.y = y;

		this.borderColor = '#ffebcd';
		this.backgroundColor = '#8B4513';
		this.lineColor = '#ffebcd';
		this.lineWidth = 2;
		this.clickAreas={
			"N":{name:'"N"',cord:{x:0,y:-1}},
			"North":{name:'"North"',cord:{x:0,y:-1}},
			"E":{name:'"E"',cord:{x:1,y:0}},
			"East":{name:'"East"',cord:{x:1,y:0}},
			"S":{name:'"S"',cord:{x:0,y:1}},
			"South":{name:'"South"',cord:{x:0,y:1}},
			"W":{name:'"W"',cord:{x:-1,y:0}},
			"West":{name:'"West"',cord:{x:-1,y:0}}
		}
		this.highlightClickable=false
		this.updateSize(x,y,rows, columns, rowThickness, columnThickness,this.clickAreas)
	}
	updateSize(x,y,rows, columns, rowThickness, columnThickness,clickAreas){
		this.x = x;
		this.y = y;
		this.rows = rows;
		this.columns = columns;
		this.rowThickness = rowThickness;
		this.columnThickness = columnThickness;
		this.width = columns*columnThickness;
		this.height = rows*rowThickness;
		this.border = Math.min(this.rowThickness, this.columnThickness);

		for(let sideclickArea in this.clickAreas){
			this.clickAreas[sideclickArea].x=this.x+(this.width+this.border)/2*this.clickAreas[sideclickArea].cord.x
			this.clickAreas[sideclickArea].y=this.y+(this.height+this.border)/2*this.clickAreas[sideclickArea].cord.y
			if(this.clickAreas[sideclickArea].name.length>3){
				this.clickAreas[sideclickArea].width=Math.abs(this.clickAreas[sideclickArea].cord.y*(this.width-this.border))+this.border
				this.clickAreas[sideclickArea].height=Math.abs(this.clickAreas[sideclickArea].cord.x*(this.height-this.border))+this.border
			}else{
				this.clickAreas[sideclickArea].width=this.border
				this.clickAreas[sideclickArea].height=this.border
			}
			this.clickAreas[sideclickArea].xMin= this.clickAreas[sideclickArea].x-this.clickAreas[sideclickArea].width/2
			this.clickAreas[sideclickArea].xMax= this.clickAreas[sideclickArea].x+this.clickAreas[sideclickArea].width/2
			this.clickAreas[sideclickArea].yMin= this.clickAreas[sideclickArea].y-this.clickAreas[sideclickArea].height/2
			this.clickAreas[sideclickArea].yMax= this.clickAreas[sideclickArea].y+this.clickAreas[sideclickArea].height/2
		}

		if(boardState.length != this.columns || boardState[0].length != this.columns|| boardState.length!=this.rows){ //new boardState if different size
			boardState = [];
			if(this.columns > 0 && this.rows > 0){
				for(var row = 0; row <this.rows; row++){
					var line = [];
					for(var col = 0; col < this.columns; col++){
						line.push(new Tile(newBlankTile(), 0, 0, tileHeight, tileWidth, tileFontSize,{x:col,y:row}));
					}
					boardState.push(line);
				}
			}
		}
	}
	
	
	draw(ctx){
		if (this.rows > 0 && this.columns >0){

			ctx.save()
			//console.log(xPos, yPos, rows, columns, rowThickness, columnThickness)
			//console.log(xPos, yPos,this.width, this.height);
			var xMin = this.x - this.width/2;
			var xMax = this.x + this.width/2;
			var yMin = this.y - this.height/2;
			var yMax = this.y + this.height/2;

			
			//border
			ctx.fillStyle = this.borderColor;
			//var border = Math.min(this.rowThickness, this.columnThickness);
			ctx.fillRect(xMin - this.border, yMin - this.border, this.width + 2*this.border, this.height + 2*this.border);
			if (this.highlightClickable){
				for(let sideclickArea in this.clickAreas){
					if (this.clickAreas[sideclickArea].name.length>3) {
						roundRect(ctx, this.clickAreas[sideclickArea].xMin, this.clickAreas[sideclickArea].yMin,this.clickAreas[sideclickArea].width, this.clickAreas[sideclickArea].height,this.border/10, "#ffffff","#000000")
					}
				}
				for(let sideclickArea in this.clickAreas){
					if (this.clickAreas[sideclickArea].name.length<4) {
						roundRect(ctx, this.clickAreas[sideclickArea].xMin, this.clickAreas[sideclickArea].yMin,this.clickAreas[sideclickArea].width, this.clickAreas[sideclickArea].height,this.border/10, "#ffffff","#000000")
					}
				}
				ctx.beginPath()
			}
			ctx.font = '' + this.rowThickness*0.9 +"px Comic Sans MS";
			ctx.fillStyle = this.backgroundColor;
			ctx.textAlign = "center";
			ctx.fillText('N',this.x,this.y-this.width/2-(this.rowThickness)/2*.8)
			ctx.fillText('S',this.x,this.y+this.width/2+(this.rowThickness)/2)
			ctx.fillText('W',this.x-this.height/2-this.columnThickness/2,this.y)
			ctx.fillText('E',this.x+this.height/2+this.columnThickness/2,this.y)
			
			//background
			ctx.fillStyle = this.backgroundColor;
			ctx.fillRect(xMin,yMin,this.width, this.height);
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
					shapes[1].push(boardState[i][j]); //bottom layer
					x += this.columnThickness;
				}
				y += this.rowThickness;
			}
			
			//drawPerson(ctx,this.x+this.columnThickness,this.y,90,90,'#ff0000');
			ctx.restore();
		}
	}
	click(name){
		console.log(name)
		if(highlightClickable){
			if(selected.type=='distance'){
				socket.emit("recieveDistanceQuestion",name)
			}
		}
	}
}

var board = new Board(canvas.width/2, canvas.height/2, Qengine.boardRow, Qengine.boardCol, tileHeight+2*tilePadding, tileWidth+2*tilePadding);
var selectButtons={yesno:new selectButton(canvas.height*3/4,300,"yes or No?",'yesNo'),
dist:new selectButton(canvas.height/2,300,"Distance?",'dist'),
move:new selectButton(canvas.height/4,300,"move","move"),
found:new selectButton(150,300,"I'm on the moose",'found'),
submit:new selectButton(canvas.height*3/4,300,'Submit','send'),
cancel:new selectButton(canvas.height*3/4,300,'Cancel','cancel')}
//socket stuff
var socket = io(publicAddress); //try public address 
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
function updateFromServer(recievedBoardState){
	Qengine.players=recievedBoardState
	for(let i=0; i<Qengine.players.length; i++){
		if(Qengine.players[i].lastPlayed!=-1){
			let tile=new doubleButton(Qengine.players[i].lastPlayed.ID, (canvas.width/2) + (tileWidth*2 + 20) * (i-(Qengine.players.length-1)/2) , (tileHeight + 20), tileWidth*2, tileHeight, cards,i)
			if(i==myUserlistIndex){
				tile.click=function(){
					console.log('this tile is locked because it is the one you played')
				}
			}
			console.log(tile)
			tile.chosen=Qengine.players[i].lastPlayed
			theirTiles.push(tile)
		}
	}
	//theirTiles.push()
}
function cord2shape(cord){
	return cord.x+cord.y*Qengine.boardCol
}
function highlightApplicable(type){
	switch(type){
		case 'dist':
			myOptions=Qengine.onplayer()
			board.highlightClickable=true
			selectButtons['yesno'].visible=true;
			selectButtons['cancel'].visible=false;
			selectButtons['submit'].visible=false;
		break;
		case 'yesNo':
			selectButtons['yesno'].visible=false;
			selectButtons['cancel'].visible=true;
			selectButtons['submit'].visible=true;
			myOptions=[]
			board.highlightClickable=false
		break;
		case 'move':
			myOptions=Qengine.moveOptions(myUserlistIndex);
			board.highlightClickable=false
			selectButtons['yesno'].visible=true;
			selectButtons['cancel'].visible=false;
			selectButtons['submit'].visible=false;
		break;
		case 'found':
			socket.emit("foundMoose");
			board.highlightClickable=false
		break;
		case 'send':
			if ($('#myText').val()!=''){
				socket.emit('yesnoquestion',$('#myText').val())
			};
		break;
		case 'cancel':
			selectButtons['cancel'].visible=false;
			selectButtons['submit'].visible=false;
			selectButtons['yesno'].visible=true;
		break
	}
}
			

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
	var userListString = '';
	userList = data;
	console.log('yesno.cardsPlayed=userList')
	console.log('yesno.cards=cards')
	for( var i = 0; i < data.length; i++ ){
		var header = 'div id="userListDiv'+ i + '"';
		var click = 'onclick="changeName(' + "'" + data[i].id + "'" + ')"';
		if(Qengine.players[data[i].boardID]){
			var color = ' style="color: ' + Qengine.players[data[i].boardID].color + ';"'
		}else{
			var color = ' style="color: ' + data[i].color + ';"'
		}
		var string = '' + data[i].userName + data[i].yourTurn;
		var ender = '</div>';
		
		if(data[i].color != spectatorColor){
			//string = string + data[i].yourTurn; 
			
			if(data[i].id == socket.id){
				if(soundsAllowed && !myTurn && data[i].yourTurn == '<'){
					ding.play(); //play ding when it becomes your turn
				} 
				myTurn = data[i].yourTurn=='<'; //update old status
				
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
	myTiles = []; //delete my tiles
	for(var i = 0; i < serverTiles.length; i++){
		//console.log(cards)
		var tile = new doubleButton(tiles[i], (canvas.width/2) + (tileWidth*2 + 20) * (i-(tiles.length-1)/2) , canvas.height - (tileHeight + 20), tileWidth*2, tileHeight, cards,myUserlistIndex);
		tile.click=function(direction){
			if(myLastChoice==undefined){
				if(direction.color=='Blue'){
					Qengine.moose.cord=Qengine.addcord(Qengine.moose.cord,this.arrowb,-1)
				}else{
					Qengine.moose.cord=Qengine.addcord(Qengine.moose.cord,this.arrowg,-1)
				}
				this.chosen.path=direction.path
				this.chosen.color=direction.color
				Qengine.moveMoose(this.chosen,this.playerID)
				myLastChoice=this.chosen
				socket.emit("recieveTile",this.chosen)
				console.log("recieveTile",this.chosen)
				// send cardID to the server and option chosen
			}else{console.log('this tile is unavalible currently')}
		}
		//tile.fillColor = newTileColor;
		//tile.drawOutline(placeholderColor); //placeholder outline
		shapes[0].concat(tile.subButtons);//1st layer
		myTiles.push(tile);
	}
	
	//resizeDrawings();
	console.log('tiles updated: ', myTiles);
});
socket.on('currentTurn',function(currentTurnR){
	console.log('recieved',currentTurnR)
	console.log('myTurn',myTurn)
	if(currentTurnR==-1){
		for(i=0; i<myTiles.length; i++){
			myLastChoice=undefined
		}
		for(i in selectButtons){
			selectButtons[i].visible=false
		}
		myOptions=[]
		board.highlightClickable=false
	}else{
		if(myTurn){
			for(i in selectButtons){
				selectButtons[i].visible=true
			}
			selectButtons['submit'].visible=false
			selectButtons['cancel'].visible=false
			if(currentTurnR!=0){
				selectButtons['dist'].visible=false
			}
		}else{
			for(i in selectButtons){
				selectButtons[i].visible=false
			}
			selectButtons['found'].visible=true
			myOptions=[]
			board.highlightClickable=false
		}
	}
	currentTurn=currentTurnR
})

socket.on('boardState', function(recievedBoardState){
	updateFromServer(recievedBoardState);
});



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
	if (!foundClick) {
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
	}else{selected = undefined;}
	if(board.highlightClickable){
		for(name in board.clickAreas){
			area=board.clickAreas[name]
			if( click.x  < area.xMax){
				if( click.x > area.xMin){
					if( click.y < area.yMax){
						if( click.y > area.yMin){
							board.click(area.name)
							foundClick = true;
						}
					}
				}
			}
			if(foundClick){break;}
		}
	}
}


//drawing stuff
function draw(){
	shapes = [[],[],[]]; //first object is top layer, second is middle, last is bottom layer
	ctx.textAlign="center";
	ctx.textBaseline = "middle";
	ctx.font = "50px Comic Sans MS"
	ctx.clearRect(0,0,canvas.width, canvas.height);
	// if(endgame!==undefined){
	// 	shapes[0] = shapes[0].concat(endgame)
	// }
	for(var i = 0; i < myTiles.length; i++){
		shapes[0] = shapes[0].concat( myTiles[i].subButtons );//1st layer
	}
	for(var i = 0; i < theirTiles.length; i++){
		shapes[0] = shapes[0].concat( theirTiles[i].subButtons );//1st layer
	}
	board.draw(ctx);
	
	for(i in selectButtons){
		if(selectButtons[i].visible){
			shapes[0].push(selectButtons[i])
		}
	}

	for(let i = 0; i<theirTiles.length;i++){
		if(theirTiles[i].chosen!=undefined){
			for(let j=0;j<theirTiles[i].subButtons.length;j++){
				if(theirTiles[i].chosen.path==theirTiles[i].subButtons[j].shape)
					theirTiles[i].subButtons[j].drawOutline('#005500')
			}
		}
	}
	for( var i = shapes.length-1; i >= 0; i -= 1){
		//if(i==0 && shapes[0].length > 0){debugger;}
		for(var j = 0; j < shapes[i].length; j++){
			shapes[i][j].draw(ctx);
		}
	}
	for(let i=0; i<Qengine.players.length;i++){
		shapes[1][cord2shape(Qengine.players[i].cord)].playerpiece=i
	}
	for( var i=0; i<myOptions.length; i++){
		let tileNumber=cord2shape(myOptions[i])
		shapes[1][tileNumber].drawOutline('#005500')
	}
	if(shapes[1].length>cord2shape(Qengine.moose.cord)){
		shapes[1][cord2shape(Qengine.moose.cord)].moose=true
	}
	if(selected!=undefined){
		if (selected.visible==true){
			selected.drawOutline('#005500')
		}
	}

	if (theirNames.length>0){
		for(let i=0;i<theirNames.length;i++){
			ctx.fillText(theirNames[i].name,theirNames[i].x,theirNames[i].y)
		}
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
	board.updateSize(canvas.width/2,canvas.height/2,Qengine.boardRow, Qengine.boardCol, tileHeight + 2*tilePadding, tileWidth + 2*tilePadding,board.clickAreas)
	let j=0
	let k=0
	for(buttonType in selectButtons){
		if(buttonType=='submit'||buttonType=='cancel'){
			k++
			selectButtons[buttonType].updateSize(300*k+150,canvas.height*1/5,300,100)
		}else{
			j++
			selectButtons[buttonType].updateSize(300,canvas.height*(j)/5,300,100)
		}
	}
	for(var i = 0; i < myTiles.length; i++){
		myTiles[i].updateSize((canvas.width/2) + (tileWidth + 20) * (i-2) , canvas.height - (tileHeight + 20), tileHeight, tileWidth);
	}
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

//other functions
function newBlankTile(){
	return {owner: blankTile.owner, number: blankTile.number, id: blankTile.id};
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
//temp functions to function as server
function readyClick(state){
	endgame=undefined
	theirTiles=[]
	myTiles=[]
	movePiece=undefined
	distance2moose=undefined
	yesNoAsk=undefined
	var showBoardMessage = {
        displayGame:  "flex" 
    };
    $('#gameBoard').css('display', showBoardMessage.displayGame);
	resizeCanvas();
	draw()

}