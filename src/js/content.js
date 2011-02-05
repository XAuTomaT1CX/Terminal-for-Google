
// コンテキストメニューを表示したリンク要素のURLを取得する関数
var resolveLinkUrl = (function(){
	var linkStore;
	
	document.addEventListener('contextmenu', function(e){
		var t = e.target;
		if(t.tagName === 'A'){
			linkStore = {text: t.textContent, url: t.href};
		}
	}, false);
	
	return function(url){
		if(linkStore && linkStore.url == url){
			return linkStore.text;
		}
		
		alert('Failed at getting link information.', 'Terminal for Google');
		throw 'Failed at getting link information.'
	};
})();


var actions = {};


// Gmailにシェアする
actions.gmail = function(info, tab){
	var u = 'https://mail.google.com/mail/?view=cm&fs=1&tf=1';
	
	if(info.selectionText){
		u += '&su=' + encodeURIComponent(tab.title || '') +
			'&body=' + encodeURIComponent(info.selectionText);
	}else if(info.linkUrl){
		u += '&su=' + encodeURIComponent(resolveLinkUrl(info.linkUrl)) +
			'&body=' + encodeURIComponent(info.linkUrl);
	}else{
		u += '&su=' + encodeURIComponent(tab.title || '') +
			'&body=' + encodeURIComponent(info.pageUrl);
	}
	
	window.open(u);
};

// Bloggerにシェアする
actions.blogger = function(info, tab){
	var u = 'http://www.blogger.com/blog-this.g';
	
	if(info.selectionText){
		u += '?t=' + encodeURIComponent(info.selectionText) +
			'&u=' + encodeURIComponent(info.pageUrl) +
			'&n=' + encodeURIComponent(tab.title || '');
	}else if(info.linkUrl){
		u += '?t=&u=' + encodeURIComponent(info.linkUrl) +
			'&n=' + encodeURIComponent(resolveLinkUrl(info.linkUrl));
	}else{
		u += '?t=&u=' + encodeURIComponent(info.pageUrl) +
			'&n=' + encodeURIComponent(tab.title || '');
	}
	
	window.open(u);
};


// リクエストを受け付ける
chrome.extension.onRequest.addListener(function(req, sender, sendResponse){
	if(req.action in actions){
		actions[req.action](req.info, req.tab, sendResponse);
	}
});
