
function BadgeManager(){
	this.initialize();
}

BadgeManager.prototype = {
	initialize: function(){
		chrome.browserAction.setBadgeText({text: ""});
		this.values = {};
		this.colors = {};
	},
	setColor: function(id, color){
		this.colors[id] = color;
		if(typeof this.values[id] === 'undefined')
			this.values[id] = null;
	},
	setValue: function(id, value){
		this.values[id] = value;
		this.refresh();
	},
	refresh: function(){
		var value = "";
		var color = [0, 0, 0, 0];
		
		var addColor = function(color1, color2){
			var result = [];
			for(var i = 0; i < 4; i++)
				result.push(Math.min(color1[i] + color2[i], 255));
			return result;
		};
		
		for(var key in this.values) if(this.values.hasOwnProperty(key)){
			if(this.values[key] != null){
				if(value){
					value = '!';
					color = addColor(color, this.colors[key]);
				}else{
					value = this.values[key] + "";
					color = this.colors[key];
				}
			}
		}
		
		if(value){
			chrome.browserAction.setBadgeBackgroundColor({color: color});
			chrome.browserAction.setBadgeText({text: value});
		}else{
			chrome.browserAction.setBadgeText({text: ""});
		}
	},
	getValues: function(){
		return this.values;
	}
};
