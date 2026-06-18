import requests
from bs4 import BeautifulSoup
import json
import os
import re
from datetime import datetime

# ==========================
# CONFIGURATION
# ==========================

URLS = {"Le Monde vu du ciel" : "https://www.jeux-geographiques.com/jeux-en-ligne-Le-Monde-vu-du-ciel-_pageid596.html",
        "Le Monde vu du ciel - Expert" : "https://www.jeux-geographiques.com/jeux-en-ligne-Le-Monde-vu-du-ciel-Expert-_pageid598.html",
        "Le Monde vu du ciel - Junior" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Le-Monde-vu-du-ciel-Junior-_pageid597.html"
}

PLAYERS = [
    "alizouilleam",
    "Araw Igum"
]

OUTPUT = "../data/scores.json"

for quiz, URL in URLS.items():

    # ==========================
    # DOWNLOAD PAGE
    # ==========================

    headers = {
        "User-Agent":
        "Mozilla/5.0"
    }

    response = requests.get(URL, headers=headers)

    if response.status_code != 200:
        raise Exception(
            f"Impossible to access page ({response.status_code})"
        )

    html = response.text
    soup = BeautifulSoup(html, "html.parser")

    # ==========================
    # EXTRACT SCORES
    # ==========================


    today = datetime.now().strftime("%d/%m/%Y")

    daily_scores = {}

    hiscores = soup.find("div", id="hiscores_month")

    rows = hiscores.find_all("tr")

    for player in PLAYERS:

        score = None
        date = None

        for row in rows:

            name_cell = row.find("td", class_="name")
            score_cell = row.find("td", class_="score")

            if name_cell is None or score_cell is None:
                continue

            # ---- Extract username ----
            name_tag = name_cell.find("a", class_="login_link")

            if name_tag is None:
                continue

            name = name_tag.get_text(strip=True)

            if name.lower() != player.lower():
                continue

            # ---- Extract score ----
            score_tag = score_cell.find("a")

            if score_tag is None:
                continue

            score_text = score_tag.get_text(strip=True)

            try:
                score = int(score_text)
            except:
                score = None

            # ---- Extract date from title ----
            date = score_tag.get("title", None)

            break

        daily_scores[player] = {
            "score": score,
            "date": date
        }

    # ==========================
    # LOAD HISTORY
    # ==========================

    history = []

    if os.path.exists(OUTPUT):

        with open(
            OUTPUT,
            "r",
            encoding="utf-8"
        ) as f:

            try:
                history = json.load(f)

            except:
                history = []


    elif not os.path.exists(OUTPUT):
        with open(OUTPUT, "w", encoding="utf-8") as f:
            f.write("[]")



    # ==========================
    # UPDATE HISTORY
    # ==========================

    entry = {
        "date": today,
        "quiz": quiz,
        "scores": daily_scores
    }

    replace = False

    for i, old in enumerate(history):

        if old["date"] == today and old['quiz'] == quiz:

            history[i] = entry

            replace = True

            break

    if not replace:
        history.append(entry)

    # ==========================
    # SAVE
    # ==========================

    with open(
        OUTPUT,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            history,
            f,
            indent=4,
            ensure_ascii=False
        )

    print("\n=== Scores updated for {} ===\n".format(quiz))

    for p, s in daily_scores.items():

        print(
            f"{p:<15} : {s}"
        )

    print(
        f"\nSaved in {OUTPUT}"
    )