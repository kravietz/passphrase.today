/**
 * Created by Paweł Krawczyk on 02/04/15.
 * https://ipsec.pl/
 */
"use strict";

/** @const */
var /** string */ msg1 = ['Shannon entropy estimate calculated over passphrase words as L*log2(N)',
    ' where L is number of words in passphrase and N is the size of the dictionary.',
    ' This reflects the complexity of an attack trying all multi-word combinations from',
    ' the same dictionary. This will grow in steps with each new word added.'];
/** @const */
var /** string */ msg2 = [
    'Entropy estimate based on NIST SP800-63, pp 49-50, where first character',
    ' has 4 bits, next have 2 bits etc and entropy generally declines with each',
    ' next character. We treat the passphrase as one long password, so characters ',
    ' in second and next words will have low entropy in this model. This is however ',
    ' quite realistic when estimating complexity against attack utilising grammatical ',
    ' rules to optimize for position of characters.'
];
/** @const */
var /** string */ msg3 = ['Shannon entropy estimate calculated over passphrase characters as',
    ' L*sum(-p * log2(p)) where L is number of individual characters in the',
    ' passphrase and p_i is the frequency of each unique character measured',
    ' in the dictionary. This is usually the biggest value as passphrases are',
    ' usually long character-wise. This reflects the complexity of an brute-force',
    ' attack trying all possible character combinations.'
];
/** @const */
var /** string */ msg4 = ['This is the minimum entropy threshold for the generated passphrases.',
    ' The lowest of the entropy estimates is compared against this limit and ',
    ' any passphrase candidate lower than that is discarded.'
];
/** @const */
var /** string */ msg5 = ['Hypothetically, if someone could apply current Bitcoin hash power',
    ' how long would it take to crack this passphrase?'
];

var titles = {
    'pp-word-entropy-title': msg1.join(' '),
    'pp-nist-entropy-title': msg2.join(' '),
    'pp-character-entropy-title': msg3.join(' '),
    'pp-target-entropy-title': msg4.join(' '),
    'pp-cracking-time-title': msg5.join(' ')
};

// actually add these long ugly titles to the page
function addTitles() {
    for (var t in titles) {
        var e = document.getElementById(t);
        e.setAttribute('title', titles[t]);
    }
}