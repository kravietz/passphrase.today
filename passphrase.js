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
        this.words = words;
    } else {
        this.words = [];
    }
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
        this.target_entropy = parseInt(localStorage.getItem('spgen.target_entropy')) || DEFAULT_TARGET_ENTROPY;
    }
}

// actual passphrase generation routine
// append random words until the resulting
// passphrase meets the entropy target
PassGen.prototype.gen = function () {
    var passArray = [];
    do {
        passArray.push(this.d.dictionary[this.nist.getRange(this.d.dictionary_size)]);
    } while (this.ee.getMinEntropy(passArray) < this.target_entropy);
    return new Passphrase(passArray);
};

// transform a dictionary-based passphrase
// by randomly modifying the words
PassGen.prototype.transform = function (pass) {
    var mutations = [false, false];
    var newWordsArray = [];

    for (var i = 0; i < pass.words.length; i++) {
        var word = pass.words[i];
        var newWord = [];
        for (var j = 0; j < word.length; j++) {
            var ch = word[j];

            if (!mutations[0] && this.nist.getRange(1000) < 100) {
                ch = (ch.toUpperCase() === ch) ? ch.toLowerCase() : ch.toUpperCase();
                mutations[0] = true;
            }
            if (!mutations[1] && this.nist.getRange(1000) < 100) {
                ch = SPECIAL_CHARS[this.nist.getRange(SPECIAL_CHARS.length)];
                mutations[1] = true;
            }

            newWord.push(ch);
        }
        newWordsArray.push(newWord.join(''));
    }
    return new Passphrase(newWordsArray);
};

// reduce target entropy by 1
PassGen.prototype.less = function () {
    if (this.target_entropy > 1) {
        this.target_entropy -= ENTROPY_STEP;
        if ('localStorage' in window) {
            localStorage.setItem('spgen.target_entropy', this.target_entropy);
        }
    }
};

// increase target entropy
PassGen.prototype.more = function () {
    this.target_entropy += ENTROPY_STEP;
    if ('localStorage' in window) {
        localStorage.setItem('spgen.target_entropy', this.target_entropy);
    }
};

// insert the generated passphrase into HTML block
PassGen.prototype.insert = function (pass) {
    document.getElementById(this.id).innerHTML = pass.toHtml();

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
