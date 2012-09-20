goog.provide('xmpptk.ui');
goog.provide('xmpptk.ui.View');

goog.require('xmpptk.Observer');
goog.require('xmpptk.Model');
goog.require('xmpptk.ui.emoticons');

goog.require('goog.object');
goog.require('goog.array');

/**
 * @constructor
 * @param {xmpptk.Model} model
 */
xmpptk.ui.View = function(model) {
    xmpptk.Observer.call(this, model);
};
goog.inherits(xmpptk.ui.View, xmpptk.Observer);

xmpptk.ui.MAX_WORD_LENGTH = 28;

/**
 * Cut a string at given length (and append '...' if too long)
 *
 * @param {string} str the string to cut
 * @param {int} len the maximum length of the string
 */
xmpptk.ui.cut = function(str, len) {
    if (!str) {
      return '';
    }
    if (str.length > len) {
      return str.substring(0, len-3)+"...";
    }
    return str;
};

/**
 * makes sure we don't have words within a message that are too long
 * for a single line
 *
 * @param {string} msg the message to parse
 * @param {int} length the maximum length allowed for a word
 * @param {boolean} forceBreak wether to use <br> or <wbr> for splitting up words
 */
 xmpptk.ui.cropLongWords = function(msg, length, forceBreak) {
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
				
				if ( forceBreak === true ) {
                    word = tokens.join('<br />');
				} else {
                    word = tokens.join('<wbr />');
				}
				
			}
			ret.push(word);
		});
	return ret.join(" ");
};

xmpptk.ui.fixID = function(str) {
    // DOM doesn't allow some chars for ids within DOM elements
    str = str.replace(/@/g, '_at_');
    str = str.replace(/\./g, '_dot_');
    str = str.replace(/\-/g, '_dash_');
    str = str.replace(/\//g, '_slash_');
    return str;
};

xmpptk.ui.hrTime = function(ts) {
    // converts timestamp ts to human readable time string
    var str = '';

    var m2 = function(num) { return (num<10)?"0"+num:num; };

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

xmpptk.ui.htmlEnc = function(str) {
    if (!str) {
        return '';
    }

    str = str.replace(/&/g,"&amp;");
    str = str.replace(/</g,"&lt;");
    str = str.replace(/>/g,"&gt;");
    str = str.replace(/\"/g,"&quot;");
    return str;
};

xmpptk.ui.msgFormat = function(msg) {
    // replaces emoticons and urls in a message
    if (!msg) {
        return null;
    }

    msg = xmpptk.ui.htmlEnc(msg);
//    msg = xmpptk.ui.cropLongWords(msg, xmpptk.ui.MAX_WORD_LENGTH);

    goog.object.forEach(
        xmpptk.ui.emoticons.sortedReplacements,
        function(item, key) {
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
