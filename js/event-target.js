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
import AsyncQueue from './async-queue.js';
export default class EventTarget extends AsyncQueue{
	constructor(){
		super(...arguments);
		this._subscribers = {all:[]};
	}
	release(){
		let p = this.publish("release");
		Object.values(this._subscribers).forEach(function(arr){
			arr.length = 0; //Removes all event listeners
		});
		return p;
	}
	//{key:[String],callback:[Function],<error>:[Function],<once>:[Boolean]}
	subscribe(key,{callback,error,once} = {}){
		if(!key) throw new Error("Subscriber must specify a key!");
		if(!callback && !error) throw new Error("Subscriber must include a callback or an error!");
		if(callback && typeof callback !== "function") throw new Error("Callback must be a function");
        if(error && typeof error !== "function") throw new Error("Error must be a function");
		
		if(!this._subscribers[key]) this._subscribers[key] = []; //creates the subscriber list
		this._subscribers[key].push({key,callback,once,error});
	}
	//{key:[String],callback:[Function],<error>:[Function],<once>:[Boolean]}
	unsubscribe(key,{callback,error,once} = {}){
		if(!key) throw new Error("Subscriber must specify a key!");
		if(!callback && !error) throw new Error("Subscriber must include a callback or an error!");
		if(callback && typeof callback !== "function") throw new Error("Callback must be a function");
        if(error && typeof error !== "function") throw new Error("Error must be a function");
		
		if(!this._subscribers[key]) return;
		this._subscribers[key] = this._subscribers[key].filter(function(obj){
            if(key !== obj.key) return true;
            if(callback !== obj.callback) return true;
            if(error !== obj.error) return true;
            if(once !== obj.once) return true;
			return false;
		});
	}
	publish(key,options = {}){
		if(!key) throw new Error("Key must be specified!");
		let event = {...options};
		event.key = key;
        for(const _key in this._subscribers){
            if(key !== _key && "all" !== _key) continue;
            const subs = this._subscribers[_key];
            this._subscribers[_key] = subs.filter(function({key,callback,once,error}){
                if(callback && !event.error) callback(event);
                if(error && event.error) error(event);
                return !once;
            });
        }
		return event;
	}
	waitForEvent(key){
		return new Promise(function(resolve, reject) {
			this.subscribe(key,{callback:resolve,once:true,error:reject});
		}.bind(this));
	}
	static observe = function(state = {}){
		let observer = new EventTarget();
		return new Proxy(state,{
			set: function(target, prop, value, receiver){
				target[prop] = value;
				observer.publish(prop,{target,value});
				return true;
			},
			get: function(target, prop, receiver){
				if(prop in observer) return observer[prop];
				if(typeof target[prop] === "function") return function(){ //TODO fix context
					try{
						let result = target[prop](...arguments);
						observer.publish(prop,{args:arguments,target});
						return result;
					}catch(e){
						observer.publish(prop,{error:e,args:arguments,target});
						throw e;
					}
				}
				return Reflect.get(target,prop);
			}
		});
		return {observer, state: proxy};
	}
}
