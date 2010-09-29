
function Service(args){
	this.id = args.id;
	this.name = args.name;
	this.url = args.url;
	this.icon = args.icon || 'icons/google.png';
	
	this.setSecure(true);
	this.setEnabled(true);
	
	this.onInitialize = args.onInitialize;
	
	this.scheduleManager = null;
	this.contextMenuManager = null;
	this.badgeManager = null;
}

Service.prototype = {
	initialize: function(man){
		if(this.enabled && this.onInitialize)
			this.onInitialize(man);
	},
	open: function(){
		var self = this;
		chrome.tabs.getAllInWindow(null, function(tabs){
			for(var i = 0, tab; tab = tabs[i]; i++){
				if(tab.url && self.checkUrl(tab.url)){
					chrome.tabs.update(tab.id, {selected: true});
					return;
				}
			}
			
			chrome.tabs.create({url: self.fullUrl, selected: true});
		});
	},
	checkUrl: function(url){
		if(url.indexOf(this.fullUrl) != 0)
			return false;
		
		return (url.length == this.fullUrl.length) ||
			(url[this.fullUrl.length] == '?') ||
			(url[this.fullUrl.length] == '#') ||
			(url[this.fullUrl.length] == '/');
	},
	getInfo: function(){
		return {
			id: this.id,
			name: this.name,
			url: this.url,
			icon: this.icon,
			secure: this.secure,
			enabled: this.enabled
		};
	},
	getSecure: function(){
		return this.secure;
	},
	setSecure: function(value){
		var url = this.url;
		this.secure = value? true: false;
		if(/^https?:\/\//.test(url))
			this.fullUrl = this.url;
		else
			this.fullUrl = (value? 'https://': 'http://') + url;
	},
	getEnabled: function(){
		return this.enabled;
	},
	setEnabled: function(value){
		return this.enabled = (value? true: false);
	}
};


function ServiceManager(services){
	this.initialized = false;
	this.services = services;
	
	this.scheduleManager = new ScheduleManager();
	this.contextMenuManager = new ContextMenuManager();
	this.badgeManager = new BadgeManager();
}

ServiceManager.prototype = {
	initialize: function(isEnabled, isSecure){
		this.scheduleManager.initialize();
		this.contextMenuManager.initialize();
		this.badgeManager.initialize();
		
		this.allService = {};
		this.allServiceInfo = [];
		
		var self = this;
		this.services.forEach(function(service){
			service.setSecure(isSecure(service.id));
			service.setEnabled(isEnabled(service.id));
			
			service.scheduleManager = self.scheduleManager;
			service.contextMenuManager = self.contextMenuManager;
			service.badgeManager = self.badgeManager;
			
			service.initialize(self);
			
			self.allService[service.id] = service;
			self.allServiceInfo.push(service.getInfo());
		});
		
		this.contextMenuManager.createAllMenus();
		
		this.initialized = true;
	},
	getAllServiceInfo: function(){
		if(this.initialized)
			return this.allServiceInfo;
		throw 'ServiceManager is not initialized.';
	},
	openService: function(id){
		if(id in this.allService)
			this.allService[id].open();
		else
			throw 'Service which id is ' + id + ' do not exists.';
	}
};


var ServiceList = [
	new Service({
		id: 'gmail',
		name: 'Gmail',
		url: 'mail.google.com/mail',
		icon: 'icons/gmail.png',
		onInitialize: function(man){
			var self = this;
			
			// Badge
			man.badgeManager.setColor(self.id, [208, 0, 24, 255]);
			var setBadge = function(value){
				man.badgeManager.setValue(self.id, (value == 0)? null: value);
			};
			
			// Context Menus
			man.contextMenuManager.createMenu({
				title: 'Mail This Page',
				context: 'page',
				action: 'gmail'
			});
			man.contextMenuManager.createMenu({
				title: 'Mail This Link',
				context: 'link',
				action: 'gmail'
			});
			man.contextMenuManager.createMenu({
				title: 'Mail This Text',
				context: 'selection',
				action: 'gmail'
			});
			
			// Check Unread Count
			var feed = (self.getSecure()? "https://": "http://") +
				"mail.google.com/mail/feed/atom";
				//"mail.google.com/" + (domain || "mail") + "/feed/atom";
			var ns = function(prefix){
				if(prefix == 'gmail')
					return 'http://purl.org/atom/ns#';
			};
			var requestFailureCount = 0;
			var checkUnreadCount = function(){
				new HttpRequest({
					url: feed,
					onSuccess: function(args){
						var fullCountSet = args.xml.evaluate(
							"/gmail:feed/gmail:fullcount", args.xml, ns,
							XPathResult.ANY_TYPE, null
						);
						var fullCountNode = fullCountSet.iterateNext();
						
						if(fullCountNode){
							setBadge(fullCountNode.textContent);
							requestFailureCount = 0;
						}else{
							throw 'XML Error';
						}
					},
					onError: function(e){
						setBadge(null);
						requestFailureCount += 1;
						console.error('Gmail Error :', e);
					}
				});
			};
			
			// Schedule to Check Unread Count
			var pollInterval = {min: 1000 * 60, max: 1000 * 60 * 30};
			var getInterval = function(){
				var exponent = Math.pow(2, requestFailureCount + 1);
				return Math.round(Math.min(
					Math.random() * pollInterval.min * exponent,
					pollInterval.max
				));
			};
			var checkUnreadCountTask = function(){
				if(!self.getEnabled())
					return;
				checkUnreadCount();
				man.scheduleManager.set(
					self.id, getInterval(), checkUnreadCountTask);
			};
			
			// Listen to Tabs Updated
			if(!self.tabUpdatedListener){
				self.tabUpdatedListener = function(tabId, changeInfo){
					if(self.getEnabled()){
						self.onTabUpdated(tabId, changeInfo);
					}else{
						chrome.tabs.onUpdated.removeListener(
							self.tabUpdatedListener);
					}
				};
			}
			this.onTabUpdated = function(tabId, changeInfo){
				if(changeInfo.url && self.checkUrl(changeInfo.url))
					checkUnreadCount();
			};
			if(!chrome.tabs.onUpdated.hasListener(self.tabUpdatedListener))
				chrome.tabs.onUpdated.addListener(self.tabUpdatedListener);
			
			checkUnreadCountTask();
		}
	}),
	new Service({
		id: 'calendar',
		name: 'Google Calendar',
		url: 'www.google.com/calendar',
		icon: 'icons/calendar.png'
	}),
	new Service({
		id: 'reader',
		name: 'Google Reader',
		url: 'www.google.com/reader',
		icon: 'icons/reader.png',
		onInitialize: function(man){
			var self = this;
			
			// Badge
			man.badgeManager.setColor(self.id, [0, 24, 208, 255]);
			var setBadge = function(value){
				man.badgeManager.setValue(self.id, (value == 0)? null: value);
			};
			
			// Check Unread Count
			var feed = (self.secure? "https://": "http://") +
				"www.google.com/reader/api/0/unread-count?output=json";
			var checkUnreadCount = function(){
				new HttpRequest({
					url: feed,
					onSuccess: function(args){
						if(args.status != 200)
							throw 'Status Code Error "' + args.status + '"';
						var linkList = args.json.unreadcounts;
						for(var i in linkList){
							if(linkList[i].id.indexOf("reading-list") >= 0){
								setBadge(linkList[i].count.toString());
								return;
							}
						}
						setBadge(null);
					},
					onError: function(e){
						setBadge(null);
						console.error('Google Reader Error :', e);
					}
				});
			};
			
			// Schedule to Check Unread Count
			var checkUnreadCountTask = function(){
				if(!self.getEnabled())
					return;
				checkUnreadCount();
				man.scheduleManager.set(
					self.id, 1000 * 60 * 3, checkUnreadCountTask);
			};
			
			// Listen to Tabs Updated
			if(!self.tabUpdatedListener){
				self.tabUpdatedListener = function(tabId, changeInfo){
					if(self.getEnabled()){
						self.onTabUpdated(tabId, changeInfo);
					}else{
						chrome.tabs.onUpdated.removeListener(
							self.tabUpdatedListener);
					}
				};
			}
			this.onTabUpdated = function(tabId, changeInfo){
				if(changeInfo.url && self.checkUrl(changeInfo.url))
					checkUnreadCount();
			};
			if(!chrome.tabs.onUpdated.hasListener(self.tabUpdatedListener))
				chrome.tabs.onUpdated.addListener(self.tabUpdatedListener);
			
			checkUnreadCountTask();
		}
	}),
	new Service({
		id: 'contacts',
		name: 'Contacts',
		url: 'www.google.com/contacts',
		icon: 'icons/contacts.png'
	}),
	new Service({
		id: 'tasks',
		name: 'Tasks',
		url: 'mail.google.com/tasks/canvas',
		icon: 'icons/tasks.png'
	}),
	new Service({
		id: 'docs',
		name: 'Google Docs',
		url: 'docs.google.com',
		icon: 'icons/docs.png'
	}),
	new Service({
		id: 'sites',
		name: 'Google Sites',
		url: 'sites.google.com',
		icon: 'icons/sites.png'
	}),
	new Service({
		id: 'analytics',
		name: 'Analytics',
		url: 'www.google.com/analytics/settings/home',
		icon: 'icons/analytics.png'
	}),
	new Service({
		id: 'tools',
		name: 'Webmaster Tools',
		url: 'www.google.com/webmasters/tools/home',
		icon: 'icons/webmaster.png'
	}),
	new Service({
		id: 'feed',
		name: 'FeedBurner',
		url: 'feedburner.google.com',
		icon: 'icons/feedburner.png'
	}),
	new Service({
		id: 'blog',
		name: 'Blogger',
		url: 'www.blogger.com/home',
		icon: 'icons/blogger.png',
		onInitialize: function(man){
			man.contextMenuManager.createMenu({
				title: 'Blog This Page',
				context: 'page',
				action: 'blogger'
			});
			man.contextMenuManager.createMenu({
				title: 'Blog This Link',
				context: 'link',
				action: 'blogger'
			});
			man.contextMenuManager.createMenu({
				title: 'Blog This Text',
				context: 'selection',
				action: 'blogger'
			});
		}
	}),
	new Service({
		id: 'adsense',
		name: 'Adsense',
		url: 'www.google.com/adsense',
	}),
	new Service({
		id: 'appengine',
		name: 'AppEngine',
		url: 'appengine.google.com',
		icon: 'icons/appengine.png'
	}),
	new Service({
		id: 'picasa',
		name: 'Picasa',
		url: 'picasaweb.google.com/home',
		icon: 'icons/picasa.png'
	}),
	new Service({
		id: 'youtube',
		name: 'YouTube',
		url: 'www.youtube.com',
		icon: 'icons/youtube.png'
	})
];

