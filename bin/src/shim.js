/**
 * A part of ECMAScript 5 and ES6 polyfill for Windows Script Host(WSH/JScript).
 *
 * Many features have been referred from MDN and es5-shim.
 * MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference
 * es5-shim: https://github.com/kriskowal/es5-shim
 *
 * NOTE: This shims not supported getter and setter.
 *
 * Annotated ES5: http://es5.github.io/
 * ES5 Spec: http://www.ecma-international.org/publications/standards/Ecma-262.htm
 */

(function(definition){
if(typeof define=="function"){
define(definition);
}else{
definition();
}
})(function(){
// es5-shim.js
var define_es5shim=function(){
var Empty=function(){};
var toInteger=function(n){
n=+n;
if(n!==n){
n=0;
}else if(n!==0&&n!==(1/0)&&n!==-(1/0)){
n=(n>0||-1)*Math.floor(Math.abs(n));
}
return n;
};
var isPrimitive=function(input){
var type=typeof input;
return(
input===null||
type==="undefined"||
type==="boolean"||
type==="number"||
type==="string"
);
};
var toPrimitive=function(input){
var val,valueOf,toString;
if(isPrimitive(input)){
return input;
}
valueOf=input.valueOf;
if(typeof valueOf==="function"){
val=valueOf.call(input);
if(isPrimitive(val)){
return val;
}
}
toString=input.toString;
if(typeof toString==="function"){
val=toString.call(input);
if(isPrimitive(val)){
return val;
}
}
throw new TypeError();
};
var toObject=function(o){
if(o==null){
throw new TypeError("can't convert "+o+" to object");
}
return Object(o);
};
if(!Function.prototype.bind){
Function.prototype.bind=function(that){
var target=this;
if(typeof target!="function"){
throw new TypeError("Function.prototype.bind called on incompatible "+target);
}
var args=_Array_slice_.call(arguments,1);
var binder=function(){
if(this instanceof bound){
var result=target.apply(
this,
args.concat(_Array_slice_.call(arguments))
);
if(Object(result)===result){
return result;
}
return this;
}else{
return target.apply(
that,
args.concat(_Array_slice_.call(arguments))
);
}
};
var boundLength=Math.max(0,target.length-args.length);
var boundArgs=[];
for(var i=0;i<boundLength;i++){
boundArgs.push("$"+i);
}
var bound=Function("binder","return function("+boundArgs.join(",")+"){return binder.apply(this,arguments)}")(binder);
if(target.prototype){
Empty.prototype=target.prototype;
bound.prototype=new Empty();
Empty.prototype=null;
}
return bound;
};
}
var call=Function.prototype.call;
var prototypeOfArray=Array.prototype;
var prototypeOfObject=Object.prototype;
var _Array_slice_=prototypeOfArray.slice;
var _toString=call.bind(prototypeOfObject.toString);
var owns=call.bind(prototypeOfObject.hasOwnProperty);
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;
if((supportsAccessors=owns(prototypeOfObject,"__defineGetter__"))){
defineGetter=call.bind(prototypeOfObject.__defineGetter__);
defineSetter=call.bind(prototypeOfObject.__defineSetter__);
lookupGetter=call.bind(prototypeOfObject.__lookupGetter__);
lookupSetter=call.bind(prototypeOfObject.__lookupSetter__);
}
if([1,2].splice(0).length!=2){
var array_splice=Array.prototype.splice;
var array_push=Array.prototype.push;
var array_unshift=Array.prototype.unshift;
if(function(){
var makeArray=function(l){
var a=[];
while(l--){
a.unshift(l);
}
return a;
};
var array=[]
,lengthBefore
;
array.splice.bind(array,0,0).apply(null,makeArray(20));
array.splice.bind(array,0,0).apply(null,makeArray(26));
lengthBefore=array.length;
array.splice(5,0,"XXX");
if(lengthBefore+1==array.length){
return true;
}
}()){
Array.prototype.splice=function(start,deleteCount){
if(!arguments.length){
return[];
}else{
return array_splice.apply(this,[
start===void 0?0:start,
deleteCount===void 0?(this.length-start):deleteCount
].concat(_Array_slice_.call(arguments,2)))
}
};
}
else{
Array.prototype.splice=function(start,deleteCount){
var result
,args=_Array_slice_.call(arguments,2)
,addElementsCount=args.length
;
if(!arguments.length){
return[];
}
if(start===void 0){
start=0;
}
if(deleteCount===void 0){
deleteCount=this.length-start;
}
if(addElementsCount>0){
if(deleteCount<=0){
if(start==this.length){
array_push.apply(this,args);
return[];
}
if(start==0){
array_unshift.apply(this,args);
return[];
}
}
result=_Array_slice_.call(this,start,start+deleteCount);
args.push.apply(args,_Array_slice_.call(this,start+deleteCount,this.length));
args.unshift.apply(args,_Array_slice_.call(this,0,start));
args.unshift(0,this.length);
array_splice.apply(this,args);
return result;
}
return array_splice.call(this,start,deleteCount);
}
}
}
if([].unshift(0)!=1){
var array_unshift=Array.prototype.unshift;
Array.prototype.unshift=function(){
array_unshift.apply(this,arguments);
return this.length;
};
}
if(!Array.isArray){
Array.isArray=function(obj){
return _toString(obj)=="[object Array]";
};
}
var boxedString=Object("a"),
splitString=boxedString[0]!="a"||!(0 in boxedString);
var boxedForEach=true;
if(Array.prototype.forEach){
Array.prototype.forEach.call("foo",function(item,i,obj){
if(typeof obj!=='object')boxedForEach=false;
});
}
if(!Array.prototype.forEach||!boxedForEach){
Array.prototype.forEach=function(fun){
var object=toObject(this),
self=splitString&&_toString(this)=="[object String]"?
this.split(""):
object,
thisp=arguments[1],
i=-1,
length=self.length>>>0;
if(_toString(fun)!="[object Function]"){
throw new TypeError();
}
while(++i<length){
if(i in self){
fun.call(thisp,self[i],i,object);
}
}
};
}
if(!Array.prototype.map){
Array.prototype.map=function(fun){
var object=toObject(this),
self=splitString&&_toString(this)=="[object String]"?
this.split(""):
object,
length=self.length>>>0,
result=Array(length),
thisp=arguments[1];
if(_toString(fun)!="[object Function]"){
throw new TypeError(fun+" is not a function");
}
for(var i=0;i<length;i++){
if(i in self)
result[i]=fun.call(thisp,self[i],i,object);
}
return result;
};
}
if(!Array.prototype.filter){
Array.prototype.filter=function(fun){
var object=toObject(this),
self=splitString&&_toString(this)=="[object String]"?
this.split(""):
object,
length=self.length>>>0,
result=[],
value,
thisp=arguments[1];
if(_toString(fun)!="[object Function]"){
throw new TypeError(fun+" is not a function");
}
for(var i=0;i<length;i++){
if(i in self){
value=self[i];
if(fun.call(thisp,value,i,object)){
result.push(value);
}
}
}
return result;
};
}
if(!Array.prototype.every){
Array.prototype.every=function(fun){
var object=toObject(this),
self=splitString&&_toString(this)=="[object String]"?
this.split(""):
object,
length=self.length>>>0,
thisp=arguments[1];
if(_toString(fun)!="[object Function]"){
throw new TypeError(fun+" is not a function");
}
for(var i=0;i<length;i++){
if(i in self&&!fun.call(thisp,self[i],i,object)){
return false;
}
}
return true;
};
}
if(!Array.prototype.some){
Array.prototype.some=function(fun){
var object=toObject(this),
self=splitString&&_toString(this)=="[object String]"?
this.split(""):
object,
length=self.length>>>0,
thisp=arguments[1];
if(_toString(fun)!="[object Function]"){
throw new TypeError(fun+" is not a function");
}
for(var i=0;i<length;i++){
if(i in self&&fun.call(thisp,self[i],i,object)){
return true;
}
}
return false;
};
}
if(!Array.prototype.reduce){
Array.prototype.reduce=function(fun){
var object=toObject(this),
self=splitString&&_toString(this)=="[object String]"?
this.split(""):
object,
length=self.length>>>0;
if(_toString(fun)!="[object Function]"){
throw new TypeError(fun+" is not a function");
}
if(!length&&arguments.length==1){
throw new TypeError("reduce of empty array with no initial value");
}
var i=0;
var result;
if(arguments.length>=2){
result=arguments[1];
}else{
do{
if(i in self){
result=self[i++];
break;
}
if(++i>=length){
throw new TypeError("reduce of empty array with no initial value");
}
}while(true);
}
for(;i<length;i++){
if(i in self){
result=fun.call(void 0,result,self[i],i,object);
}
}
return result;
};
}
if(!Array.prototype.reduceRight){
Array.prototype.reduceRight=function(fun){
var object=toObject(this),
self=splitString&&_toString(this)=="[object String]"?
this.split(""):
object,
length=self.length>>>0;
if(_toString(fun)!="[object Function]"){
throw new TypeError(fun+" is not a function");
}
if(!length&&arguments.length==1){
throw new TypeError("reduceRight of empty array with no initial value");
}
var result,i=length-1;
if(arguments.length>=2){
result=arguments[1];
}else{
do{
if(i in self){
result=self[i--];
break;
}
if(--i<0){
throw new TypeError("reduceRight of empty array with no initial value");
}
}while(true);
}
if(i<0){
return result;
}
do{
if(i in this){
result=fun.call(void 0,result,self[i],i,object);
}
}while(i--);
return result;
};
}
if(!Array.prototype.indexOf||([0,1].indexOf(1,2)!=-1)){
Array.prototype.indexOf=function(sought){
var self=splitString&&_toString(this)=="[object String]"?
this.split(""):
toObject(this),
length=self.length>>>0;
if(!length){
return-1;
}
var i=0;
if(arguments.length>1){
i=toInteger(arguments[1]);
}
i=i>=0?i:Math.max(0,length+i);
for(;i<length;i++){
if(i in self&&self[i]===sought){
return i;
}
}
return-1;
};
}
if(!Array.prototype.lastIndexOf||([0,1].lastIndexOf(0,-3)!=-1)){
Array.prototype.lastIndexOf=function(sought){
var self=splitString&&_toString(this)=="[object String]"?
this.split(""):
toObject(this),
length=self.length>>>0;
if(!length){
return-1;
}
var i=length-1;
if(arguments.length>1){
i=Math.min(i,toInteger(arguments[1]));
}
i=i>=0?i:length-Math.abs(i);
for(;i>=0;i--){
if(i in self&&sought===self[i]){
return i;
}
}
return-1;
};
}
if(!Object.keys){
var hasDontEnumBug=true,
dontEnums=[
"toString",
"toLocaleString",
"valueOf",
"hasOwnProperty",
"isPrototypeOf",
"propertyIsEnumerable",
"constructor"
],
dontEnumsLength=dontEnums.length;
for(var key in{"toString":null}){
hasDontEnumBug=false;
}
Object.keys=function(object){
if(
(typeof object!="object"&&typeof object!="function")||
object===null
){
throw new TypeError("Object.keys called on a non-object");
}
var keys=[];
for(var name in object){
if(owns(object,name)){
keys.push(name);
}
}
if(hasDontEnumBug){
for(var i=0,ii=dontEnumsLength;i<ii;i++){
var dontEnum=dontEnums[i];
if(owns(object,dontEnum)){
keys.push(dontEnum);
}
}
}
return keys;
};
}
var negativeDate=-62198755200000,
negativeYearString="-000001";
if(
!Date.prototype.toISOString||
(new Date(negativeDate).toISOString().indexOf(negativeYearString)===-1)
){
Date.prototype.toISOString=function(){
var result,length,value,year,month;
if(!isFinite(this)){
throw new RangeError("Date.prototype.toISOString called on non-finite value.");
}
year=this.getUTCFullYear();
month=this.getUTCMonth();
year+=Math.floor(month/12);
month=(month%12+12)%12;
result=[month+1,this.getUTCDate(),
this.getUTCHours(),this.getUTCMinutes(),this.getUTCSeconds()];
year=(
(year<0?"-":(year>9999?"+":""))+
("00000"+Math.abs(year))
.slice(0<=year&&year<=9999?-4:-6)
);
length=result.length;
while(length--){
value=result[length];
if(value<10){
result[length]="0"+value;
}
}
return(
year+"-"+result.slice(0,2).join("-")+
"T"+result.slice(2).join(":")+"."+
("000"+this.getUTCMilliseconds()).slice(-3)+"Z"
);
};
}
var dateToJSONIsSupported=false;
try{
dateToJSONIsSupported=(
Date.prototype.toJSON&&
new Date(NaN).toJSON()===null&&
new Date(negativeDate).toJSON().indexOf(negativeYearString)!==-1&&
Date.prototype.toJSON.call({
toISOString:function(){
return true;
}
})
);
}catch(e){
}
if(!dateToJSONIsSupported){
Date.prototype.toJSON=function(key){
var o=Object(this),
tv=toPrimitive(o),
toISO;
if(typeof tv==="number"&&!isFinite(tv)){
return null;
}
toISO=o.toISOString;
if(typeof toISO!="function"){
throw new TypeError("toISOString property is not callable");
}
return toISO.call(o);
};
}
if(!Date.parse||"Date.parse is buggy"){
Date=(function(NativeDate){
var Date=function(Y,M,D,h,m,s,ms){
var length=arguments.length;
if(this instanceof NativeDate){
var date=length==1&&String(Y)===Y?
new NativeDate(Date.parse(Y)):
length>=7?new NativeDate(Y,M,D,h,m,s,ms):
length>=6?new NativeDate(Y,M,D,h,m,s):
length>=5?new NativeDate(Y,M,D,h,m):
length>=4?new NativeDate(Y,M,D,h):
length>=3?new NativeDate(Y,M,D):
length>=2?new NativeDate(Y,M):
length>=1?new NativeDate(Y):
new NativeDate();
date.constructor=Date;
return date;
}
return NativeDate.apply(this,arguments);
};
var isoDateExpression=new RegExp("^"+
"(\\d{4}|[\+\-]\\d{6})"+
"(?:-(\\d{2})"+
"(?:-(\\d{2})"+
"(?:"+
"T(\\d{2})"+
":(\\d{2})"+
"(?:"+
":(\\d{2})"+
"(?:(\\.\\d{1,}))?"+
")?"+
"("+
"Z|"+
"(?:"+
"([-+])"+
"(\\d{2})"+
":(\\d{2})"+
")"+
")?)?)?)?"+
"$");
var months=[
0,31,59,90,120,151,181,212,243,273,304,334,365
];
var dayFromMonth=function(year,month){
var t=month>1?1:0;
return(
months[month]+
Math.floor((year-1969+t)/4)-
Math.floor((year-1901+t)/100)+
Math.floor((year-1601+t)/400)+
365*(year-1970)
);
};
var toUTC=function(t){
return Number(new NativeDate(1970,0,1,0,0,0,t));
};
for(var key in NativeDate){
Date[key]=NativeDate[key];
}
Date.now=NativeDate.now;
Date.UTC=NativeDate.UTC;
Date.prototype=NativeDate.prototype;
Date.prototype.constructor=Date;
Date.parse=function(string){
var match=isoDateExpression.exec(string);
if(match){
var year=Number(match[1]),
month=Number(match[2]||1)-1,
day=Number(match[3]||1)-1,
hour=Number(match[4]||0),
minute=Number(match[5]||0),
second=Number(match[6]||0),
millisecond=Math.floor(Number(match[7]||0)*1000),
isLocalTime=Boolean(match[4]&&!match[8]),
signOffset=match[9]==="-"?1:-1,
hourOffset=Number(match[10]||0),
minuteOffset=Number(match[11]||0),
result;
if(
hour<(
minute>0||second>0||millisecond>0?
24:25
)&&
minute<60&&second<60&&millisecond<1000&&
month>-1&&month<12&&hourOffset<24&&
minuteOffset<60&&
day>-1&&
day<(
dayFromMonth(year,month+1)-
dayFromMonth(year,month)
)
){
result=(
(dayFromMonth(year,month)+day)*24+
hour+
hourOffset*signOffset
)*60;
result=(
(result+minute+minuteOffset*signOffset)*60+
second
)*1000+millisecond;
if(isLocalTime){
result=toUTC(result);
}
if(-8.64e15<=result&&result<=8.64e15){
return result;
}
}
return NaN;
}
return NativeDate.parse.apply(this,arguments);
};
return Date;
})(Date);
}
if(!Date.now){
Date.now=function(){
return new Date().getTime();
};
}
if(!Number.prototype.toFixed||(0.00008).toFixed(3)!=='0.000'||(0.9).toFixed(0)==='0'||(1.255).toFixed(2)!=='1.25'||(1000000000000000128).toFixed(0)!=="1000000000000000128"){
(function(){
var base,size,data,i;
base=1e7;
size=6;
data=[0,0,0,0,0,0];
var multiply=function(n,c){
var i=-1;
while(++i<size){
c+=n*data[i];
data[i]=c%base;
c=Math.floor(c/base);
}
};
var divide=function(n){
var i=size,c=0;
while(--i>=0){
c+=data[i];
data[i]=Math.floor(c/n);
c=(c%n)*base;
}
};
var toString=function(){
var i=size;
var s='';
while(--i>=0){
if(s!==''||i===0||data[i]!==0){
var t=String(data[i]);
if(s===''){
s=t;
}else{
s+='0000000'.slice(0,7-t.length)+t;
}
}
}
return s;
};
var pow=function(x,n,acc){
return(n===0?acc:(n%2===1?pow(x,n-1,acc*x):pow(x*x,n/2,acc)));
};
var log=function(x){
var n=0;
while(x>=4096){
n+=12;
x/=4096;
}
while(x>=2){
n+=1;
x/=2;
}
return n;
};
Number.prototype.toFixed=function(fractionDigits){
var f,x,s,m,e,z,j,k;
f=Number(fractionDigits);
f=f!==f?0:Math.floor(f);
if(f<0||f>20){
throw new RangeError("Number.toFixed called with invalid number of decimals");
}
x=Number(this);
if(x!==x){
return"NaN";
}
if(x<=-1e21||x>=1e21){
return String(x);
}
s="";
if(x<0){
s="-";
x=-x;
}
m="0";
if(x>1e-21){
e=log(x*pow(2,69,1))-69;
z=(e<0?x*pow(2,-e,1):x/pow(2,e,1));
z*=0x10000000000000;
e=52-e;
if(e>0){
multiply(0,z);
j=f;
while(j>=7){
multiply(1e7,0);
j-=7;
}
multiply(pow(10,j,1),0);
j=e-1;
while(j>=23){
divide(1<<23);
j-=23;
}
divide(1<<j);
multiply(1,1);
divide(2);
m=toString();
}else{
multiply(0,z);
multiply(1<<(-e),0);
m=toString()+'0.00000000000000000000'.slice(2,2+f);
}
}
if(f>0){
k=m.length;
if(k<=f){
m=s+'0.0000000000000000000'.slice(0,f-k+2)+m;
}else{
m=s+m.slice(0,k-f)+'.'+m.slice(k-f);
}
}else{
m=s+m;
}
return m;
}
}());
}
var string_split=String.prototype.split;
if(
'ab'.split(/(?:ab)*/).length!==2||
'.'.split(/(.?)(.?)/).length!==4||
'tesst'.split(/(s)*/)[1]==="t"||
''.split(/.?/).length||
'.'.split(/()()/).length>1
){
(function(){
var compliantExecNpcg=/()??/.exec("")[1]===void 0;
String.prototype.split=function(separator,limit){
var string=this;
if(separator===void 0&&limit===0)
return[];
if(Object.prototype.toString.call(separator)!=="[object RegExp]"){
return string_split.apply(this,arguments);
}
var output=[],
flags=(separator.ignoreCase?"i":"")+
(separator.multiline?"m":"")+
(separator.extended?"x":"")+
(separator.sticky?"y":""),
lastLastIndex=0,
separator=new RegExp(separator.source,flags+"g"),
separator2,match,lastIndex,lastLength;
string+="";
if(!compliantExecNpcg){
separator2=new RegExp("^"+separator.source+"$(?!\\s)",flags);
}
limit=limit===void 0?
-1>>>0:
limit>>>0;
while(match=separator.exec(string)){
lastIndex=match.index+match[0].length;
if(lastIndex>lastLastIndex){
output.push(string.slice(lastLastIndex,match.index));
if(!compliantExecNpcg&&match.length>1){
match[0].replace(separator2,function(){
for(var i=1;i<arguments.length-2;i++){
if(arguments[i]===void 0){
match[i]=void 0;
}
}
});
}
if(match.length>1&&match.index<string.length){
Array.prototype.push.apply(output,match.slice(1));
}
lastLength=match[0].length;
lastLastIndex=lastIndex;
if(output.length>=limit){
break;
}
}
if(separator.lastIndex===match.index){
separator.lastIndex++;
}
}
if(lastLastIndex===string.length){
if(lastLength||!separator.test("")){
output.push("");
}
}else{
output.push(string.slice(lastLastIndex));
}
return output.length>limit?output.slice(0,limit):output;
};
}());
}else if("0".split(void 0,0).length){
String.prototype.split=function(separator,limit){
if(separator===void 0&&limit===0)return[];
return string_split.apply(this,arguments);
}
}
if("".substr&&"0b".substr(-1)!=="b"){
var string_substr=String.prototype.substr;
String.prototype.substr=function(start,length){
return string_substr.call(
this,
start<0?((start=this.length+start)<0?0:start):start,
length
);
}
}
var ws="\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003"+
"\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028"+
"\u2029\uFEFF";
if(!String.prototype.trim||ws.trim()){
var re_ws="["+ws+"]";
var trimBeginRegexp=new RegExp("^"+re_ws+re_ws+"*"),
trimEndRegexp=new RegExp(re_ws+re_ws+"*$");
String.prototype.trim=function(){
if(this===void 0||this===null){
throw new TypeError("can't convert "+this+" to object");
}
return String(this).replace(trimBeginRegexp,"").replace(trimEndRegexp,"");
};
if(!String.prototype.trimRight||ws.trimRight()){
String.prototype.trimRight=function(){
if(this===void 0||this===null){
throw new TypeError("can't convert "+this+" to object");
}
return String(this).replace(trimEndRegexp,"");
};
}
if(!String.prototype.trimLeft||ws.trimLeft()){
String.prototype.trimLeft=function(){
if(this===void 0||this===null){
throw new TypeError("can't convert "+this+" to object");
}
return String(this).replace(trimEndRegexp,"");
};
}
}
// ES6: https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String
if(!String.prototype.contains){
String.prototype.contains=function(str,startIndex){
return -1!==String.prototype.indexOf.call(this,str,startIndex);
};
}
if(!String.prototype.startsWith){
String.prototype.startsWith=function(searchString,position){
position=position||0;
return this.indexOf(searchString,position)===position;
};
}
if(!String.prototype.endsWith){
String.prototype.endsWith=function(searchString,position){
position=position||this.length;
position=position-searchString.length;
return this.lastIndexOf(searchString)===position;
};
}
};
// es5-sham.js
var define_es5sham=function(){
var isWSH=typeof WScript!="undefined"&&typeof WScript.Echo=="unknown"&&typeof ActiveXObject!="undefined";
var hasDocument=!isWSH&&typeof document=="object"&&typeof window=="object";
var createContext=function(){
createContext._contexts||(createContext._contexts=[]);
var context,iframe,parent,doc;
try{
if(hasDocument){
iframe=document.createElement("iframe");
parent=document.body||document.documentElement||document.head;
iframe.style.display="none";
parent.appendChild(iframe);
iframe.src="javascript:";
context=iframe.contentWindow;
parent.removeChild(iframe);
iframe=null;
}else if(isWSH){
doc=new ActiveXObject("htmlfile");
doc.open();
doc.write(["<html><script>null<"]+["/script></html>"]);
doc.close();
var timeout=new Date().getTime()+1000;
while(doc.readyState!="complete") {
WScript.sleep(20);
if(new Date().getTime()>timeout){
return doc=null;
}
}
context=doc.parentWindow;
}
}catch(e){
context=null;
}finally{
if(context&&context.Object&&context.Object!==Object){
createContext._contexts.push(context);
return context;
}
return context=iframe=parent=doc=null;
}
};
var call=Function.prototype.call;
var prototypeOfObject=Object.prototype;
var owns=call.bind(prototypeOfObject.hasOwnProperty);
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;
if((supportsAccessors=owns(prototypeOfObject,"__defineGetter__"))){
defineGetter=call.bind(prototypeOfObject.__defineGetter__);
defineSetter=call.bind(prototypeOfObject.__defineSetter__);
lookupGetter=call.bind(prototypeOfObject.__lookupGetter__);
lookupSetter=call.bind(prototypeOfObject.__lookupSetter__);
}
if(!Object.getPrototypeOf){
Object.getPrototypeOf=function(object){
return object.__proto__||(
object.constructor?object.constructor.prototype:prototypeOfObject);
};
}
var doesGetOwnPropertyDescriptorWork=function(object){
try{
object.sentinel=0;
return Object.getOwnPropertyDescriptor(object,"sentinel").value===0;
}catch(exception){}
};
if(Object.defineProperty){
var getOwnPropertyDescriptorWorksOnObject=doesGetOwnPropertyDescriptorWork({});
var getOwnPropertyDescriptorWorksOnDom=typeof document=="undefined"||
doesGetOwnPropertyDescriptorWork(hasDocument&&document.createElement("div"));
if(!getOwnPropertyDescriptorWorksOnDom||!getOwnPropertyDescriptorWorksOnObject){
var getOwnPropertyDescriptorFallback=Object.getOwnPropertyDescriptor;}}
if(!Object.getOwnPropertyDescriptor||getOwnPropertyDescriptorFallback){
var ERR_NON_OBJECT="Object.getOwnPropertyDescriptor called on a non-object: ";
Object.getOwnPropertyDescriptor=function(object,property){
if((typeof object!="object"&&typeof object!="function")||object===null){
throw new TypeError(ERR_NON_OBJECT+object);
}
if(getOwnPropertyDescriptorFallback){
try{
return getOwnPropertyDescriptorFallback.call(Object,object,property);
}catch(exception){
}
}
if(!owns(object,property)){
return;
}
var descriptor={enumerable:true,configurable:true};
if(supportsAccessors){
var prototype=object.__proto__;
object.__proto__=prototypeOfObject;
var getter=lookupGetter(object,property);
var setter=lookupSetter(object,property);
object.__proto__=prototype;
if(getter||setter){
if(getter){
descriptor.get=getter;
}
if(setter){
descriptor.set=setter;
}
return descriptor;
}
}
descriptor.value=object[property];
descriptor.writable=true;
return descriptor;
};
}
if(!Object.getOwnPropertyNames){
Object.getOwnPropertyNames=function(object){
return Object.keys(object);
};
}
if(!Object.create){
var createEmpty;
var supportsProto=Object.prototype.__proto__===null;
if(supportsProto){
createEmpty=function(){
return{"__proto__":null};
};
}else{
createEmpty=function(){
if(createEmpty.getNew){
return createEmpty.getNew();
}
var empty=createContext().Object.prototype;
delete empty.constructor;
delete empty.hasOwnProperty;
delete empty.propertyIsEnumerable;
delete empty.isPrototypeOf;
delete empty.toLocaleString;
delete empty.toString;
delete empty.valueOf;
empty.__proto__=null;
var Empty=function(){};
Empty.prototype=empty;
createEmpty.getNew=function(){
return new Empty();
};
return new Empty();
};
}
Object.create=function(prototype,properties){
var object;
var Type=function(){};
if(prototype===null){
object=createEmpty();
}else{
if(typeof prototype!=="object"&&typeof prototype!=="function"){
throw new TypeError("Object prototype may only be an Object or null");
}
Type.prototype=prototype;
object=new Type();
object.__proto__=prototype;
}
if(properties!==void 0){
Object.defineProperties(object,properties);
}
return object;
};
}
var doesDefinePropertyWork=function(object){
try{
Object.defineProperty(object,"sentinel",{});
return"sentinel"in object;
}catch(exception){
}
};
if(Object.defineProperty){
var definePropertyWorksOnObject=doesDefinePropertyWork({});
var definePropertyWorksOnDom=typeof document=="undefined"||
doesDefinePropertyWork(document.createElement("div"));
if(!definePropertyWorksOnObject||!definePropertyWorksOnDom){
var definePropertyFallback=Object.defineProperty,
definePropertiesFallback=Object.defineProperties;
}
}
if(!Object.defineProperty||definePropertyFallback){
var ERR_NON_OBJECT_DESCRIPTOR="Property description must be an object: ";
var ERR_NON_OBJECT_TARGET="Object.defineProperty called on non-object: "
var ERR_ACCESSORS_NOT_SUPPORTED="getters & setters can not be defined "+
"on this javascript engine";
Object.defineProperty=function(object,property,descriptor){
if((typeof object!="object"&&typeof object!="function")||object===null){
throw new TypeError(ERR_NON_OBJECT_TARGET+object);
}
if((typeof descriptor!="object"&&typeof descriptor!="function")||descriptor===null){
throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR+descriptor);
}
if(definePropertyFallback){
try{
return definePropertyFallback.call(Object,object,property,descriptor);
}catch(exception){
}
}
if(owns(descriptor,"value")){
if(supportsAccessors&&(lookupGetter(object,property)||
lookupSetter(object,property)))
{
var prototype=object.__proto__;
object.__proto__=prototypeOfObject;
delete object[property];
object[property]=descriptor.value;
object.__proto__=prototype;
}else{
object[property]=descriptor.value;
}
}else{
if(!supportsAccessors){
throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
}
if(owns(descriptor,"get")){
defineGetter(object,property,descriptor.get);
}
if(owns(descriptor,"set")){
defineSetter(object,property,descriptor.set);
}
}
return object;
};
}
if(!Object.defineProperties||definePropertiesFallback){
Object.defineProperties=function(object,properties){
if(definePropertiesFallback){
try{
return definePropertiesFallback.call(Object,object,properties);
}catch(exception){
}
}
for(var property in properties){
if(owns(properties,property)&&property!="__proto__"){
Object.defineProperty(object,property,properties[property]);
}
}
return object;
};
}
if(!Object.seal){
Object.seal=function(object){
return object;
};
}
if(!Object.freeze){
Object.freeze=function(object){
return object;
};
}
try{
Object.freeze(function(){});
}catch(exception){
Object.freeze=(function(freezeObject){
return function(object){
if(typeof object=="function"){
return object;
}else{
return freezeObject(object);
}
};
})(Object.freeze);
}
if(!Object.preventExtensions){
Object.preventExtensions=function(object){
return object;
};
}
if(!Object.isSealed){
Object.isSealed=function(object){
return false;
};
}
if(!Object.isFrozen){
Object.isFrozen=function(object){
return false;
};
}
if(!Object.isExtensible){
Object.isExtensible=function(object){
if(Object(object)!==object){
throw new TypeError();
}
var name='';
while(owns(object,name)){
name+='?';
}
object[name]=true;
var returnValue=owns(object,name);
delete object[name];
return returnValue;
};
}
};
// https://github.com/douglascrockford/JSON-js/blob/master/json2.js
var define_json=function(){
if(typeof JSON!=='object'){
JSON={};
}
(function(){
var f=function(n){
return n<10?'0'+n:n;
};
if(typeof Date.prototype.toJSON!=='function'){
Date.prototype.toJSON=function(){
return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+
f(this.getUTCMonth()+1)+'-'+
f(this.getUTCDate())+'T'+
f(this.getUTCHours())+':'+
f(this.getUTCMinutes())+':'+
f(this.getUTCSeconds())+'Z':null;
};
String.prototype.toJSON=
Number.prototype.toJSON=
Boolean.prototype.toJSON=function(){
return this.valueOf();
};
}
var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
gap,
indent,
meta={
'\b':'\\b',
'\t':'\\t',
'\n':'\\n',
'\f':'\\f',
'\r':'\\r',
'"':'\\"',
'\\':'\\\\'
},
rep;
var quote=function(string){
escapable.lastIndex=0;
return escapable.test(string)?'"'+string.replace(escapable,function(a){
var c=meta[a];
return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);
})+'"':'"'+string+'"';
};
var str=function(key,holder){
var i,k,v,length,mind=gap,partial,value=holder[key];
if(value&&typeof value==='object'&&typeof value.toJSON==='function'){
value=value.toJSON(key);
}
if(typeof rep==='function'){
value=rep.call(holder,key,value);
}
switch(typeof value){
case'string':
return quote(value);
case'number':
return isFinite(value)?String(value):'null';
case'boolean':
case'null':
return String(value);
case'object':
if(!value){
return'null';
}
gap+=indent;
partial=[];
if(Object.prototype.toString.apply(value)==='[object Array]'){
length=value.length;
for(i=0;i<length;i+=1){
partial[i]=str(i,value)||'null';
}
v=partial.length===0?'[]':gap?
'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':
'['+partial.join(',')+']';
gap=mind;
return v;
}
if(rep&&typeof rep==='object'){
length=rep.length;
for(i=0;i<length;i+=1){
if(typeof rep[i]==='string'){
k=rep[i];
v=str(k,value);
if(v){
partial.push(quote(k)+(gap?': ':':')+v);
}
}
}
}else{
for(k in value){
if(Object.prototype.hasOwnProperty.call(value,k)){
v=str(k,value);
if(v){
partial.push(quote(k)+(gap?': ':':')+v);
}
}
}
}
v=partial.length===0?'{}':gap?
'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':
'{'+partial.join(',')+'}';
gap=mind;
return v;
}
};
if(typeof JSON.stringify!=='function'){
JSON.stringify=function(value,replacer,space){
var i;
gap='';
indent='';
if(typeof space==='number'){
for(i=0;i<space;i+=1){
indent+=' ';
}
}else if(typeof space==='string'){
indent=space;
}
rep=replacer;
if(replacer&&typeof replacer!=='function'&&
(typeof replacer!=='object'||
typeof replacer.length!=='number')){
throw new Error('JSON.stringify');
}
return str('',{'':value});
};
}
if(typeof JSON.parse!=='function'){
JSON.parse=function(text,reviver){
var j;
function walk(holder,key){
var k,v,value=holder[key];
if(value&&typeof value==='object'){
for(k in value){
if(Object.prototype.hasOwnProperty.call(value,k)){
v=walk(value,k);
if(v!==undefined){
value[k]=v;
}else{
delete value[k];
}
}
}
}
return reviver.call(holder,key,value);
}
text=String(text);
cx.lastIndex=0;
if(cx.test(text)){
text=text.replace(cx,function(a){
return'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);
});
}
if(/^[\],:{}\s]*$/.test(text.
replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').
replace(/(?:^|:|,)(?:\s*\[)+/g,''))){
j=eval('('+text+')');
return typeof reviver==='function'?walk({'':j},''):j;
}
throw new SyntaxError('JSON.parse');
};
}
}());
};
define_es5shim(),define_es5sham(),define_json();
});

