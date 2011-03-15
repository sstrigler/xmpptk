goog.provide('xmpptk.ui.emoticons');

goog.require('goog.object');

xmpptk.ui.emoticons = {
};

xmpptk.ui.emoticons.path = "images/emoticons/";

xmpptk.ui.emoticons.init = function(base_url) {

  if (typeof base_url != 'undefined') {
    xmpptk.ui.emoticons.path = base_url + xmpptk.ui.emoticons.path;
  }

  goog.object.foreach(
    xmpptk.ui.emoticons,
    function(val, key) {

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

      var icon = new Image();
      icon.src = xmpptk.ui.emoticons.path + val;

      xmpptk.ui.emoticons[key] = {regexp: eval("/\(\\s\|\^\)"+key_q+"\(\\s|\$\)/g"), icon: icon};
    }
  );
};
