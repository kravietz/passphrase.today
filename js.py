#!/usr/bin/env python3

# Fetch and process dictionaries supported by https://passphrase.today/
# Written by Paweł Krawczyk 2015-04-08

import json
import math
import os
import requests
import codecs
import re

RE_DIC = '^(\w+)/?'  # for iSpell files
RE_MW = '^([^\$\'-].+)'  # for Moby Words, just skip the initial -endings

DICTS = {
    'Russian': ['http://cgit.freedesktop.org/libreoffice/dictionaries/plain/ru_RU/ru_RU.dic', 'koi8_r', RE_DIC],
    'English': ['https://raw.githubusercontent.com/GlitchHound/TinyTeam/master/mwords/256772co.mpo', 'ascii', RE_MW],
    'Polish': ['http://cgit.freedesktop.org/libreoffice/dictionaries/plain/pl_PL/pl_PL.dic', 'iso8859_2', RE_DIC],
}

TEMPLATE = """
var dictionary = {{
    language: "{language}",
    source: "{source}",
    max_entropy_per_char: {max_entropy_per_char},
    alphabet_size: {alphabet_size},
    dictionary_size: {dictionary_size},
    entropy_per_word: {entropy_per_word},
    alphabet_frequencies: {alphabet_frequencies},
    dictionary: {dictionary}
}}
"""

# handling invalid encoding in input is important because
# creating passphrases with weird encoding inside may
# render them unusable when people retype them on keyboards
# this global variable is used by the Python codecs callback
# to skip such words, which are especially prevalent in Moby Words
invalid_chars = False


def handle_error(err):
    global invalid_chars
    invalid_chars = True
    return u'?', err.start+1


def fetch_dict(k, v):
    language = k
    url = v[0]
    encoding = v[1]
    transform = v[2]
    lang_code = language.lower()
    dictionary = []

    global invalid_chars

    # write to output files static/dict/english.js etc
    # output files are UTF-8 encoded
    fout = open(os.path.join('dict', '{}.js'.format(lang_code)), 'w')

    rr = re.compile(transform)

    alphabet = {}

    print('Fetching', language, 'from', url, end=' ')

    r = requests.get(url, stream=True)
    first_line = True

    codecs.register_error('skip', handle_error)

    for line in codecs.iterdecode(r.iter_lines(), encoding, errors='skip'):
        # skip first line of DIC file
        # it contains number of words
        # for MWords it doesn't matter as we'll skip
        # the initial -endings anyway
        if first_line:
            first_line = False
            continue

        if invalid_chars:
            print('Invalid input', line)
            invalid_chars = False
            continue

        # strip DIC suffixes, as words are in format
        # WORD/XXX
        try:
            line = rr.match(line.strip()).group(1)
        except AttributeError:
            # ...but some words don't have the suffix
            line = line.strip()

        # record character count for frequency
        for c in line:
            if c in alphabet:
                alphabet[c] += 1
            else:
                alphabet[c] = 1

        # append the word to dictionary
        dictionary.append(line.strip())

    # total number of characters counted in all words
    total_chars = 0.0
    for c in alphabet.keys():
        total_chars += alphabet[c]
    # convert from count to frequency
    for c in alphabet.keys():
        alphabet[c] = alphabet[c] / total_chars

    # calculate avg entropy per character using the Shannon formula
    max_entropy_per_char = sum([x for x in map(lambda x: -x * math.log2(x), alphabet.values())])

    fout.write(TEMPLATE.format(
        language=language,
        source=url,
        alphabet_size=len(alphabet.keys()),
        max_entropy_per_char=max_entropy_per_char,
        dictionary_size=len(dictionary),
        entropy_per_word=math.log2(len(dictionary)),
        alphabet_frequencies=json.dumps(alphabet, ensure_ascii=False),
        dictionary=json.dumps(dictionary, ensure_ascii=False)
    ))

    fout.close()

    print('OK', len(dictionary), 'words')


if __name__ == "__main__":
    for a, b in DICTS.items():
        fetch_dict(a, b)
