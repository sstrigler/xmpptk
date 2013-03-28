goog.provide('chat.ui.vCard');

chat.ui.vCard.toHtml = function(vCard) {
    return goog.dom.getOuterHtml(
        chat.ui.vCard._toHtml(
            vCard,
            goog.dom.createElement('dl'),
            ''
        ));
};

chat.ui.vCard._toHtml = function(vCard, parent, path) {
    goog.object.forEach(
        vCard,
        function(val, key) {
            if (key.indexOf('@') === 0)
                return;
            if (key == 'PHOTO')
                return;
            if (typeof val == 'object')
                return chat.ui.vCard._toHtml(val, parent, path+key+'/');
            goog.dom.appendChild(parent, goog.dom.createDom('dt', {}, chat.ui.vCard.lookup(path+key)));
            goog.dom.appendChild(parent, goog.dom.createDom('dd', {}, val));
        });
    return parent;
};

chat.ui.vCard.lookup = function(key) {
    return chat.ui.vCard.LOOKUP_TABLE[key] || key;
};

chat.ui.vCard.LOOKUP_TABLE = {
    'FN': 'Full Name',
    'N/FAMILY': 'Lastname',
    'N/GIVEN': 'Firstname',
    'NICKNAME': 'Nickname',
    'URL': 'Homepage',
    'ADR/LOCALITY': 'City',
    'ADR/REGION': 'State',
    'ADR/CTRY': 'Country',
    'TITLE': 'Occupation',
    'EMAIL/USERID': 'Email',
    'BDAY': 'Birthday',
    'DESC': 'Description'
};
