goog.provide('xmpptk.emotions');

goog.require('goog.object');

xmpptk.emoticons = {
  ':-)' : 'happy.gif',
  ':)'  : 'happy.gif',
  '=)'  : 'happy.gif',
  ':]'  : 'happy.gif',
  ':&gt;' : 'happy.gif',

  ';-)' : 'wink.gif',
  ';)'  : 'wink.gif',
  ';]'  : 'wink.gif',

  ':-D' : 'lol.gif',
  ':D'  : 'lol.gif',
  '=D'  : 'lol.gif',
  'xD'  : 'lol.gif',

  ':-(' : 'sad.gif',
  ':('  : 'sad.gif',
  '=('  : 'sad.gif',
  ':['  : 'sad.gif',
  ':&lt;' : 'sad.gif',

  ':-P' : 'tongue-out.gif',
  ':p'  : 'tongue-out.gif',
  '=P'  : 'tongue-out.gif',
  ':P'  : 'tongue-out.gif',
  ':Þ'  : 'tongue-out.gif',
  ':þ'  : 'tongue-out.gif',
  'xP'  : 'tongue-out.gif',
  ';p'  : 'tongue-out.gif',

  ':-0' : 'surprised.gif',
  ':o'  : 'surprised.gif',
  '=O'  : 'surprised.gif',
  ':0'  : 'surprised.gif',

  '&lt;:o)': 'party.gif',

  '[:-)': 'earphones.gif',

  '(-:' : 'happy.gif',

  ':-*)': 'turning-pink.gif',

  '%-)' : 'confused.gif',

  ':\'-(': 'crying.gif',
  ':,(' : 'crying.gif',

  ':-X' : 'not-telling.gif',
  ':-x' : 'not-telling.gif',
  ':*'  : 'not-telling.gif',
  ':-*' : 'not-telling.gif',
  '=*'  : 'not-telling.gif',

  ':-|' : 'sleep.gif', //    ich sage diesmal nichts, Teilnahmslosigkeit    

  ':-/' : 'not-funny.gif',

  ':*)' : 'drunk.gif',

  '8-)' : 'nerd-glasses.gif',

  ':-Q' : 'smoking.gif', 

  ':S'  : 'dizzy.gif', 
  ':-$' : 'dizzy.gif',

  '0:-)': 'angel.gif',

  '=|:)=': 'lincoln.gif',
  '==|:)=': 'lincoln.gif',

  '|*-*|': 'cassette.gif',

  ';o))': 'wink.gif',

  ':))' : 'super-happy.gif',

  ':-o' : 'ohoh.gif',

  'oO'  : 'surprised.gif',
  'Oo'  : 'surprised.gif',
  'ôÔ'  : 'surprised.gif',
  'Ôô'  : 'surprised.gif',

  '&gt;-(' : 'angry.gif',
  '&gt;:-€': 'angry.gif',

  ':-@' : 'yelling.gif',

  '%-}' : 'nonsense.gif',

  '&gt;-)' : 'naughty-smile.gif',

  'B-)' : 'sunglasses.gif',

  'd:-)': 'hat.gif',

  ';o)' : 'wink.gif',

  '{:-)': 'toupee.gif',

  ']:-)': 'devil.gif',
  '&gt;:-)': 'devil.gif',
  '&gt;:)' : 'devil.gif', 
  '}:-&gt;': 'devil.gif',

  '+=:-)': 'pope.gif',
  
  ':-è' : 'fish-tank.gif'
};

xmpptk.emoticons.path = "images/emoticons/";

xmpptk.emoticons.init = function(base_url) {

  if (typeof base_url != 'undefined') {
    xmpptk.emoticons.path = base_url + xmpptk.emoticons.path;
  }

  goog.object.foreach(
    xmpptk.emoticons,
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
      icon.src = xmpptk.emoticons.path + val;

      xmpptk.emoticons[key] = {regexp: eval("/\(\\s\|\^\)"+key_q+"\(\\s|\$\)/g"), icon: icon};
    }
  );
};
