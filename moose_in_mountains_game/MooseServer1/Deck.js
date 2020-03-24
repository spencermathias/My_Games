// nodejs for a deck module. https://nodejs.org/docs/latest/api/modules.html
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

	//overload when creating deck
	drawCard(ctx, cardNum){
		console.warn('draw not defined');
	}
}

//try/catch to allow use on client and server side
try {
	module.exports = Deck
} catch (err){
	console.log("you must be client side!")
} 

/*let a = new Deck({suit:['♥','♦','♣','♠'], number:['A',2,3,4,5,6,7,8,9,10,'J','Q','K']}) //MSB->LSB

let c = []
for(let b = 0; b<52; b++){
	c.push(a.getProperties(b))
}
console.log(c)*/
