
var backgroundPage = chrome.extension.getBackgroundPage();
var pref = backgroundPage.pref;
var services = backgroundPage.services;

window.dataContext = new iggy.ViewModel({
	_secure: {
		writable: true,
		value: pref.get('secure')
	},
	secure: {
		get: function(){
			return this._secure;
		},
		set: function(value){
			value = Boolean(value);
			this._secure = value;
			pref.set('secure', value);
			this.dispatchEvent('secure-saved');
		}
	},
	_iconOnly: {
		writable: true,
		value: pref.get('icon-only')
	},
	iconOnly: {
		get: function(){
			return this._iconOnly;
		},
		set: function(value){
			value = Boolean(value);
			this._iconOnly = value;
			pref.set('icon-only', value);
			this.dispatchEvent('icon-only-saved');
		}
	},
	_columns: {
		writable: true,
		value: pref.get('columns')
	},
	columns: {
		get: function(){
			return this._columns;
		},
		set: function(value){
			value = Number(value);
			if(value !== 3 && value !== 4 && value !== 5)
				return;
			this._columns = value;
			pref.set('columns', value);
			this.dispatchEvent('columns-saved');
		}
	},
	_gmailEnabled: {
		writable: true,
		value: pref.get('gmail-enabled')
	},
	gmailEnabled: {
		get: function(){
			return this._gmailEnabled;
		},
		set: function(value){
			value = Boolean(value);
			this._gmailEnabled = value;
			pref.set('gmail-enabled', value);
		}
	},
	gmailDisplay: {
		get: function(){
			return this._gmailEnabled? 'block': 'none';
		}
	},
	_gmailPollEnabled: {
		writable: true,
		value: pref.get('gmail-poll-enabled')
	},
	gmailPollEnabled: {
		get: function(){
			return this._gmailPollEnabled;
		},
		set: function(value){
			value = Boolean(value);
			this._gmailPollEnabled = value;
			pref.set('gmail-poll-enabled', value);
			this.dispatchEvent('gmail-poll-saved');
		}
	},
	_gmailPollInterval: {
		writable: true,
		value: pref.get('gmail-poll-interval')
	},
	gmailPollInterval: {
		get: function(){
			return this._gmailPollInterval;
		},
		set: function(value){
			value = Number(value);
			if(isNaN(value) || value <= 0)
				return;
			this._gmailPollInterval = value;
			pref.set('gmail-poll-interval', value);
			this.dispatchEvent('gmail-poll-saved');
		}
	},
	_readerEnabled: {
		writable: true,
		value: pref.get('reader-enabled')
	},
	readerEnabled: {
		get: function(){
			return this._readerEnabled;
		},
		set: function(value){
			value = Boolean(value);
			this._readerEnabled = value;
			pref.set('reader-enabled', value);
		}
	},
	readerDisplay: {
		get: function(){
			return this._readerEnabled? 'block': 'none';
		}
	},
	_readerPollEnabled: {
		writable: true,
		value: pref.get('reader-poll-enabled')
	},
	readerPollEnabled: {
		get: function(){
			return this._readerPollEnabled;
		},
		set: function(value){
			value = Boolean(value);
			this._readerPollEnabled = value;
			pref.set('reader-poll-enabled', value);
			this.dispatchEvent('reader-poll-saved');
		}
	},
	_readerPollInterval: {
		writable: true,
		value: pref.get('reader-poll-interval')
	},
	readerPollInterval: {
		get: function(){
			return this._readerPollInterval;
		},
		set: function(value){
			value = Number(value);
			if(isNaN(value) || value <= 0)
				return;
			this._readerPollInterval = value;
			pref.set('reader-poll-interval', value);
			this.dispatchEvent('reader-poll-saved');
		}
	},
	_plusEnabled: {
		writable: true,
		value: pref.get('plus-enabled')
	},
	plusEnabled: {
		get: function(){
			return this._plusEnabled;
		},
		set: function(value){
			value = Boolean(value);
			this._plusEnabled = value;
			pref.set('plus-enabled', value);
		}
	},
	plusDisplay: {
		get: function(){
			return this._plusEnabled? 'block': 'none';
		}
	},
	_plusPollEnabled: {
		writable: true,
		value: pref.get('plus-poll-enabled')
	},
	plusPollEnabled: {
		get: function(){
			return this._plusPollEnabled;
		},
		set: function(value){
			value = Boolean(value);
			this._plusPollEnabled = value;
			pref.set('plus-poll-enabled', value);
			this.dispatchEvent('plus-poll-saved');
		}
	},
	_plusPollInterval: {
		writable: true,
		value: pref.get('plus-poll-interval')
	},
	plusPollInterval: {
		get: function(){
			return this._plusPollInterval;
		},
		set: function(value){
			value = Number(value);
			if(isNaN(value) || value <= 0)
				return;
			this._plusPollInterval = value;
			pref.set('plus-poll-interval', value);
			this.dispatchEvent('plus-poll-saved');
		}
	},
	_urlshortenerEnabled: {
		writable: true,
		value: pref.get('urlshortener-enabled')
	},
	urlshortenerEnabled: {
		get: function(){
			return this._urlshortenerEnabled;
		},
		set: function(value){
			value = Boolean(value);
			this._urlshortenerEnabled = value;
			pref.set('urlshortener-enabled', value);
		}
	},
	urlshortenerDisplay: {
		get: function(){
			return this._urlshortenerEnabled? 'block': 'none';
		}
	},
	_shortenButtonEnabled: {
		writable: true,
		value: pref.get('shorten-button-enabled')
	},
	shortenButtonEnabled: {
		get: function(){
			return this._shortenButtonEnabled;
		},
		set: function(value){
			value = Boolean(value);
			this._shortenButtonEnabled = value;
			pref.set('shorten-button-enabled', value);
			this.dispatchEvent('shorten-button-saved');
		}
	},
	_serviceOrder: {
		writable: true,
		value: (function(serviceOrder){
			return services.reduce(function(result, service){
				if(result.indexOf(service.id) === -1)
					result.push(service.id);
				return result;
			}, serviceOrder);
		}(pref.get('service-order', [])))
	},
	serviceOrder: {
		get: function(){
			return this._serviceOrder;
		},
		set: function(value){
			this._serviceOrder = value;
			pref.set('service-order', value);
		}
	},
	services: {
		get: function(){
			var order = this.serviceOrder;

			return services.sort(function(a, b){
				return order.indexOf(a.id) - order.indexOf(b.id);
			}).map(function(service){
				return new iggy.ViewModel({
					_service: {
						value: service
					},
					enabled: {
						value: service.isEnabled
					},
					id: {
						value: service.id
					},
					name: {
						value: service.name
					},
					image: {
						value: '/' + service.icon
					}
				});
			});
		}
	},
	_enabledServices: {
		writable: true,
		value: null
	},
	enabledServices: {
		get: function(){
			if(this._enabledServices)
				return this._enabledServices;

			return new iggy.List(this.services.filter(function(service){
				return service.enabled;
			}), function(list){
				dataContext._enabledServices = list;

				list.onInsert.addListener(function(data){
					data.item._service.enable();

					var serviceOrder = [];
					dataContext.enabledServices.forEach(function(service){
						serviceOrder.push(service.id);
					});
					dataContext.disabledServices.forEach(function(service){
						serviceOrder.push(service.id);
					});
					dataContext.serviceOrder = serviceOrder;
				});
			});
		}
	},
	_disabledServices: {
		writable: true,
		value: null
	},
	disabledServices: {
		get: function(){
			if(this._disabledServices)
				return this._disabledServices;

			return new iggy.List(this.services.filter(function(service){
				return !service.enabled;
			}), function(list){
				dataContext._disabledServices = list;

				list.onInsert.addListener(function(data){
					data.item._service.disable();

					var serviceOrder = [];
					dataContext.enabledServices.forEach(function(service){
						serviceOrder.push(service.id);
					});
					dataContext.disabledServices.forEach(function(service){
						serviceOrder.push(service.id);
					});
					dataContext.serviceOrder = serviceOrder;
				});
			});
		}
	},
	dispatchEvent: {
		value: function(type){
			var event = document.createEvent('Event');
			event.initEvent(type, false, false);
			window.dispatchEvent(event);
		}
	}
});


window.addEventListener('pref-changed', function(event){
	// abc-defをabcDefの形式に変換する
	var key = event.key.replace(/-([a-z])/g, function($0, $1){
		return $1.toUpperCase();
	});

	if(key in window.dataContext){
		window.dataContext['_' + key] = event.value;
		window.dataContext.notifyPropertyChange(key);

		// keyがgmailEnabledやreaderEnabledのようにEnabledで終わる場合
		// EnabledをDisplayに置き換えたプロパティも変更されたと通知する
		if(/Enabled$/.test(key)){
			window.dataContext.notifyPropertyChange(
				key.slice(0, key.lastIndexOf('Enabled')) + 'Display');
		}
	}
});

