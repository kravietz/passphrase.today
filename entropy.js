/**
 * Created by Paweł Krawczyk on 28/03/15.
 * https://ipsec.pl/
 */
"use strict";

/**
 * Estimates entropy of passphrase given the dictionary used to generate it.
 * @constructor
 * @param {Object} dictionary
 */
function EntropyEstimator(/** Object */ dictionary) {
    this.dictionary = dictionary;
}

EntropyEstimator.prototype.nistMap = [4, 2, 2, 2, 2, 2, 2, 2, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5];

EntropyEstimator.prototype.getMinEntropy = function(pass) {
    // run all entropy estimators and
    return Math.min(this.getNist(pass), this.getShannon(pass), this.getWord(pass));
};

EntropyEstimator.prototype.getShannon = function (pass) {
    // Theoretical maximum entropy from the Shannon formula
    // Per-character entropy is calculated based on the
    // actual frequency of the characters in the dictionary
    var passText = pass.toString();
    return passText.length * dictionary.max_entropy_per_char;
};
EntropyEstimator.prototype.getShannonExplain = function (pass) {
    var passText = pass.toString();
    return ['Because the passphrase has', passText.length, ' characters',
            'and each character in this dictionary provides on average ',
            dictionary.max_entropy_per_char.toFixed(2),' bits of entropy'].join(' ');
};

EntropyEstimator.prototype.getNist = function (pass) {
    // Based on the algorithm proposed in NIST SP800-63, pp 49-50
    // Assigns entropy to password characters based on their position
    // based on the following table

    var passText = pass.toString();

    // from character 20 up expand based on the password length
    if (passText.length > 20) {
        for (var i = 0; i < passText.length - 20; i++) this.nistMap.push(1);
    }

    // map entropies to password chars and sum
    var sum = 0;
    for (i = 0; i < passText.length; i++) sum += this.nistMap[i];

    // bonus for uppercase characters
    if (passText !== passText.toLowerCase()) {
        sum += 6;
    }

    return sum;
};
EntropyEstimator.prototype.getNistExplain = function (pass) {
    var passText = pass.toString();
    return ['Because the passphrase has', passText.length, ' characters',
            'and the result is a sum of NIST entropy values on their positions'].join(' ');
};

EntropyEstimator.prototype.getWord = function (pass) {
    return this.dictionary.entropy_per_word * pass.length;
};
EntropyEstimator.prototype.getWordExplain = function (pass) {
    return ['Because the passphrase has', pass.length, ' words',
            'and each word in this dictionary on average provides',
            this.dictionary.entropy_per_word.toFixed(2),' bits of entropy'].join(' ');
};
