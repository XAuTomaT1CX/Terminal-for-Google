
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

