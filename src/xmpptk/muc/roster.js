goog.provide('xmpptk.muc.Roster');

goog.require('xmpptk.Collection');
goog.require('xmpptk.muc.Occupant');

/**
 * @constructor
 * @inherits {xmpptk.Collection}
 */
xmpptk.muc.Roster = function() {
    xmpptk.Collection.call(this, xmpptk.muc.Occupant, 'jid');
};
goog.inherit(xmpptk.muc.Roser, xmpptk.Collection);