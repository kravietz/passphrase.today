/**
 * Created by Paweł Krawczyk on 28/03/15.
 * https://ipsec.pl/
 */
"use strict";

/** @const */ var /** string */ BLOCKCHAIN_STATS_URL = 'https://blockchain.info/q/hashrate';
/** @const */ var /** string */ LS_HASH_RATE = 'blockchain_hash_rate';
/** @const */ var /** string */ LS_HASH_RATE_TIMESTAMP = 'blockchain_hash_rate_timestamp';
/** @const */ var /** Array<number> */ NIST_MAP = [4, 2, 2, 2, 2, 2, 2, 2, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5];
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

EntropyEstimator.prototype.nistMap = NIST_MAP;

EntropyEstimator.prototype.getMinEntropy = function (pass) {
    // run all entropy estimators and
    return Math.min(this.getNist(pass), this.getShannon(pass), this.getWord(pass));
};

/**
 * Estimate time to crack using Bitcoin hash rate.
 * @param pass
 * @returns {number}
 */
EntropyEstimator.prototype.getCrackTime = function (pass) {
    var hash_rate_bn = new sjcl.bn;
    hash_rate_bn.initWith(Math.ceil(this.getHashRate()));
    // nominal hash rate is in Gh/s, normalize to h/s
    hash_rate_bn = hash_rate_bn.mul(1e9);

    // keyspace when cracking as combination of dictionary words
    // keyspace = keyspace ** words_in_passphrase
    var keyspace_as_words_bn = new sjcl.bn;
    keyspace_as_words_bn.initWith(this.dictionary.dictionary_size);
    var words_in_passphrase = pass.length;
    keyspace_as_words_bn = keyspace_as_words_bn.power(words_in_passphrase);

    // return estimated time to crack
    return keyspace_as_words_bn / hash_rate_bn;
};

/**
 * Estimate cracking time in words.
 * @param pass {Object}
 * @returns {string}
 */
EntropyEstimator.prototype.getCrackTimeText = function (pass) {
    var crack_time_seconds = this.getCrackTime(pass);

    var ret = "seconds";

    if (crack_time_seconds > 60) {
        ret = "minutes";
    }
    if (crack_time_seconds > 3600) {
        ret = "hours";
    }
    if (crack_time_seconds > 3600*24) {
        ret = "days";
    }
    if (crack_time_seconds > 3600*24*30) {
        ret = "months";
    }
    if (crack_time_seconds > 3600*24*365) {
        ret = "years";
    }
    if (crack_time_seconds > 3600*24*365*10) {
        ret = "tens of years";
    }
    if (crack_time_seconds > 3600*24*365*100) {
        ret = "hundreds of years";
    }
    if (crack_time_seconds > 3600*24*365*1000) {
        ret = "thousands of years";
    }

    return ret;
};

/**
 * Returns BlockChain hash rate in Gh/s. If network is not available or a cached value
 * is fresh, it will return a default or cached value.
 * @returns {number}
 */
EntropyEstimator.prototype.getHashRate = function () {
    // try to read cached values
    if (this.hash_rate === undefined) {
        if ('localStorage' in window) {
            this.hash_rate = parseFloat(localStorage.getItem(LS_HASH_RATE)) || DEFAULT_HASH_RATE;
        } else {
            this.hash_rate = DEFAULT_HASH_RATE;
        }
    }
    if (this.hash_rate_timestamp === undefined) {
        if ('localStorage' in window) {
            this.hash_rate_timestamp = new Date(localStorage.getItem(LS_HASH_RATE_TIMESTAMP)) || new Date();
        } else {
            this.hash_rate_timestamp = new Date();
        }
    }

    // if cached hash rate younger than 1 day, use the cached value
    if (new Date() - this.hash_rate_timestamp < 60*60*24*1e3) {
        return this.hash_rate;
    }

    // check at BlockChain.info
    var req = new XMLHttpRequest();

    try {
        req.open('GET', BLOCKCHAIN_STATS_URL, false /* synchronous request */ );
        req.send(null);
    } catch (e) {
        console.warn('Cannot connect to BlockChain:', e);
        return this.hash_rate; // return default
    }

    // parse API response with a sanity check
    // as parseFloat() can return NaN
    var blockchain_hash_rate = 0;
    if (parseFloat(req.responseText) > 0) {
        blockchain_hash_rate = parseFloat(req.responseText);
    }

    // only record the maximum value seen from BlockChain
    // the current hash rate fluctuates, but for our purposes
    // we're interested in the highest one
    if (blockchain_hash_rate > this.hash_rate) {
        this.hash_rate = blockchain_hash_rate; // update the object's value
        if ('localStorage' in window) {
            localStorage.setItem(LS_HASH_RATE, this.hash_rate);
            localStorage.setItem(LS_HASH_RATE_TIMESTAMP, new Date());
        }
    }

    return this.hash_rate;

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
