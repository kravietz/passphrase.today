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
    
Apart from sounding rather scary (methanol is [highly poisonous](https://en.wikipedia.org/wiki/Methanol#Toxicity)) it also looks
like a natural sentence. It's because it's really only composed of **two** tokens
&mdash; the dictionary contains not only single words, but also short phrases (`wood alcohol` and `on the table` in this case).
Now, applying the entropy estimation algorithms gives the following results:

<table>
<tr><th>Method <th>Entropy <th>Notes
<tr><td>Shannon word <td>36 <td>2 tokens
<tr><td>NIST <td>41 <td>25 characters, decreasing entropy per char
<tr><td>Shannon char <td>115 <td>25 chars but different formula
</table>

This passphrase passes the minimum 35 bits of entropy threshold and is thus presented to the user as a candidate. To make
things simpler, *this* example doesn't use the transformations described below.

## Brute-force attacks

Treating the passphrase as a string of characters and applying a brute-force guessing attack won't be in most cases
feasible because the passphrases tend to be longer than typical passwords. The sample passphrase `wood alcohol...` 
is 25 characters long and let's assume for simplicity it's built from an alphabet of only 26 characters (`a-z` and space).
This gives a keyspace of 2e35 (<!-- 26**25 -->). Then, let's assume we can employ the
[current Bitcoin hash rate](https://blockchain.info/charts/hash-rate) to crack
passwords (which is around 3.5e17 in Q2 2015). This gives around 1e10 years <!-- 26**25/3.5e17/3600/24/365  --> to
search the keyspace (while it would take only 7 seconds if the password was 13 characters long). <!-- 26**13/3.5e17 -->

The actual alphabets used by this generator are however much larger than the 26 characters from the example:
they can range from 62 unique characters in Russian to 71 in English. This significantly increases the search time (1e21 years).
<!-- math.log10(71**25/3.5e17/3600/24/365) -->

## Markov attacks

The exhaustive keyspace search model assumes characters selected randomly from the alphabet, but with natural
language dictionary it's not random at all: not only unique characters occur at different frequencies, but also follow
certain statistical patterns on how one characters tend to follow others. This allows to implement
**much faster Markov attacks** (see 
[John the Ripper](http://openwall.info/wiki/john/markov)
and [HashCat](http://hashcat.net/wiki/doku.php?id=statsprocessor)). 

A naïve brute-force attack would try the following combinations, spending a lot of time on sequences
that never appear in natural language (like `aaaa`):

    aaaaa
    baaaa
    caaaa
    ...

Markov attacks will try the more frequent character sequences first. Sample of strings tried by Markov algorithm (HashCat
implementation):

    serera
    seaner
    seller
    ...

So even though the keyspace remains the same, chances are they will hit the right combination much faster: in my testing on
6 character passwords Markov cracking tried all natural-language-looking strings in just 0.24% of the keyspace
(5e5 <!-- math.log10(25**6*0.24/100) --> instead of 2e8<!-- math.log10(25**6) -->).
This doesn't *guarantee* a hit, but with natural language words it makes it  very likely.

However, for full length passphrase, even with this reduction it's still in unreachable regions (4e18 years <!-- 71**25*0.24/100/3.5e17/3600/24/365 -->)
so character-by-character brute force attacks on passphrases aren't very practical.

## Dictionary combination attacks

Instead of guessing the passphrase character by character the attacker may choose to try to reproduce the approach used by this generator:
take the same dictionary and try all possible combinations of *words*. Take this passphrase for example &mdash; it's just two words:

     niepoprzekłuwany niewybębniany

This attack may be still quite effective &mdash; for example, for two-word passphrases selected from a 300'000 words long dictionary
there will be 90 billions <!-- 3e5**2 --> of combinations (9e10), which can be searched... in a minute using a
[GPU](https://en.wikipedia.org/wiki/Graphics_processing_unit)-powered crackers
like [oclHashCat](http://hashcat.net/oclhashcat/) on a middle-class gaming computer:

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

In the above example a keyspace of 9e10 is searched at speed of 2213e6 hashes per second, which theoretically should
take 40 seconds, but as they key is found after searching roughly half of the keyspace it only takes 27 seconds.

The difficulty grows quickly with each word: if the passphrase was built using 3 words it would take 141 days
to crack on the same machine, and if it was 4 words the time would increase to 116'000 years and so on. This looks good, but
remember we're modelling this now for a medium class gaming computer.

The [Bitcoin hash rate surge](https://blockchain.info/charts/hash-rate?timespan=all&showDataPoints=false&daysAverageString=1&show_header=true&scale=0&address=)
has taught us that building GPU and ASIC-based hashing farms can be relatively inexpensive.
As of 2015 the Bitcoin mining rate (which is technically SHA256 hashing rate) is in the regions of 3.5e17 hashes per second. Today's cost
of reproducing this hash power can be estimated at around $157m, which is again not something completely unreachable. 
<!--  437k BFL Monarchs at $360 of 800e9 h/s per unit -->

So, taking the BTC hash rate as reasonable limit of human capabilities, the times to crack would be now as follows (assuming 3e5 words dictionary):


<table>
<tr><th>Words <th>Keyspace <th>Time to crack (s) <th>Difficulty 
<tr><td>2 <td>9.00e+10 <td>2.57e-07 <td>seconds
<tr><td>3 <td>2.70e+16 <td>7.71e-02 <td>seconds
<tr><td>4 <td>8.10e+21 <td>2.31e+04 <td>hours
<tr><td>5 <td>2.43e+27 <td>6.94e+09 <td>hundreds of years
<tr><td>6 <td>7.29e+32 <td>2.08e+15 <td>thousands of years
<tr><td>7 <td>2.19e+38 <td>6.25e+20 <td>thousands of years
<tr><td>8 <td>6.56e+43 <td>1.87e+26 <td>thousands of years
<tr><td>9 <td>1.97e+49 <td>5.62e+31 <td>thousands of years
</table>


The problem with longer passphrases is human ability to remember them. While humans can easily remember even long text
because of the semantic links between the words, what we're looking for is exactly opposite: words that are completely
randomly chosen. So just increasing number of words in passphrase doesn't seem like a viable solution.

## Defense against dictionary combination attacks

To render the dictionary attacks useless this generator applies **transformations** to the dictionary words.
Currently there are two of them:

* case switching
* injection of non-dictionary characters (digits, punctuation etc)

The transformations are applied randomly: i.e. each character in the whole passphrase can be modified by each of them.
The parameters are set so that it's almost certain that out of every 10 characters at least one will be most likely modified.

    W2ood alcohol on the table
    wood Alcohol on the t7able
    3wood alcohol on the table
    Wood alcoh*ol on the table

The case switching transformation adds as many variants as many characters there are in each word (on average words in the dictionary
are 12 characters). The character injection  multiplies the number of variants by word length and number of special characters (38). This adds almost
5500 variants to each word in the dictionary.

The dictionary of 300'000 words used in examples above is inflated to estimated 1.6e9 and the crack times grow accordingly:

<table>
<tr><th>Words <th>Keyspace <th>Time to crack (s) <th>Difficulty 
<tr><td>2 <td>5.78e+14 <td>1.65e-03 <td>seconds
<tr><td>3 <td>1.73e+20 <td>4.95e+02 <td>minutes
<tr><td>4 <td>5.20e+25 <td>1.49e+08 <td>years
<tr><td>5 <td>1.56e+31 <td>4.46e+13 <td>thousands of years
<tr><td>6 <td>4.68e+36 <td>1.34e+19 <td>thousands of years
<tr><td>7 <td>1.40e+42 <td>4.01e+24 <td>thousands of years
<tr><td>8 <td>4.21e+47 <td>1.20e+30 <td>thousands of years
<tr><td>9 <td>1.26e+53 <td>3.61e+35 <td>thousands of years
</table>