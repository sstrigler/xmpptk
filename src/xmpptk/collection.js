goog.provide('xmpptk.Collection');

goog.require('goog.object');
goog.require('xmpptk.Model');

/**
 * @constructor
 * @inherits {xmpptk.Model}
 * @param {function} itemClass classname of items to build collection of
 * @param {string} itemID the key id to differentiate items with (aka primary key)
*/
xmpptk.Collection =  function(itemClass, itemID) {
    if (!itemClass || !itemID) {
        throw "missing argument";
    }

    xmpptk.Model.call(this);

    this.items = {};
    this._itemClass = itemClass;
    this._itemID = itemID;
};
goog.inherits(xmpptk.Collection, xmpptk.Model);

xmpptk.Collection.prototype.add = function(item, skip) {
    if (!(item instanceof this._itemClass)) {
        throw "bad argument: not instanceof itemClass";
    }
    this.get('items')[item.get(this._itemID)] = item;
    if (!skip) {
        this.notify();
    }
    return item;
};

xmpptk.Collection.prototype.getItem = function(id) {
    var item = this.get('items')[id];
    if (!item) {
        var obj = {};
        obj[this._itemID] = id;
        item = this.add(new this._itemClass(obj));
    }
    return item;
};

xmpptk.Collection.prototype.getItems = function() {
    var items = {};
    goog.object.forEach(
        this.items,
        function(id, item) {
            items[id] = item.get();
        }
    );
    return items;
};

xmpptk.Collection.prototype.hasItem = function(id) {
    return (typeof this.get('items')[id] != 'undefined');
};

xmpptk.Collection.prototype.remove = function(item) {
    if (!(item instanceof this._itemClass)) {
        throw "bad argument: not instanceof itemClass";
    }
    delete this.get('items')[item.get(this._itemID)];
    this.notify();
    return this;
};

xmpptk.Collection.prototype.removeItem = function(id) {
    var item = this.get('items')[id];
    if (item) {
        this.remove(item);
    }
    return this;
};

xmpptk.Collection.prototype.setItems = function(items) {
    this.items = {}; // reset my own items
    if (items) {
        goog.object.forEach( 
            items, 
            goog.bind(
                function(item) {
                    try { 
                        this.add(new this._itemClass(item), true);
                    } catch(e) { }
                },
                this
            )
        );
        this.notify();
    }
};
