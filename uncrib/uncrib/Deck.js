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
	createCard(ctx,cardNum){
		let properties=undefined
		if(cardNum>=0&&cardNum<this.totalCards){
			properties=this.getProperties(cardNum)
		}
		let width=Math.min(ctx.canvas.height/10, ctx.canvas.width/15);
		return new newCard(cardNum,0,0,width,properties)
	}
};
class newCard {
	constructor(id,x,y,width,properties,textSlant=false,fillColor='#ffe0b3'){
		this.id=id
		this.properties=properties
		this.text='🂠'
		this.sizeRatio=.95
		this.visible=true
		this.textSlant=textSlant
		this.fillColor=fillColor
		this.outlineColor='#000000'
		if(this.properties!=undefined){
			this.text=''+properties.number+'\n'+properties.suit
			this.sizeRatio=.33
		}
		this.updateSize(x,y)
	}
	updateSize(x,y){
		this.x = x;
		this.y = y;
		this.width = Math.min(ctx.canvas.height/10, ctx.canvas.width/15);
		this.height = Math.floor(this.width*1.3)
		this.fontSize = this.height*this.sizeRatio
		this.clickArea = {minX: x - this.width/2, minY: y - this.height/2, maxX: x + this.width/2, maxY: y + this.height/2};
		if(this.clickArea.minY-this.height/11<0^this.clickArea.maxY+this.height/11>ctx.canvas.height){
			y=this.clickArea.minY-this.height/10<0?this.height*3/5:ctx.canvas.height-this.height*3/5;
			this.updateSize(x,y)
		}
	}
	draw(ctx){
		if(this.visible){
			ctx.save();
			ctx.fillStyle = this.fillColor;
			ctx.strokeStyle = this.outlineColor;
			roundRect(ctx, this.clickArea.minX, this.clickArea.minY, this.width, this.height, this.width/8, this.fillColor , this.outlineColor);
			ctx.fillStyle = this.outlineColor
			//draw number
			ctx.font = '' + this.fontSize + "px Arimo" //Arial Black, Gadget, Arial, sans-serif";
			ctx.fillStyle = this.textColor;
			ctx.strokeStyle = this.textOutlineColor;
			ctx.translate(this.x, this.y);
			if(this.textSlant){
				ctx.rotate(Math.atan(this.height/this.width));
			}
			multiLine(ctx,this.text,this.fontSize,0);
			ctx.restore();
		}
	}
	click(){
		console.log('overload when creating card')
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
