goog.provide('chat.ui.Roster');

goog.require('goog.dom');

goog.require('xmpptk.ui.View');

goog.require('chat.ui.RosterItem');

/**
 * @constructor
 * @extends {xmpptk.ui.View}
 */
chat.ui.Roster = function(subject) {
    this._logger.info('creating view for roster');
    xmpptk.ui.View.call(this, subject);

    var rosterEl = goog.dom.getElement('roster');

    this._itemMenuBar = goog.dom.createDom('ul', {'class': 'roster_itemMenuBar'});
    goog.array.forEach(
        ['chat', 'info'],
        function(action) {
            var menuItem = goog.dom.createDom('li', {}, action);
            goog.events.listen(
                menuItem,
                goog.events.EventType.CLICK,
                function(e) {
                    this.handleAction(action);
                    e.stopPropagation();
                },
                false,
                this
            );
            goog.dom.appendChild(
                this._itemMenuBar,
                menuItem);
        },
        this);
    goog.dom.appendChild(rosterEl, this._itemMenuBar);
    goog.style.setStyle(this._itemMenuBar, 'visibility', 'hidden');

    this._roster = goog.dom.createDom('ul', {'class': 'roster_items'});
    this._rosterItemViews = [];
    this._rosterItemSelected = null;

    goog.dom.appendChild(rosterEl, this._roster); 
    this.render();
};
goog.inherits(chat.ui.Roster, xmpptk.ui.View);

/**
 * @type {goog.debug.Logger}
 * @protected
*/
chat.ui.Roster.prototype._logger = goog.debug.Logger.getLogger('chat.ui.Roster');

chat.ui.Roster.prototype.handleAction = function(action) {
    this._logger.info("got action: "+action);
    this._rosterItemSelected.handleAction(action);
};

chat.ui.Roster.prototype.update = function() {
    this._logger.info('roster updated');
    this.render();
};

chat.ui.Roster.prototype.render = function() {
    this._logger.info('rendering roster');
    goog.dom.removeChildren(this._roster);
    this._rosterItemViews = [];
    goog.object.forEach(this.subject.items, function(item) {
        this._rosterItemViews.push(new chat.ui.RosterItem(item, this._roster));
    }, this);

    goog.events.listen(
        goog.dom.getElement('roster'),
        goog.events.EventType.CLICK,
        function() {
            this.setSelected();
        },
        false,
        this);
};

chat.ui.Roster.prototype.setSelected = function(itemView) {
    this._rosterItemSelected = itemView;
    goog.style.setStyle(this._itemMenuBar, 'visibility', (typeof itemView !== 'undefined')?'visible':'hidden');
    goog.array.forEach(
        this._rosterItemViews,
        function(curView) {
            curView.setSelected(curView == itemView);
        });
};