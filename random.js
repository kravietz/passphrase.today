/**
 * Created by Paweł Krawczyk on 19/03/15.
 * https://ipsec.pl/
 */
"use strict";

// This class implements algorithms for converting a random binary value
// as received from the PRNG to an integer index of specific range.
// NIST has described algorithms for such conversion that minimizes
// likelihood of skew of the result index. These algorithms are described
// in NIST SP800-90A section B.5
// http://csrc.nist.gov/publications/nistpubs/800-90A/SP800-90A.pdf
/**
 * @constructor
 */
function NistRandom() {
    this.method = this.ModMethod;
}

NistRandom.prototype.getRange = function (r) {
    return this.method(r)
};

// B.5.1.1 The Simple Discard Method
// Works by cycling through random bit strings until one of them hits
// a value that fits into the desired range. The candidate random bit
// strings should be of the bit size that can hold the desired range.
// The disadvantage is that it it's not constant time - it take a few
// iterations to find the right value.
NistRandom.prototype.DiscardMethod = function (rangeInput) {
    var rangeBn = new window['sjcl']['bn'];
    rangeBn['initWith']((rangeInput - 1).toString(16));
    var m = rangeBn['bitLength']();
    var wordsNeeded = Math.ceil(m / 32);
    var candidate, candidateBn;
    // generate sequence of m random bits until
    // we find one that fits into the range r
    do {
        // generate random words
        candidate = window['sjcl']['random']['randomWords'](wordsNeeded);
        // Shrink leftmost word to make the random
        // fit the desired m bit length. This is necessary
        // because the generator can only produce strings
        // in 32 bit chunks, so if we'd be looking for a
        // random in 16-bit range scanning through all 32 bit
        // candidates until we find one would take a lot of time
        candidate[0] = candidate[0] >>> (32 - (m % 32));
        candidateBn = window['sjcl']['bn']['fromBits'](candidate);
    } while (candidateBn >= rangeInput);
    // candidate found
    return parseInt(candidateBn['toString'](), 16);

};

// B.5.1.3 The Simple Modular Method
// Works by treating the candidate random integer with modulo range
// operator. To avoid the skew however the candidate needs to be significantly
// longer than the range. NIST recommends bit length of the range plus 64 bits.
NistRandom.prototype.ModMethod = function (rangeInput) {
    var securityParam = 64; // "The value of s shall be greater than or equal to 64."
    var rangeBn = new window['sjcl']['bn'];
    // conversion of rangeInput to BN is only a convenient way to obtain the bit length
    rangeBn['initWith']((rangeInput).toString(16)); // initWith consumes hex
    var m = rangeBn['bitLength']();
    // generate random word and convert it into BN
    var wordsNeeded = Math.ceil((m + securityParam -1) / 32);
    var randBn = window['sjcl']['bn']['fromBits'](window['sjcl']['random']['randomWords'](wordsNeeded));
    // return actual "a=c mod r"
    return parseInt(randBn['mod'](rangeInput).toString(), 16);
};

NistRandom.prototype.setMethod = function (method) {
    if (method == 'discard') {
        NistRandom.method = this.DiscardMethod;
    }
    if (method == 'mod') {
        NistRandom.method = this.ModMethod;
    }
};