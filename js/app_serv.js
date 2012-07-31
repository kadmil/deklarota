(function(w) {
	var ready = false;
	jsLoadComplete(function(){
		domReady(w.document, function(){
			ready = true;
		});
	});
	window.suReady = function(callback){
		if (ready){
			setTimeout(callback, 30);
		} else{
			jsLoadComplete(function(){
				domReady(w.document, callback);
			});
		}
		
	};
	
})(window);



var tempTool = {
	loadPlaylist: function() {
		$.ajax({
			url: "playlist.txt",
			type: "text"
		}).done(function(r) {
			//var playlist = [];
			var title ="крым,карпаты 2012";

			var playlist = su.preparePlaylist({
				title: title,
				type: "cplaylist",
				data: {name: title} 
			});

			var arr = r.split(/\n/);
			$.each(arr, function(i, el){
				if (el){
					var song = guessArtist(el);
					if (!song.artist){
						throw "Shhiii!"
					}
					playlist.add(song);
				}
			});
			su.views.showStaticPlaylist(playlist);
			dizi = playlist;
		})
	},
	downloadFile: function(url) {
		app_env.openURL(url);
		return;
		$(function() {
			var iframe = document.createElement("iframe");
			iframe.style.display = 'none';
			iframe.src = url;
			$(document.body).append(iframe);
		});
	}
};

var downloadFile = tempTool.downloadFile;

var getTagRegExp = function(tag_name, simple, flags){
	var reg_string = "<" + tag_name + "[\\s\\S]*?>";
	if (!simple){
		reg_string += "[\\s\\S]*?<\/" + tag_name + ">";
	}
	return new RegExp(reg_string, flags || "gi");
};

var getCleanDocumentBodyHTML = function(text) {
	var body = text.match(getTagRegExp("body"));
	body = body && body[0];
	if (body){
		var wrap = document.createElement("html");
		wrap.innerHTML = body
			.replace(getTagRegExp("script"), "")
			.replace(getTagRegExp("style"), "")
			.replace(getTagRegExp("img", true) , "")
			.replace(getTagRegExp("link", true) , "");
		return wrap;
	}
};
var loaded_images = {};
var loadImage = function(opts) {
	

	//queue
	var node = opts.node || new Image();
	var deferred = $.Deferred();

	var unbindEvents = function() {
		removeEvent(node, "load", loadCb);
		removeEvent(node, "error", errorCb);
	};
	var loadCb = function() {
		deferred.resolve(node);
		unbindEvents();
	};
	var errorCb = function() {
		deferred.reject(node);
		unbindEvents();
	};

	var async_obj = deferred.promise({
		abort: function() {
			delete node.src;
			if (this.queued){
				this.queued.abort();
			}
			unbindEvents();
		}
	});


	addEvent(node, "load", loadCb);
	addEvent(node, "error", errorCb);
	if (opts.timeout){
		setTimeout(function() {
			deferred.reject(node, 'timeout');
			unbindEvents();
		}, opts.timeout)
	}

	var completeLoad = function() {
		node.src = opts.url;
		if (node.complete){
			if (opts.cache_allowed){
				loaded_images[opts.url] = true;
			}
			deferred.resolve(node);
			unbindEvents();
		}
	};
	if (opts.queue && !loaded_images[opts.url]){
		async_obj.queued = opts.queue.add(completeLoad);
		
	} else {
		completeLoad();
	}
	
	
	return async_obj;
};

var getInternetConnectionStatus = function(cb) {
	var img = new Image();
	img.onload = function() {
		cb(true);
	};
	img.onerror = function() {
		cb(false);
	};
	img.src = "http://www.google-analytics.com/__utm.gif?" + Math.random() + new Date();
};
var async_script_support = "async" in document.createElement("script");
var xhr2_support = window.XMLHttpRequest && "withCredentials" in new XMLHttpRequest;  //https://gist.github.com/1431660
var aReq = function(options){
	if (options.dataType != "jsonp"){
		return $.ajax(options);
	} else if (xhr2_support && options.thisOriginAllowed) {
		options.dataType = "json";
		options.crossDomain = true;
		if (options.afterChange){
			options.afterChange(options);
		}
		return $.ajax(options);
	} else {
		var
			img,
			script,
			callback_func_name,
			script_load_timeout,
			deferred 			= $.Deferred(),
			cancelLoad = function() {
				if (img){
					img.src = null;
					unbindImage();
				}
				if (script){
					script.src = null;
				}
				if (callback_func_name && window[callback_func_name]){
					window[callback_func_name] = $.noop()
				}
			},
			complex_response 	= {
				abort: function(){
					this.aborted = true;
					cancelLoad();
					

				}
			};
		deferred.promise( complex_response );
		
		var timeout = options.timeout || ($.ajaxSettings && $.ajaxSettings.timeout);
		if (timeout){
			script_load_timeout = setTimeout(function() {
				deferred.reject();
			}, timeout);
		}

		var params = {};
		$.extend(params, options.data || {});

		var callback_param_name = options.callback || "callback";

		if (!options.jsonpCallback && !params[callback_param_name]){
			callback_func_name = create_jsonp_callback(function(r){
				if (script_load_timeout){
					clearTimeout(script_load_timeout);
				}
				
				
				deferred.resolve(r);
			});
			params[callback_param_name] = callback_func_name;
		}


		var params_url = $.param(params);
		var full_url = (options.url || "") + (params_url ? "?" + params_url : "");

		

		
		var done;
		var loadScript = function(){
			script = document.createElement("script");
			script.async = true;
			script.onload = function(){
				//document.documentElement.firstChild.removeChild(script);
				

				
			};
			script.onerror = function(){
				deferred.reject();
			};
			script.src = full_url;
			document.documentElement.firstChild.insertBefore(script, document.documentElement.firstChild.firstChild);
		};


		var unbindImage = function(){
			img.onload = null;
			img.onerror = null;
		};
		if (async_script_support){
			loadScript();
		} else if (options.resourceCachingAvailable){
			img = document.createElement("img");
			var completeImage = function(){
				if (!done){
					done = true;
					loadScript();
				}
			};

			img.src = full_url;
			
			if (img.complete){
				setTimeout(completeImage,0);
			} else {
				img.onload = completeImage;
				img.onerror = completeImage;
			}
		} else {
			loadScript();
		}
			
		
		
		return complex_response;
		
	}
};

var getHTMLText = function(text) {
	var safe_node = document.createElement('div');
	safe_node.innerHTML = text;
	return $(safe_node).text();

};

var changeFavicon = function(d, src, type) {
	var link = d.createElement('link'),
		oldLink = d.getElementById('dynamic-favicon');
	link.id = 'dynamic-favicon';
	link.rel = 'shortcut icon';
	if (type){
		link.type = type;
	}
	
	link.href = src;
	if (oldLink) {
		d.head.removeChild(oldLink);
	}
	d.head.appendChild(link);
};

var abortage = {
	addDependent: function(dependent) {
		this.dep_objs = this.dep_objs || [];
		this.dep_objs.push(dependent);
	},
	canAbort: function(dependent) {
		if (!this.dep_objs){
			return true;
		} else {
			if (!this.dep_objs.length){
				return true;
			} else {
				this.dep_objs = arrayExclude(this.dep_objs, dependent);
				return !this.dep_objs.length;
			}
		}
	}
};



(function(){
	var jsonp_counter = 0;
	window.create_jsonp_callback = function(func){
		var func_name = 'jspc_' + (++jsonp_counter);
		window[func_name] = func;
		
		
		
		return func_name;
	};	
})();
function getSomething(array){
	return array[(Math.random()*(array.length-1)).toFixed(0)];
}


var addClass = function(old_c, cl){
	
	var add_c = cl.split(' ');
	var new_c = old_c;
	for (var i=0; i < add_c.length; i++) {
		var re = new RegExp("(^|\\s)" + add_c[i] + "(\\s|$)", "g");
		if (!old_c.match(re)){
			var b = (" " + add_c[i]);
			new_c = (new_c + " " + add_c[i]).replace(/\s+/g, " ").replace(/(^ | $)/g, "");
		}
	}
	return new_c;
};
 
var removeClass = function(old_c, add_c){
	var re = new RegExp("(^|\\s)" + add_c + "(\\s|$)", "g");
	return old_c.replace(re, "$1").replace(/\s+/g, " ").replace(/(^ | $)/g, "");
};
var toggleClass = function(old_c, toggle_class){
	if (old_c.indexOf(toggle_class) == -1){
		return addClass(old_c, toggle_class);
	} else{
		return removeClass(old_c, toggle_class);
	}
};
var document_states = function(d){
	this.ui = {
		d: d
	};
	this.html_el_state= d.documentElement.className || '';

};
document_states.prototype = {
	add_state: function(state_of, state){
		if (state_of == 'html_el'){
			this.html_el_state = addClass(this.html_el_state, state);
			if (this.dub) {
				this.dub.documentElement.className = this.html_el_state;
			}
			
		} 
	},
	toggleState: function(state_of, state){
		if (state_of == 'html_el'){
			this.html_el_state = toggleClass(this.html_el_state, state);
			if (this.dub) {
				this.dub.documentElement.className  = this.html_el_state;
			}
			
		} 
	},
	remove_state: function(state_of, state){
		if (state_of == 'html_el'){
			this.html_el_state = removeClass(this.html_el_state, state);
			if (this.dub) {
				this.dub.documentElement.className  = this.html_el_state;
			}
			
		}
	}, 
	connect_ui: function(dub){
		if (dub.documentElement){
			dub.documentElement.className =  this.html_el_state;
		}
		this.dub = dub;
	//	this.ui = ui;
	}
};

window.dstates = new document_states(window.document);


function get_url_parameters(str){
	var url_vars = str.replace(/^\?/,'').split('&');
	var full_url = {};
	for (var i=0; i < url_vars.length; i++) {
		var _h = url_vars[i].split('=');
		full_url[_h[0]] = _h[1];
	}
	return full_url;
};

var detectBrowser;
(function(w) {
	var
		rwebkit = /(webkit)[ \/]([\w.]+)/,
		ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
		rmsie = /(msie) ([\w.]+)/,
		rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/,
		ua = w && w.navigator && w.navigator.userAgent;

	detectBrowser = function() {
		ua = ua.toLowerCase();

		var match = rwebkit.exec( ua ) ||
			ropera.exec( ua ) ||
			rmsie.exec( ua ) ||
			ua.indexOf("compatible") < 0 && rmozilla.exec( ua ) ||
			[];

		return { browser: match[1] || "", version: match[2] || "0" };
	};
	
})(window);

window.app_env = (function(wd){

	var bro = detectBrowser();

	var env = {};
	env.url = get_url_parameters(wd.location.search);
	
	env.cross_domain_allowed = !wd.location.protocol.match(/(http\:)|(file\:)/);
	
	
	if (typeof widget == 'object' && !widget.fake_widget){
		if (bro.browser == 'opera'){
			if (opera.extension){
				env.app_type = 'opera_extension';
			} else{
				env.app_type = 'opera_widget';
				env.deep_sanbdox = true;
			}
			
		} else {
			env.app_type = 'apple_db_widget';
		}
		env.deep_sanbdox = true;
		env.as_application = true;
	} else
	if (typeof chrome === 'object' && wd.location.protocol == 'chrome-extension:'){
		if (wd.location.pathname == '/index.html'){
			env.app_type = 'chrome_app';
			env.as_application = false;
			env.needs_url_history = true;
			env.need_favicon = true;
		} else{
			env.app_type = 'chrome_extension';
			env.as_application = true;
		}
		
	} else
	if (wd.location.protocol.match(/http/)){
		
		if (wd.parent != wd && env.url.access_token && env.url.user_id){
			env.app_type = 'vkontakte';
			env.check_resize = true;
		} else{
			env.need_favicon = true;
			env.app_type = 'web_app';
		}
		env.as_application = false;
		env.needs_url_history = true;
		
	} else 
	if (wd.pokki && wd.pokki.openPopup){
		env.safe_data = true;
		env.app_type = 'pokki_app';
		env.cross_domain_allowed = true;
		env.deep_sanbdox = true;
		//env.as_application = true;
	} else 
	if (typeof btapp == 'object'){
		env.app_type = 'utorrent_app';
		env.as_application = false;
		env.deep_sanbdox = true;
		
	} else
	if (bro.browser == 'mozilla'){
		env.app_type = 'firefox_widget';
		env.as_application = true;
	} else{
		env.app_type = false;
		env.unknown_app = true;
		env.needs_url_history = true;
	}
	try{
		if (wd.document.createEvent('TouchEvent')){
			env.touch_support = true;
		}
	} catch(e){}
	
	
	
	//env.needs_url_history = false; //TEMP
	
	if (!env.app_type){
		env.app_type = 'unknown_app_type' + (wd.navigator.userAgent && ': ' + wd.navigator.userAgent);
		env.unknown_app_type = true;
		env.deep_sanbdox = true;
	} else{
		env[env.app_type] = true;
	}
	

	env.iframe_support = !env.utorrent_app && (!env.unknown_app_type || wd.location.protocol == 'file:');
	
	
	if (env.touch_support){dstates.add_state('html_el', 'touch-screen');}
	if (env.as_application){
		
		dstates.add_state('html_el', 'as-application');
		dstates.remove_state('html_el', 'not-as-application');
	} else{
		dstates.add_state('html_el', 'not-as-application');
	}
	if (!env.unknown_app_type){dstates.add_state('html_el', env.app_type.replace('_','-'));}
	if (env.cross_domain_allowed) {dstates.add_state('html_el', 'cross-domain-allowed');}
	
	
	if (env.vkontakte){
		if (env.url.language === '0'){
			env.lang = 'ru';
		} else if (env.url.language === '3'){
			env.lang = 'en';
		} else{
			env.lang = (wd.navigator.language || wd.navigator.browserLanguage).slice(0,2).toLowerCase();
		}
	} else{
		env.lang = (wd.navigator.language || wd.navigator.browserLanguage).slice(0,2).toLowerCase();
	}
	
	if (env.check_resize){
		var detectSize = function(D){
			return Math.max(D.scrollHeight, D.offsetHeight, D.clientHeight);
		};
		var jz;
		env.readySteadyResize = function(D){
			if (jz){
				clearInterval(jz);
			}
			
			var oldsize = detectSize(D);
			jz = setInterval(function(){
				if (typeof documentScrollSizeChangeHandler == 'function'){
					var newsize = detectSize(D);
					
					if (oldsize != newsize){
						documentScrollSizeChangeHandler(oldsize = newsize);
					}
					
				}
			},100);
		};
		
		
	}
	
	
	return env;
})(window);
(function(){
	var sensitive_keys = ['vk_token_info', 'dg_auth', 'lfm_scrobble_s', 'lfmsk', 'big_vk_cookie'];
	var parse = function(r_value){
		if (r_value === Object(r_value)){
			return r_value;
		} else if (typeof r_value == 'string'){
			var str_start = r_value.charAt(0),
				str_end   = r_value.charAt(r_value.length - 1);
			if ((str_start == '{' && str_end == '}') || (str_start == '[' && str_end == ']')){
				try {
					r_value = JSON.parse(r_value);
				} catch (e) {
					
				}
			}
			return r_value;
		} else{
			return r_value;
		}
	};
	window.suStore = function(key, value, opts){
		var sensitive = !!key && sensitive_keys.indexOf(key) > -1;
		if (typeof value != 'undefined'){
			if (value && sensitive && app_env.pokki_app){
				value = pokki.scramble(value);
			}

			return w_storage(key, value, opts);
			
		} else{
			
			value =  w_storage(key, value, opts);
			if (sensitive && app_env.pokki_app){
				value = pokki.descramble(value);
			}
			
			return parse(value);
		}
	};
	window.getPreloadedNK = function(key){
		if (app_env.pokki_app){
			var rv = pokki.getScrambled(key);
			if (rv){
				return rv;
			}
		}
		var nk = suStore('preloaded_nk');
		if (nk && nk[key]){
			return nk[key];
		}
		
	};

})();

if (typeof widget != 'object'){
	window.widget = {
		fake_widget: true,
		identifier : 0,
		showNotification: function(){return false;},
		openURL: function(url){
			window.open(url);
		}
	};
}


(function(){
	var openURL;

	if (window.widget && !widget.fake_widget){
		if (widget.openURL){
			openURL = function(){
				return widget.openURL.apply(widget, arguments);
			};
		} else{
			openURL = function(url){
				var link_node = window.document.createElement('a');
					link_node.href = url;
					link_node.click();
			};
		}
		
	} else if (window.pokki && pokki.openURLInDefaultBrowser) {
		openURL = function(){
			return pokki.openURLInDefaultBrowser.apply(pokki, arguments);
		};
	} else {
		openURL = function(url){
			return window.open(url);
		};
	}
	app_env.openURL = openURL;

	if (window.pokki && pokki.showWebSheet){
		app_env.showWebPage = function(url, beforeLoadedCb, error, width, height){
			var beforeLoaded = function(nurl){
				var done = beforeLoadedCb.apply(this, arguments);
				//beforeLoaded func must contain "return true" in it's body 
				if (!done) {
					return true;
				} else{
					return false;
				}
			};
			return pokki.showWebSheet(url, width, height, beforeLoaded, error);
		};
		app_env.hideWebPages = function(){
			return pokki.hideWebSheet();
		};
		app_env.clearWebPageCookies = function(){
			return pokki.clearWebSheetCookies();
		};
	}
	

})();



// Forcing Opera full page reflow/repaint to fix page draw bugs
var forceOperaRepaint = function() {
	if (window.opera) {
		var bs = window.document.body.style;
		bs.position = 'relative';
		setTimeout(function() {
			bs.position = 'static';
		}, 1);
	}
};




if (typeof console != 'object'){
	var console = {};
	
	if  (window.navigator.userAgent.match(/Opera/)){
		console.log = function(){
				opera.postError.apply(opera, arguments);
			
		};
	} else if ((typeof System != "undefined") && System.Debug) {
		console.log = function(text){
			System.Debug.outputString(text);
		};
	} else {
		console.log = function(){};
	}	
}


var handleDocument = function(d) {
	/*
	jsLoadComplete({
		test: function() {

		},
		fn: function() {
			if (window.resizeWindow && d){
				var dw = getDefaultView(d);
				if (dw && dw.window_resized){
					resizeWindow(dw);
				}
				
			}
		};
	});*/
	var
		done,
		dom_opts,
		ui;

	var tryComplete = function() {


		if (!done && ui && dom_opts){
			done = true;
			ui.setDOM(dom_opts);
		}
	};


	jsLoadComplete({
		test: function() {
			return window.connect_dom_to_som && window.jQuery && window.localizer;
		},
		fn: function() {
			connect_dom_to_som(d, function(opts) {
				dom_opts = opts;
				tryComplete();
			});
		}
	});

	jsLoadComplete({
		test: function() {
			return window.su && window.seesu_ui;
		},
		fn: function() {
			var g = new seesu_ui(d, true);
			su.setUI(g);
			ui = g;
			tryComplete();
		}
	});

	jsLoadComplete(function() {
		
		
		//su.createUI(d, true);
	});
	
};