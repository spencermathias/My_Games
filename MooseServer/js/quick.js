// thanks to Neel Somani for the majority of this code find his writup athttps://www.apptic.me/blog/evaluating-mathematical-expression-javascript.php
// and on linked in at https://www.linkedin.com/in/neelsomani/
 
// replace all fx
function replaceAll(haystack, needle, replace) {
    return haystack.split(needle).join(replace);
} 

 // custom true/false contains
function strContain(haystack, needle) {
    return haystack.indexOf(needle) > -1;
}

 // determine if char should be added to side
function isParseable(n) {
    return (!isNaN(n) || n == ".");
}

function getSide(haystack, middle, direction) {
    var i = middle + direction;
    var term = "";
    var limit = (direction == -1) ? 0 : haystack.length; // set the stopping point, when you have gone too far
    while (i * direction <= limit) { // while the current position is >= 0, or <= upper limit
        if (isParseable(haystack[i])) {
            if (direction == 1) term = term + haystack[i];
            else term = haystack[i] + term;
            i += direction;
        } else { return term; }
    }
    return term;
}

// fx to generically map a symbol to a function for parsing
function allocFx(eq, symbol, alloc) {
    if (strContain(eq, symbol)) {
        var middleIndex = eq.indexOf(symbol);
        var left = getSide(eq, middleIndex, -1);
        var right = getSide(eq, middleIndex, 1);
        eq = replaceAll(eq, left+symbol+right, alloc(left, right));
    }
    return eq;
} 

function solveStr(eq) {
    firstNest:
    while (strContain(eq, "(")) { // while the string has any parentheses
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
        if(eq.substr(first-8,first)=='distance'){

            var solvedStr = solveStr(nested);
            solvedStr=distance(solvedStr)
            var preStr = "distance(" + nested + ")";
        }else{
            var solvedStr = solveStr(nested);
            var preStr = "(" + nested + ")";
        }
        eq = eq.replace(preStr, solvedStr); // replace parenthetical with value
    }
    //while (strContain(eq,"distance")) return(replaceAll(eq,'distance','')); 
    
    while (strContain(eq, "*") || strContain(eq, "/")) {
        var multiply = true;
        if (eq.indexOf("*") < eq.indexOf("/")) {
            multiply = (strContain(eq, "*"));
        } else {
            multiply = !(strContain(eq, "/"));
        }
        eq = (multiply) ? allocFx(eq, "*", function(l, r) { return parseFloat(l)*parseFloat(r); }) : allocFx(eq, "/", function(l, r) { return parseFloat(l)/parseFloat(r); });
    }
    while (strContain(eq, "+")) eq = allocFx(eq, "+", function(l, r) { return parseFloat(l)+parseFloat(r); });
    while (strContain(eq, "=")) eq = allocFx(eq, "=", function(l, r) { return parseFloat(l)==parseFloat(r)&1; });
    while (strContain(eq, ">")) eq = allocFx(eq, ">", function(l, r) { return parseFloat(l)>parseFloat(r)&1; });
    while (strContain(eq, "<")) eq = allocFx(eq, "<", function(l, r) { return parseFloat(l)<parseFloat(r)&1; });
    while (strContain(eq, "^")) eq = allocFx(eq, "^", function(l, r) { return parseFloat(l)^parseFloat(r); });
    while (strContain(eq, "&")) eq = allocFx(eq, "&", function(l, r) { return parseFloat(l)&&parseFloat(r); });
    while (strContain(eq, "|")) eq = allocFx(eq, "|", function(l, r) { return parseFloat(l)||parseFloat(r); });

     // account for things like (-3)^2
    return eq;
} // main recursive fx + PEMDAS
var moose=''
var moosecord=parsePath(moose)
moosecord.y=moosecord.dy+4
moosecord.x=moosecord.dx+4


function distance(text){
    let eq=text+''
    let obj=[]
    for (i=0;i<2;i++){
        if(strContain(eq,'moose')){obj[i]=moosecord;eq=eq.replace('moose','')}else
        if(strContain(eq,'me')){obj[i]=me;eq=eq.replace('me','')}else
        if(strContain(eq,'{')){
            let first=eq.indexOf('{')
            let last=eq.indexOf('}')+1
            if (last==-1) {console.log('error')};
            obj[i]=JSON.parse(eq.substr(first,last))
            eq=eq.replace(eq.substr(first,last))
        }else{return 'error'}
    }
    for(i=0;i<2;i++){
        if(obj[i].x==undefined){obj[i].x=obj[1-i].x};
        if(obj[i].y==undefined){obj[i].y=obj[1-i].y};
    }
    
    let vect=addcord(obj[0],obj[1],-1)
    if((isNaN(vect.x))^(isNaN(vect.y))){
        if(isNaN(vect.x)){return Math.abs(vect.y)};
        if(isNaN(vect.y)){return Math.abs(vect.x)};
    }else{return Math.abs(vect.x)+Math.abs(vect.y)}
}