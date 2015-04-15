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

## Passphrase strength

There's just one configurable parameter in this generator: the target information entropy, which is the most
commonly used to illustrate strength of passwords. If your entropy threshold is set to 35 bits the application
will randomly generate candidate passphrases until it finds one that is measured above this level. You can increase
or descrease the threshold to get stronger or weaker passphrases.

The application uses three methods for candidate passphrase estimation:

* **Shannon entropy over words.** The passphrase is treated as a string of whole words randomly chosen from the dictionary
and the entropy is equal to `math.log2(len(dictionary))`, so for an English dictionary of around 250'000 words each of them
will contribute around 17 bits of entropy. This method reflects the resistance to attacks where all combinations of the
words in the original dictionary are tried, mimicking how this generator works, and tends to produce the lowest number &mdash;
it's also the most conservative of the estimates.
* **NIST entropy.** In [SP 800-63](http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-63-2.pdf) the NIST
has proposed an algorithm that is based on actual password strength research and takes into account the fact that
if natural language words are used to generate passwords the entropy quickly decreases with each  character. Because
our passphrases are quite long, it will still give high result, usually higher than the Shannon word entropy.
* **Shannon entropy over characters.** We treat the passphrase as a string of characters chosen from the dictionary, but not
quite randomly: it's because the characters in the words in the dictionary have very different and non-uniform frequencies,
typical for natural language. Entropy is calculated according to the "full" Shannon formula where `-p * math.log2(p)` is 
calculated for probability of each character in the dictionary, and then they are summed. This method reflects
the resistance to  brute-force guessing all character combinations and tends to produce very high values.


## Brute-force guessing



## Dictionary combination attacks

As the passphrases generated with default parameters will be in most cases well over 20 characters long, brute-force attacks
attempting to guess the passphrase character by character won't be feasible. Take this passphrase for example:

     niepoprzekłuwany niewybębniany

However, attacks trying all combinations of the words **from the same dictionary as we use** may be still quite effective
&mdash; for example, for two-word passphrases selected from a 300'000 words long dictionary there will be 90 billions
of combinations, which can be cracked... in a minute. This can be easily achieved 
using [GPU](https://en.wikipedia.org/wiki/Graphics_processing_unit)-powered
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
take 40 seconds, but as they key is found after searching roughly half of the keyspace it only takes 27 seconds.

If the passphrase was built using 3 words it would take 141 days to crack on the same machine, and if it was 4 words
the time would increase to 116'000 years and so on. So, under the same parameters the time to crack would be the following:

<table>
<tr><th>Words <th>Keyspace <th>Time
<tr><td>2 <td>90e10 <td>40 sec
<tr><td>3 <td>90e16 <td>141 days
<tr><td>4 <td>90e21 <td>116'000 years
</table>

Unfortunately, the Bitcoin mining revolution has taught us
how to build  GPU farms cheaply so hash cracking can be now easily parallelised, scaled horizontally
reducing the cracking time to a reasonable period again. 

In addition to that, the longer the passphrase, the more difficult it becomes to remember and type, thus
cancelling their advantage over character based passwords. So relying on the number of words alone is perphaps not the
best way forward.

## Defense against dictionary attacks

To render the dictionary attacks useless the generator applies **transformations** to the dictionary words.
Currently there are two of them:

* injection of non-dictionary characters (digits, punctuation etc)
* case switching

The transformations are applied to a random character of the passphrase and each of them will usually happen
only once. Here's an example how transformations work:

```
narr4w seas Townsville
narrow Seas Townsv)lle
narr{w seas TownsviLle
narr1w seas TownsviLle
```

These passphrases can no longer be cracked using dictionary combination attack or, more precisely, such an attack
would be equivalent in complexity to a brute force attack.