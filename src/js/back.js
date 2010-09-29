
var manager = new ServiceManager(ServiceList);
var pref = Preference("pref", localStorage, {
	'secure': true,
	'custom-domain': null,
});


// 変数等を初期化する
function initialize(){
	var secure = pref.get('secure');
	var domain = pref.get('custom-domain');
	
	manager.initialize(function(id){
		return pref.get(id + '-enabled', true);
	}, function(id){
		if(id === 'picasa' || id === 'youtube')
			return false;
		return secure;
	});
}


// Methods (api.js)
var methods = {
	// サービスの情報の配列を返す
	GetAllServiceInfo: function(){
		return manager.getAllServiceInfo();
	},
	// サービスを開く
	OpenService: function(id){
		manager.openService(id);
	},
	// バッジの値を返す
	GetBadge: function(){
		return manager.badgeManager.getValues();
	},
	// 新しいタブを開く
	CreateTab: function(url, selected){
		if(typeof selected === 'undefined' || typeof selected === 'function')
			selected = true;
		if(!/^(https?:\/\/|about:|chrome(-extension)?:)/.test(url))
			url = (pref.get('secure')? 'https://': 'http://') + url;
		chrome.tabs.create({url: url, selected: selected});
	},
	// 設定を更新する
	SetPref: function(params, value){
		if(typeof value !== 'undefined' && typeof value !== 'function')
			pref.set(params, value);
		else
			pref.update(params);
		initialize();
	},
	// 設定を返す
	GetPref: function(){
		return pref.getAll();
	}
};


initialize();
