goog.provide('chat.ui.ChatSession');

goog.require('goog.ui.Bubble');
goog.require('goog.ui.Button');
goog.require('goog.ui.FlatButtonRenderer');
goog.require('goog.ui.Textarea');

goog.require('xmpptk.ui');
goog.require('xmpptk.ui.View');

/**
 * @constructor
 * @extends {xmpptk.ui.View}
 */
chat.ui.ChatSession = function(subject, tab) {
    xmpptk.ui.View.call(this, subject);

    subject.subscribe('message', this._handleChatMessage, this);

    this._tab = tab;
    this.render(goog.dom.getElement('chatSessions'));
};
goog.inherits(chat.ui.ChatSession, xmpptk.ui.View);

chat.ui.ChatSession.prototype._logger = goog.debug.Logger.getLogger('chat.ui.ChatSession');

chat.ui.ChatSession.prototype._handleChatMessage = function(message) {
    this._logger.info("got a message", message);
    this.appendMessage(this.formatMessage(message));
    if (!this._tab.isVisible()) {
        this._tab.setVisible(true);
    }
    if (!this._tab.isSelected()) {
        this._tab.setHighlighted(true);
    }
    if (!this._tab.getParent().getSelectedTab())
        this._tab.getParent().setSelectedTab(this._tab);
};

/**
 * Appends message to chat window
 * @param {Object} message with properties
 *   body (string) the message body
 *   className (string) optional css class to add
 *   id (string) optional id of message element
 *   urls (array) an array of urls to display
 * @notypecheck
 */
chat.ui.ChatSession.prototype.appendMessage = function(message) {
    var classes = 'chatMessage';
    if (goog.isString(message.className)) {
        classes += ' ' + message.className;
    }
    this._logger.info(classes);
    var chatMessage = goog.dom.createDom('div', {'class':classes});
    if (message.id) {
        chatMessage.id = message.id;
    }
    // using innerHTML here as body already contains formatted html
    // stuff (like clickable links)
    chatMessage.innerHTML = message.body;

    var scrollBottom = this._messagesPanel.scrollTop+this._messagesPanel.clientHeight>=this._messagesPanel.scrollHeight;
    this._logger.info("scrollBottom: "+scrollBottom);

    goog.dom.appendChild(this._messagesPanel, chatMessage);
    if (scrollBottom) {
        this._messagesPanel.scrollTop = this._messagesPanel.scrollHeight;
    }
};

/**
 * format a message
 * @param {{type: string, body: string, from: string}} msg the message to be formated
 * @return {{body: string, className: string}}
 * @notypecheck
 */
chat.ui.ChatSession.prototype.formatMessage = function(msg, from) {
    this._logger.fine("formatting message");

    var className = 'me_chat_message';
    if (!from) {
        from = this.subject.entity.name;
        className = 'other_chat_message';
    }

    var ts = '@'+(new Date().toLocaleTimeString());
    if (msg.delay) {
        this._logger.fine("message got a delay of "+msg.delay);
        ts = Date.jab2date(msg.delay);
        ts = '@'+ts.toLocaleTimeString();
    }
    this._logger.fine("using timestamp of "+ts);
    var meMatches = msg.body.match(/^\/me (.*)$/);
    if (meMatches) {
        this._logger.fine("formatting as /me message from "+from);
        return {body:'* ' + xmpptk.ui.htmlEnc(from)+ ' ' +
                xmpptk.ui.msgFormat(meMatches[1]) + ' *',
                className:'me_message'};
    } else {
        this._logger.fine("no /me messsage");
        return {body:'<span title="'+ts+'" class="'+className+'">&lt;'+xmpptk.ui.htmlEnc(from)+'&gt;</span> '+ xmpptk.ui.msgFormat(msg.body),
                className: 'chat_message'};
    }
};

chat.ui.ChatSession.prototype.render = function(parent) {
    this._panel = goog.dom.createDom(
        'div', {'class': 'goog-tab-content'},
        goog.dom.createDom('div', {'class': 'messagesPanel'}),
        goog.dom.createDom('div', {'class': 'plugins'},
                           goog.dom.createDom('button', {'class': 'emoticonsButton'})),
        goog.dom.createDom('div', {'class': 'sendDiv'},
                           goog.dom.createDom('input', {'type': 'button', 'title': 'Click here to send message', 'class': 'sendButton', 'value': 'Send'}),
                           goog.dom.createDom('div', {'class': 'sendPanel'},
                                              goog.dom.createDom('textarea', {'class': 'sendTextarea'})
                                             )));
    goog.dom.appendChild(parent, this._panel);

    this._messagesPanel = goog.dom.getElementByClass('messagesPanel', this._panel);

    this._sendTextarea = new goog.ui.Textarea();
    this._sendTextarea.decorate(goog.dom.getElementByClass('sendTextarea', this._panel));
    this._sendTextareaElement = goog.dom.getElementByClass('sendTextarea', this._panel);

    this._sendTextarea.setValue('Please click here to send a message!');
    goog.events.listenOnce(
        this._sendTextarea.getElement(),
        goog.events.EventType.CLICK,
        function(e) {
            this._sendTextarea.setValue('');
            goog.events.listen(
                sendButton,
                goog.ui.Component.EventType.ACTION,
                function() {
                    this.send();
                },
                true,
                this);
        },
        true,
        this
    );

    goog.events.listen(
        this._sendTextareaElement,
        goog.events.EventType.KEYPRESS,
        goog.bind(function(e) {
            if (e.charCode == 13) { // return key
                this.send();
                e.preventDefault();
            }
        }, this)
    );



    var emoticonsButton = goog.dom.getElementByClass('emoticonsButton', this._panel);

    var emoticonsPanel = goog.dom.createElement('div');

    var seenEmoticon = {};
    var numEmoticonsProcessed = 0;
    this._logger.info("creating emoticonsPanel");
    goog.object.forEach(
        xmpptk.ui.emoticons.replacements,
        function(replacement, key) {
            var img = new Image();
            img.src = replacement.icon.src;

            if (seenEmoticon[img.src]) {
                return;
            }
            seenEmoticon[img.src] = true;
            img.title = key;
            img.className = 'emoticonBtn';
            goog.dom.appendChild(emoticonsPanel, img);

            goog.events.listen(
                img,
                goog.events.EventType.CLICK,
                function(e) {
                    var emoticon = e.target.title;

                    var setSelectionRange = function(input, selectionStart, selectionEnd) {
                        if (input.setSelectionRange) {
                            input.focus();
                            input.setSelectionRange(selectionStart, selectionEnd);
                        }
                        else if (input.createTextRange) {
                            var range = input.createTextRange();
                            range.collapse(true);
                            range.moveEnd('character', selectionEnd);
                            range.moveStart('character', selectionStart);
                            range.select();
                        }
                    };

                    var input = this._sendTextareaElement;
                    if (input.setSelectionRange) {
                        var selectionStart = input.selectionStart;
                        var selectionEnd = input.selectionEnd;
                        if (input.value.charAt(input.selectionStart-1) !== ' ' && input.value.charAt(input.selectionStart-1) !== '') {
                            emoticon = ' ' + emoticon;
                        }
                        input.value = input.value.substring(0, selectionStart) + emoticon + input.value.substring(selectionEnd);
                        if (selectionStart != selectionEnd) { // has there been a selection
                            setSelectionRange(input, selectionStart, selectionStart + emoticon.length);
                        }
                        else { // set caret
                            setSelectionRange(input, selectionStart + emoticon.length, selectionStart + emoticon.length);
                        }
                    }
                    else if (input.caretPos) {
                        var caretPos = input.caretPos;
                        caretPos.text = (caretPos.text.charAt(caretPos.text.length - 1)==' '?emoticon+' ':emoticon);
                        input.focus();
                    }
                    else {
                        if (input.value.length && input.value.charAt(input.value.length) != ' ') {
                            input.value += ' ';
                        }
                        input.value += emoticon;
                        input.focus();
                    }
                },
                false,
                this);
        }, this);

    var emoticonsBubble = new goog.ui.Bubble(emoticonsPanel);
    //    emoticonsBubble.setAutoHide(false);
    emoticonsBubble.setPosition(new goog.positioning.AnchoredPosition(emoticonsButton, null));
    emoticonsBubble.render();
    emoticonsBubble.attach(emoticonsButton);

    goog.events.listen(
        emoticonsButton,
        goog.events.EventType.CLICK,
        function() {
            this._sendTextarea.getElement().click();
            emoticonsBubble.setVisible(true);
            // dirty fix bad position
            var coord = goog.style.getPosition(emoticonsBubble.getElement());
            coord.x = coord.x+42;
            goog.style.setPosition(emoticonsBubble.getElement(), coord);
        }, true, this);

    var sendButton = new goog.ui.Button();
    sendButton.decorate(goog.dom.getElementByClass('sendButton', this._panel));
};

chat.ui.ChatSession.prototype.send = function() {
    var body = this._sendTextarea.getValue();
    if (body && body !== '') {
        try {
            this._logger.info(this._sendTextarea.getValue());
            this.subject.sendMessage(body);
            this.appendMessage(this.formatMessage({'body': body},
                                                  xmpptk.getConfig('username')));
            this._sendTextarea.setValue('');
        } catch(err) { this._logger.severe("failed sending message", err.message); }
    }
};

/**
 * visually show the chat
 * @param {boolean} show whether to show or hide the chat
 */
chat.ui.ChatSession.prototype.show = function(show) {
    goog.style.showElement(this._panel, show);
};
