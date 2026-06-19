import requests
from bs4 import BeautifulSoup
import json
import os
import re
from datetime import datetime
from pathlib import Path

# ==========================
# CONFIGURATION
# ==========================

URLS = {"Pays d'Europe" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Jeu-Pays-d-Europe-_pageid160.html",
        "Pays de l'Union Européenne" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Pays-de-l-Union-Europeenne-_pageid260.html",
        "Villes du Monde" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Jeu-Villes-du-Monde-_pageid47.html",
        "Villes du Monde Junior" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Jeu-Villes-du-Monde-Junior-_pageid185.html",
        "Villes du Monde Expert" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Villes-du-Monde-Expert-_pageid358.html",
        "Pays d'Afrique" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Jeu-Pays-d-Afrique-_pageid158.html",
        "Pays du Moyen-Orient" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Jeu-Pays-du-Moyen-Orient-Caucase-et-Asie-centrale-_pageid163.html",
        "Pays d'Amérique Centrale" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Jeu-Pays-d-Amerique-Centrale-_pageid156.html",
        "Pays d'Amérique du Sud" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Jeu-Pays-d-Amerique-du-Sud-_pageid162.html",
        "Pays d'Asie" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Jeu-Pays-d-Asie-_pageid161.html",
        "Pays de l'hémisphère Nord" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Pays-de-l-hemisphere-Nord-_pageid396.html",
        "Les Pays vus du Ciel" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Les-Pays-vus-du-Ciel-_pageid604.html",
        "Les Pays vus du Ciel - Junior" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Les-Pays-vus-du-Ciel-Junior-_pageid605.html",
        "Les Pays vus du Ciel - Expert" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Les-Pays-vus-du-Ciel-Expert-_pageid606.html",
        "Quel est ce pays ?" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Quiz-Quel-est-ce-pays-_pageid485.html",
        "Quel est ce pays ? - Expert" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Quel-est-ce-pays-Expert-_pageid557.html",
        "Le Monde vu du ciel" : "https://www.jeux-geographiques.com/jeux-en-ligne-Le-Monde-vu-du-ciel-_pageid596.html",
        "Le Monde vu du ciel - Expert" : "https://www.jeux-geographiques.com/jeux-en-ligne-Le-Monde-vu-du-ciel-Expert-_pageid598.html",
        "Le Monde vu du ciel - Junior" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Le-Monde-vu-du-ciel-Junior-_pageid597.html",
        "Géo. Physique du Monde" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Jeu-Geo-Physique-du-Monde-_pageid121.html",
        "Géo. Physique du Monde - Junior" :  "https://www.jeux-geographiques.com/jeux-en-ligne-Jeu-Geo-Physique-du-Monde-Junior-_pageid117.html"
        
}

PLAYERS = [
    "alizouilleam",
    "Araw Igum"
]

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

OUTPUT = DATA_DIR / "scores.json"
# OUTPUT = "../data/scores.json"

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

        if old["date"] == today and old['quiz'] == quiz:    # Meme jour et meme quiz
            
            old_scores = old["scores"]

            for player in daily_scores:

                new_score = daily_scores[player]["score"]
                old_score = (
                                old_scores
                                .get(player, {})
                                .get("score")
                            )

                if (    old_score is None
                        or (
                            new_score is not None
                            and new_score > old_score
                        ) ):

                    old_scores[player] = daily_scores[player]

            history[i]["scores"] = old_scores

        replace = True

        break

    if not replace:
        history.append(entry)

        keep = False

        for player in daily_scores:

            new_score = daily_scores[player]["score"]

            best = None

            # Recherche du meilleur score historique
            for old in history:

                if old["quiz"] != quiz:
                    continue

                if player in old["scores"]:

                    score = old["scores"][player]["score"]

                    if (
                        score is not None
                        and (
                            best is None
                            or score > best
                        )
                    ):
                        best = score

            # Ajouter seulement si record battu
            if (
                new_score is not None
                and (
                    best is None
                    or new_score > best
                )
            ):
                keep = True

        if keep:
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