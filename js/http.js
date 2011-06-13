
function httpRequest(args){
	var url = args.url,
		method = args.method || 'GET',
		requestTimeout = args.requestTimeout || 1000 * 60,
		responseType = args.responseType || 'text',
		onSuccess = args.onSuccess,
		onError = args.onError;
	
	var handleError = function(e){
		if(timeout){
			clearTimeout(timeout);
		}
		
		if(onError){
			onError(e);
		}else{
			console.error(e)
		}
	};
	
	var xhr = new XMLHttpRequest();
	
	var timeout = setTimeout(function(){
		timeout = null;
		xhr.abort();
		handleError('Request Timeout (' + method + ' ' + url + ')');
	}, requestTimeout);
	
	xhr.onerror = handleError;
	xhr.onreadystatechange = function(){
		if(xhr.readyState === 4){
			if(xhr.status !== 200){
				clearTimeout(timeout);
				timeout = null;
				return;
			}
			
			try{
				var response = null;
				
				if(responseType === 'json'){
					response = JSON.parse(xhr.responseText);
				}else if(responseType === 'xml'){
					response = xhr.responseXML;
				}else if(responseType === 'text'){
					response = xhr.responseText;
				}
				
				if(timeout){
					clearTimeout(timeout);
				}
				
				if(onSuccess){
					onSuccess(response, xhr);
				}
			}catch(e){
				handleError(e);
			}
		}
	};
	
	xhr.open(method, url, true);
	xhr.send(null);
}
