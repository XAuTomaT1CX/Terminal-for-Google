
function GoogleReader(){
	Service.call(this, {
		id: 'reader',
		name: 'Google Reader',
		url: 'www.google.com/reader',
		icon: 'image/goog-reader.png'
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

				// もしタブのURLがGoogle Readerならば未読チェック
				if(tab.url.indexOf('http://' + this.url) === 0 ||
					tab.url.indexOf('https://' + this.url) === 0){
					this.checkUnreadCount();
				}
			}.bind(this)
		}
	});

	// Google Readerが有効にされたとき
	this.onEnabled.push(function(){
		if(pref.get('reader-poll-enabled')){
			// 未読をチェック
			this.checkUnreadCount();

			// 定期的に未読をチェックするようにする
			this.startPolling();

			// タブを監視する
			this.startObservingTab();
		}
	});

	// Google Readerが無効にされたとき
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

		if(key === 'reader-poll-interval'){
			this.stopPolling();
			this.startPolling();
		}else if(key === 'reader-poll-enabled'){
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


GoogleReader.prototype = Object.create(Service.prototype);
Object.defineProperties(GoogleReader.prototype, {
	/** 未読数を返すJSONのURL */
	jsonURL: {
		get: function(){
			return (pref.get('secure')? "https://": "http://") +
				"www.google.com/reader/api/0/unread-count?output=json";
		}
	},
	/** 未読数 */
	unreadCount: {
		get: function(){
			return this._unreadCount;
		},
		set: function(value){
			this._unreadCount = badge.reader = Number(value);
		}
	},
	/** 未読数を調べに行く頻度(ms) */
	pollInterval: {
		get: function(){
			var pollInterval = pref.get('reader-poll-interval');
			if(!isFinite(pollInterval))
				pollInterval = pref.set('reader-poll-interval', 1000 * 60 * 5);
			return pollInterval;
		}
	},
	/** 未読数を調べる */
	checkUnreadCount: {
		value: function(){
			var xhr = new XMLHttpRequest();
			xhr.open('GET', this.jsonURL, true);
			xhr.send(null);

			// 読み込み完了
			xhr.onload = function(){
				if(timeout){
					clearTimeout(timeout);
					timeout = null;
				}

				try{
					// JSONをパースして未読数を取得
					var json = JSON.parse(xhr.responseText);
					json.unreadcounts.some(function(link){
						if(link.id.indexOf('reading-list') >= 0){
							this.unreadCount = String(link.count);
							return true;
						}
					}, this);
				}catch(error){
					console.error(
						'GoogleReader#checkUnreadCount() - ' + error);
				}
			}.bind(this);

			// エラーがあったとき
			xhr.onerror = function(error){
				this.unreadCount = 0;
				clearTimeout(timeout);
				timeout = null;
				console.error('GoogleReader#checkUnreadCount() - ' + error);
			}.bind(this);

			// 60秒でタイムアウト
			var timeout = setTimeout(function(){
				this.unreadCount = 0;
				timeout = null;
				xhr.abort();
				console.warn('GoogleReader#checkUnreadCount() - Timeout');
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

