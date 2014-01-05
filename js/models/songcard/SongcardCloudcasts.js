define(['spv', 'app_serv', 'js/libs/BrowseMap', '../SongsList', '../LoadableList'],
function(spv, app_serv, BrowseMap, SongsList, LoadableList) {
"use strict";
var localize = app_serv.localize;

//http://api.mixcloud.com/track/michael-jackson/smooth-criminal-acapella/?metadata=1
//Cloudcast
//CloudcastsList (extends PlaylistsList)
//limit and offset





var raw_testmap_data = {
	topalbums: {
		album: {
			artist: {
				name: "The Killers"
			},
			name: "Shiny Album",
			image: [55, 14],
			"555": 'number',
			"1466": 'value',
			playcount: 10024,
			images: [
				{
					artist_name: "The Killers",
					track_name: "Just a test"
				}, {
					artist_name: "Beastie Boys",
					track_name: "Another Track Name"
				}
			]
		}
	}
};

var map = {

	source: 'topalbums.album',

	props_map: {
		album_artist: 'artist.name',
		album_name: 'name',
		lfm_image: {
			array: 'image',
			justatest: {
				deep: '555',
				wrong: {
					realy_deep: '1466'
				}
			}
		},
		playcount: 'playcount'
	},

	parts_map: {
		'lfm_image.real_array': {
			source: 'images',
			props_map: {
				common_time_stamp: '#smile',
				album_name: '^name',
				artist_name: 'artist_name',
				track: {
					name: 'track_name'
				}
			}
		}
	}

};




var Cloudcast = function() {};
SongsList.extendTo(Cloudcast, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		spv.cloneObj(this.init_states, params);
		this.initStates();
	},
	datamorph_map: new spv.MorphMap({
		source: 'sections',
		props_map: {
			artist: 'track.artist.name',
			track: 'track.name'
		}
	}),
	getRqData: function() {
		return this.state('key');
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		var _this = this;

		request_info.request = $.ajax({
			url: 'https://api.mixcloud.com/' + this.getRqData(),
			dataType: "json"
		})
			.done(function(r){
				var list = _this.datamorph_map.execute(r);
				_this.putRequestedData(request_info.request, list, r.error);
				if (!r.error) {
					_this.setLoaderFinish();
				}
			});
			
	}

});

var TrackCloudcastsList = function() {};
LoadableList.extendTo(TrackCloudcastsList, {
	model_name: 'cloudcasts_list',
	init: function(opts, params) {
		this._super(opts);
		this.sub_pa_params = params;
		spv.cloneObj(this.init_states, params);
		this.initStates();
	},
	subitemConstr: Cloudcast,
	datamorph_map: new spv.MorphMap({
		source: 'data',
		props_map: {
			nav_title: 'name',
			key: 'key'
		}
	}),
	getRqData: function() {
		return ['track', this.state('artist_key'), this.state('track_key'), this.tcl_type].join('/') + '/';
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		var _this = this;

		request_info.request = $.ajax({
			url: 'https://api.mixcloud.com/' + this.getRqData(),
			dataType: "json"
		})
			.done(function(r){
				var list = _this.datamorph_map.execute(r);
				_this.putRequestedData(request_info.request, list, r.error);
			});
			
	}

});


var TrackCloudcastsNew = function() {};
TrackCloudcastsList.extendTo(TrackCloudcastsNew, {
	tcl_type: 'new'
});
var TrackCloudcastsPopular = function() {};
TrackCloudcastsList.extendTo(TrackCloudcastsPopular, {
	tcl_type: 'popular'
});
var TrackCloudcastsHot = function() {};
TrackCloudcastsList.extendTo(TrackCloudcastsHot, {
	tcl_type: 'hot'
});



var reg_replace_only_this_range = /[\u0000-\u0080]+/g;
var reg_replace = /[^a-zA-Z0-9_-]/g;
var replaceFunc = function(matched){
	return matched.replace(reg_replace, '');
};

var getMixcloudNameKey = function(string) {
	return string
		.toLowerCase()
		.replace(/\s/g, '-')
		.replace(reg_replace_only_this_range, replaceFunc)
		.replace(/-+/g, '-');

};

var SongcardCloudcasts = function() {};
BrowseMap.Model.extendTo(SongcardCloudcasts, {
	init: function(opts, params) {
		this._super(opts);

		var sub_pa_params = {};
		spv.cloneObj(sub_pa_params, params);
		spv.cloneObj(sub_pa_params, {
			artist_key: getMixcloudNameKey(params.artist_name),
			track_key: getMixcloudNameKey(params.track_name)
		});

		this.sub_pa_params = sub_pa_params;

		spv.cloneObj(this.init_states, params);
		this.initStates();




		this.lists_list = ['new', 'hot', 'popular'];
		this.initSubPages(this.lists_list);

		//this.initItems(this.lists_list, {app:this.app, map_parent:this}, {tag_name:this.tag_name});

		this.updateNesting('lists_list', this.lists_list);
		this.bindChildrenPreload();

		//this.tag_name = params.tag_name;
	},
/*	getRqData: function() {
		return {
			artist: this.state('artist_name'),
			track: this.state('track_name')
		};
	},*/
	model_name: 'songcard_cloudcasts',
	sub_pa: {
		'new': {
			constr: TrackCloudcastsNew,
			title: 'New'
		},
		'hot': {
			constr: TrackCloudcastsHot,
			title: 'Hot'
		},
		'popular': {
			constr: TrackCloudcastsPopular,
			title: 'Popular'
		},
	}
});

/*
var SongsLists = function() {};
BrowseMap.Model.extendTo(SongsLists, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;
		this.initStates();

		this.sub_pa_params = {tag_name:this.tag_name};
		this.lists_list = ['_', 'free', 'trending_exfm', 'explore_exfm',
			'blogged', 'blogged?fav_from=25&fav_to=250', 'blogged?fav_from=250&fav_to=100000'];
		this.initSubPages(this.lists_list);

		//this.initItems(this.lists_list, {app:this.app, map_parent:this}, {tag_name:this.tag_name});

		this.updateNesting('lists_list', this.lists_list);
		this.bindChildrenPreload();
	},
	model_name: 'tag_songs',
	sub_pa: {
		'_': {
			constr: TopTagSongs,
			title: localize('Top')
		},
		'free': {
			constr: FreeTagSongs,
			title: localize('Free-songs')
		},
		'trending_exfm': {
			constr: TrendingTagSongs,
			title: localize('Trending-songs-exfm')
		},
		'explore_exfm': {
			constr: ExplorableTagSongs,
			title: localize('Explore-songs-exfm')
		},
		'blogged': {
			constr: AllHypemTagSongs,
			title: localize('Blogged-all-hypem')
		},
		'blogged?fav_from=25&fav_to=250': {
			constr: Fav25HypemTagSongs,
			title: localize('Blogged-25-hypem')
		},
		'blogged?fav_from=250&fav_to=100000': {
			constr: Fav250HypemTagSongs,
			title: localize('Blogged-250-hypem')
		}
	}
});

*/
return SongcardCloudcasts;

});