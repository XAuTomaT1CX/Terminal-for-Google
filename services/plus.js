
function GooglePlus(){
	Service.call(this, {
		id: 'plus',
		name: 'Google+',
		url: 'plus.google.com/',
		icon: 'image/g-plus-icon-150x150.png'
	});
}


GooglePlus.prototype = Object.create(Service.prototype);

