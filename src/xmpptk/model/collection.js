goog.provide('xmpptk.model.collection');

goog.require('goog.object');

xmpptk.model.collection =  function(itemClass, itemID) {
    if (!itemClass || !itemID) {
        throw "missing argument";
    }
    this.sup();
    this.items = {};
    this._itemClass = itemClass;
    this._itemID = itemID;
};
goog.inherits(xmpptk.model.collection, xmpptk.model);

xmpptk.model.collection.prototype.add = function(item, skip) {
    if (!(item instanceof this._itemClass)) {
        throw "bad argument: not instanceof itemClass";
    }
    this.get('items')[item.get(this._itemID)] = item;
    if (!skip) {
        this.notify();
    }
    return item;
};

xmpptk.model.collection.prototype.getItem = function(id) {
    var item = this.get('items')[id];
    if (!item) {
        var obj = {};
        obj[this._itemID] = id;
        item = this.add(new this._itemClass(obj));
    }
    return item;
};

xmpptk.model.collection.prototype.getItems = function() {
    var items = {};
    goog.object.forEach(
        this.items,
        function(id, item) {
            items[id] = item.get();
        }
    );
    return items;
};

xmpptk.model.collection.prototype.hasItem = function(id) {
    return (typeof this.get('items')[id] != 'undefined');
};

xmpptk.model.collection.prototype.remove = function(item) {
    if (!(item instanceof this._itemClass)) {
        throw "bad argument: not instanceof itemClass";
    }
    delete this.get('items')[item.get(this._itemID)];
    this.notify();
    return this;
};

xmpptk.model.collection.prototype.removeItem = function(id) {
    var item = this.get('items')[id];
    if (item) {
        this.remove(item);
    }
    return this;
};

xmpptk.model.collection.prototype.setItems = function(items) {
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
