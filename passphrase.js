/**
 * Created by Paweł Krawczyk on 01/04/15.
 * https://ipsec.pl/
 */
"use strict";

/** @const */ var /** number */ DEFAULT_TARGET_ENTROPY = 35;
/** @const */ var /** number */ ENTROPY_STEP = 1;
/** @const */ var /** string */ SPECIAL_CHARS = '!#$%&()*+,-./0123456789:;<=>?@[\\]^_{}~';

/**
 * Object for storing passphrase in structured format.
 * @constructor
 * @param {?Array<string>} words
 */
function Passphrase(/** ?Array<string> */ words) {
    if (words) {
        // the actual passphrase words array
        this.words = words;
    } else {
        this.words = [];
    }

    // word count
    this.length = this.words.length;
}
Passphrase.prototype.toString = function () {
    return this.words.join(' ');
};
Passphrase.prototype.toHtml = function () {
    return this.words.join('&nbsp;');
};

/**
 * Passphrase generator class. Uses dictionary to generate
 * random words and can inject them into HTML sections identified
 * by identifier id.
 * @constructor
 * @param {Object} d
 * @param {string} id
 */
function PassGen(/** Object */ d, /** string */ id) {
    this.d = d;     // dictionary
    this.id = id;   // id of the target HTML element to insert the result
    this.target_entropy = DEFAULT_TARGET_ENTROPY;
    this.nist = new NistRandom;
    this.ee = new EntropyEstimator(this.d);

    if ('localStorage' in window) {
        this.target_entropy = parseInt(localStorage.getItem(LS_TARGET_ENTROPY)) || DEFAULT_TARGET_ENTROPY;
    }
}


/**
 * Generate a passphrase by outputting random words until the whole string satisfies the
 * entropy requirement
 * @return {Passphrase}
 */
PassGen.prototype.gen = function () {
    var passArray = [];
    var dict_size = this.d.dictionary_size;
    do {
        var random_index = this.nist.getRange(dict_size);
        var random_word = this.d.dictionary[random_index];
        passArray.push(random_word);
    } while (this.ee.getMinEntropy(passArray) < this.target_entropy);
    return new Passphrase(passArray);
};

/**
 * Transform a Passphrase object by introducing random modifications in the component words.
 * @param pass {Passphrase}
 * @returns {Passphrase}
 */
PassGen.prototype.transform = function (pass) {
    var mutations_applied = [false, false];

    while(mutations_applied[0] == false || mutations_applied[1] == false) {
        var newWordsArray = [];
        for (var i = 0; i < pass.length; i++) {
            var word = pass.words[i];
            var newWord = [];
            for (var j = 0; j < word.length; j++) {
                var ch = word[j];

                if (!mutations_applied[0] && this.nist.getRange(1000) < 100) {
                    // replace with case toggled
                    ch = (ch.toUpperCase() === ch) ? ch.toLowerCase() : ch.toUpperCase();
                    mutations_applied[0] = true;
                }
                if (!mutations_applied[1] && this.nist.getRange(1000) < 100) {
                    // inject special char instead of replacing
                    newWord.push(SPECIAL_CHARS[this.nist.getRange(SPECIAL_CHARS.length)]);
                    mutations_applied[1] = true;
                }

                newWord.push(ch);
            }
            newWordsArray.push(newWord.join(''));
        }
    }
    return new Passphrase(newWordsArray);
};

/**
 * Reduce generator's entropy target.
 */
PassGen.prototype.less = function () {
    if (this.target_entropy > 1) {
        this.target_entropy -= ENTROPY_STEP;
        if ('localStorage' in window) {
            localStorage.setItem(LS_TARGET_ENTROPY, this.target_entropy);
        }
    }
};

/**
 * Increase generator's entropy target.
 */
PassGen.prototype.more = function () {
    this.target_entropy += ENTROPY_STEP;
    if ('localStorage' in window) {
        localStorage.setItem(LS_TARGET_ENTROPY, this.target_entropy);
    }
};

/**
 * Insert a passphrase into a HTML block.
 * @param pass {Passphrase}
 */
PassGen.prototype.insert = function (pass) {
    // actually output the passphrase into the target field
    var pass_str = pass.toString();
    var output = document.getElementById(this.id);
    // actually insert the passphrase string
    output.textContent = pass_str;
    // rescale to fit without scrolling
    output.rows = Math.ceil(pass_str.length/output.cols) + 1;

    document.getElementById('pp-target-entropy').textContent = this.target_entropy;
    var p = document.getElementById('pp-character-entropy');
    p.textContent = this.ee.getShannon(pass).toFixed(2);
    p.setAttribute('title', this.ee.getShannonExplain(pass));

    p = document.getElementById('pp-nist-entropy');
    p.textContent = this.ee.getNist(pass).toFixed(2);
    p.setAttribute('title', this.ee.getNistExplain(pass));

    p = document.getElementById('pp-word-entropy');
    p.textContent = this.ee.getWord(pass).toFixed(2);
    p.setAttribute('title', this.ee.getWordExplain(pass));
};
