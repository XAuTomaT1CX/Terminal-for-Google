
var backgroundPage = chrome.extension.getBackgroundPage();
var pref = backgroundPage.pref;


window.addEventListener('pref-changed', function(event){
	var listener;
	if(listener = bind.listeners[event.key])
		listener(event.value);
});

bind.listeners = {};
function bind(args){
	var valueKey = args.valueKey || 'value';
	var prefKey = args.prefKey;
	var box = args.box;

	box[valueKey] = pref.get(prefKey);
	box.addEventListener('change', function(){
		pref.set(prefKey, this[valueKey]);
		onSaved(this);
	}, false);

	bind.listeners[prefKey] = function(value){
		if(box[valueKey] !== value)
			box[valueKey] = value;
	};
}

onSaved.timeouts = {};
function onSaved(node){
	var msg = node.nextElementSibling;
	while(msg && !msg.classList.contains('msg'))
		msg = msg.nextElementSibling;

	if(!msg)
		return;

	var timeouts = onSaved.timeouts;
	if(node.id in timeouts){
		clearTimeout(timeouts[node.id]);
		msg.classList.remove('saved');
		timeouts[node.id] = setTimeout(function(){
			setSaved();
		}, 100);
	}else{
		setSaved();
	}

	function setSaved(){
		msg.classList.add('saved');
		timeouts[node.id] = setTimeout(function(){
			msg.classList.remove('saved');
			delete timeouts[node.id];
		}, 1600);
	}
}


function Q(selector){
	return document.querySelector(selector);
}

