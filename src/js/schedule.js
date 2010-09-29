
var ScheduleManager = function(){
	this.schedules = {};
};

ScheduleManager.prototype = {
	initialize: function(){
		for(var id in this.schedules) if(this.isExists(id)){
			window.clearTimeout(this.schedules[id]);
			this.schedules[id] = null;
		}
		this.schedules = {};
	},
	set: function(id, time, callback){
		this.clear(id);
		var self = this;
		this.schedules[id] = window.setTimeout(function(){
			self.schedules[id] = null;
			callback();
		}, time);
	},
	isExists: function(id){
		return this.schedules.hasOwnProperty(id) && this.schedules[id] != null;
	},
	clear: function(id){
		if(this.isExists(id)){
			window.clearTimeout(this.schedules[id]);
			this.schedules[id] = null;
		}
	}
};
