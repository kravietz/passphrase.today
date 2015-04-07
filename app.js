/**
 * Created by Paweł Krawczyk on 19/03/15.
 * https://ipsec.pl/
 */
"use strict";

// placeholders
window['dictionary'] = {};
window['pp'] = {};
window['pass'] = "";

window['toggle'] = function () {
    var e = document.getElementById('advanced');
    e.hidden = e.hidden ? false : true;
};
window['ppNewPass'] = function () {
    window['pass'] = window['pp'].gen();
    window['pp'].insert(window['pp'].transform(window['pass']));
};
window['ppNewTrans'] = function () {
    window['pp'].insert(window['pp'].transform(window['pass']));

};
window['ppLess'] = function () {
    window['pp']['less']();
    window['ppNewPass']();
};
window['ppMore'] = function () {
    window['pp']['more']();
    window['ppNewPass']();
};

window['start'] = function () {
    // framebuster
    if (self == top) {
        console.log('main view enabled');
        document.documentElement.style.display = 'block';
    } else {
        console.warn('frames detected');
        top.location = self.location;
    }

    window['sjcl']['random']['startCollectors']();

    // ensure PRNG is working
    if (window['sjcl']['random']['isReady']()) {

        var lang;
        if ('localStorage' in window) {
            lang = localStorage.getItem('language') || DEFAULT_LANG;
        } else {
            lang = DEFAULT_LANG;
        }

        // load dictionary for current language
        // and inject first passphrase
        loadDictionary(lang);

    } else {

        // something went wrong, display error and die
        console.error('SJCL not ready');
        var msg = 'Sorry, your browser does not support cryptographic random numbers.';
        document.getElementById('output').innerHTML = msg;
        document.className = 'alert alert-danger';
        console.error(msg);
    }

    // add titles to the advanced tab
    addTitles();
};