goog.provide('chat.ui.RosterItem');

goog.require('goog.ui.Dialog');

goog.require('xmpptk.ui.View');
goog.require('chat.ui.vCard');

/**
 * @constructor
 * @extends {xmpptk.ui.View}
 * @param {xmpptk.RosterItem} subject the object to listen on
 * @param {Element} parent the DOM element to append view to
 */
chat.ui.RosterItem = function(subject, parent) {
    this._logger.info('Creating view of RosterItem for '+subject.getId());
    xmpptk.ui.View.call(this, subject);

    this._parent = parent;
    this._el = null;
    this.render();
};
goog.inherits(chat.ui.RosterItem, xmpptk.ui.View);

/**
 * @type {goog.debug.Logger}
 * @protected
*/
chat.ui.RosterItem.prototype._logger = goog.debug.Logger.getLogger('chat.ui.RosterItem');

chat.ui.RosterItem.prototype.update = function() {
    this._logger.info('Got update of RosterItem for ' + this.subject.getId());
    this.render();
};

chat.ui.RosterItem.DEFAULT_AVATAR = "iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAABGdBTUEAANbY1E9YMgAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAAYUExURel4Nvzq3/fNs+2QWvKthedqIf///+VfEDaKp/gAAAEbSURBVHja7JbRDsMgCEWBC+7//3h2dqtMxJrscTw0KekJQuEilW2j4yEgu2OQN6KP24aGbBAvhoo8tkwqgj0EFaE9xCpif+SP/B4xWiCDj7CIYt8+xeJgBu8jwSoX9SMExip9ODEw8UMYIcbkQjAtiyziQnwREaKdQ3kgeuQsLC6RoqqNA9EjrSrEb5GyJqZJw5i21Atbe+WY6BDVJoWFj1gNCFXxQlgbUSVa5dwKmnbykTWJ3yOSN/9xIvYEW4ogWFbIR4xHQvKp1FtB7INQSPg+MgLRhRQJ9y6ur1UVZN3BZiZS/5Aws7iRy5ATVBvTT4w1bst5AMyKPANo/l+2gLbEoxyQXxWCELa4kAyW3WnAEcJ3Lleb9hRgAIX/PfhhPTfIAAAAAElFTkSuQmCC";
chat.ui.RosterItem.DEFAULT_AVATAR_TYPE = "image/png";

chat.ui.RosterItem.prototype.render = function() {
    this._logger.info('rendering RosterItem for ' + this.subject.getId());

    var avatar = {'TYPE': chat.ui.RosterItem.DEFAULT_AVATAR_TYPE,
                  'BINVAL': chat.ui.RosterItem.DEFAULT_AVATAR};
    if (this.subject.vCard && this.subject.vCard.PHOTO) {
        this._logger.info(goog.json.serialize(this.subject.vCard));
        avatar = this.subject.vCard.PHOTO;
    }

    if (this._el) {
        goog.dom.setProperties(this._el, {'class': 'rosterItem_presence_'+this.subject.getPresenceShow()});
        this._avatar.src = "data:"+avatar.TYPE+";base64,"+avatar.BINVAL;
        if (this.subject.vCard.FN)
            goog.dom.setTextContent(
                goog.dom.getElementByClass('rosterItem_name', this._el),
                this.subject.vCard.FN);
    } else {
        this._el = goog.dom.createDom('li',
                                      {'class': 'rosterItem_presence_'+this.subject.getPresenceShow()},
                                      goog.dom.createDom('img', 
                                                         {src: "data:"+avatar.TYPE+";base64,"+avatar.BINVAL,
                                                          'class': 'rosterItem_avatar'}),
                                      goog.dom.createDom('span', {'class': 'rosterItem_name'}, this.subject.name)
                                     );
        
        goog.events.listen(this._el,
                           goog.events.EventType.DBLCLICK,
                           function(e) { 
                               this._logger.info(this.subject.getId() + ' dblclicked');
                               chat.Client.getInstance().publish('openChat', this.subject);
                               e.stopPropagation();
                           },
                           false,
                           this
                          );
        goog.events.listen(this._el,
                           goog.events.EventType.CLICK,
                           function(e) { 
                               this._logger.info(this.subject.getId() + ' clicked');
                               chat.Client.getInstance().publish('selectRosterItem', this);
                               e.stopPropagation();
                           },
                           false,
                           this
                          );

        this._avatar = goog.dom.getElementByClass('rosterItem_avatar', this._el);
        goog.dom.appendChild(
            this._parent,
            this._el);
    }
};

chat.ui.RosterItem.prototype.handleAction = function(action) {
    switch (action) {
    case 'chat':
        chat.Client.getInstance().publish('openChat', this.subject);
        break;
    case 'info':
        var dialog = new goog.ui.Dialog();
        dialog.setTitle('vCard for '+this.subject.name);
        dialog.setContent(
            chat.ui.vCard.toHtml(this.subject.vCard));
        dialog.setButtonSet(goog.ui.Dialog.ButtonSet.createOk());
        dialog.setVisible(true);
        break;
    }
};

chat.ui.RosterItem.prototype.setSelected = function(selected) {
    goog.dom.classes.enable(this._el, 'rosterItem_selected', selected);
};

chat.ui.RosterItem.prototype.show = function(show) {
    goog.style.showElement(this._el, show);
};