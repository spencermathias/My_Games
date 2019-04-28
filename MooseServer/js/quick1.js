function factorial(n){
	if(n==1){
		return 1
	}else{if(n>100){
			return 'error'
		}else{
			return n+factorial(n-1)
		}
	}
}

function parse(text){
	console.log(text.length)
	//text='.'+text+'.'
	/*var parens = text.split('(')
	for(i=parens.length-1;i>=0;i--){
		console.log('i=',i)
		jparen=parens[i].split(')')
		console.log('jparen=',jparen)
		jparen.forEach(function(out){
			var add=text.split('+')
			var added={x:0,y:0}
			console.log(out)
		})
	*/
	var basicfun={
		'(':10,
		')':11,
		'&':13,
		'|':15,
		'=':17,
		'>':19,
		'<':21,
		'+':23,
		'-':25,
		'*':27,
		'/':29,
		'.':'dot'
		}
	var readfun	={
		'x':'dx',
		'y':'dy',
		'distance':37,
		'col':39,
		'row':41,
	}
	var translation=[]
	var temp=[]
	let	word=''
	let newword=true
	var paren=0
	var parenhold=0
	var ind=0
	var len=0
	for(i=0;i<text.length;i++){
		let val=basicfun[text[i]]
		if(val!=undefined){	
			if (!newword) {
				if(readfun[word]!=undefined){
					translation.push(readfun[word])
				}else{translation.push(String(word))}
			}
			word=''
			if(val==10){
				parenhold++
			}
			translation.push(val)
			newword=true
		}else{
			word=word+text[i]
			newword=false	
		}
	}
	console.log(translation)

	runfun={
		10:function(i){
			return 'start'
		},
		'dot':function(i){console.log('dot')},
		'moose':function(i){
			translation[i]=parsePath('LD')
			console.log(translation)
		},
		'dx':function(i){
			if (translation[i-1]=='dot') {
				return translation[i-2].dx
			}
		},
		'dy':function(i){
			if (translation[i-1]=='dot') {
				return translation[i-2].dy
			}
		},
	}
	var translation1=[]
	var k=0
	translation1=[...translation]

	for(j=0;j<parenhold;j+=temp.length){

		for(i=0;i<translation.length;i++){
			len++
			if(translation[i]==10){
				if(paren==0){
					ind=translation1.length-translation.length+i+1
					len=-1
				}
				paren++
			}
			else if(translation[i]==11){
				paren--
				if (paren==0) {
					temp.push(translation1.splice(ind,len))
					console.log(temp)
				}
			}
		}
		k++
		if(k==10){break}
	}

	for(i=0;i<translation.length;i++){
		console.log(runfun[translation[i]](i))
	}
}
function brakeparen(text){
	let paren=0
	let ind=0
	let len=-1
	for(i=0;i<text.length;i++){
		len++
		if(text[i]=='('){
			if(paren==0){
				ind=i+1
				len=-1
			}
			paren++
		}else if(text[i]==')'){
			paren--
			if(paren==0){
				return ' lvm '+brakeparen(text.slice(ind,i))
			}
		}
	}
	return text
}
	/*
}



11:distance
12:.x
13:.y
14:col
15:row

player:#
num:0-9
T:true
F:false



(moose.x==(5))&(2+distance(red)>5)
0       4 0 1120 7        0   15 1
i= 4
jparen= (3) ["red", ">5", ""]
red
>5

i= 3
jparen= ["2+distance"]
2+distance
i= 2
jparen= (3) ["5", "", "&"]
5

&
i= 1
jparen= ["moose.x=="]
moose.x==
i= 0
jparen= [""]

	var ands=text.split('&')
	for(iand=0;iand<ands.length;iand++){
		var parens = iand.split('')
	}
	var add=text.split('+')
	var added={x:0,y:0}

	console.log(tree[0])
	*/
	
