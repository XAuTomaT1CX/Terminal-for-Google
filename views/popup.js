
var backgroundPage = chrome.extension.getBackgroundPage();
var pref = backgroundPage.pref;
var badge = backgroundPage.badge;
var services = backgroundPage.services;

window.dataContext = new iggy.ViewModel({
	serviceOrder: {
		value: (function(){
			return services.reduce(function(result, service){
				if(result.indexOf(service.id) === -1)
					result.push(service.id);
				return result;
			}, pref.get('service-order'));
		}())
	},
	_services: {
		value: services.filter(function(service){
			return service.isEnabled;
		}).map(function(service){
			var id = service.id;

			var badgeText = '';
			var badgeCommand = null;

			switch(id){
				case 'plus':
					badgeCommand = new iggy.Command(function(){
						var url = 'plus.google.com/notifications/all';
						openURL(url, function(){
							window.close();
						});
					});
					// わざとbreakしない
				case 'gmail':
				case 'reader':
					badgeText = badge[id] || '';
					if(pref.get('icon-only') && badgeText > 99)
						badgeText = '!';
					break;
				case 'appengine':
					badgeText = pref.get('icon-only')? '?': 'Status';
					badgeCommand = new iggy.Command(function(){
						var url = 'code.google.com/status/appengine';
						openURL(url, function(){
							window.close();
						});
					});
					break;
				case 'urlshortener':
					if(!pref.get('shorten-button-enabled'))
						break;
					badgeText = pref.get('icon-only')? '+': 'Shorten';
					badgeCommand = new iggy.Command(function(){
						shortenURL(function(){
							window.close();
						});
					});
					break;
			}

			return {
				id: id,
				name: service.name,
				image: '/' + service.icon,
				badgeText: badgeText,
				badgeCommand: badgeCommand,
				open: new iggy.Command(function(){
					service.open();
					window.close();
				})
			};
		})
	},
	services: {
		get: function(){
			var order = this.serviceOrder;

			return new iggy.List(this._services.sort(function(a, b){
				return order.indexOf(a.id) - order.indexOf(b.id);
			}));
		}
	},
	_iconOnly: {
		value: pref.get('icon-only')
	},
	iconOnly: {
		get: function(){
			return this._iconOnly;
		}
	},
	_columns: {
		value: pref.get('columns')
	},
	columns: {
		get: function(){
			return this._columns;
		}
	},
	openAppsDashboard: {
		value: new iggy.Command(function(){
			chrome.tabs.create({
				url: 'http://www.google.com/appsstatus',
				selected: true
			}, function(){
				window.close();
			});
		})
	},
	openOptionPage: {
		value: new iggy.Command(function(){
			chrome.tabs.create({
				url: chrome.extension.getURL('/views/option.html'),
				selected: true
			}, function(){
				window.close();
			});
		})
	}
});


function openURL(url, callback){
	url = (pref.get('secure')? 'https://': 'http://') + url;
	chrome.tabs.create({
		url: url,
		selected: true
	}, function(){
		callback();
	});
}


function shortenURL(callback){
	chrome.tabs.getSelected(null, function(tab){
		chrome.tabs.create({
			url: 'http://goo.gl',
			selected: true
		}, function(newTab){
			chrome.tabs.executeScript(newTab.id, {
				code: 'void ' + function(){
					if(window.document &&
						document.readyState === 'complete'){
						a();
					}else{
						window.addEventListener('load', a);
					}
					function a(){
						document.querySelector('#shorten').value =
							"%TAB_URL%";
					}
				}.toString().replace('%TAB_URL%', tab.url) + '()'
			});

			callback();
		});
	});
}

