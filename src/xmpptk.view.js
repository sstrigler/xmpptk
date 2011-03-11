goog.provide('xmpptk.view');

goog.require('xmpptk.observer');

goog.require('goog.object');
goog.require('goog.array');

xmpptk.view = function() {
    xmpptk.observer.call(this);
};
goog.inherits(xmpptk.view, xmpptk.observer);

xmpptk.view.MAX_WORD_LENGTH = 28;

xmpptk.view.cropLongWords = function(msg, length, forceBreak) {
    var ret = [];
    goog.array.forEach(
    msg.split(" "),
    function(word) {
      if (word.length > length) {
	var tokens = [];
	while (word.length >= length) {
	  tokens.push(word.slice(0, length));
	  word = word.slice(length);
	}
        if (word) {
          tokens.push(word);
        }
        
        if ( forceBreak == true ) {
        	word = tokens.join('<br />');
        } else {
        	word = tokens.join('<wbr />');
        }
	
      }
      ret.push(word);
    });
  return ret.join(" ");
};

xmpptk.view.fixID = function(str) {
    // DOM doesn't allow some chars for ids within DOM elements
    str = str.replace(/@/g, '_at_');
    str = str.replace(/\./g, '_dot_');
    str = str.replace(/\-/g, '_dash_');
    str = str.replace(/\//g, '_slash_');
    return str;
};

xmpptk.view.hrTime = function(ts) {
    // converts timestamp ts to human readable time string
    var str = '';
    
    var m2 = function(num) { return (num<10)?"0"+num:num; }
    
    var now = new Date();
    var ystrdy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var date = new Date(ts);
    
    if (ts < ystrdy.getTime()) {
        if (ts > ystrdy.getTime()-24*3600000) {
            str = "yesterday";
        } else {
            str = date.getDate()+"."+m2(date.getMonth()+1);
        }
    } else {
        str = m2(date.getHours())+":"+m2(date.getMinutes())+" h";
    }
    return str;
};

xmpptk.view.htmlEnc = function(str) {
    if (!str) {
        return '';
    }
    
    str = str.replace(/&/g,"&amp;");
    str = str.replace(/</g,"&lt;");
    str = str.replace(/>/g,"&gt;");
    str = str.replace(/\"/g,"&quot;");
    return str;
};

xmpptk.view.msgFormat = function(msg) { 
    // replaces emoticons and urls in a message
    if (!msg) {
        return null;
    }

    msg = xmpptk.view.htmlEnc(msg);
  
    msg = xmpptk.view.cropLongWords(msg, xmpptk.view.MAX_WORD_LENGTH);
    
    // TODO

    // make sure xmpptk.emoticons is initialized already, could be
    // done by using a singleton

    goog.object.forEach(
        xmpptk.emoticons,
        function(key, item) {
            if (typeof item.icon.width != 'undefined' && item.icon.width && item.icon.width > 0 && item.icon.height > 0) {
	        msg = msg.replace(item.regexp,"$1<img src=\""+item.icon.src+"\" width='"+item.icon.width+"' height='"+item.icon.height+"' alt=\""+key+"\" title=\""+key+"\">$2");
            } else {
	        msg = msg.replace(item.regexp,"$1<img src=\""+item.icon.src+"\" alt=\""+key+"\" title=\""+key+"\">$2");
            }
        }
    );
  
    // Replace http://<url>
    msg = msg.replace(/(\s|^)(https?:\/\/\S+)/gi,"$1<a href=\"$2\" target=\"_blank\">$2</a>");
  
    // replace ftp://<url>
    msg = msg.replace(/(\s|^)(ftp:\/\/\S+)/gi,"$1<a href=\"$2\" target=\"_blank\">$2</a>");
    
    // replace mail-links
    msg = msg.replace(/(\s|^)(\w+\@\S+\.\S+)/g,"$1<a href=\"mailto:$2\">$2</a>");
    
    // replace *bla*
    msg = msg.replace(/(\s|^)\*([^\*\r\n]+)\*/g,"$1<b>$2</b>");
  
    // replace _bla_ 
    msg = msg.replace(/(\s|^)\_([^\_\r\n]+)\_/g,"$1<u>$2</u>");
    
    // replace /bla/ 
    msg = msg.replace(/(\s|^)\/([^\/\r\n]+)\//g,"$1<i>$2</i>");

    msg = msg.replace(/\n/g,"<br>");

    return msg;
};
