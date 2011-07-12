
function Service(args){
	Object.defineProperties(this, {
		id: {value: args.id},
		name: {value: args.name},
		url: {value: args.url},
		icon: {value: args.icon || 'image/goog-logo.png'},
		menus: {value: args.menus || []},
		urlContainsScheme: {value: /^[a-z]+:/.test(args.url)},
		onEnabled: {value: []},
		onDisabled: {value: []},
		isEnabled: {value: false, writable: true},
		menuIds: {value: [], writable: true}
	});
	
	if(args.id === 'gmail'){
		Gmail.call(this);
	}else if(args.id === 'reader'){
		GoogleReader.call(this);
	}
	
	if(pref.get(args.id + '-enabled', true)){
		this.enable();
	}
	
	// コンテキストメニューを削除
	if(args.menus && args.menus.length > 0){
		window.addEventListener('unload', function(){
			this.menuIds.forEach(function(menuId){
				chrome.contextMenus.remove(menuId);
			});
		}.bind(this), false);
	}
}

Object.defineProperties(Service.prototype, {
	enable: {value: function(){
		if(this.isEnabled){
			return;
		}
		
		this.isEnabled = true;
		pref.set(this.id + '-enabled', true);
		
		// コンテキストメニューを作成
		this.menuIds = this.menus.map(function(menu){
			return chrome.contextMenus.create({
				type: menu.type || 'normal',
				title: menu.title,
				contexts: [menu.context],
				onclick: function(info, tab){
					chrome.tabs.sendRequest(tab.id, {
						action: menu.action,
						info: info,
						tab: tab
					});
				}
			});
		});
		
		this.onEnabled.forEach(function(onEnabled){
			onEnabled.call(this);
		}, this);
	}},
	disable: {value: function(){
		if(!this.isEnabled){
			return;
		}
		
		this.isEnabled = false;
		pref.set(this.id + '-enabled', false);
		
		// コンテキストメニューを削除
		this.menuIds.forEach(function(menuId){
			chrome.contextMenus.remove(menuId);
		});
		this.menuIds = [];
		
		this.onDisabled.forEach(function(onDisabled){
			onDisabled.call(this);
		}, this);
	}},
	open: {value: function(){
		var url, secure = pref.get('secure');
		if(this.urlContainsScheme){
			url = this.url;
		}else{
			url = (secure? 'https://': 'http://') + this.url;
		}
		
		chrome.tabs.getAllInWindow(null, function(tabs){
			for(var i = 0, tab; tab = tabs[i]; i++){
				if(tab.url && tab.url.indexOf(url) === 0){
					chrome.tabs.update(tab.id, {selected: true});
					return;
				}
			}
			chrome.tabs.create({url: url, selected: true});
		}.bind(this));
	}}
});


function Gmail(){
	// フィードURL
	var feed = (pref.get('secure')? "https://": "http://") +
		"mail.google.com/mail/feed/atom";
	
	// XMLネームスペース
	var path = '/gmail:feed/gmail:fullcount';
	var ns = function(prefix){
		if(prefix == 'gmail'){
			return 'http://purl.org/atom/ns#';
		}
	};
	
	var checkUnreadCount = function(){
		httpRequest({
			url: feed,
			responseType: 'xml',
			onSuccess: function(xml, xhr){
				var node = xml.evaluate(path, xml, ns, XPathResult.ANY_TYPE, null).iterateNext();
				
				if(node){
					badge.gmail = node.textContent;
				}else{
					console.error('Gmail XML Error', xml);
				}
			},
			onError: function(e){
				badge.gmail = 0;
				console.error('Gmail', e);
			}
		});
	}.bind(this);
	
	// サービスのページが開かれたら未読チェック
	var onTabUpdated = function(tabId, changeInfo, tab){
		var url, secure = pref.get('secure');
		if(this.urlContainsScheme){
			url = this.url;
		}else{
			url = (secure? 'https://': 'http://') + this.url;
		}
		
		if(tab.url && tab.url.indexOf(url) === 0){
			checkUnreadCount();
		}
	}.bind(this);
	
	this.onEnabled.push(function(){
		if(pref.get('gmail-poll-enabled'))
			startPolling();
	});

	this.onDisabled.push(function(){
		stopPolling();
	});

	pref.onPropertyChange.addListener(function(key, value){
		if(!this.isEnabled)
			return;

		if(key === 'gmail-poll-interval'){
			stopPolling();
			startPolling();
		}else if(key === 'gmail-poll-enabled'){
			if(value)
				startPolling();
			else
				stopPolling();
		}
	}.bind(this));


	var polling = null;

	// 未読チェックを開始
	function startPolling(){
		if(polling)
			return;

		checkUnreadCount();

		var interval = Number(pref.get('gmail-poll-interval')) ||
			1000 * 60 * 5;
		polling = setInterval(checkUnreadCount, interval);

		// タブを監視する
		chrome.tabs.onUpdated.addListener(onTabUpdated);
	}

	// 未読チェックを終了
	function stopPolling(){
		if(!polling)
			return;

		// タブの監視を外す
		chrome.tabs.onUpdated.removeListener(onTabUpdated);

		clearInterval(polling);
		polling = null;

		// バッジを非表示に
		badge.gmail = null;
	}
}


function GoogleReader(){
	var polling = null, pollInterval = 1000 * 60 * 5;
	
	// JSON URL
	var json = (pref.get('secure')? "https://": "http://") +
		"www.google.com/reader/api/0/unread-count?output=json";
	
	var checkUnreadCount = function(){
		httpRequest({
			url: json,
			responseType: 'json',
			onSuccess: function(json, xhr){
				var links = json.unreadcounts, value = 0, i;
				
				for(i in links){
					if(links[i].id.indexOf("reading-list") >= 0){
						value = links[i].count.toString();
						break;
					}
				}
				
				badge.reader = value;
			},
			onError: function(e){
				badge.reader = 0;
				console.error('Google Reader', e);
			}
		});
	}.bind(this);
	
	// サービスのページが開かれたら未読チェック
	var onTabUpdated = function(tabId, changeInfo, tab){
		var url, secure = pref.get('secure');
		if(this.urlContainsScheme){
			url = this.url;
		}else{
			url = (secure? 'https://': 'http://') + this.url;
		}
		
		if(tab.url && tab.url.indexOf(url) === 0){
			checkUnreadCount();
		}
	}.bind(this);
	
	this.onEnabled.push(function(){
		checkUnreadCount();
		
		// 未読チェックを開始
		polling = setInterval(function(){
			checkUnreadCount();
		}, pollInterval);
		
		// タブを監視する
		if(!chrome.tabs.onUpdated.hasListener(onTabUpdated)){
			chrome.tabs.onUpdated.addListener(onTabUpdated);
		}
	});
	
	this.onDisabled.push(function(){
		badge.reader = null;
		
		// 未読チェックを終了
		if(polling){
			clearInterval(polling);
			polling = null;
		}
		
		// タブの監視を外す
		if(chrome.tabs.onUpdated.hasListener(onTabUpdated)){
			chrome.tabs.onUpdated.removeListener(onTabUpdated)
		}
	});
}


var serviceInfo = [{
	id: 'gmail',
	name: 'Gmail',
	url: 'mail.google.com/mail',
	icon: 'image/goog-mail.png',
	menus: [{
		title: 'Mail This Page',
		context: 'page',
		action: 'gmail'
	}, {
		title: 'Mail This Link',
		context: 'link',
		action: 'gmail'
	}, {
		title: 'Mail This Text',
		context: 'selection',
		action: 'gmail'
	}]
}, {
	id: 'calendar',
	name: 'Google Calendar',
	url: 'www.google.com/calendar',
	icon: 'image/goog-cal.png'
}, {
	id: 'reader',
	name: 'Google Reader',
	url: 'www.google.com/reader',
	icon: 'image/goog-reader.png'
}, {
	id: 'contacts',
	name: 'Contacts',
	url: 'www.google.com/contacts',
	icon: 'image/goog-contacts.png'
}, {
	id: 'tasks',
	name: 'Tasks',
	url: 'mail.google.com/tasks/canvas',
	icon: 'image/goog-tasks.png'
}, {
	id: 'docs',
	name: 'Google Docs',
	url: 'docs.google.com',
	icon: 'image/goog-docs.png'
}, {
	id: 'sites',
	name: 'Google Sites',
	url: 'sites.google.com',
	icon: 'image/goog-sites.png'
}, {
	id: 'analytics',
	name: 'Analytics',
	url: 'www.google.com/analytics/settings/home',
	icon: 'image/goog-analytics.png'
}, {
	id: 'tools',
	name: 'Webmaster Tools',
	url: 'www.google.com/webmasters/tools/home',
	icon: 'image/goog-webmaster.png'
}, {
	id: 'feed',
	name: 'FeedBurner',
	url: 'feedburner.google.com',
	icon: 'image/goog-feedburner.png'
}, {
	id: 'blog',
	name: 'Blogger',
	url: 'www.blogger.com/home',
	icon: 'image/goog-blogger.png',
	menus: [{
		title: 'Blog This Page',
		context: 'page',
		action: 'blogger'
	}, {
		title: 'Blog This Link',
		context: 'link',
		action: 'blogger'
	}, {
		title: 'Blog This Text',
		context: 'selection',
		action: 'blogger'
	}]
}, {
	id: 'adsense',
	name: 'Adsense',
	url: 'www.google.com/adsense',
	icon: 'image/goog-adsense-old.png'
}, {
	id: 'appengine',
	name: 'AppEngine',
	url: 'appengine.google.com',
	icon: 'image/goog-app-engine.png'
}, {
	id: 'picasa',
	name: 'Picasa',
	url: 'picasaweb.google.com/home',
	icon: 'image/goog-picasa.png'
}, {
	id: 'youtube',
	name: 'YouTube',
	url: 'www.youtube.com',
	icon: 'image/goog-you-tube.png'
}, {
	id: 'dashboard',
	name: 'Dashboard',
	url: 'https://www.google.com/dashboard/'
}, {
	id: 'accounts',
	name: 'Accounts',
	url: 'https://www.google.com/accounts/',
	icon: 'image/goog-account-settings.png'
}, {
	id: 'news',
	name: 'Google News',
	url: 'news.google.com',
	icon: 'image/goog-news.png'
}, {
	id: 'maps',
	name: 'Google Maps',
	url: 'maps.google.com',
	icon: 'image/goog-maps.png'
}, {
	id: 'android',
	name: 'Android Market',
	url: 'https://market.android.com/',
	icon: 'image/goog-android-market.png'
}, {
	id: 'groups',
	name: 'Google Groups',
	url: 'groups.google.com',
	icon: 'image/goog-groups-old.png'
}, {
	id: 'igoogle',
	name: 'iGoogle',
	url: 'http://www.google.com/ig',
	icon: 'image/goog-igoogle-old.png'
}, {
	id: 'notebook',
	name: 'Google Notebook',
	url: 'www.google.com/notebook/',
	icon: 'image/goog-notebook.png'
}, {
	id: 'translate',
	name: 'Google Translate',
	url: 'http://translate.google.com/',
	icon: 'image/goog-translate.png'
}, {
	id: 'voice',
	name: 'Google Voice',
	url: 'http://www.google.com/voice',
	icon: 'image/goog-voice-new.png'
}, {
	id: 'bookmarks',
	name: 'Google Bookmarks',
	url: 'http://www.google.com/bookmarks',
	icon: 'image/goog-bookmarks.png'
}, {
	id: 'urlshortener',
	name: 'Google URL Shortener',
	url: 'http://goo.gl'
}];

var services;
function initialize(){
	services = serviceInfo.map(function(args){
		return new Service(args);
	});
}
