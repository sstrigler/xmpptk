goog.provide('xmpptk.muc.Occupant');
goog.provide('xmpptk.muc.Occupant.Affiliation');
goog.provide('xmpptk.muc.Occupant.Role');

goog.require('xmpptk.Model');

/**
 * @constructor
 * @inherits {xmpptk.Model}
 */
xmpptk.muc.Occupant = function(jid) {
    xmpptk.Model.call(this);
};
goog.inherits(xmpptk.muc.Occupant, xmpptk.Model);

/** @enum {string} */
xmpptk.muc.Occupant.Affiliation = {
    OUTCAST: 'outcast',
    NONE: 'none',
    MEMBER: 'member',
    ADMIN: 'admin',
    OWNER: 'owner'
};

/** @enum {string} */
xmpptk.muc.Occupant.Role = {
    NONE: 'none',
    PARTICIPANT: 'participant',
    VISITOR: 'visitor',
    MODERATOR: 'moderator'
};

/** @type {xmpptk.muc.Occupant.Affiliation} */
xmpptk.muc.Occupant.prototype.affiliation;

/** @type {xmpptk.muc.Occupant.Role} */
xmpptk.muc.Occupant.prototype.role;