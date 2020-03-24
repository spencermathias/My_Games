class game{
	constructor(centerCard){
		this.cards = new Deck({suit:['♠','♥','♦','♣'], number:['A',2,3,4,5,6,7,8,9,10,'J','Q','K']})
		this.cards.values=getvalues(this.cards)
		this.centerCard=centerCard
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
	countHand(hand){
		let score=this.knobbs(this.centerCard,hand)
		hand.push(this.centerCard)
		hand.sort((a, b) => a - b)
		score+=this.countSuit(hand)
		hand=hand.map(x=>x%this.cards.cardDesc.number.length)
		hand.sort((a, b) => a - b)
		score+=this.count15(hand.map(x=>this.cards.values[x]))
		let pairs=this.countPair(hand)
		score+=pairs.score
		score+=this.countRuns(pairs)
		return score
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
		let score=0
		let sum=handValues.reduce((sum,val)=>sum+val,0)
		if(total+sum>15){
			if (handValues.length>1){
				for(let i=handValues.length-1; i>=0;i-- ){
					let subtotal=total+handValues[i]
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
}