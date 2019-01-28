var numberOfTilesForHand = 8;

var blankTile = {owner: "board", number: -1, id: -1};
function newBlankTile(){
	return {owner: blankTile.owner, number: blankTile.number, id: blankTile.id};
}

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

try {
	module.exports = {
		numberOfTilesForHand: numberOfTilesForHand,
		blankTile: blankTile,
		validTilesToPlay: function(playerTiles, submittedBoardState, currentBoardState, numberOfTilesForHand, allTiles){return validTilesToPlay(playerTiles, submittedBoardState, currentBoardState, numberOfTilesForHand, allTiles)}
	}
} catch (err){
	console.log("you must be client side!");
}