# Passphrase.Today

This application generates random passphrases in secure manner. Features:

* Randomly choose words from a large dictionary
* JavaScript based, fully client-side generation. Includes off-line version, so after running once it wil work without network access
* Uses [SJCL](https://github.com/bitwiseshiftleft/sjcl) library for random numbers
* English, Polish and Russian dictionaries currently built-in
* Full Unicode support
* Passphrase is transformed to thwart dictionary attacks

## How does it work?

The theory of operation is similar to a well-known [Diceware](https://en.wikipedia.org/wiki/Diceware) scheme, where
six words are selected randomly from a dictionary of almost 8000 words using a pair of traditional dice. This application
works on the same principle, it just uses much larger dictionaries (140-300k words) and words are selected using
a software random number generator.

Passphrase length is determined by the target entropy, which by default is set to 35 bits &mdash; this usually
produces passphrases of around 2-3 words. You can change the target entropy to get shorter or longer passphrases.
The passphrase goes through additional transformations, lie adding special characters, to increase resistance to
dictionary attacks.

## Random numbers

High quality randomness is critical in passphrase generation so that the selected words are not biased in any way and
are uniformly distributed in the dictionary. All possible precautions have been taken to make the generation process
as resistant to bias as possible in a web browser environment.

The application does not use the standard `Math.random()` function but relies on
[Stanford Javascript Crypto Library](https://github.com/bitwiseshiftleft/sjcl) to maintain an in-session entropy pool
and feed it from the cryptographic API offered by the browser. If this can't be done in secure manner, the generator
will warn the user and refuse to work.

## Dictionary attacks

As the passphrases generated with default parameters will be in most cases well over 20 characters long, brute-force attacks
attempting to guess the passphrase character by character won't be feasible.

However, attacks trying all combinations of the words from the same dictionaries may be still quite effective &mdash; for
example, for two-word passphrases selected from a 300'000 words long dictionary there will be 90 billions of combinations,
which can be crackied... in a minute using [GPU](https://en.wikipedia.org/wiki/Graphics_processing_unit)-powered
crackers like [oclHashCat](http://hashcat.net/oclhashcat/) on a middle-class gaming computer:

```
7cd687bbabf32e577f901f3876618258:niepoprzekłuwany niewybębniany

Session.Name...: oclHashcat
Status.........: Cracked
Input.Left.....: File (pl.txt)
Input.Right....: File (pl.txt)
Hash.Target....: 7cd687bbabf32e577f901f3876618258
Hash.Type......: MD5
Time.Started...: Tue Apr 07 23:21:19 2015 (24 secs)
Speed.GPU.#1...:  2213.7 MH/s
Recovered......: 1/1 (100.00%) Digests, 1/1 (100.00%) Salts
Progress.......: 53030907904/90406658329 (58.66%)
Skipped........: 0/53030907904 (0.00%)
Rejected.......: 0/53030907904 (0.00%)
Restore.Point..: 300677/300677 (100.00%)

Started: Tue Apr 07 23:21:19 2015
Stopped: Tue Apr 07 23:21:46 2015
```
In the above example a keyspace of 9e10 is searched at speed of 2213e6 hashes per second, which theoretically should
take 40 seconds, but as they key is found after searching 50% of the keyspace it only takes 27 seconds.

If the passphrase had 3 words, it would take 141 days to crack on the same machine, but as the Bitcoin revolution has taught
us how to build massive GPU farms cheaply, this can be easily parallelized and reduced down to no time again. 

Because of this we need to render the dictionary attacks useless and the generator does this by adding  transformations.
Currently there are two of them: injection of non-dictionary characters (digits, punctuation etc) and case toggling. They are
applied to a random character of the passphrase and each of them will usually happen only once.

