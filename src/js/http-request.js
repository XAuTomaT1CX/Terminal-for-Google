
function HttpRequest(args){
	var self = this;
	self.url = args.url;
	self.method = args.method || 'GET';
	self.onSuccess = args.onSuccess;
	self.onError = args.onError;
	self.requestTimeout = args.requestTimeout || 1000 * 10;
	
	var xhr = new XMLHttpRequest();
	var timeout;
	
	var handleSuccess = function(result){
		if(timeout){
			window.clearTimeout(timeout);
			timeout = null;
		}
		
		if(self.onSuccess)
			self.onSuccess.call(self, result);
	}
	
	var handleError = function(e){
		if(timeout){
			window.clearTimeout(timeout);
			timeout = null;
		}
		
		if(self.onError)
			self.onError.call(self, e);
	};
	
	timeout = window.setTimeout(function(){
		timeout = null;
		xhr.abort();
		handleError('request time out');
	}, self.requestTimeout);
	
	try{
		xhr.onreadystatechange = function(){
			if(xhr.readyState == 4){
				try{
					handleSuccess({
						get status(){ return xhr.status; },
						get text(){ return xhr.responseText; },
						get json(){ return JSON.parse(xhr.responseText); },
						get xml(){ return xhr.responseXML; }
					});
				}catch(e){
					handleError(e);
				}
			}
		};
		xhr.onerror = function(e){ handleError(e); };
		xhr.open(this.method, this.url, true);
		xhr.send(null);
	}catch(e){
		handleError(e);
	}
}
