/**
 * Created by Paweł Krawczyk on 19/03/15.
 * https://ipsec.pl/
 */
"use strict";

// placeholders
window['dictionary'] = {};
window['pp'] = {};
window['pass'] = "";

function toggleAdvanced() {
    var e = document.getElementById('advanced');
    e.hidden = e.hidden ? false : true;
}

function outputNewPassphrase() {
    window['pass'] = window['pp'].gen();
    window['pp'].insert(window['pp'].transform(window['pass']));
}

function outputNewTRansform() {
    window['pp'].insert(window['pp'].transform(window['pass']));
}

function lessEntropy() {
    window['pp']['less']();
    outputNewPassphrase();
}

function moreEntropy() {
    window['pp']['more']();
    outputNewPassphrase();
}

function start() {
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

    document.getElementById('toggle-advanced-element').addEventListener('click', toggleAdvanced);
    document.getElementById('new-pass-element').addEventListener('click', outputNewPassphrase);
    document.getElementById('new-trans-element').addEventListener('click', outputNewTRansform);
    document.getElementById('less-entropy-element').addEventListener('click', lessEntropy);
    document.getElementById('more-entropy-element').addEventListener('click', moreEntropy);
}

// actually start the application
// event handler is used to avoid CSP complaints about inline event handlers
document.addEventListener('DOMContentLoaded', start);