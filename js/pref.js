// Preference Class

function Preference(args){
	var prefix = args.prefix || '';
	var suffix = args.suffix || '';
	var storage = args.storage || localStorage;
	var cache = {};
	var listeners = [];
	
	this.get = function(key, defaultValue){
		key = prefix + key + suffix;
		var result;
		if(key in cache){
			result = cache[key];
		}else{
			var jsonString = storage[key];
			if(jsonString)
				result = JSON.parse(jsonString);
		}
		if(typeof result === 'undefined')
			result = defaultValue;
		return result;
	};
	
	this.set = function(key, value){
		var key_ = prefix + key + suffix;
		storage[key_] = JSON.stringify(cache[key_] = value);
		listeners.forEach(function(listener){
			listener.call(null, key, value, pref);
		});
		return value;
	};
	
	this.setDefault = function(key, value){
		var result = this.get(key);
		if(typeof result === 'undefined')
			result = this.set(key, value);
		return result;
	}
	
	this.onPropertyChange = {
		addListener: function(listener){
			listeners.push(listener);
		},
		removeListener: function(listener){
			var i = listeners.indexOf(listener);
			if(i !== -1){
				listeners.splice(i, 1);
			}
		},
		hasListener: function(listener){
			return listeners.indexOf(listener) !== -1;
		}
	};
}
