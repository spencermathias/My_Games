Qengine={
    moose:{cord:{x:4,y:4},path:''},
    cardsPlayed:[],
    boardCol:9,
    boardRow:9,
    players:[],
    maxMove:2,
    reset:function(){
        this.moose={cord:{x:4,y:4},path:''}
        this.cardsPlayed=[]
        this.players=[]
        this.maxMove=2
    },
    moveMoose:function(chosen,playerID){
        this.moose.path+=chosen.path
        this.players[playerID].lastPlayed=chosen
        this.cardsPlayed[chosen.ID]={color:chosen.color,path:chosen.path}
        this.moose.cord={x:this.moosecord(this.moose.path).x,y:this.moosecord(this.moose.path).y}
    },
    emitplayers:function(emitchoice=false){
        if(emitchoice){return this.players}else{
            cleanplayers=this.players
            cleanplayers.forEach(function(player){
                player.lastPlayed=player.lastPlayed.ID
                player.tiles=[]
            })
            return cleanplayers
        }
    },
    moosecord:function(moosepath){
        let type= typeof moosepath
        let moosecord={}
        moosecord=this.parsePath(moosepath)
        return this.shiftBoardDiag(moosecord,this.boardRow,this.boardCol,4)
    },
    shiftBoardDiag:function(moosecord,row,col,displace){
        let moosecord1={}
        moosecord1.y=(row+(moosecord.y+displace)%row)%row
        moosecord1.x=(col+(moosecord.x+displace)%col)%col
        return moosecord1
    },
    parsePath:function(path){
    let dmax={
    y:0,
    x:0,
    miny:0,
    maxy:0,
    minx:0,
    maxx:0}
    for(let i = 0; i<path.length; i++){
        let c = path[i];
        switch(c){
            case 'U':
                dmax.y -= 1;
                dmax.miny = Math.min(dmax.miny,dmax.y);
            break;
            case 'R':
                dmax.x += 1; 
                dmax.maxx = Math.max(dmax.maxx,dmax.x);
            break;
            case 'D':
                dmax.y += 1; 
                dmax.maxy = Math.max(dmax.maxy,dmax.y);
            break;
            case 'L':
                dmax.x -= 1; 
                dmax.minx = Math.min(dmax.minx,dmax.x);
            break;
        }
    }
    return(dmax)
    },
    addcord:function (a,b,neg=1){
        let c={}
        let a1=[],b1=[]
        if(a==0){a1.x=0;a1.y=0}else{a1=a}
        if(b==0){b1.x=0;b1.y=0}else{b1=b}
        c.x=a1.x+neg*b1.x
        c.y=a1.y+neg*b1.y
        return c
    },
    validMove:function(player,newLocation,move=false){
        let Pcord=this.players[player].cord
        if(newLocation.x>-1&&newLocation.y>-1&&newLocation.x<=this.boardCol&&newLocation.y<=this.boardRow&&(Pcord.x!=newLocation.x||Pcord.y!=newLocation.y)){
            let dist=this.distance(Pcord,newLocation)
            if(dist<this.maxMove+1){
                if(move){
                    this.players[player].cord=newLocation
                    return dist
                }else{return true}
            }else if((dist>6 && dist<10)||dist==16){
                let shifted=this.shiftBoardDiag(Pcord,this.boardRow,this.boardCol,3)
                let validFrom=this.distance(shifted,{x:2,y:2})<4
                validFrom=validFrom||this.distance(shifted,{x:2,y:7})<3
                validFrom=validFrom||this.distance(shifted,{x:7,y:2})<3
                if (validFrom){
                    shifted=this.shiftBoardDiag(newLocation,this.boardRow,this.boardCol,3)
                    let validTo=this.distance(shifted,{x:2,y:2})<4
                    validTo=validTo||this.distance(shifted,{x:2,y:7})<3
                    validTo=validTo||this.distance(shifted,{x:7,y:2})<3
                    if (validTo) {
                        let dplayercord=this.shiftBoardDiag(Pcord,this.boardRow,this.boardCol,3)
                        dist=this.distance(dplayercord,this.shiftBoardDiag(newLocation,this.boardRow,this.boardCol,3))
                        if(dist<this.maxMove+1&&move){
                            this.players[player].cord=newLocation
                            return dist
                        }else{return dist<this.maxMove+1}                        
                    } else {return false}
                }else{return false}
            }else{return false}
        }else{return false}
    },
    distanceParse:function(text){
         let eq=text+''
        let obj=[]
        for (i=0;i<2;i++){
            if(this.strContain(eq,'moose')){obj[i]=this.moosecord(this.moose.path);eq=eq.replace('moose','')}else
            if(this.strContain(eq,'Moose')){obj[i]=this.moosecord(this.moose.path);eq=eq.replace('Moose','')}else
            if(this.strContain(eq,'"N"')){obj[i]={x:4,y:-1};eq=eq.replace('"N"','')}else
            if(this.strContain(eq,'"North"')){obj[i]={y:-1};eq=eq.replace('"North"','')}else
            if(this.strContain(eq,'"E"')){obj[i]={x:9,y:4};eq=eq.replace('"E"','')}else
            if(this.strContain(eq,'"East"')){obj[i]={x:9};eq=eq.replace('"East"','')}else
            if(this.strContain(eq,'"S"')){obj[i]={x:4,y:9};eq=eq.replace('"S"','')}else
            if(this.strContain(eq,'"South"')){obj[i]={y:9};eq=eq.replace('"South"','')}else
            if(this.strContain(eq,'"W"')){obj[i]={x:-1,y:4};eq=eq.replace('"W"','')}else
            if(this.strContain(eq,'"West"')){obj[i]={x:-1,};eq=eq.replace('"West"','')}else 
            if(this.strContain(eq,'{')){
                let first=eq.indexOf('{')
                let last=eq.indexOf('}')+1
                if (last==0) {console.log('error')};
                obj[i]=JSON.parse(eq.substr(first,last))
                eq=eq.replace(eq.substr(first,last),'')
            }else{
                for(j=0;j<this.players.length;j++){
                    if(this.strContain(eq,this.players[j].userName)){
                        obj[i]=this.players[j].cord
                        eq=eq.replace(this.players[j].userName,'')
                        break
                    }
                }
                if(obj[i]==undefined){return 'insufficient parameters found'}
            }
        }
        return this.distance(obj[0],obj[1])
    },

    distance: function(obj1,obj2){
        obj=[obj1,obj2]
        for(i=0;i<2;i++){
            if(obj[i].x==undefined){obj[i].x=obj[1-i].x};
            if(obj[i].y==undefined){obj[i].y=obj[1-i].y};
        }

        let vect=this.addcord(obj[0],obj[1],-1)
        if((isNaN(vect.x))^(isNaN(vect.y))){
            if(isNaN(vect.x)){return Math.abs(vect.y)};
            if(isNaN(vect.y)){return Math.abs(vect.x)};
        }else{return Math.abs(vect.x)+Math.abs(vect.y)}
    },
    choose:function(text){
        console.log(text)
        let chosen=0
        for(let i=0;i<this.cardsPlayed.length;i++){
            console.log(this.cardsPlayed[i].userName)
            if(this.strContain(text,this.players[i].userName)){
                text=text.replace(this.players[i].userName,'')
                if(this.strContain(text,'blue')||this.strContain(text,'Blue')){
                    console.log('chose blue')
                    chosen=(Blue==this.players[i].lastPlayed.color)
                }else if (this.strContain(text,'green')||this.strContain(text,'Green')) {
                    let lastPathCord={}
                    console.log('chose green')
                    lastPathCord.x=this.parsePath(this.cardsPlayed[i].lastPath).dx
                    lastPathCord.y=this.parsePath(this.cardsPlayed[i].lastPath).dy
                    chosen=this.addcord(this.cards.getProperties(this.cardsPlayed[i].lastID).mean,this.cards.getProperties(this.cardsPlayed[i].lastID).dif,-1)
                    chosen=(Math.abs(this.addcord(lastPathCord,chosen,-1).x)+Math.abs(this.addcord(lastPathCord,chosen,-1).y)==0)
                }else if(this.strContain(text,this.cardsPlayed[i].lastPath)){
                    chosen=true
                }else{chosen=false}
                console.log(+chosen)
                return +chosen
                break
            }
        }
        if(this.strContain(text,'[')){
            let first=text.indexOf('[')+1
            let last=text.indexOf(']')-1
            console.log(text.substr(first,last))
            if (last==-1) {
                console.log('no end "]"')
            }else if(this.strContain(text,this.cardsPlayed[text.substr(first,last)].lastPath)){
                return chosen=+true
            }else{return chosen=+false}

        }else{console.log('no player chosen')}
    },
    // thanks to Neel Somani for the following this code find his writup athttps://www.apptic.me/blog/evaluating-mathematical-expression-javascript.php
    // and on linked in at https://www.linkedin.com/in/neelsomani/
    // replace all fx
    replaceAll: function(haystack, needle, replace) {
        return haystack.split(needle).join(replace);
    }, 

     // custom true/false contains
    strContain: function(haystack, needle) {
        return haystack.indexOf(needle) > -1;
    },

     // determine if char should be added to side
    isParseable: function(n) {
        return (!isNaN(n) || n == ".");
    },

    getSide: function(haystack, middle, direction) {
        var i = middle + direction;
        var term = "";
        var limit = (direction == -1) ? 0 : haystack.length; // set the stopping point, when you have gone too far
        while (i * direction <= limit) { // while the current position is >= 0, or <= upper limit
            if (this.isParseable(haystack[i])) {
                if (direction == 1) term = term + haystack[i];
                else term = haystack[i] + term;
                i += direction;
            } else { return term; }
        }
        return term;
    },

    // fx to generically map a symbol to a function for parsing
    allocFx: function(eq, symbol, alloc) {
        if (this.strContain(eq, symbol)) {
            var middleIndex = eq.indexOf(symbol);
            var left = this.getSide(eq, middleIndex, -1);
            var right = this.getSide(eq, middleIndex, 1);
            eq = this.replaceAll(eq, left+symbol+right, alloc(left, right));
        }
        return eq;
    }, 

    solveStr: function(eq) {
        firstNest:
        while (this.strContain(eq, "(")) { // while the string has any parentheses
            var first = eq.indexOf("("); // first get the earliest open parentheses
            var last = first + 1; // start searching at the character after
            var layer = 1; // we might run into more parentheses, so this integer will keep track
            var layermax=1
            while (layer != 0) { // loop this until we've found the close parenthesis
                if (eq[last] == ")") { // if we run into a close parenthesis, then subtract one from "layer"
                    layer--;
                    if (layer == 0) break; // if it is the corresponding closing parenthesis for our outermost open parenthesis, then we can deal with this expression
                }
                else if (eq[last] == "(") { // if we see an open parenthesis, add one to "layer"
                    layer++;
                    layermax=Math.max(layer,layermax)
                }
                last++; // increment the character we're looking at
                if (last > eq.length) break firstNest; // if the parentheses are incorrectly nested, don't bother with this string
            }
            
            var nested = eq.substr(first + 1, last - first - 1); // get the expression between the parentheses
            
            if (last + 1 <= eq.length) { // if there is exponentiation, change to a different symbol
                if (eq[last + 1] == "^") {
                    eq = eq.substr(0, last + 1) + "&" + eq.substr((last+1)+1);
                }
            }
            if(eq.substr(first-8,8)=='distance'){

                var solvedStr = this.solveStr(nested);
                solvedStr=this.distanceParse(solvedStr)
                var preStr = "distance(" + nested + ")";
            }else if(eq.substr(first-5,5)=='chose'){
                var solvedStr=this.solveStr(nested)
                solvedStr=this.choose(solvedStr)
                var preStr = "chose(" + nested + ")";
            }else{
                var solvedStr = this.solveStr(nested);
                var preStr = "(" + nested + ")";
            }
            eq = eq.replace(preStr, solvedStr); // replace parenthetical with value
        }
        //while (strContain(eq,"distance")) return(replaceAll(eq,'distance','')); 
        
        while (this.strContain(eq, "*") || this.strContain(eq, "/")) {
            var multiply = true;
            if (eq.indexOf("*") < eq.indexOf("/")) {
                multiply = (this.strContain(eq, "*"));
            } else {
                multiply = !(this.strContain(eq, "/"));
            }
            eq = (multiply) ? this.allocFx(eq, "*", function(l, r) { return parseFloat(l)*parseFloat(r); }) : this.allocFx(eq, "/", function(l, r) { return parseFloat(l)/parseFloat(r); });
        }
        while (this.strContain(eq, "+")) eq = this.allocFx(eq, "+", function(l, r) { return parseFloat(l)+parseFloat(r); });
        while (this.strContain(eq, "=")) eq = this.allocFx(eq, "=", function(l, r) { return parseFloat(l)==parseFloat(r)&1; });
        while (this.strContain(eq, ">")) eq = this.allocFx(eq, ">", function(l, r) { return parseFloat(l)>parseFloat(r)&1; });
        while (this.strContain(eq, "<")) eq = this.allocFx(eq, "<", function(l, r) { return parseFloat(l)<parseFloat(r)&1; });
        while (this.strContain(eq, "^")) eq = this.allocFx(eq, "^", function(l, r) { return parseFloat(l)^parseFloat(r); });
        while (this.strContain(eq, "&")) eq = this.allocFx(eq, "&", function(l, r) { return parseFloat(l)&&parseFloat(r); });
        while (this.strContain(eq, "|")) eq = this.allocFx(eq, "|", function(l, r) { return parseFloat(l)||parseFloat(r); });

         // account for things like (-3)^2
        return eq;
    } // main recursive fx + PEMDAS
}
try {
    module.exports = Qengine
}catch (err){
    console.log("you must be client side!quick"); 
}
//Qengine.players[0]={userName:'spencer',cord:{x:0,y:4}}
//Qengine.players[1]={userName:'incog'}
//var cards = new Deck({mean:[{x:0,y:-1},{x:0,y:1},{x:1,y:0},{x:-1,y:0},0,0],dif:[{x:0,y:-1},{x:0,y:1},{x:1,y:0},{x:-1,y:0}]})
//function theircardadd(){Qengine.movemoose({ID:cards.deal(1)[0],path:undefined,color:undefined},1)}