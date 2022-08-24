import {proxy} from '/js/main.js';

const artwork_el = document.querySelector("#state-artwork");
const title_el = document.querySelector("#state-title");
const artist_el = document.querySelector("#state-artist");

proxy.state.subscribe("track",{callback:function({value: track}){
    artwork_el.src = track.thumbnail? track.thumbnail: "/images/musical-note.svg";
    artwork_el.classList[track.thumbnail? "remove": "add"]("invert");
	title_el.innerText = track.title? track.title: "Unkown Title";
    artist_el.innerText = track.artist? track.artist: "Unkown Artist";
}});
