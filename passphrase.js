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
 * List of currently implemented passphrase transformation methods. Each method
 * supplies information on provided variants (for complexity assessment) and
 * and actual transformation function.
 * @type {*[]}
 */
PassGen.prototype.transform_methods = [
    {   // switch case
        variants: function () {
            return this.d.avg_word_len;
        },
        method:     function (ch) {
            this.done = true;
            return (ch.toUpperCase() == ch) ? ch.toLowerCase() : ch.toUpperCase();
        },
        done: false
    },
    {   // insert special char
        variants: function () {
            return this.d.avg_word_len * SPECIAL_CHARS.length;
        },
        method:     function (ch) {
            var rand_index = this.nist.getRange(SPECIAL_CHARS.length);
            var insert_char = SPECIAL_CHARS[rand_index];
            this.done = true;
            return ch + insert_char;
        },
        done: false,
        nist: null // will be installed by transform() loop
    }
];


/**
 * Transform a Passphrase object by introducing random modifications in the component words.
 * @param pass {Passphrase}
 * @returns {Passphrase}
 */
PassGen.prototype.transform = function (pass) {
    var applied = 0;

    // apply transforms until each of them is applied once
    while(applied < this.transform_methods.length) {
        var newWordsArray = [];
        for (var i = 0; i < pass.length; i++) {
            var word = pass.words[i];
            var newWord = [];
            for (var j = 0; j < word.length; j++) {
                var ch = word[j];

                for(var m=0; m<this.transform_methods.length; m++) {
                    var method = this.transform_methods[m];
                    method.nist = this.nist;
                    if ('done' in method && method.done == true) {
                        applied += 1;
                    } else {
                        // there's 0.5% chance that given transformation kicks in
                        // on each character in each run
                        if (this.nist.getRange(1000) < 50) {
                            ch = method.method(ch);
                        }
                    }
                }

                newWord.push(ch);
            }
            newWordsArray.push(newWord.join(''));
        }
    }
    // clean up
    for(m=0; m<this.transform_methods.length; m++) {
        this.transform_methods[m].done = false;
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
    output.rows = Math.ceil(pass_str.length/output.cols);

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
