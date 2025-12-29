with open("wwf_data/enable1-wwf-v4.0-wordlist.txt", "r") as f:
    lines = [x.strip() for x in f.readlines()]

words = set(lines)

diff = set([])

for word in words:
    if 'ize' in word:
        british = word.replace('ize', 'ise')
        if british in words:
            diff.add(word)
            diff.add(british)
    if 'izat' in word:
        british = word.replace('izat', 'isat')
        if british in words:
            diff.add(word)
            diff.add(british)

for word in sorted(list(diff)):
    print(word)

