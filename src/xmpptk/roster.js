goog.provide('xmpptk.Roster');

goog.require('xmpptk.Collection');

/**
 * @constructor
 * @extends {xmpptk.Collection}
 */
xmpptk.Roster = function(client) {
    xmpptk.Collection.call(this, xmpptk.RosterItem, 'jid');
    client.subscribe('presence', function(presence) {
        this._logger.info("got presence from "+presence['from'].toString());
        
        this.getItem(presence['from'].getBareJID())
            .setPresence(presence['from'].getResource(), presence['presence']);
    }, this);
    this._logger.info("created");
};
goog.inherits(xmpptk.Roster, xmpptk.Collection);

/**
 * @type {goog.debug.Logger}
 * @protected
*/
xmpptk.Roster.prototype._logger = goog.debug.Logger.getLogger('xmpptk.Roster');
