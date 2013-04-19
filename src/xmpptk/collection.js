goog.provide('xmpptk.Collection');

goog.require('goog.object');
goog.require('xmpptk.Model');

/**
 * @constructor
 * @extends {xmpptk.Model}
 * @param {function(object)} itemClass classname of items to build collection of
 * @param {string} itemID the key id to differentiate items with (aka primary
 *                        key)
*/
xmpptk.Collection =  function(itemClass) {
    if (!itemClass) {
        throw "missing argument";
    }

    xmpptk.Model.call(this);

    this.items = {};
    this._itemClass = itemClass;
};
goog.inherits(xmpptk.Collection, xmpptk.Model);

xmpptk.Collection.prototype.add = function(id) {
    // this should also work if not an id but some object as param to
    // constructor are given

    return this.addItem(new this._itemClass(id));
};

xmpptk.Collection.prototype.addItem = function(item, skip) {
    if (!(item instanceof this._itemClass)) {
        throw "bad argument: not instanceof itemClass";
    }
    this.items[item.getId()] = item;
    if (!skip) {
        this.notify();
    }
    return item;
};

xmpptk.Collection.prototype.getItem = function(id) {
    if (this.hasItem(id)) {
        return this.items[id];
    } else {
        return this.addItem(new this._itemClass(id));
    }
};

xmpptk.Collection.prototype.getItems = function() {
    var items = [];
    goog.object.forEach(
        this.items,
        function(item) {
            items.push(item.get());
        }
    );
    return items;
};

xmpptk.Collection.prototype.hasItem = function(id) {
    return (typeof this.items[id] != 'undefined');
};

xmpptk.Collection.prototype.remove = function(id) {
    if (this.hasItem(id)) {
        this.removeItem(this.getItem(id));
    }
    return this;
};

xmpptk.Collection.prototype.removeItem = function(item) {
    if (!(item instanceof this._itemClass)) {
        throw "bad argument: not instanceof itemClass";
    }
    delete this.items[item.getId()];
    this.notify();
    return this;
};

xmpptk.Collection.prototype.setItems = function(items) {
    this.items = {}; // reset my own items
    goog.array.forEach(
        items,
        function(item) {
            console.log(item);
            this.addItem(new this._itemClass(item), true);
        },
        this
    );
    this.notify();
};
