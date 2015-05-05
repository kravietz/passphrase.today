/**
 * Created by Paweł Krawczyk on 28/03/15.
 * https://ipsec.pl/
 */
"use strict";

/** @const */ var /** string */ BLOCKCHAIN_STATS_URL = 'https://blockchain.info/stats?format=json';
/** @const */ var /** string */ LS_HASH_RATE = 'blockchain_hash_rate';
/** @const */ var /** string */ LS_HASH_RATE_TIMESTAMP = 'blockchain_hash_rate_timestamp';
/**
 * If on-line hash rate is unreachable we use default value which was recorded on
 * 5 May 2015
 */
/** @const */ var /** float */ DEFAULT_HASH_RATE = 3.457814595843686E8;

/**
 * Estimates entropy of passphrase given the dictionary used to generate it.
 * @constructor
 * @param {Object} dictionary
 */
function EntropyEstimator(/** Object */ dictionary) {
    this.dictionary = dictionary;
}

EntropyEstimator.prototype.nistMap = [4, 2, 2, 2, 2, 2, 2, 2, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5];

EntropyEstimator.prototype.getMinEntropy = function (pass) {
    // run all entropy estimators and
    return Math.min(this.getNist(pass), this.getShannon(pass), this.getWord(pass));
};

/**
 * Returns BlockChain hash rate in Gh/s. If network is not available or a cached value
 * is fresh, it will return a default or cached value.
 * @returns {number}
 */
EntropyEstimator.prototype.getHashRate = function () {
    var hash_rate = DEFAULT_HASH_RATE;
    var blockchain_hash_rate = 0;
    var hash_rate_timestamp = new Date();

    // try to read cached value
    if ('localStorage' in window) {
        hash_rate_timestamp = new Date(localStorage.getItem(LS_HASH_RATE_TIMESTAMP)) || new Date();
        hash_rate = parseFloat(localStorage.getItem(LS_HASH_RATE)) || DEFAULT_HASH_RATE;
        // if cached hash rate younger than 7 days, use the cached value
        if (new Date() - hash_rate_timestamp < 60*60*24*7*1e3) {
            return hash_rate;
        }
    }

    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        var DONE = this.DONE || 4;
        if (this.readyState === DONE) {
            try {
                var stats = JSON.parse(req.responseText);
                blockchain_hash_rate = stats['hash_rate'];
            } catch (e) {
                console.warn('Cannot parse BlockChain response:', e);
                return hash_rate; // return default
            }

            // only record the maximum value seen from BlockChain
            // the current hash rate fluctuates, but for our purposes
            // we're interested in the highest one
            if (blockchain_hash_rate > hash_rate) {
                hash_rate = blockchain_hash_rate;
                if ('localStorage' in window) {
                    localStorage.setItem(LS_HASH_RATE, hash_rate);
                    localStorage.setItem(LS_HASH_RATE_TIMESTAMP, new Date());
                }
            }

            // this is the "fully successful" execution path
            console.log('BlockChain.info hash rate', stats['hash_rate]']);
            return hash_rate;
        }
    };
    try {
        req.open('GET', BLOCKCHAIN_STATS_URL, true);
        req.send(null);
    } catch (e) {
        console.warn('Cannot connect to BlockChain:', e);
        return hash_rate; // return default
    }
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
        dictionary.max_entropy_per_char.toFixed(2), ' bits of entropy'].join(' ');
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
        this.dictionary.entropy_per_word.toFixed(2), ' bits of entropy'].join(' ');
};
