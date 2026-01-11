# from wordfreq import word_frequency
import json
import math
import os
import shutil


def build_freq_map():
    freq_map = {}
    done_books = set([])

    if os.path.exists("freq_data.json"):
        with open("freq_data.json") as f:
            freq_data = json.load(f)
            freq_map = freq_data["freq_map"]
            done_books = set(freq_data["done_books"])

    file_list = os.listdir("books")
    file_list.sort()
    for file in file_list:
        if file in done_books:
            # print("skipping book " + file)
            continue

        print("loading " + file)
        with open(os.path.join('books', file), 'r', encoding="utf8", errors="surrogateescape") as f:
            words = f.read().split()

        for word_ in words:
            word = ""
            orig_len = len(word_)
            for i in range(orig_len):
                char = word_[i]
                if ord(char) >= ord('A') and ord(char) <= ord('Z'):
                    char = chr(ord('a') + ord(char) - ord('A'))
                if ord(char) >= ord('a') and ord(char) <= ord('z'):
                    word += char
                elif i != 0 and i != orig_len - 1:
                    word = ''
                    break
            if word:
                if word not in freq_map:
                    freq_map[word] = 0
                freq_map[word] += 1

        done_books.add(file)

        with open("freq_data_temp.json", "w") as f:
            json.dump({"freq_map": freq_map, "done_books": list(done_books)}, f)
        shutil.move("freq_data_temp.json", "freq_data.json")

    return freq_map

freq_map = build_freq_map()

def word_freq(word):
    if word in freq_map:
        return freq_map[word]
    else:
        return -1

words = []
with open('wwf_data/enable1-wwf-v4.0-wordlist.txt', 'r') as file:
    for line in file:
        words.append(line.strip())

with open('wwf_data/enable1-wwf-v4.0-wordlist-deletions.txt', 'r') as file:
    for line in file:
        words.append(line.strip())

words.sort()

naughty = set([])
with open('naughty.txt', 'r') as file:
    for line in file:
        naughty.add(line.strip())

regional = set([])
with open('us_uk_diff.txt', 'r') as file:
    for line in file:
        regional.add(line.strip())

manual_remove = set([])
with open('manual_remove.txt', 'r') as file:
    for line in file:
        regional.add(line.strip())

words_with_freq = [(x, freq_map[x]) for x in words if x in freq_map]

words_with_freq.sort(key=lambda x: x[1], reverse=True)

with open('dictionary_for_generation.txt', 'wb') as file:
    count = math.floor(len(words_with_freq) * 0.25)
    for i in range(count):
        word = words_with_freq[i][0]
        if word in naughty or word in regional or len(word) <= 3:
            continue
        file.write(word.encode('utf-8'))
        if i != count - 1:
            file.write('\n'.encode('utf-8'))

with open('../site/dictionary_full.txt', 'wb') as file:
    count = len(words)
    for i in range(count):
        word = words[i]
        file.write(word.encode('utf-8'))
        if i != count - 1:
            file.write('\n'.encode('utf-8'))
