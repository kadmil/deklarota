var searches_pr = {
	vk: 0,
	soundcloud: -5
};



cmo = {
	getSteamSData: function(sem){
		var allr = [];
		var steams = sem.steams;
		for (var steam in steams){
			var d = this.getSteamData(sem, steam);
			if (d){
				allr.push(allr);
			}
		}
		return !!allr.length && allr;
	},
	getSteamData: function(sem, steam_name){
		var steam = sem.steams[steam_name]
		if (!steam){
			return false;
		}
		var nice_steam;
		for(var source in steam){
			if (!steam[source].failed && steam[source].t){
				nice_steam = steam[source];
				break;
			}
		}
		var ugly_steam;
		if (!nice_steam){
			for(var source in steam){
				if (steam[source].failed){
					ugly_steam = steam[source];
					break;
				}
			}
		}
		return nice_steam || ugly_steam || false;
	},
	addSteamPart: function(sem, search_source, t ){
		var _ms = this.getMusicStore(sem, search_source);
		_ms.t = t;
		sem.have_tracks = true;
		_ms.processing = false;
		sem.some_results = true;
		_ms.failed = false;
		var searches_indexes=[];
		for (var s in searches_pr) {
			if (searches_pr[s] < 1){
				searches_indexes.push(searches_pr[s]);
			}
			
		};
		var best = Math.max.apply(Math, searches_indexes);
		if (searches_pr[search_source.name] === best){
			sem.have_best = true;
		}
		
		
	},
	blockSteamPart: function(sem, search_source){
		var _ms = this.getMusicStore(sem, search_source);
		_ms.processing = false;
		sem.some_results = true;
		if (!_ms.t){
			_ms.failed = true;
			if (search_source.fixable){
				_ms.fixable = true;
				
			}
			return true;
		} else{
			return false;
		}
		
		
	},
	getSomeTracks: function(steam){
		var many_tracks = [];
		for(var source in steam){
			if (!steam[source].failed && steam[source].t){
				many_tracks.push.apply(many_tracks, steam[source].t);
			}
		}
		return !!many_tracks.length && many_tracks;
	},
	by_best_search_index: function(g,f){
		if (g && f) {
			var gg = searches_pr[g.name];
			var ff = searches_pr[f.name];
			if (typeof gg =='undefined'){
				gg = -1000;
			}
			if (typeof ff =='undefined'){
				ff = -1000;
			}
			
			
			if (gg < ff){
				return 1;
			}
			else if (gg > ff){
				return -1;
			}
			else{
				return 0;
			}
		} else {
			return 0;
		}
	},
	getAllSongTracks: function(sem){

		var tracks_pack = [];
		for(var steam in sem.steams){
			var m = this.getSomeTracks(sem.steams[steam]);
			if (m){
				tracks_pack.push({
					name: steam,
					t: m
				})
			}
		}
		tracks_pack.sort(this.by_best_search_index);
		return !!tracks_pack.length && tracks_pack;
	},
	getMusicStore: function(sem, search_source){
		
		var ss = {
			name: (search_source && search_source.name) || 'sample',
			key: (search_source && search_source.key) || 0
		};
		
		if (!sem.steams){
			sem.steams = {};
		}
		if (!sem.steams[ss.name]){
			sem.steams[ss.name] = {};
		}
		if (!sem.steams[ss.name][ss.key]){
			sem.steams[ss.name][ss.key] = {};
		}
		return sem.steams[ss.name][ss.key];
	}
	
}




function get_all_tracks(trackname, callback, nocache, hypnotoad, only_cache){
	var allow_h = hypnotoad && seesu.delayed_search.waiting_for_mp3provider;
	if (seesu.delayed_search.use.queue) {seesu.delayed_search.use.queue.reset();}
	seesu.delayed_search.tracks_waiting_for_search = 0;
	seesu.ui.els.art_tracks_w_counter.text('');
	var s = allow_h ? seesu.hypnotoad.search_soundcloud : seesu.delayed_search.use.search_tracks;
	var used_successful = s(trackname, callback, function(){callback();}, nocache, false, only_cache);
	if (typeof used_successful == 'object'){
		used_successful.pr = seesu.player.want_to_play + 1;
		used_successful.q.init();
	}
	return used_successful;
};



function getSongMatchingIndex(song, query){
	var _ar = song.artist,
		_tr = song.track;
		
	var artist = query.artist,
		track = query.track;
	
	if (!track && !artist){
		if (!query.q){
			return -1000;
		} else{
			artist = query.q;
			_tr = '';
		}
		
	}
		
	var mi = 0;
	
	
	var epic_fail_test = artist + ' ' + track,
		epic_fail = !~epic_fail_test.indexOf(artist.replace(/^The /, '')) && !~epic_fail_test.indexOf(track);
	
	if (epic_fail){
		return mi = -1000;
	} else{
		if ((_ar == artist) && (_tr == track)){
			return mi;
		} 
		--mi;
		if ((_ar.toLowerCase() == artist.toLowerCase()) && (_tr.toLowerCase() == track.toLowerCase())){
			return mi;
		} 
		--mi;
		if ((_ar.replace(/^The /, '') == artist.replace(/^The /, '')) && (_tr == track)){
			return mi;
		} 
		--mi;
		if ((_ar.replace(/^The /, '') == artist.replace(/^The /, '')) && (_tr.replace(/.mp3$/, '') == track)){
			return mi;
		} 
		--mi;
		if ((_ar.toLowerCase() == artist.replace(/^The /).toLowerCase()) && (_tr.toLowerCase() == track.toLowerCase())){
			return mi;
		} 
		--mi;
		if (~_ar.indexOf(artist) && ~_tr.indexOf(track)) {
			return mi;
		} 
		--mi;
		if (~_ar.toLowerCase().indexOf(artist.toLowerCase()) && ~_tr.toLowerCase().indexOf(track.toLowerCase())) {
			return mi;
		} 
		
		--mi 
		return mi;
		
	}
	
		
	
};


function by_best_matching_index(g,f, query){
	if (g && f) {
		if (getSongMatchingIndex(g,query) < getSongMatchingIndex(f, query)){
			return 1;
		}
		else if (getSongMatchingIndex(g, query) > getSongMatchingIndex(f, query)){
			return -1;
		}
		else{
			return 0;
		}
	} else {
		return 0;
	}
};

function kill_music_dubs(array) {
	var cleared_array = [];
	for (var i=0; i < array.length; i++) {
		if (!has_music_copy(array, array[i], i+1)){
			cleared_array.push(array[i]);
		}
	}
	return cleared_array
};
function has_music_copy(array, entity, from_position){
	var ess = /(^\s*)|(\s*$)/g;
	if (!array.length) {return false}
	
	for (var i = from_position || 0, l = array.length; i < l; i++) {
		if ((array[i].artist.replace(ess, '') == entity.artist.replace(ess, '')) && (array[i].track.replace(ess, '') == entity.track.replace(ess, '')) && (array[i].duration == entity.duration)) {
			return true;
		}
	};
};


function canUseSearch(sem, search_source){
	if (!sem.steams){
		return true;
	}
	if (!sem.steams[search_source.name]){
		return true;
	}
	
	var my_steam = sem.steams[search_source.name][search_source.key];
	if (my_steam){
		if (my_steam.failed){
			if (my_steam.fixable){
				return true;
			} else{
				return false;
			}
		} else if (my_steam.t){
			return false; 
		} else if (my_steam.processing){
			return false; 
		} else{
			return true;
		}
		
	}
		
	var fixable = true;
	var getted = false;
	for (var steam in sem.steams) {
		if (sem.steams[steam].t){
			getted = true;
		}
		if (sem.steams[steam].failed && !sem.steams[steam].fixable){
			fixable = false;
		}
		
	};
	if (!getted && fixable){
		return true;
	} else{
		return false;
	}
};
function handle_song(mo, complete, get_next){
	mo.node.removeClass('search-mp3');
	if (complete){
		if (mo.sem.have_tracks){
			clearTimeout(mo.cantwait);
			make_node_playable(mo);
			seesu.ui.els.export_playlist.addClass('can-be-used');
		} else{
			mo.node.addClass('search-mp3-failed').removeClass('waiting-full-render');
			if (get_next){
				if (seesu.player.c_song && ((seesu.player.c_song.next_song && (mo == seesu.player.c_song.next_song)) || 
					(seesu.player.c_song.prev_song && (mo == seesu.player.c_song.prev_song)))){
					seesu.player.fix_songs_ui();
				}
				if (seesu.player.c_song && seesu.player.c_song.next_song){
					get_next_track_with_priority(seesu.player.c_song.next_song);
				}
			}
		}
	} else if (mo.sem.have_best){
		clearTimeout(mo.cantwait);
		make_node_playable(mo);
		seesu.ui.els.export_playlist.addClass('can-be-used');
	} else if (mo.sem.have_tracks){
		mo.cantwait = setTimeout(function(){
			make_node_playable(mo);
			seesu.ui.els.export_playlist.addClass('can-be-used');
		},20000);
		make_node_playable(mo, true);
	}
};

var get_mp3 = function(msq, options, p, callback, just_after_request){
	var o = options || {};
	var search_query = msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || ''));
	
	//o ={handler: function(){}, nocache: false, only_cache: false, get_next: false}
	if (!o.nocache && !o.only_cache){
		seesu.ui.els.art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search += 1) || '');
	}
	
	var count_down = function(search_source, music_list){
		var complete = p.n !== 0 && --p.n === 0;
		if (!o.nocache && !o.only_cache){
			seesu.ui.els.art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
		}
		if (callback){
			callback(!music_list, search_source, complete, music_list)
		}
	};
	/*
	setTimeout(function(){
		if (p.n !== 0){
			p.n = 1;
			count_down();
		}
	},50000);*/
	var callback_success = function(music_list, search_source){
		//success
		music_list.sort(function(g,f){
			return by_best_matching_index(g,f, msq)
		});
		count_down(search_source, music_list);
		cache_ajax.set(search_source.name + 'mp3', search_query, {
			music_list: music_list,
			search_source: search_source
		});
	};
	
	var callback_error = function(search_source){
		//error
		count_down(search_source);
	};
	var used_successful = o.handler(search_query, callback_success, callback_error, o.nocache, just_after_request, o.only_cache);
	
	
	return used_successful;
};


function music_seach_emitter(q){
	this.q = q;
	this.fdefs = [];
	this.songs = [];
	
};
music_seach_emitter.prototype = {
	addSong: function(mo, get_next){
		if (!~this.songs.indexOf(mo)){
			this.songs.push(mo);
			mo.sem = this;
			if (this.some_results){
				handle_song(mo, this.search_completed, get_next);
			}
		} 
		
	},
	emmit_handler: function(c){
		var c = this.fdefs[i];
		if (!c.done){
			if (c.filter){
				var r = cmo.getSteamData(this, c.filter);
				if (r){
					c.handler(r.failed, r.t, c);
				}
			} else{
				
			}
		}
	},
	addHandler: function(oh){
		this.fdefs.push(oh);
		this.emmit_handler(oh);
	},
	emit: function(complete, get_next){
		for (var i=0; i < this.songs.length; i++) {
			handle_song(this.songs[i]);
		}
		
		for (var i=0; i < this.fdefs.length; i++) {
			this.emmit_handler(c, complete, get_next)
			
			
			
		}
		
	},
	wait_ui: function(){
		for (var i=0; i < this.songs.length; i++) {
			var mo = this.songs[i];
			if (!mo.have_tracks){
                mo.node.addClass('search-mp3');
            }
		}
		
		for (var i=0; i < this.fdefs.length; i++) {
			if (!this.fdefs[i].done && this.fdefs[i].while_wait){
				this.fdefs[i].while_wait(); 
			}
			
		}
	}
};
su.mp3_search= (function(){
	  	var s = [];
	  	s.search_emitters = {};
	  	
		s.getCache = function(sem, name){
			return cache_ajax.get(name + 'mp3', sem.q, function(r){
				
				cmo.addSteamPart(sem, r.search_source, r.music_list);
				sem.emit();
				
			});
		};
		s.find_simple = function(q, filter){
			for (var i=0; i < this.length; i++) {
				this[i]
			};
		},
		s.searchFor = function(query, init, filter, options){
			var q = HTMLDecode(query.q || (query.artist + ' - ' + query.track));
			var o = options || {};
			var search_handlers = [];
			
			var sem = this.search_emitters[q] || (this.search_emitters[q] = new music_seach_emitter(q));
			if (init){
				init(sem);
			}
	
			var tried_cache = [];
			
			for (var i=0; i < this.length; i++) {
				var cursor = this[i];
				var _c; //cache
				if (!filter || cursor.name == filter){
					if (!~tried_cache.indexOf(cursor.name)){
						_c = this.getCache(sem, cursor.name);
						tried_cache.push(cursor.name);
						
	
					}
					
					if (!_c && !o.only_cache && !cursor.disabled){
						if (!cursor.preferred || cursor.preferred.disabled){
							
								var can_search = cursor.test(sem);
								if (can_search){
									cmo.getMusicStore(sem, cursor.s).processing = true;
									search_handlers.push(cursor.search);
								}
								
						}
						
					}
				}
				
			};
			var p = {
				n: search_handlers.length
			};
			var successful_uses = []
			for (var i=0; i < search_handlers.length; i++) {				
				var used_successful =  get_mp3(query, {
					handler: search_handlers[i],
					get_next: o.get_next
				}, p, function(err, search_source, complete, music_list){
					if (err){
						if (search_source){
							cmo.blockSteamPart(sem, search_source);
						}
					} else{
						cmo.addSteamPart(sem, search_source, music_list);
					}
					if (complete){
						sem.search_completed = true;
					}
					sem.emit(complete, o.get_next);
				}, function(){
					sem.wait_ui();
				});
				if (used_successful){successful_uses.push(used_successful)}
				
				
				
			};
			return !!successful_uses.length && successful_uses;
		},
		s.find_mp3 = function(mo, options){
			if (!mo.artist || !mo.track){
				return false;
			}
			var music_query = {
				artist:mo.artist,
				track: mo.track
			};
			var mqs = mo.artist + ' - '+ mo.track;
			var successful_uses = this.searchFor(music_query, function(sem){
				if (!mo.handled){
					sem.addSong(mo, !!options && options.get_next);
					mo.handled = true;
				} 
			}, false, options);
			
			if (successful_uses){
				for (var i=0; i < successful_uses.length; i++) {
					var used_successful = successful_uses[i];
					if (typeof used_successful == 'object'){
						var has_pr = mo.want_to_play;
						if (has_pr) {
							used_successful.pr = has_pr;
						}
						mo.delayed_in.push(used_successful);
						used_successful.q.init();
					};
				};
			}
			
			
			
		};
		
		s.add = function(asearch, force){
			var exist_slave;
			var exist_alone_master;
			
			var push_later;
			
			
			for (var i=0; i < this.length; i++) {
				var cmp3s = this[i];
				if (!cmp3s.disabled && cmp3s.name == asearch.name){
					if (cmp3s.slave){
						if (!exist_slave){
							exist_slave = cmp3s;
						}
					}
				}
			};
			for (var i=0; i < this.length; i++) {
				var cmp3s = this[i];
				if (!cmp3s.disabled && cmp3s.name == asearch.name){
					if (!cmp3s.slave){
						if (exist_slave){
							if (exist_slave != cmp3s  && exist_slave.preferred != cmp3s){
								exist_alone_master = cmp3s;
							}
						} else{
							exist_alone_master = cmp3s;
						}
					}
				}
			};
			
			
			if (exist_slave){
				if (force || !exist_slave.preferred || !~this.indexOf(exist_slave.preferred)){
					exist_slave.preferred.disabled = true;
					this.push(asearch);
					exist_slave.preferred = asearch;
				} 
			} else if (exist_alone_master){
				if (force){
					exist_alone_master.disabled = true;
					this.push(asearch);
				}
			} else{
				this.push(asearch);
			}
	  	}

		return s;
})();

if (typeof soundcloud_search != 'undefined'){
	(function(){
		var sc_search_source = {name: 'soundcloud', key: 0};
		su.mp3_search.add({
			test: function(mo){
				return canUseSearch(mo, sc_search_source);
			},
			search: soundcloud_search,
			name: sc_search_source.name,
			description:'soundcloud.com',
			slave: false,
			s: sc_search_source,
			preferred: null,
			q: su.soundcloud_queue
		})
	})();
	
};