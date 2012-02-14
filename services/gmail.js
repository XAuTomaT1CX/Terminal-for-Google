
function Gmail(){
	Service.call(this, {
		id: 'gmail',
		name: 'Gmail',
		url: 'mail.google.com/mail',
		icon: 'image/goog-mail.png',
		menus: [
			{
				title: 'Mail this page',
				context: 'page',
				action: 'gmail'
			},
			{
				title: 'Mail this link',
				context: 'link',
				action: 'gmail'
			},
			{
				title: 'Mail this text',
				context: 'selection',
				action: 'gmail'
			}
		]
	});

	Object.defineProperties(this, {
		_polling: {
			writable: true,
			value: null
		},
		_unreadCount: {
			writable: true,
			value: 0
		},
		_tabUpdateHandler: {
			value: function(id, info, tab){
				if(!tab.url)
					return;

				// もしタブのURLがGmailならば未読チェック
				if(tab.url.indexOf('http://' + this.url) === 0 ||
					tab.url.indexOf('https://' + this.url) === 0){
					this.checkUnreadCount();
				}
			}.bind(this)
		}
	});

	// Gmailが有効にされたとき
	this.onEnabled.push(function(){
		if(pref.get('gmail-poll-enabled')){
			// 未読をチェック
			this.checkUnreadCount();

			// 定期的に未読をチェックするようにする
			this.startPolling();

			// タブを監視する
			this.startObservingTab();
		}
	});

	// Gmailが無効にされたとき
	this.onDisabled.push(function(){
		this.unreadCount = 0;

		// 定期的に未読をチェックするのをやめる
		this.stopPolling();

		// タブの監視をはずす
		this.stopObservingTab();
	});

	// 設定が変更されたとき
	pref.onChange.addListener(function(key, value){
		if(!this.isEnabled)
			return;

		if(key === 'gmail-poll-interval'){
			this.stopPolling();
			this.startPolling();
		}else if(key === 'gmail-poll-enabled'){
			this.unreadCount = 0;
			if(value){
				this.checkUnreadCount();
				this.startPolling();
				this.startObservingTab();
			}else{
				this.stopPolling();
				this.stopObservingTab();
			}
		}
	}.bind(this));
}


Gmail.prototype = Object.create(Service.prototype);
Object.defineProperties(Gmail.prototype, {
	/** 未読のフィードのURL */
	feedURL: {
		get: function(){
			return (pref.get('secure')? "https://": "http://") +
				"mail.google.com/mail/feed/atom";
		}
	},
	/** 未読数 */
	unreadCount: {
		get: function(){
			return this._unreadCount;
		},
		set: function(value){
			this._unreadCount = badge.gmail = Number(value);
		}
	},
	/** 未読数を調べに行く頻度(ms) */
	pollInterval: {
		get: function(){
			var pollInterval = pref.get('gmail-poll-interval');
			if(!isFinite(pollInterval))
				pollInterval = pref.set('gmail-poll-interval', 1000 * 60 * 5);
			return pollInterval;
		}
	},
	/** 未読数を調べる */
	checkUnreadCount: {
		value: function(){
			var xhr = new XMLHttpRequest();
			xhr.open('GET', this.feedURL, true);
			xhr.send(null);

			// 読み込み完了
			xhr.onload = function(){
				if(timeout){
					clearTimeout(timeout);
					timeout = null;
				}

				try{
					// XPathでXMLからデータを取得
					var xpath = '/gmail:feed/gmail:fullcount';
					var ns = function(prefix){
						if(prefix === 'gmail')
							return 'http://purl.org/atom/ns#';
					};

					var xml = xhr.responseXML;
					var node = xml.evaluate(xpath, xml, ns,
						XPathResult.ANY_TYPE, null).iterateNext();

					if(node){
						this.unreadCount = node.textContent;
					}else{
						console.error(
							'Gmail#checkUnreadCount() - XML Error', xml);
					}
				}catch(error){
					console.error(
						'Gmail#checkUnreadCount() - ' + error);
				}
			}.bind(this);

			// エラーがあったとき
			xhr.onerror = function(error){
				this.unreadCount = 0;
				clearTimeout(timeout);
				timeout = null;
				console.error('Gmail#checkUnreadCount() - ' + error);
			}.bind(this);

			// 60秒でタイムアウト
			var timeout = setTimeout(function(){
				this.unreadCount = 0;
				timeout = null;
				xhr.abort();
				console.warn('Gmail#checkUnreadCount() - Timeout');
			}.bind(this), 1000 * 60);
		}
	},
	/** 定期的な未読チェックを開始 */
	startPolling: {
		value: function(){
			if(this._polling)
				return;

			this._polling = setInterval(function(){
				this.checkUnreadCount();
			}.bind(this), this.pollInterval);
		}
	},
	/** 定期的な未読チェックを中止 */
	stopPolling: {
		value: function(){
			if(this._polling){
				clearInterval(this._polling);
				this._polling = null;
			}
		}
	},
	/** タブの監視を開始 */
	startObservingTab: {
		value: function(){
			var handler = this._tabUpdateHandler;
			if(!chrome.tabs.onUpdated.hasListener(handler))
				chrome.tabs.onUpdated.addListener(handler);
		}
	},
	/** タブの監視を中止 */
	stopObservingTab: {
		value: function(){
			var handler = this._tabUpdateHandler;
			if(chrome.tabs.onUpdated.hasListener(handler))
				chrome.tabs.onUpdated.removeListener(handler)
		}
	}
});

