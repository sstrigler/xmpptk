goog.provide('xmpptk.ui.emoticons');

goog.require('goog.object');
goog.require('goog.array');
goog.require('goog.string');
goog.require('goog.net.XhrIo');

/** @typedef {{icon:object, regexp:object}} */
xmpptk.ui.emoticons.Replacement;

/** @type {object.<xmpptk.ui.emoticons.Replacement>} */
xmpptk.ui.emoticons.replacements = {};

xmpptk.ui.emoticons.path = "images/emoticons/";

xmpptk.ui.emoticons.init = function(base_url) {

    xmpptk.ui.emoticons.path = base_url || xmpptk.ui.emoticons.path;

    goog.net.XhrIo.send(
        xmpptk.ui.emoticons.path + 'icondef.xml',
        function(e) {
            var xhr = /** @type {goog.net.XhrIo} */ (e.target);
            goog.array.forEach(
                xhr.getResponseXml().getElementsByTagName('icon'),
                function(iconEl) {
                    var src = iconEl.getElementsByTagName('graphic').item(0).firstChild.nodeValue;
                    goog.array.forEach(
                        iconEl.getElementsByTagName('text'),
                        function(textEl) {
                            var key = textEl.firstChild.nodeValue;

                            var key_q = key.replace(/\\/g, '\\\\');
                            key_q = key_q.replace(/\)/g, '\\)');
                            key_q = key_q.replace(/\(/g, '\\(');
                            key_q = key_q.replace(/\[/g, '\\[');
                            key_q = key_q.replace(/\]/g, '\\]');
                            key_q = key_q.replace(/\}/g, '\\}');
                            key_q = key_q.replace(/\{/g, '\\{');
                            key_q = key_q.replace(/\//g, '\\/');
                            key_q = key_q.replace(/\|/g, '\\|');
                            key_q = key_q.replace(/\*/g, '\\*');
                            key_q = key_q.replace(/\+/g, '\\+');
                            key_q = key_q.replace(/\?/g, '\\?');
                            key_q = key_q.replace(/\./g, '\\.');
                            key_q = key_q.replace(/>/g, '\\&gt;');
                            key_q = key_q.replace(/</g, '\\&lt;');

                            var icon = new Image();
                            icon.src = xmpptk.ui.emoticons.path + src;

                            xmpptk.ui.emoticons.replacements[key] = {
                                regexp: new RegExp("(\\s\|\^|)"+key_q+"(\\s|\$)", "g"),
                                icon: icon
                            };
                        }
                    );
                }
            );
            xmpptk.ui.emoticons.sortedReplacements = {};
            goog.array.forEach(
                goog.object.getKeys(xmpptk.ui.emoticons.replacements).sort(function(a,b) { return a.length < b.length}),
                function(key) {
                    xmpptk.ui.emoticons.sortedReplacements[key] = xmpptk.ui.emoticons.replacements[key];
                });
            xmpptk.ui.emoticons._logger.info("done initializing emoticons");
        }
    );
};

xmpptk.ui.emoticons._logger = goog.debug.Logger.getLogger('xmpptk.ui.emoticons');
