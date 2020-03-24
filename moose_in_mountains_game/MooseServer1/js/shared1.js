var numberOfTilesForHand = 4;
var movemax=1

var blankTile = {owner: "board", number: -1, id: -1};
function newBlankTile(){
	return {owner: blankTile.owner, number: blankTile.number, id: blankTile.id};
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

/*try/catch to allow use on client and server side
try {
	module.exports = Deck
} catch (err){
	console.log("you must be client side!")
} 

//let a = new Deck({suit:['♥','♦','♣','♠'], number:['A',2,3,4,5,6,7,8,9,10,'J','Q','K']}) //MSB->LSB

let c = []
for(let b = 0; b<52; b++){
	c.push(a.getProperties(b))
}
console.log(c)*/

function checkNeighbors(oldboard,row,col){
	var isConnected = false
	//check center
	var boardRows = 0;
	var boardColumns = 0;
	var centerRow = 0; 
	var centerCol = 0;
	if(oldboard.length > 0){
		boardRows = oldboard.length;
		centerRow = (boardRows-1)/2;
		if(oldboard[0].length > 0){
			boardColumns = oldboard[0].length;
			centerCol = (boardColumns-1)/2;
		}
	}
	//console.log(__line, "row", row, "centerRow" , centerRow);
	//console.log(__line, "col", col, "centerCol" , centerCol);
	if(row == centerRow && col == centerCol){isConnected = true;}
	//check upper
	var upperRow = row - 1;
	var leftCol = col - 1;
	var lowerRow = row + 1;
	var rightCol = col + 1;
	
	if(upperRow >= 0){
		if(oldboard[upperRow][col].id != blankTile.id) {isConnected = true;}
	}
	if(leftCol >= 0){//check left
		if(oldboard[row][leftCol].id != blankTile.id) {isConnected = true;}
	}
	if(lowerRow < boardRows){//check lower
		if(oldboard[lowerRow][col].id != blankTile.id) {isConnected = true;}
	}
	if(rightCol < boardColumns){//check right
		if(oldboard[row][rightCol].id != blankTile.id) {isConnected = true;}
	}
	//console.log(__line, "is connected", isConnected);
	return isConnected;
}

function validTilesToPlay(playerTiles, submittedBoardState, currentBoardState, allTiles) {
	//at least one section must contain an old tile or the origin
	//played tiles must be in a single row or column
	//cannot have empty gap between played tiles
	//sections that contain a played tile must add to a multiple of 5
	var score = 0;
	var corrected = ensureSubmittedIsPhysicallyPossible(playerTiles, submittedBoardState, currentBoardState, allTiles);
	var skipped = corrected.changedTiles.length == 0;
	if(corrected.error.length == 0){
		//split board up into sections that contain newly played tiles
		//var allConnect = true;
		var rowSections = [];
		for(var row = 0; row < corrected.boardState.length; row++){
			var sections = [];
			var containsNew = false;
			//var subConnect = false;
			var subsection = [];
			for(var col = 0; col < corrected.boardState[row].length; col++){
				if(corrected.boardState[row][col].id != blankTile.id){
					subsection.push({pos: {row: row, col:col}, tile: corrected.boardState[row][col]});
					if(corrected.changedTiles.indexOf(corrected.boardState[row][col]) >= 0){
						containsNew = true;
					}
				} else {
					if(subsection.length > 0 && containsNew){
						//if(!subConnect){allConnect = false;}
						sections.push(subsection);
					}
					subsection = [];
					containsNew = false
					subConnect = false;
				}
			}
			if(subsection.length > 0 && containsNew){ //takes care of edge case
				//if(!subConnect){allConnect = false;}
				sections.push(subsection);
			} 
			rowSections.push(sections);
		}
		
		var colSections = [];
		for(var col = 0; col < corrected.boardState[0].length; col++){
			var sections = [];
			var containsNew = false;
			var subConnect = false;
			var subsection = [];
			for(var row = 0; row < corrected.boardState.length; row++){
				if(corrected.boardState[row][col].id != blankTile.id){
					subsection.push({pos: {row: row, col:col}, tile: corrected.boardState[row][col]});
					if(corrected.changedTiles.indexOf(corrected.boardState[row][col]) >= 0){
						containsNew = true;
					}
				} else {
					if(subsection.length > 0 && containsNew){
						//if(!subConnect){allConnect = false;}
						sections.push(subsection);
					}
					subsection = [];
					containsNew = false
					subConnect = false;
				}
			}
			if(subsection.length > 0 && containsNew){ //takes care of edge case
				//if(!subConnect){allConnect = false;}
				sections.push(subsection);
			} 
			colSections.push(sections);
		}
		//console.log("rowSections",rowSections);
		//console.log("colSections",colSections);
		
		/*for(var i = 0; i < rowSections.length; i++){
			console.log( "row " + i + ":")
			for(var j = 0; j < rowSections[i].length; j++){
				console.log( rowSections[i][j]);
			}
		}
		for(var i = 0; i < colSections.length; i++){
			console.log( "col " + i + ":")
			for(var j = 0; j < colSections[i].length; j++){
				console.log( colSections[i][j]);
			}
		}*/
		
		
		var space = false;
		var multipleOfFive = true;
		var oneRunIsLongerThanOne = false;
		var runsShoterThanSix = true;
		var allRunsLongerThanOneConnectToOldBoard = true;
		var subscore;
		for(var row = 0; row < rowSections.length; row++){
			if(rowSections[row].length > 1){space = true;}
			subscore = 0;
			if(rowSections[row].length > 0){
				if(rowSections[row][0].length > 1){
					oneRunIsLongerThanOne = true;
					if(rowSections[row][0].length > numberOfTilesForHand){
						runsShoterThanSix = false;
					}
					var groupConnects = false;
					for(var i = 0; i < rowSections[row][0].length; i++){
						subscore += rowSections[row][0][i].tile.number;
						if(checkNeighbors(currentBoardState, rowSections[row][0][i].pos.row, rowSections[row][0][i].pos.col)){
							groupConnects = true;
						}
					}
					if (!groupConnects){
						allRunsLongerThanOneConnectToOldBoard = false;
					}
				}
			}
			if(subscore % numberOfTilesForHand == 0){
				score += subscore;
			} else {
				multipleOfFive = false;
			}
		}
		
		for(var col = 0; col < colSections.length; col++){
			if(colSections[col].length > 1){space = true;}
			subscore = 0;
			if(colSections[col].length > 0){
				if(colSections[col][0].length > 1){
					oneRunIsLongerThanOne = true;
					if(colSections[col][0].length > numberOfTilesForHand){
						runsShoterThanSix = false;
					}
					var groupConnects = false;
					for(var i = 0; i < colSections[col][0].length; i++){
						subscore += colSections[col][0][i].tile.number;
						if(checkNeighbors(currentBoardState, colSections[col][0][i].pos.row, colSections[col][0][i].pos.col)){
							groupConnects = true;
						}
					}
					if (!groupConnects){
						allRunsLongerThanOneConnectToOldBoard = false;
					}
				}
			}
			if(subscore % numberOfTilesForHand == 0){
				score += subscore;
			} else {
				multipleOfFive = false;
			}
		}
		if(space){
			corrected.error += "Spaces are not allowed between played tiles! \n";
		}
		
		if(!runsShoterThanSix){
			corrected.error += "Run lengths must be shorter than " + numberOfTilesForHand + "\n";
		}
		
		if(!multipleOfFive){
			corrected.error += "A run was not a multiple of " + numberOfTilesForHand + "\n";
		}
		
		if(!oneRunIsLongerThanOne && !skipped){
			corrected.error += "At least one run must be longer than one tile! \n";
		}
		
		if(!allRunsLongerThanOneConnectToOldBoard){
			corrected.error += "Tiles must connect to previous tiles! \n";
		}
		
	} else {
		console.log("submitted is not possible!");
	}
	
	return {score:score, error: corrected.error, changedTiles: corrected.changedTiles, skipped: skipped, boardState: corrected.boardState};
}

function ensureSubmittedIsPhysicallyPossible(playerTiles, submittedBoardState, boardState, allTiles){
//submitted board is the same as the actual board /
//ensure all submitted tiles are actual tiles /
//only empty tiles replaced with played tiles /
//all played tiles are from players hand /
//all played tiles are in a line /
	var playedTilesCoord = [];
	var corrected = {error: "", boardState: [], changedTiles: []};
	if(boardIsCorrectSize(submittedBoardState, boardState)){ //submitted board is the same as the actual board
		for(var row = 0; row < boardState.length; row++){
			var correctedRow = [];
			for(var col = 0; col < boardState[row].length; col++){
				//ensure all submitted tiles are actual tiles
				if(submittedBoardState[row][col].id == blankTile.id){ //make a submitted board using server side tiles
					correctedRow.push(boardState[row][col]);
				} else if(submittedBoardState[row][col].id < allTiles.length){
					var tile = allTiles[submittedBoardState[row][col].id];
					correctedRow.push(tile);
					if(tile.id != boardState[row][col].id ){ //if a tile has changed
						if(boardState[row][col].id == blankTile.id){ //if tile is empty on board state
							var tileIndex = -1;
							for(var i = 0; i < playerTiles.length; i++){
								if(playerTiles[i].id == tile.id){
									tileIndex = i;
								}
							}
							if(tileIndex >= 0){
								corrected.changedTiles.push(tile);
								playedTilesCoord.push({row: row, col: col});
							} else { //all played tiles are from players hand
								corrected.error += "Played tiles not in hand! \n";
							}
						} else { //only empty tiles replaced with played tiles
							corrected.error += "Cannot replace old tile! \n";
						}
					}
				} else {
					correctedRow.push(blankTile);
					corrected.error += "Submitted non existant tile! \n";
				}
			}
			corrected.boardState.push(correctedRow);
		}
	} else {
		corrected.error += "Submitted board does not have the correct size! \n";
	}
	//all played tiles are in a line
	var useRow = true;
	var useCol = true;
	if(playedTilesCoord.length > 0){
		iRow = playedTilesCoord[0].row;
		iCol = playedTilesCoord[0].col;
		for(var i = 1; i < playedTilesCoord.length; i++){
			if(playedTilesCoord[i].row != iRow){ useRow = false;}
			if(playedTilesCoord[i].col != iCol){ useCol = false;}
		}
	}
	if(!useRow && !useCol){
		corrected.error += "New tiles must be in a single row or column! \n";
	}
	//console.log(corrected.boardState);
	return corrected;
}

function boardIsCorrectSize(submittedBoardState, boardState){
	correctSize = true;
	//make sure row lengths match
	if(submittedBoardState.length != boardState.length){
		console.log(__line,"Invalid number of rows!"); 
		correctSize = false;
	} 
	for(var row = 0; row < boardState.length; row++){
		//make sure column lengths match
		if(submittedBoardState[row].length != boardState[row].length){
			console.log(__line,"Invalid number of columns!"); 
			correctSize = false;
		}
	}
	return correctSize;
}

function addcord(a,b,neg=1){let c={}
	let a1=[],b1=[]
	if(a==0){a1.x=0;a1.y=0}else{a1=a}
	if(b==0){b1.x=0;b1.y=0}else{b1=b}
	c.x=a1.x+neg*b1.x
	c.y=a1.y+neg*b1.y
	return c
}

function validMove(movement){
	//could give half integers and loose the piece
	let movelen=Math.abs(Math.floor(movement.x))+Math.abs(Math.floor(movement.y))
	let valid=false
	if(movelen>0 && movelen<=movemax){valid=true} else {valid=false}

	return valid
}
function getcord(boardState,playerID){
	let cord={}
	for(let i=0; i<boardState.length; i++){
		let x=boardState[i].findIndex(ID => ID === playerID)
		if(x!=-1){
			cord={x:x,y:i}
			break
		}
	}
	return cord
}


function parsePath(path){
	let dmax={
	dy:0,
	dx:0,
	miny:0,
	maxy:0,
	minx:0,
	maxx:0}
	
	for(let i = 0; i<path.length; i++){
		let c = path[i];
		switch(c){
			case 'U':
				dmax.dy -= 1;
				dmax.miny = Math.min(dmax.miny,dmax.dy);
			break;
			case 'R':
				dmax.dx += 1; 
				dmax.maxx = Math.max(dmax.maxx,dmax.dx);
			break;
			case 'D':
				dmax.dy += 1; 
				dmax.maxy = Math.max(dmax.maxy,dmax.dy);
			break;
			case 'L':
				dmax.dx -= 1; 
				dmax.minx = Math.min(dmax.minx,dmax.dx);
			break;
		}
	}

	return(dmax)
}



//validMove: function(movement,boardState,playerID){return validTilesToPlay(playerTiles, submittedBoardState, currentBoardState, numberOfTilesForHand, allTiles)}
try {
	module.exports = {
		numberOfTilesForHand: numberOfTilesForHand,
		blankTile: blankTile,
		Deck:Deck,
		validMove: function(movement){return validMove(movement)},
		addcord: function(a,b,neg){return addcord(a,b,neg)},
		parsePath: function(path){return parsePath(path)}
	}
} catch (err){
	console.log("you must be client side!");
}