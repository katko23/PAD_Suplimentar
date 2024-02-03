import json

from flask import Flask, jsonify
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
import requests
import os
from datetime import date

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://killercoseru:SCFt4ja2ougp@ep-holy-surf-a2elkdep.eu-central-1.aws.neon.tech/neondb'
# app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
db = SQLAlchemy(app)
socketio = SocketIO(app)

news_url = "http://127.0.0.1:5001"

class Statistic(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    country = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)

# Define your database model here

@app.route('/status')
def status():
    return jsonify(statistic_status='running')

@app.route('/countries')
def countries():
    url = "https://covid-193.p.rapidapi.com/countries"

    headers = {
        "X-RapidAPI-Key": "2f8205f0c8msh88f67f11b8352e4p1666cfjsn8b8288b747c2",
        "X-RapidAPI-Host": "covid-193.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers)

    print(response.json())
    return response.json()

@app.route('/country/<country_name>')
def country(country_name):
    url = "https://covid-193.p.rapidapi.com/statistics"

    headers = {
        "X-RapidAPI-Key": "2f8205f0c8msh88f67f11b8352e4p1666cfjsn8b8288b747c2",
        "X-RapidAPI-Host": "covid-193.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers)
    send_data = {}
    # print(response.json())
    for data in response.json()["response"]:
        if data["country"] == str(country_name):
            # print(data)
            send_data = data
    if send_data == {} : send_data = "Nothing found"
    return {"country": str(country_name), "data": send_data}

@app.route('/history/<country_name>/day/<day>')
def history(country_name,day):
    url = "https://covid-193.p.rapidapi.com/history"

    querystring = {"country": str(country_name), "day": str(day)}

    headers = {
        "X-RapidAPI-Key": "2f8205f0c8msh88f67f11b8352e4p1666cfjsn8b8288b747c2",
        "X-RapidAPI-Host": "covid-193.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())
    return response.json()

@app.route('/moldova')
def moldova():
    url = "https://covid-193.p.rapidapi.com/history"

    querystring = {"country": "Moldova", "day": str(date.today())}

    headers = {
        "X-RapidAPI-Key": "2f8205f0c8msh88f67f11b8352e4p1666cfjsn8b8288b747c2",
        "X-RapidAPI-Host": "covid-193.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)

    print(response.json())
    return response.json()


@app.route('/add_statistic', methods=['POST'])
def add_statistic():
    url = "https://covid-193.p.rapidapi.com/statistics"

    headers = {
        "X-RapidAPI-Key": "2f8205f0c8msh88f67f11b8352e4p1666cfjsn8b8288b747c2",
        "X-RapidAPI-Host": "covid-193.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers)
    send_data = {}
    # print(response.json())
    for data in response.json()["response"]:
        country = data['country']
        content = json.dumps(data['cases'])
        statistic = Statistic(country=country, content=content)
        db.session.add(statistic)
        db.session.commit()
        print("db added and commited")
    # response = requests.post(news_url + "/communicate", data = {}, headers={"Info" : " Statistic added to db"})
    return jsonify({'status': 'Statistics_added_successfully'})

@app.route('/communicate', methods=['POST'])
def communicate():
    return {"Status" : "Good"}

if __name__ == '__main__':
    socketio.run(app, debug=True, host="0.0.0.0", port="5000")
