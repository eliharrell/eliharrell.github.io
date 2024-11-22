"""Using TMDB API to add movie data to sheet"""

# genre id dictionary for TMDB

genredict = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western"
}

!pip install langcodes[data]
from langcodes import *

import requests
import urllib.parse
import json

def get_details(details, result_num):
    detaili = details["results"][result_num]

    lang = detaili["original_language"] if bool(detaili["original_language"]) else None
    pop = float(detaili["popularity"]) if bool(detaili["popularity"]) else None
    genre_ids = detaili["genre_ids"] if bool(detaili["genre_ids"]) else None
    year = int(detaili["release_date"].split('-')[0]) if bool(detaili["release_date"]) else None
    title = detaili["title"] if bool(detaili["title"]) else None

    genres = []
    if genre_ids:
        for id in genre_ids:
            genres.append(genredict.get(id))

    output = {
        "title": title,
        "year": year,
        "lang": Language.get(lang).display_name() if lang else None,
        "pop": pop,
        "genres": genres
    }

    return output

def get_search_result_nums(title):
    url = "https://api.themoviedb.org/3/search/movie?query=" + urllib.parse.quote(title) + "&include_adult=true&language=en"

    headers = {
        "accept": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNmE0OTA3YWJjNzM1MGU3MGEwODhjZjc0NDkxYTRkZSIsInN1YiI6IjY0YTIyMTc4YzM5MGM1MDE0ZTNkMzhkOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Ih73JThbYYDU68pAZ3agiJjejt7P0ixeVuEDy4ZqsTE"
    }

    response = requests.get(url, headers=headers)
    details = json.loads(response.text)
    results = details["total_results"]
    pages = details["total_pages"]
    return [results, pages]

# function searching TMDB for the given title, and returns a list of results
def search(title, chunk):

    search_result_nums = get_search_result_nums(title)
    results = search_result_nums[0]
    pages = search_result_nums[1]

    # initialize results list

    title_results = []

    start = 5 * (chunk - 1)
    end = 5 * chunk if results > (5 * chunk) else results

    count = start + 1
    option = 1

    for i in range(start, end):
        page = int(i / 20) + 1
        page_loc = i % 20

        url = "https://api.themoviedb.org/3/search/movie?query=" + urllib.parse.quote(title) + "&include_adult=true&language=en&page=" + str(page)

        headers = {
            "accept": "application/json",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNmE0OTA3YWJjNzM1MGU3MGEwODhjZjc0NDkxYTRkZSIsInN1YiI6IjY0YTIyMTc4YzM5MGM1MDE0ZTNkMzhkOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Ih73JThbYYDU68pAZ3agiJjejt7P0ixeVuEDy4ZqsTE"
        }

        response = requests.get(url, headers=headers)
        details = json.loads(response.text)
        result = get_details(details, page_loc)

        if (result['title'] != title):
            print(f"Option {option} [result {count}]: a.k.a. {result['title']} ({result['year']}, {result['lang']}) --- {result['genres']}")
            count = count + 1
            option = option + 1
            title_results.append(result)
        else:
            print(f"Option {option} [result {count}]: {result['title']} ({result['year']}, {result['lang']}) --- {result['genres']}")
            count = count + 1
            option = option + 1
            title_results.append(result)

    return title_results

def quick_search(title, release_year):
    url = "https://api.themoviedb.org/3/search/movie?query=" + urllib.parse.quote(title) + "&include_adult=true&language=en&primary_release_year=" + str(release_year) + "&page=1"

    headers = {
        "accept": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmNmE0OTA3YWJjNzM1MGU3MGEwODhjZjc0NDkxYTRkZSIsInN1YiI6IjY0YTIyMTc4YzM5MGM1MDE0ZTNkMzhkOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Ih73JThbYYDU68pAZ3agiJjejt7P0ixeVuEDy4ZqsTE"
    }

    response = requests.get(url, headers=headers)
    details = json.loads(response.text)
    result = get_details(details, 0)

    return result

"""Creating an interface to the model"""

'''
-1: year
-2: week of the quarter
-3: hour
-4: month
5: release year*
6: tmdb pop*
7: num_genres*
8-26: ...genres... (19)*
-27-29: quarter (3)
-30-33: program (4)
-34-40: day of the week (fri mon sat sun thu tue wed)
40-63: languages (24)*
-64-69: format (6)
70-77: regions (8): Africa, East Asia, Europe, Latin America, Middle East, North America, Oceania, South Asia


output = {
    "title": title,
    "year": year,
    "lang": Language.get(lang).display_name() if lang else None,
    "pop": pop,
    "genres": genres
}
'''

'''
title = input("Enter the title of the film: ")
release = input("Enter the release year of the film: ")
quarter = input("Enter the quarter of the screening (fall winter spring): ")
dayofweek = input("Enter the day of the week (mon tue wed thu fri sat): ")
mmddyyyy = input("Enter screening date in MM/DD/YYYY format: ").split('/')
week = input("Enter the week of the screening (1-9): ")
hour = input("Enter the hour of the screening (i.e. 19 for 7:00pm): ")
format = input("Enter the screening format (16mm, 35mm, digital, DCP, 3D, unknown): ")
program = input("Enter the kind of screening (rs for Regular Series, se for Special Event, pp for Programmer Pick, nr for New Release): ")
region = input("Enter the region of the film (Africa, East Asia, Europe, Latin America, Middle East, North America, Oceania, South Asia): ")
'''

import time

"""Using the TMDB API"""

search("Marie Antoinette", 1)

def selection_input_dialog(title, index, chunk):
    print("")
    print(f"At CSAD row {index}.")
    print("Type 'q' to exit, and 's' to save progress to CSV file")

    search_result_nums = get_search_result_nums(title)
    total_results = search_result_nums[0]

    results = search(title, chunk)
    selection = input("Select option: ")

    if selection == 'q':
        return None
    if selection == 's':
        return ['s', index]
    if selection == 'm':
        if (total_results <= 5):
            return selection_input_dialog(title, index, chunk)
        else:
            next = chunk + 1
            print("enter 'm' for more titles, or 'b' to go back")
            return selection_input_dialog(title, index, next)
    if selection == 'b':
        prev = chunk - 1
        return selection_input_dialog(title, index, prev)
    else:
        return results[int(selection) - 1]

def add_movie_data(df, start_row):
    for id, genre in genredict.items():
        df[str(genre)] = 0
        df['release-year'] = 0
        df['language'] = ''
        df['tmdb-popularity'] = 0.0

    for index, row in df.iloc[start_row:].iterrows():

        title = row['title']
        film = selection_input_dialog(title, index, 1)
        if film is None:
            return df
        if type(film) == list:
            filepath = '/content/drive/MyDrive/Attendance Analytics/csad-moviedata-thru-line' + str(film[1]) + '.csv'
            df.to_csv(filepath)
        else:
            # Input selected film's data into the big dataframe
            df.at[index, 'release-year'] = film['year']
            df.at[index, 'language'] = film['lang']
            df.at[index, 'tmdb-popularity'] = film['pop']
            for genre in film['genres']:
                df.at[index, genre] = 1

    return df