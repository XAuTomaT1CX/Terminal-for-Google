
function GooglePlus(){
	Service.call(this, {
		id: 'plus',
		name: 'Google+',
		url: 'plus.google.com/',
		icon: 'image/g-plus-icon-150x150.png'
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

				// もしタブのURLがGoogle Plusならば未読チェック
				if(tab.url.indexOf('http://' + this.url) === 0 ||
					tab.url.indexOf('https://' + this.url) === 0){
					this.checkUnreadCount();
				}
			}.bind(this)
		}
	});

	// Google Plusが有効にされたとき
	this.onEnabled.push(function(){
		if(pref.get('plus-poll-enabled')){
			// 未読をチェック
			this.checkUnreadCount();

			// 定期的に未読をチェックするようにする
			this.startPolling();

			// タブを監視する
			this.startObservingTab();
		}
	});

	// Google Plusが無効にされたとき
	this.onDisabled.push(function(){
		this.unreadCount = 0;

		// 定期的に未読をチェックするのをやめる
		this.stopPolling();

		// タブの監視をはずす
		this.stopObservingTab();
	});

	// 設定が変更されたとき
	pref.onPropertyChange.addListener(function(key, value){
		if(!this.isEnabled)
			return;

		if(key === 'plus-poll-interval'){
			this.stopPolling();
			this.startPolling();
		}else if(key === 'plus-poll-enabled'){
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


GooglePlus.prototype = Object.create(Service.prototype);
Object.defineProperties(GooglePlus.prototype, {
	/** 未読数を返すAPIのURL */
	apiURL: {
		get: function(){
			return (pref.get('secure')? 'https://': 'http://') +
				'plus.google.com/u/0/_/n/guc';
		}
	},
	/** 未読数 */
	unreadCount: {
		get: function(){
			return this._unreadCount;
		},
		set: function(value){
			this._unreadCount = badge.plus = Number(value);
		}
	},
	/** 未読数を調べに行く頻度(ms) */
	pollInterval: {
		get: function(){
			var pollInterval = pref.get('plus-poll-interval');
			if(!isFinite(pollInterval))
				pollInterval = pref.set('plus-poll-interval', 1000 * 60 * 5);
			return pollInterval;
		}
	},
	/** 未読数を調べる */
	checkUnreadCount: {
		value: function(){
			var xhr = new XMLHttpRequest();
			xhr.open('GET', this.apiURL, true);
			xhr.send(null);

			// 読み込み完了
			xhr.onload = function(){
				if(timeout){
					clearTimeout(timeout);
					timeout = null;
				}

				try{
					// レスポンスから未読数を取り出す
					var text = xhr.responseText;
					this.unreadCount = text.match(/"on\.uc",(\d+),/)[1];
				}catch(error){
					console.error('GooglePlus#checkUnreadCount() - ' + error);
				}
			}.bind(this);

			// エラーがあったとき
			xhr.onerror = function(error){
				this.unreadCount = 0;
				clearTimeout(timeout);
				timeout = null;
				console.error('GooglePlus#checkUnreadCount() - ' + error);
			}.bind(this);

			// 60秒でタイムアウト
			var timeout = setTimeout(function(){
				this.unreadCount = 0;
				timeout = null;
				xhr.abort();
				console.warn('GooglePlus#checkUnreadCount() - Timeout');
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

