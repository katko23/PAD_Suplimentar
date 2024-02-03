from flask import Flask, jsonify
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
import requests
from requests import request
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://killercoseru:SCFt4ja2ougp@ep-holy-surf-a2elkdep.eu-central-1.aws.neon.tech/news'
# app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
db = SQLAlchemy(app)
socketio = SocketIO(app)

statistic_url = "http://127.0.0.1:5000"

# Define your database model here

class News(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    link = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)

@app.route('/status')
def status():
    return jsonify(news_status='running')

@app.route('/news')
def news():
    url = "https://covid-19-news.p.rapidapi.com/v1/covid"

    querystring = {"q": "covid", "lang": "en", "media": "True"}

    headers = {
        "X-RapidAPI-Key": "2f8205f0c8msh88f67f11b8352e4p1666cfjsn8b8288b747c2",
        "X-RapidAPI-Host": "covid-19-news.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    # print(response.json())
    return response.json()

@app.route('/newscovid')
def newscovid():
    url = "https://joj-web-search.p.rapidapi.com/"

    querystring = {"query": "Covid 19", "limit": "10", "related_keywords": "true"}

    headers = {
        "X-RapidAPI-Key": "2f8205f0c8msh88f67f11b8352e4p1666cfjsn8b8288b747c2",
        "X-RapidAPI-Host": "joj-web-search.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    # print(response.json())
    return response.json()

@app.route('/covidimages')
def covidimages():
    url = "https://real-time-image-search.p.rapidapi.com/search"

    querystring = {"query": "Covid 19", "region": "us"}

    headers = {
        "X-RapidAPI-Key": "2f8205f0c8msh88f67f11b8352e4p1666cfjsn8b8288b747c2",
        "X-RapidAPI-Host": "real-time-image-search.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    # print(response.json())
    return response.json()

@app.route('/moldova')
def moldova():
    url = "https://joj-web-search.p.rapidapi.com/"

    querystring = {"query": "Covid 19 Moldova", "limit": "10", "related_keywords": "true"}

    headers = {
        "X-RapidAPI-Key": "2f8205f0c8msh88f67f11b8352e4p1666cfjsn8b8288b747c2",
        "X-RapidAPI-Host": "joj-web-search.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    # print(response.json())
    return response.json()

@app.route('/add_news', methods=['POST'])
def add_news():
    url = "https://covid-19-news.p.rapidapi.com/v1/covid"

    querystring = {"q": "covid", "lang": "en", "media": "True"}

    headers = {
        "X-RapidAPI-Key": "2f8205f0c8msh88f67f11b8352e4p1666cfjsn8b8288b747c2",
        "X-RapidAPI-Host": "covid-19-news.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)
    # print(response.json())
    for new in response.json()["articles"]:
        title = new['title']
        content = new['summary']
        link = new['link']
        news = News(title=title, content=content, link = link)
        db.session.add(news)
        db.session.commit()
        print("db added and commited")
    # response = requests.post(statistic_url + "/communicate", data={}, headers={"Info": " News added to db"})
    return jsonify({'status': 'News added successfully'})

@app.route('/communicate', methods=['POST'])
def communicate():
    return {"Status" : "Good"}

if __name__ == '__main__':
    socketio.run(app, debug=True, host="0.0.0.0", port="5001")
