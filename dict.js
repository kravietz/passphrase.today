/**
 * Created by Paweł Krawczyk on 02/04/15.
 * https://ipsec.pl/
 */
"use strict";

/** @const */ var DEFAULT_LANG = 'english';

// choose a dictionary for specified language and display the first passphrase
function loadDictionary(lang) {
    console.log('dictionary change=', lang);
    // validate
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
    var dict_path = 'dict/' + lang + '.js';

    // delete any previously injected tags
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
    script.onload = script.onreadystatechange = function () {
        if (!done && (!document.readyState ||
            document.readyState == "loaded" || document.readyState == "complete")) {
            done = true;

            // export for the inline HTML calls
            window['pp'] = new PassGen(dictionary, 'output');
            window['ppNewPass']();

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
}