import {proxy} from '/js/main.js';

//###################### keyboard controls ######################
document.addEventListener("keydown", function(e){ //prevent defaults
	if(e.target.tagName === "INPUT") return;
	if([' ', 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].indexOf(e.key) > -1) e.preventDefault();
});
let keyEvent = function(e,key_code,f,...args){
	document.addEventListener(e, function(e){
		if(e.key === key_code && e.target.tagName !== "INPUT") return f(...args);
	}, false);
}
keyEvent('keyup',' ',function(){
    proxy.enqueue(proxy.state.paused? "play": "pause");
});
keyEvent('keyup','l',function(){
    proxy.loop(!proxy.state.loop);
});
keyEvent('keyup','m',function(){
    proxy.mute(!proxy.state.muted);
});
keyEvent('keydown','ArrowRight',proxy.enqueue.bind(proxy,'fastForward',5));
keyEvent('keydown','ArrowLeft',proxy.enqueue.bind(proxy,'fastForward',-5));
keyEvent('keyup','0',proxy.enqueue.bind(proxy,'seek',0));

//###################### Media Session ######################
if ('mediaSession' in navigator) {
	console.log("Using mediaSession");
	const session = window.top.navigator.mediaSession;
    proxy.state.subscribe("paused",{callback:function({value: is_paused}){
        try{
            session.playbackState = is_paused? "paused": "playing";
        }catch(e){
            console.error("mediaSession failed to set playbackState: ",e);
        }
    }});
    proxy.state.subscribe("track",{callback:function({value: track}){
        try{
            session.metadata = new MediaMetadata({
                title: track.title,
                artist: track.artist,
                album: track.album,
                artwork: ['96x96','128x128','192x192','256x256','354x384','512x512'].map(function(sizes){
                    return track.thumbnail? {src: track.thumbnail, sizes, type: 'image/png'}: {src: "/images/musical-note.svg", sizes, type: 'image/svg+xml'};
                }),
            });
        }catch(e){
            console.error("mediaSession failed to set metadata: ",e);
        }
    }});
    proxy.state.subscribe("src",{callback:function({value: src}){
        console.log("actionHandler");
        try{
            const actionHandler = function({action, seekOffset, seekTime}){
                switch(action){
                    case "play":
                        proxy.play(); // TODO use enqueue instead?
                        break;
                    case "pause":
                        proxy.pause();
                        break;
                    case "stop":
                        proxy.stop();
                        break;
                    case "seekbackward":
                        proxy.fastForward(seekOffset || -5);
                        break;
                    case "seekforward":
                        proxy.fastForward(seekOffset || 5);
                        break;
                    case "seekto":
                        proxy.seek(seekTime);
                        break;
                }
            }
            session.setActionHandler('play', actionHandler);
            session.setActionHandler('pause', actionHandler);
            session.setActionHandler('stop', actionHandler);
            session.setActionHandler('seekbackward', actionHandler);
            session.setActionHandler('seekforward', actionHandler);
            session.setActionHandler('seekto', actionHandler);
        }catch(e){
            console.error("mediaSession failed to initialize: ",e);
        }
    }, once: true});
    proxy.state.subscribe("time",{callback:function({value: time}){
        try{
            session.setPositionState({
               duration: proxy.state.duration,
               playbackRate: 1.0,
               position: time,
            });
        }catch(e){
            console.error("mediaSession failed to setPositionState: ",e);
        }
    }});
}else{
	console.log("mediaSession is unsupported");
}

// ########################### TOP ###########################
const status_modal = document.querySelector("#status");
const url_input = document.querySelector("#controls #url");
const load_btn = document.querySelector("#controls #load");
const download_btn = document.querySelector("#state-download");

proxy.state.subscribe("src", {callback: function({value: src}){
    console.log("download_btn"); //TODO my bet is on the "src" subscription (once) [line 51] handler skiping over this callback
    if(!proxy.state.paused) proxy.enqueue("play");
    download_btn.disabled = src? false: true;
}});
download_btn.addEventListener("click", function(e){
    if(!proxy.state.src) return alert("Nothing to download!");
    const a = document.createElement('a');
    a.href = proxy.state.track.src;
    a.download = proxy.state.track.title;
    a.target = "_blank";
    a.click();
});

load_btn.addEventListener("click", async function(e){
	if(!url_input.value) return alert("Please enter a valid URL!");
	try{
		new URL(url_input.value);
	}catch{
		return alert("Please enter a valid URL!");
	}
    const track = EventTarget.observe({src: url_input.value});
    try{
        status_modal.innerText = "Loading...";
        status_modal.classList.remove("hidden");
        await proxy.load(track);
        status_modal.classList.add("hidden");
    }catch(e){
        console.error(e);
        status_modal.innerText = "Unable to load URL";
    }
});

// ########################### BOTTOM ###########################

const loop_checkbox = document.querySelector("#controls #loop");
const rewind_btn = document.querySelector("#controls #rewind");
const play_btn = document.querySelector("#controls #play");
// const pause_btn = document.querySelector("#controls #pause");
// const stop_btn = document.querySelector("#controls #stop");
const forward_btn = document.querySelector("#controls #forward");
const mute_checkbox = document.querySelector("#controls #mute");

loop_checkbox.addEventListener('click', function(e){
	proxy.loop(!proxy.state.loop);
});
proxy.state.subscribe("loop", {callback: function({value: will_loop}){
    loop_checkbox.classList[will_loop? "add": "remove"]("highlight");
}});

rewind_btn.addEventListener('click',proxy.enqueue.bind(proxy, "fastForward", -10));

play_btn.addEventListener('click',function(e){
    proxy.enqueue(proxy.state.paused? "play": "pause");
});
proxy.state.subscribe("paused", {callback: function({value: is_paused}){
    play_btn.src = is_paused? "/images/media-play.svg": "/images/media-pause.svg";
}});

// pause_btn.addEventListener('click',proxy.enqueue.bind(proxy, "pause"));
// stop_btn.addEventListener('click',proxy.enqueue.bind(proxy, "stop"));

forward_btn.addEventListener('click',proxy.enqueue.bind(proxy, "fastForward", 10));

mute_checkbox.addEventListener('click', function(e){
	proxy.mute(!proxy.state.muted);
});
proxy.state.subscribe("muted", {callback: function({value: is_muted}){
    mute_checkbox.src = is_muted? "/images/volume-off.svg": "/images/volume-high.svg";
}});