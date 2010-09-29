
function ContextMenuManager(){
	this.initialize();
}

ContextMenuManager.prototype = {
	initialize: function(){
		chrome.contextMenus.removeAll();
		this.contexts = {};
		this.menus = [];
	},
	createMenu: function(args){
		var type = args.type || 'normal';
		var title = args.title;
		var context = args.context;
		var itemAction = args.action;
		
		this.contexts[context] = true;
		
		this.menus.push({
			type: type,
			title: title,
			contexts: [context],
			onclick: function(info, tab){
				chrome.tabs.sendRequest(tab.id, {
					action: itemAction,
					info: info,
					tab: tab
				});
			}
		});
	},
	createAllMenus: function(){
		var contexts = [];
		
		for(var context in this.contexts){
			if(this.contexts[context] === true)
				contexts.push(context);
		} 
		
		if(contexts.length == 0)
			return;
		
		var rootMenuId = chrome.contextMenus.create({
			title: 'Google Terminal',
			contexts: contexts
		});
		
		this.menus.forEach(function(menuInfo){
			menuInfo.parentId = rootMenuId;
			chrome.contextMenus.create(menuInfo);
		});
	}
};
