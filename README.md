# Passphrase.Today

This application generates random passphrases of configurable strength:

* Randomly choose words from a large dictionary
* English, Polish and Russian dictionaries currently built-in, easy to add new
* Client-side only generation with [HTML5 off-line](http://www.html5rocks.com/en/tutorials/appcache/beginner/) support
* [SJCL](https://github.com/bitwiseshiftleft/sjcl) for strong random numbers in any browser
* Additional transformations to thwart dictionary attacks

There's an on-line prototype at [Passphrase.Today](https://passphrase.today/) that also works off-line. Android
application is planned to be issued soon.

## How does it work?

The theory of operation is similar to a well-known [Diceware](https://en.wikipedia.org/wiki/Diceware) scheme, where
six words are selected randomly from a dictionary of almost 8000 words using a pair of traditional dice. This application
works on the same principle, it just uses much larger dictionaries (140-300k words), words are selected using
a software random number generator and additional transformations are applied.

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

There's just one configurable parameter in this generator: **the target information entropy,** which is the metric most
commonly used to describe strength of passwords. If your entropy threshold is set to 35 bits the application
will randomly generate candidate passphrases until it finds one that is measured above this level. You can increase
or decrease the threshold to get stronger or weaker passphrases.

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

Let's take one generated passphrase as a sample:

    wood alcohol on the table
    
It looks funny, but it's composed from only **two** tokens actually: the dictionary also contains
phrases (`wood alcohol` and `on the table` in this case). Applying the entropy
estimation algorithms will give the following results>

<table>
<tr><th>Method <th>Entropy <th>Notes
<tr><td>Shannon word <td>36 <td>2 tokens
<tr><td>NIST <td>41 <td>25 characters, decreasing entropy per char
<tr><td>Shannon char <td>115 <td>25 chars but different formula
</table>

This passphrase passes the minimum 35 bits of entropy threshold and is thus presented to the user as a candidate. To make
things simpler, *this* example doesn't use the transformations described below.

## Brute-force guessing

Treating the passphrase as a string of characters and applying a brute-force guessing attack won't be in most cases
feasible because the passphrases tend to be longer than typical passwords. The sample passphrase `wood alcohol...` passphrase
is 25 characters long and let's assume for simplicity it's built from an alphabet of only 26 characters (`a-z` and space).
This gives a keyspace
of 2e35. Then, let's assume we can employ the [current Bitcoin hash rate](https://blockchain.info/charts/hash-rate) to crack
passwords (which is around 3.5e17 in Q2 2015). This gives around 1e10 years to search the keyspace (while it would take only
17 seconds if the password was 16 characters long).

The actual alphabets are much larger than the 26 characters from the example: from 62 unique characters in Russian to 71 in English.
This obviously **increases** the keyspace (to 1e21).

The exhaustive keyspace search model assumes characters selected randomly from the alphabet, but with natural
language dictionary it's not random at all: not only unique characters occur at different frequencies, but also follow
certain statistical patterns on how one characters tend to follow others. This allows to implement
**much faster Markov attacks** (see 
[John the Ripper](http://openwall.info/wiki/john/markov)
and [HashCat](http://hashcat.net/wiki/doku.php?id=statsprocessor)). 

A naïve brute-force attack would try the following combinations, spending a lot of time on sequences
that never appear in natural language (like `aaaa`):

```
aaaaa
baaaa
caaaa
...
```

Markov attacks will try the more frequent character sequences first. Sample of strings tried by Markov algorithm (HashCat
implementation):

```
serera
seaner
seller
...
```

So even though the keyspace remains the same, chances are they will hit the right combination much faster: in my testing on
6 character passwords Markov cracking tried all natural-language-looking strings in just 0.24% of the keyspace
(3e8 instead of 3e11).

But even with this reduction it's still in unreachable regions for the full length passphrase.

## Dictionary combination attacks

As the passphrases generated with default parameters will be in most cases well over 20 characters long, brute-force attacks
attempting to guess the passphrase character by character won't be feasible. Take this passphrase for example:

     niepoprzekłuwany niewybębniany

However, attacks trying all combinations of the words **from the same dictionary as we use** may be still quite effective
&mdash; for example, for two-word passphrases selected from a 300'000 words long dictionary there will be 90 billions
of combinations (9e10), which can be searched... in a minute using a
[GPU](https://en.wikipedia.org/wiki/Graphics_processing_unit)-powered
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
<tr><th>Words <th>Keyspace <th>Time at 2 GH/s <th>Time at 3.5e17 H/s
<tr><td>2 <td>9.00e+10 <td>40 sec <td>0
<tr><td>3 <td>2.70e+16 <td>141 days <td>0
<tr><td>4 <td>8.10e+21 <td>116k years <td>6 sec
<tr><td>5 <td>2.43e+27 <td>3e10 years <td>220 years
<tr><td>6 <td>7.29e+32 <td>1e16 years <td>6e7 years
</table>

Unfortunately, the [Bitcoin hash rate surge](https://blockchain.info/charts/hash-rate?timespan=all&showDataPoints=false&daysAverageString=1&show_header=true&scale=0&address=)
has taught us how to build GPU or ASIC farms cheaply so even that 3.5e17 hash rate doesn't apply completely
unreasonably when applied to password cracking.

In addition, the longer the passphrase, the more difficult it becomes to remember and type, thus
cancelling their advantage over character based passwords. So relying on the number of words alone perhaps is not the
best way forward.

## Defense against dictionary attacks

To render the dictionary attacks useless the generator applies **transformations** to the dictionary words.
Currently there are two of them:

* injection of non-dictionary characters (digits, punctuation etc)
* case switching

The transformations are applied to a random character of the passphrase and each of them will usually happen
only once. Here's an example how transformations work:

```
wOod5alcohol on the table
wood alc[hOl on the table
Wood alcohol on %he table
wood a9cohol on the table
```

These passphrases can no longer be cracked using dictionary combination attack or, more precisely, such an attack
would be equivalent in complexity to a brute force attack.