
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
	
	if(pref.get(args.id + '-enabled', true)){
		var channel = new MessageChannel();
		channel.port1.postMessage(0);
		channel.port2.onmessage = function(){
			this.enable();
		}.bind(this);
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


var serviceInfo = [{
	id: 'gmail'
}, {
	id: 'calendar',
	name: 'Google Calendar',
	url: 'www.google.com/calendar',
	icon: 'image/goog-cal.png'
}, {
	id: 'reader'
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
}, {
	id: 'music',
	name: 'music beta',
	url: 'music.google.com/music/',
	icon: 'image/goog-music-o.png'
}, {
	id: 'knol',
	name: 'Knol',
	url: 'http://knol.google.com/k',
	icon: 'image/goog-knol.png'
}, {
	id: 'finance',
	name: 'Google finance',
	url: 'www.google.com/finance',
	icon: 'image/goog-finance-g.png'
}, {
	id: 'moderator',
	name: 'Google Moderator',
	url: 'www.google.com/moderator',
	icon: 'image/goog-moderator.png'
}, {
	id: 'books',
	name: 'Google Books',
	url: 'http://books.google.com',
	icon: 'image/goog-books.png'
}, {
	id: 'webstore',
	name: 'Chrome Web\xA0Store',
	url: 'https://chrome.google.com/webstore'
}, {
	id: 'plus'
}];

var services;
function initialize(){
	services = serviceInfo.map(function(args){
		if(args.id === 'gmail'){
			return new Gmail();
		}else if(args.id === 'reader'){
			return new GoogleReader();
		}else if(args.id === 'plus'){
			return new GooglePlus();
		}else{
			return new Service(args);
		}
	});
}
