/*
 *  This file is part of the MetaMusic library (https://github.com/KenanTurner/MetaMusic)
 *  Copyright (C) 2022  Kenan Turner
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import Default from './default.js';
export default class ProxyPlayer extends Default{
	static proxy_url = "/php/proxy.php";
    constructor(){
		super();
		this.state.track = null;
	}
	async load(track){
		if(track.src !== track.static_url && track._expiration_date > Date.now()) return super.load(track);
        let fetch_url = new URL(this.constructor.proxy_url, window.location.href);
        fetch_url.searchParams.set("url", track.src);
		let result = await fetch(fetch_url.toString(),{
			method: 'GET',
            mode: 'cors',
            cache: 'no-store',
		});
		if(!result.ok) throw new Error(await result.text());
		let response = await result.json();
		
		track.title = response.fulltitle || response.title;
		track.sources = response.formats? response.formats.filter(function(resource){
			return (
				resource.resolution == "audio only" &&
				(resource.protocol == "http" || resource.protocol == "https" || resource.protocol == "http_dash_segments")
			)
		}).map(function(resource){
			return {
				"ext": resource.ext,
				"codec": resource.acodec,
				"abr": resource.abr,
				"asr": resource.asr,
				"src": resource.fragment_base_url? resource.fragment_base_url: resource.url,
			}
		}).reverse(): [];
		track.src = response.url;
        track.duration = response.duration;
		track.thumbnail = response.thumbnail;
		track.description = response.description;
        track.artist = response.artist || response.uploader;
		track.static_url = response.original_url;
        track.album = response.album;
		
		let ret = await super.load(track);
		track._expiration_date = Date.now() + (1000 * Math.floor(this.state.duration || 0));
        this.state.track = track;
		return ret;
	}
}
