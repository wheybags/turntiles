import os
import shutil

import requests
import json
import time

results = []
url = "https://gutendex.com/books/?author_year_start=1900&languages=en"

if os.path.exists("gutenberg_books.json"):
    with open('gutenberg_books.json', 'r') as file:
        data = json.load(file)
        url = data['next']
        results = data['results']

while url is not None:
    print("getting " + url)
    r = requests.get(url)

    if r.status_code == 429:
        time.sleep(10)
        continue

    assert r.status_code == 200
    data = r.json()

    if 'results' in data:
        results += data['results']

    if 'next' in data:
        url = data['next']
    else:
        url = None

    if os.path.exists("gutenberg_books.json"):
        shutil.copy("gutenberg_books.json", "gutenberg_books_bak.json")
    with open('gutenberg_books.json', 'w') as file:
        json.dump({"results": results, "next": url}, file)

os.makedirs("books", exist_ok=True)

for item in results:
    if os.path.exists("books/" + str(item["id"]) + ".txt"):
        print("skipping " + item["title"])
        continue

    if "Category: Novels" in item['bookshelves'] or "Category: Short Stories" in item['bookshelves']:
        text_format = None
        for format in item['formats']:
            if format.startswith('text/plain;'):
                text_format = format
                break
        if text_format:
            print("Downloading " + item['title'])
            while True:
                try:
                    r = requests.get("https://www.gutenberg.org/ebooks/" + str(item["id"]) + ".txt.utf-8")
                    assert r.status_code == 200
                except Exception as e:
                    print(e)
                    time.sleep(10)
                    continue

                with open("temp.txt", "wb") as file:
                    file.write(r.content)
                os.rename("temp.txt", "books/" + str(item["id"]) + ".txt")
                break

            # print(item['title'], text_format, item['id'])
