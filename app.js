/**
 * Created by Paweł Krawczyk on 19/03/15.
 * https://ipsec.pl/
 */
"use strict";

/** @const */ var /** string */ LS_LANGUAGE= 'language';

// export for Closure, initialised in dict.js
window['dictionary'] = {};
// placeholders
window.pp = {};
window.ee = {};
window.pass = "";

function toggleAdvanced() {
    var e = document.getElementById('advanced');
    e.hidden = e.hidden ? false : true;
}

function outputNewPassphrase() {
    // generate & output new passphrase
    // keep it global so that pass doesn't change when cycling transformations
    window.pass = window.pp.gen();
    window.transformed = window.pp.transform(window.pass);
    insertPassphrase(window.transformed);
}

function outputNewTransform() {
    // generate new transformation of the existing passphrase
    window.transformed = window.pp.transform(window.pass);
    insertPassphrase(window.transformed);
}

function insertPassphrase(passphrase) {
    // actually output the passphrase into the target field
    var pass_str = passphrase.toString();
    var output = document.getElementById('output');
    // actually insert the passphrase string
    output.textContent = pass_str;
    // rescale to fit without scrolling
    output.rows = Math.ceil(pass_str.length/output.cols);

    // update stats
    var p = document.getElementById('pp-character-entropy');
    p.textContent = window.ee.getShannon(passphrase).toFixed(2);
    p.setAttribute('title', window.ee.getShannonExplain(passphrase));

    p = document.getElementById('pp-nist-entropy');
    p.textContent = window.ee.getNist(passphrase).toFixed(2);
    p.setAttribute('title', window.ee.getNistExplain(passphrase));

    p = document.getElementById('pp-word-entropy');
    p.textContent = window.ee.getWord(passphrase).toFixed(2);
    p.setAttribute('title', window.ee.getWordExplain(passphrase));

    p = document.getElementById('pp-cracking-time');
    p.textContent = window.ee.getCrackTimeText(passphrase, "word");
    p.setAttribute('class', window.ee.getCrackTimeText(passphrase, "class"));
    var time_to_crack_detailed = window.ee.getCrackTime(passphrase);
    p.setAttribute('title', time_to_crack_detailed.toString() + ' seconds');

    document.getElementById('pp-target-entropy').textContent = window.pp.target_entropy;
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
