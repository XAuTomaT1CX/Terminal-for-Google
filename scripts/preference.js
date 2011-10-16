
function Preference(args){
    if(!(this instanceof Preference))
        throw new TypeError();

    if(args == null)
        args = {};

    this._storage = Object.prototype.hasOwnProperty.call(args, 'storage')?
        args.storage: localStorage;
    this._cache = {};

    this.prefix =
        Object.prototype.hasOwnProperty.call(args, 'prefix')? args.prefix: '';
    this.suffix =
        Object.prototype.hasOwnProperty.call(args, 'suffix')? args.suffix: '';

    var channel = new MessageChannel();
    this._port = channel.port1;
    this.onChange = new EventDispatcher(this, channel.port2);
}

Preference.prototype.get = function(key, defaultValue){
    if(Object.prototype.hasOwnProperty.call(this._cache, key))
        return this._cache[key];
    var value = Storage.prototype.getItem.call(this._storage,
        this.prefix + key + this.suffix);
    if(value == null)
        return defaultValue;
    return this._cache[key] = JSON.parse(value);
};

Preference.prototype.set = function(key, value){
    if(this._cache[key] === value)
        return value;
    Storage.prototype.setItem.call(this._storage,
        this.prefix + key + this.suffix, JSON.stringify(value));
    this._cache[key] = value;
    this._port.postMessage({key: key, value: value});
    return value;
};

Preference.prototype.add = function(key, value){
    var val = this.get(key);
    if(typeof val === 'undefined')
        return this.set(key, value);
    return val;
};

Preference.prototype.update = function(keyValues, overwrite/*=true*/){
    var result = {}, p = (overwrite == null || overwrite)? 'set': 'add';
    Object.keys(keyValues).forEach(function(key){
        result[key] = this[p](key, keyValues[key]);
    }, this);
    return result;
};

Preference.prototype.has = function(key){
    return Object.prototype.hasOwnProperty(key) ||
        (this.prefix + key + this.suffix) in this._storage;
};

Preference.prototype.remove = function(key){
    delete this._cache[key];
    Storage.prototype.removeItem.call(this._storage,
        this.prefix + key + this.suffix);
};

