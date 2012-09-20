goog.provide('xmpptk.ui.sound');

xmpptk.ui.sound.FILES = {
    'message_recv': "message_recv.swf",
    'message_queue': "message_queue.swf",
    'chat_recv': "ping.swf",
    'chat_queue': "chat_queue.swf",
    'online': "online.swf",
    'offline': "offline.swf",
    'startup': "startup.swf",
    'connected': "connected.swf",
    'ring': "ring.swf",
    'ping_client': 'ping_client.swf',
    'ring_client': 'ring_client.swf'
};

/** @type {string} */
xmpptk.ui.sound.path = 'sounds/';

/**
 * @param {string} base_url base url for static files
 */
xmpptk.ui.sound.init = function(base_url) {
    if (base_url) {
        if (!goog.string.endsWith(base_url, '/')) {
            base_url += '/';
        }
        xmpptk.ui.sound.path = base_url + xmpptk.ui.sound.path;
    }
};

/** @type {boolean} */
xmpptk.ui.sound.enabled = true;

/**
 * @param {string} event event to play sound for
 */
xmpptk.ui.sound.play = function(event) {
    if (xmpptk.ui.sound.enabled) {
        var target = frames['soundIFrame'].document;
        var html = '<embed src="'+xmpptk.ui.sound.path+xmpptk.ui.sound.FILES[event]+'" width="1" height="1" quality="high" pluginspage="http://www.macromedia.com/shockwave/download/index.cgi?P1_Prod_Version=ShockwaveFlash" type="application/x-shockwave-flash">';
        target.open();
        target.write(html);
        target.close();
    }
};
