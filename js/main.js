import EventTarget from '/js/event-target.js';
import YoutubePlayer from '/js/youtube.js';

let imports = {EventTarget, YoutubePlayer};
function map(src,dest={},key=function(k){return k},value=function(v){return v}){for(let k in src){dest[key(k)] = value(src[k]);};return dest;}
map(imports,window);
console.log("Imports Loaded");

const player = new YoutubePlayer();
player.observer.subscribe('error',{callback:function(err){
	console.error(err);
}});
player.observer.subscribe('all',{callback:function(e){console.debug(e)}});

export {player};

window.player = player;