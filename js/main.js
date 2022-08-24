import EventTarget from '/js/event-target.js';
import PROXY from '/js/proxy.js';

let imports = {EventTarget, PROXY};
function map(src,dest={},key=function(k){return k},value=function(v){return v}){for(let k in src){dest[key(k)] = value(src[k]);};return dest;}
map(imports,window);
console.log("Imports Loaded");

const proxy = new PROXY();
proxy.state.subscribe('error',{callback:function(err){
	console.error(err);
}});
proxy.state.subscribe('all',{callback:function(e){console.debug(e)}});

export {proxy};

window.proxy = proxy;