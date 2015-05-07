/**
 * Created by Paweł Krawczyk on 19/03/15.
 * https://ipsec.pl/
 */
"use strict";

/** @const */ var /** string */ LS_LANGUAGE= 'language';

// placeholders
window['dictionary'] = {}; // export for Closure
window.pp = {};
window.pass = "";

function toggleAdvanced() {
    var e = document.getElementById('advanced');
    e.hidden = e.hidden ? false : true;
}

function outputNewPassphrase() {
    window.pass = window.pp.gen();
    window.pp.insert(window.pp.transform(window.pass));
}

function outputNewTransform() {
    window.pp.insert(window.pp.transform(window.pass));
}

function lessEntropy() {
    window.pp.less();
    outputNewPassphrase();
}

function moreEntropy() {
    window.pp.more();
    outputNewPassphrase();
}

// uses dict.js
function switchDictionary() {
    var selected_lang = document.getElementById("lang").options[document.getElementById("lang").selectedIndex].value;
    loadDictionary(selected_lang);
}

function start() {
    // frame buster
    if (self == top) {
        console.log('main view enabled');
        document.documentElement.style.display = 'block';
    } else {
        console.warn('frames detected');
        top.location = self.location;
    }

    window['sjcl']['random']['startCollectors'](); // export for Closure

    // ensure PRNG is working
    if (window['sjcl']['random']['isReady']()) { // export for Closure

        var lang;
        if ('localStorage' in window) {
            lang = localStorage.getItem(LS_LANGUAGE) || DEFAULT_LANG;
        } else {
            lang = DEFAULT_LANG;
        }

        // load dictionary for current language
        // and inject first passphrase
        loadDictionary(lang);

    } else {

        // something went wrong, display error and die
        console.error('SJCL not ready');
        var err = document.createElement('span');
        err.setAttribute('class', "alert-danger");
        err.setAttribute('role', 'alert');
        var msg = 'Sorry, your browser does not support cryptographic random numbers.';
        err.textContent = msg;
        document.getElementById('output-wrapper').appendChild(err);
        console.error(msg);
    }

    // add titles to the advanced tab
    addTitles();

    document.getElementById('toggle-advanced-element').addEventListener('click', toggleAdvanced);
    document.getElementById('new-pass-element').addEventListener('click', outputNewPassphrase);
    document.getElementById('new-trans-element').addEventListener('click', outputNewTransform);
    document.getElementById('less-entropy-element').addEventListener('click', lessEntropy);
    document.getElementById('more-entropy-element').addEventListener('click', moreEntropy);

    document.getElementById('lang').addEventListener('change', switchDictionary);
}

// actually start the application
// event handler is used to avoid CSP complaints about inline event handlers
document.addEventListener('DOMContentLoaded', start);
