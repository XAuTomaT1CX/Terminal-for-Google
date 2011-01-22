
function Service(args){
	Object.defineProperties(this, {
		id: {value: args.id},
		name: {value: args.name},
		url: {value: args.url},
		icon: {value: args.icon || 'icons/google.png'},
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
		var url, secure = pref.get('secure', true);
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
	var polling = null, pollInterval = 1000 * 60 * 5;
	
	// フィードURL
	var feed = (pref.get('secure', true)? "https://": "http://") +
		"mail.google.com/mail/feed/atom";
	
	// XMLネームスペース
	var ns = function(prefix){
		if(prefix == 'gmail'){
			return 'http://purl.org/atom/ns#';
		}
	};
	
	var checkUnreadCount = function(){
		// TODO
		new HttpRequest({
			url: feed,
			onSuccess: function(args){
				var fullCountNode = args.xml.evaluate(
					"/gmail:feed/gmail:fullcount", args.xml, ns,
					XPathResult.ANY_TYPE, null
				).iterateNext();
				
				if(fullCountNode){
					if(fullCountNode.textContent == '0'){
						badge.gmail = null;
					}else{
						badge.gmail = fullCountNode.textContent;
					}
				}else{
					console.error('Gmail XML Error', args);
				}
			},
			onError: function(e){
				badge.gmail = null;
				console.error('Gmail Error :', e);
			}
		});
	}.bind(this);
	
	// サービスのページが開かれたら未読チェック
	var onTabUpdated = function(tabId, changeInfo, tab){
		var url, secure = pref.get('secure', true);
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
		badge.gmail = null;
		
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


function GoogleReader(){
	var polling = null, pollInterval = 1000 * 60 * 5;
	
	// JSON URL
	var json = (pref.get('secure')? "https://": "http://") +
		"www.google.com/reader/api/0/unread-count?output=json";
	
	var checkUnreadCount = function(){
		// TODO
		new HttpRequest({
			url: json,
			onSuccess: function(args){
				if(args.status != 200){
					console.error('Status Code Error "' + args.status + '"');
					return;
				}
				
				var linkList = args.json.unreadcounts, value = null;
				
				for(var i in linkList){
					if(linkList[i].id.indexOf("reading-list") >= 0){
						value = linkList[i].count.toString();
						break;
					}
				}
				
				badge.reader = value;
			},
			onError: function(e){
				badge.reader = null;
				console.error('Google Reader Error :', e);
			}
		});
	}.bind(this);
	
	// サービスのページが開かれたら未読チェック
	var onTabUpdated = function(tabId, changeInfo, tab){
		var url, secure = pref.get('secure', true);
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


var services = [{
	id: 'gmail',
	name: 'Gmail',
	url: 'mail.google.com/mail',
	icon: 'icons/gmail.png',
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
	icon: 'icons/calendar.png'
}, {
	id: 'reader',
	name: 'Google Reader',
	url: 'www.google.com/reader',
	icon: 'icons/reader.png'
}, {
	id: 'contacts',
	name: 'Contacts',
	url: 'www.google.com/contacts',
	icon: 'icons/contacts.png'
}, {
	id: 'tasks',
	name: 'Tasks',
	url: 'mail.google.com/tasks/canvas',
	icon: 'icons/tasks.png'
}, {
	id: 'docs',
	name: 'Google Docs',
	url: 'docs.google.com',
	icon: 'icons/docs.png'
}, {
	id: 'sites',
	name: 'Google Sites',
	url: 'sites.google.com',
	icon: 'icons/sites.png'
}, {
	id: 'analytics',
	name: 'Analytics',
	url: 'www.google.com/analytics/settings/home',
	icon: 'icons/analytics.png'
}, {
	id: 'tools',
	name: 'Webmaster Tools',
	url: 'www.google.com/webmasters/tools/home',
	icon: 'icons/webmaster.png'
}, {
	id: 'feed',
	name: 'FeedBurner',
	url: 'feedburner.google.com',
	icon: 'icons/feedburner.png'
}, {
	id: 'blog',
	name: 'Blogger',
	url: 'www.blogger.com/home',
	icon: 'icons/blogger.png',
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
}, {
	id: 'appengine',
	name: 'AppEngine',
	url: 'appengine.google.com',
	icon: 'icons/appengine.png'
}, {
	id: 'picasa',
	name: 'Picasa',
	url: 'picasaweb.google.com/home',
	icon: 'icons/picasa.png'
}, {
	id: 'youtube',
	name: 'YouTube',
	url: 'www.youtube.com',
	icon: 'icons/youtube.png'
}, {
	id: 'dashboard',
	name: 'Dashboard',
	url: 'https://www.google.com/dashboard/'
}, {
	id: 'accounts',
	name: 'Accounts',
	url: 'https://www.google.com/accounts/'
}].map(function(args){
	return new Service(args);
});
