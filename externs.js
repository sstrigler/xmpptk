var JSJaC = function() {};
JSJaC.bind = function(fun, obj) {};

var JSJaCHttpBindingConnection = function() {};
JSJaCHttpBindingConnection.prototype.registerHandler = function(event, handler) {};
JSJaCHttpBindingConnection.prototype.registerIQSet = function(child, ns, handler) {};
JSJaCHttpBindingConnection.prototype.connect = function(cfg) {};
JSJaCHttpBindingConnection.prototype.disconnect = function() {};
JSJaCHttpBindingConnection.prototype.resume = function() {};
JSJaCHttpBindingConnection.prototype.send = function(p) {};
JSJaCHttpBindingConnection.prototype.sendIQ = function(p, handlers, context) {};
JSJaCHttpBindingConnection.prototype.suspend = function(p) {};

var JSJaCPacket = function() {};
JSJaCPacket.prototype.appendNode = function(str, obj, val) {};
JSJaCPacket.prototype.buildNode = function(str, obj, val) {};
JSJaCPacket.prototype.errorReply = function(errrorCondition) {};
JSJaCPacket.prototype.getChild = function(tag, ns) {};
JSJaCPacket.prototype.getChildVal = function(tag, ns) {};
JSJaCPacket.prototype.getDoc = function() {};
JSJaCPacket.prototype.getFrom = function() {};
JSJaCPacket.prototype.getFromJID = function() {};
JSJaCPacket.prototype.getNode = function() {};
JSJaCPacket.prototype.getType = function() {};
JSJaCPacket.prototype.isError = function() {};
JSJaCPacket.prototype.pType = function() {};
JSJaCPacket.prototype.setTo = function(str) {};
JSJaCPacket.prototype.setType = function(str) {};
JSJaCPacket.prototype.xml = function() {};

var JSJaCPresence = function() {};
JSJaCPresence.prototype.getPriority = function() {};
JSJaCPresence.prototype.getShow = function() {};
JSJaCPresence.prototype.getStatus = function() {};
JSJaCPresence.prototype.setPriority = function() {};
JSJaCPresence.prototype.setShow = function(str) {};
JSJaCPresence.prototype.setStatus = function(str) {};

var JSJaCMessage = function() {};
JSJaCMessage.prototype.getBody = function() {};
JSJaCMessage.prototype.getChatState = function() {};
JSJaCMessage.prototype.getSubject = function() {};
JSJaCMessage.prototype.setBody = function(str) {};
JSJaCMessage.prototype.setChatState = function(state) {};
JSJaCMessage.prototype.setSubject = function(str) {};

var JSJaCIQ = function() {};
JSJaCIQ.prototype.getQuery = function(str) {};
JSJaCIQ.prototype.reply = function(nodeList) {};
JSJaCIQ.prototype.setIQ = function(to, type, id) {};
JSJaCIQ.prototype.setQuery = function(str) {};

var JSJaCJID = function() {};
JSJaCJID.prototype.getBareJID = function() {};
JSJaCJID.prototype.getNode = function() {};
JSJaCJID.prototype.getDomain = function() {};
JSJaCJID.prototype.getResource = function() {};
JSJaCJID.prototype.isEntity = function() {};
JSJaCJID.prototype.removeResource = function() {};
JSJaCJID.prototype.setNode = function(str) {};
JSJaCJID.prototype.setDomain = function(str) {};
JSJaCJID.prototype.setResource = function(str) {};
JSJaCJID.prototype.toString = function() {};

Date.jab2date = function(str) {};

var gettext = function(msgid) {};
var ngettext = function(singular, plural, count) {};
var interpolate = function(msgid, obj, named) {};
