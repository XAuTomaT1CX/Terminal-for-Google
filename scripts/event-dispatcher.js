
function EventDispatcher(owner, port){
	var listeners = this._listeners = [];

	if(!port.onmessage)
		port.onmessage = function(){};

	port.addEventListener('message', function(event){
		listeners.forEach(function(listener){
			listener.call(owner, event.data);
		});
	});
}

EventDispatcher.prototype.addListener = function(listener){
	this._listeners.push(listener);
};

EventDispatcher.prototype.removeListener = function(listener){
	var index = this._listeners.indexOf(listener);
	if(index !== -1)
		delete this._listeners[index];
};

EventDispatcher.prototype.hasListener = function(listener){
	var index = this._listeners.indexOf(listener);
	return index !== -1;
};

