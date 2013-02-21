var UserAcquaintance = function() {};
provoda.Model.extendTo(UserAcquaintance, {
	init: function(opts, params) {
		this._super();
		this.sender = params.sender;
		this.user_photo = params.user_photo;
		this.receiver = params.sender;
		//this.current_user = params.current_user;
		this.remainded_date = params.remainded_date;
		this.updateState('remainded_date', params.remainded_date);
		this.accepted = params.accepted;
		this.updateState('user-info', params.info);

		this.current_user_is_sender = params.current_user_is_sender;

		this.updateState('current_user_is_sender', params.current_user_is_sender);
		this.updateState('accepted', params.accepted);
	//	this.update

		//accept_button

		//need_accept b
		//after_request_desc
		//after_accept_desc

		//localize('if-one-accept-i') + ' ' + localize('will-get-link')
		//localize('if-you-accept-one-i') + ' ' + localize('will-get-link')
	},
	complex_states: {
		userlink: {
			depends_on: ['accepted', 'user-info'],
			fn: function(accepted, user_info) {
				if (accepted){
					if (user_info && user_info.full_name && (user_info.domain || user_info.uid)){
						return {
							href: 'http://vk.com/' + user_info.domain,
							text: user_info.full_name
						};
					}
				}
			}
		},
		after_accept_desc: {
			depends_on: ['accepted', 'remainded_date', 'userlink'],
			fn: function(accepted, remainded_date, userlink) {
				if (accepted && !userlink){
					return su.getRemainTimeText(remainded_date, true);
				}
				
			}
		}
	},
	/*
	return localize('if-one-accept-i') + ' ' + localize('will-get-link');
} else {
	return localize('if-you-accept-one-i') + ' ' + localize('will-get-link');
	*/
	acceptInvite: function() {
		var _this = this;
		su.s.api('relations.acceptInvite', {from: this.sender}, function(r){
			if (r.done){
				su.trackEvent('people likes', 'accepted', false, 5);
				_this.updateState('remainded_date', r.done.est);
				if (new Date(r.done.est) < new Date()){
					checkRelationsInvites();
				}
			}
		});
	}
});

var UserAcquaintancesLists = function() {};
mapLevelModel.extendTo(UserAcquaintancesLists, {
	init: function(opts) {
		this._super(opts);
		var _this = this;

		this.app.on('state-change.su-userid', function(e) {
			if (e.value){
				_this.updateState('current_user', e.value);
			}
		});
		var su = this.app;

		su.on('state-change.su-server-api', function(e) {
			if (e.value){
				_this.bindDataSteams();
			}
		});

		

	},
	bindDataSteams: function() {
		if (this.data_st_binded){
			return;
		}
		this.data_st_binded = true;
		var _this = this;
		su.s.susd.rl.regCallback('start-page', function(r){
			_this.replaceChildrenArray('relations-likes', r.done);		
		});
		su.s.susd.ri.regCallback('start-page', function(r){
			_this.replaceChildrenArray('relations-invites', r.done);
		});
	},
	replaceChildrenArray: function(array_name, new_array) {
		if (!this.state('current_user')){
			throw new Error('there is no current_user!');
		}
		var filtered = $filter(new_array, 'item.accepted', function(v){
			return !!v;
		});

		var concated = [].concat(filtered, filtered.not);

		this.removeChildren(array_name);

		for (var i = 0; i < concated.length; i++) {
			var cur = concated[i];
			var user_acq = new UserAcquaintance();
			
			user_acq.init({
				app: this.app
			}, {
				current_user_is_sender: this.state('current_user') == cur.item.from,
				sender: cur.item.from,
				receiver: cur.item.to,
				sended_date: cur.item.ts,
				accepted_date: cur.item.ats,
				remainded_date: cur.item.est,
				accepted: cur.item.accepted,
				info: cur.info,
				user_photo: cur.info && cur.info.photo
			});

			concated[i] = user_acq;
		}
		this.setChild(array_name, concated, true);
	},
	removeChildren: function(array_name) {

	}
});