import {player} from '/js/main.js';

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
    player.enqueue(player.state.paused? "play": "pause");
});
keyEvent('keyup','l',function(){
    player.loop(!player.state.loop);
});
keyEvent('keyup','m',function(){
    player.mute(!player.state.muted);
});
keyEvent('keydown','ArrowRight',player.enqueue.bind(player,'fastForward',5));
keyEvent('keydown','ArrowLeft',player.enqueue.bind(player,'fastForward',-5));
keyEvent('keyup','0',player.enqueue.bind(player,'seek',0));

//###################### Media Session ######################
if ('mediaSession' in navigator) {
	console.log("Using mediaSession");
	const session = window.top.navigator.mediaSession;
    player.observer.subscribe("paused",{callback:function({value: is_paused}){
        try{
            session.playbackState = is_paused? "paused": "playing";
        }catch(e){
            console.error("mediaSession failed to set playbackState: ",e);
        }
    }});
    player.observer.subscribe("track",{callback:function({value: track}){
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
    player.observer.subscribe("src",{callback:function({value: src}){
        try{
            const actionHandler = function({action, seekOffset, seekTime}){
                switch(action){
                    case "play":
                        player.play(); // TODO use enqueue instead?
                        break;
                    case "pause":
                        player.pause();
                        break;
                    case "stop":
                        player.stop();
                        break;
                    case "seekbackward":
                        player.fastForward(seekOffset || -5);
                        break;
                    case "seekforward":
                        player.fastForward(seekOffset || 5);
                        break;
                    case "seekto":
                        player.seek(seekTime);
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
    player.observer.subscribe("time",{callback:function({value: time}){
        try{
            session.setPositionState({
               duration: player.state.duration,
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

// ########################### PROGRESS ###########################
const current_time = document.querySelector("#state-time");
const current_duration = document.querySelector("#state-duration");
const progress_bar = document.querySelector("#progress-bar");
const progress_bar_elapsed = document.querySelector("#progress-bar #elapsed");
const progress_bar_remaining = document.querySelector("#progress-bar #remaining");

player.observer.subscribe("time", {callback: function({value: time}){
    current_time.innerText = new Date(time * 1000).toISOString().substr(14, 5);
}});
player.observer.subscribe("duration", {callback: function({value: time}){
    current_duration.innerText = new Date(time * 1000).toISOString().substr(14, 5);
}});
player.observer.subscribe("time", {callback: function({value: time}){
	let duration = player.state.duration || 0;
	if(time > duration || !isFinite(duration)) return;
	let p = 100*time/duration;
	progress_bar_elapsed.style.width = String(p)+"%";
	progress_bar_remaining.style.width = String(100-p)+"%";
}});
progress_bar.addEventListener('click', async function(e){
    const rect = progress_bar.getBoundingClientRect();
	let p = (e.clientX - rect.left) / rect.width;
	if(player.state.duration && isFinite(player.state.duration)) player.seek(player.state.duration*p);
});

// ########################### TOP ###########################
const status_modal = document.querySelector("#status");
const url_input = document.querySelector("#controls #url");
const load_btn = document.querySelector("#controls #load");
const download_btn = document.querySelector("#state-download");

player.observer.subscribe("src", {callback: function({value: src}){
    if(!player.state.paused) player.enqueue("play");
    download_btn.disabled = src? false: true;
}});
download_btn.addEventListener("click", function(e){
    if(!player.state.src) return alert("Nothing to download!");
    const a = document.createElement('a');
    a.href = player.state.track.src;
    a.download = player.state.track.title;
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
	const track = {src: url_input.value};
    try{
        status_modal.innerText = "Loading...";
        status_modal.classList.remove("hidden");
        await player.load(track);
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
	player.loop(!player.state.loop);
});
player.observer.subscribe("loop", {callback: function({value: will_loop}){
    loop_checkbox.classList[will_loop? "add": "remove"]("highlight");
}});

rewind_btn.addEventListener('click',player.enqueue.bind(player, "fastForward", -10));

play_btn.addEventListener('click',function(e){
    player.enqueue(player.state.paused? "play": "pause");
});
player.observer.subscribe("paused", {callback: function({value: is_paused}){
    play_btn.src = is_paused? "/images/media-play.svg": "/images/media-pause.svg";
}});

// pause_btn.addEventListener('click',player.enqueue.bind(player, "pause"));
// stop_btn.addEventListener('click',player.enqueue.bind(player, "stop"));

forward_btn.addEventListener('click',player.enqueue.bind(player, "fastForward", 10));

mute_checkbox.addEventListener('click', function(e){
	player.mute(!player.state.muted);
});
player.observer.subscribe("muted", {callback: function({value: is_muted}){
    mute_checkbox.src = is_muted? "/images/volume-off.svg": "/images/volume-high.svg";
}});