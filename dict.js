/**
 * Created by Paweł Krawczyk on 02/04/15.
 * https://ipsec.pl/
 */
"use strict";

/** @const */ var /** string */ DEFAULT_LANG = 'english';

/**
 * Validate if input language is a supported one
 * @param {string} lang
 */
function validDictionary(/** string */ lang) {
    // manually managed list of supported dictionaries
    switch (lang) {
        case 'english':
            break;
        case 'russian':
            break;
        case 'polish':
            break;
        default:
            lang = DEFAULT_LANG;
    }
    return lang;
}

// choose a dictionary for specified language and display the first passphrase
/**
 * Load new dictionary for specified language.
 * @param {string} lang
 */
function loadDictionary(/** string */ lang) {

    // validate requested language
    lang = validDictionary(lang);

    console.log('initialising dictionary, lang=', lang);

    var dict_path = 'dict/' + lang + '.js';

    // unhide the "loading dictionary" message
    document.getElementById('loading-dictionary').hidden = false;
    // hide passphrase output field
    document.getElementById('output').hidden = true;

    // delete any previously injected tags
    // just in case, there should be none
    var e = document.getElementById('dictionary');
    if (e) {
        e.remove();
    }

    // prepare script tag to load new dictionary
    var script = document.createElement('script');
    var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
    script.src = dict_path;
    script.id = 'dictionary';
    var done = false;

    // hook function that will be called when dictionary is loaded
    script.onload = script.onreadystatechange = function () {
        if (!done && (!document.readyState || document.readyState == "loaded" || document.readyState == "complete" || document.readyState == "interactive" )) {

            done = true;

            // hide "loading dictionary" message
            document.getElementById('loading-dictionary').hidden = true;
            // unhide passphrase field
            document.getElementById('output').hidden = false;

            // export for the inline HTML calls
            window['pp'] = new PassGen(dictionary, 'output');
            outputNewPassphrase();

            // clean up
            script.onload = script.onreadystatechange = null;
            head.removeChild(script);

            // update dictionary params display
            document.getElementById('dictionary-size').textContent = dictionary.dictionary_size.toFixed();
            document.getElementById('alphabet-size').textContent = dictionary.alphabet_size.toFixed();
            document.getElementById('entropy-per-character').textContent = dictionary.max_entropy_per_char.toFixed(2);
            document.getElementById('entropy-per-word').textContent = dictionary.entropy_per_word.toFixed(2);
        }
    };

    // update the selection list to display the current language
    var o = document.getElementById("lang").options;
    for (var i = 0; i < o.length; i++) {
        if (o[i].value == lang) {
            o[i].selected = true;
        }
    }

    // save current language selection
    if ('localStorage' in window) {
        localStorage.setItem('language', lang);
    }

    // actually inject the tag
    head.insertBefore(script, head.firstChild);
}

// interactive function called from the HTML when user changes dictionary in the selection list
window['switchDict'] = function() {
    var lang = document.getElementById("lang").options[document.getElementById("lang").selectedIndex].value;
    loadDictionary(lang);
};