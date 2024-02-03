const express = require('express');
const app = express();
const axios = require('axios');

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const {createClient} = require("redis");

const client = createClient({
    password: '6GXjYdFPl6g0IOrW4lAEoGz05bbWwyhp',
    socket: {
        host: 'redis-18972.c326.us-east-1-3.ec2.cloud.redislabs.com',
        port: 18972
    }
});

// Limit requests to 100 per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Slow down requests after 50 requests
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per 15 minutes, then...
    delayMs: 500 // begin adding 500ms of delay per request above 100
});

// for load balancer , but because I have used replicas in docker compose, I have no need in load balancer.
// Docker Compose, or a container orchestration system like Kubernetes,
// usually takes care of distributing the load among the replicas
let service1Instances = ['http://suplimentarytask_for_pad-statistic-1:5000', 'http://suplimentarytask_for_pad-statistic-2:5000',
                            'http://suplimentarytask_for_pad-statistic-3:5000'];
let service2Instances = ['http://suplimentarytask_for_pad-news-1:5001', 'http://suplimentarytask_for_pad-news-2:5001',
                            'http://suplimentarytask_for_pad-news-3:5001'];

let service1Index = 0;
let service2Index = 0;

//simple round robin
app.get('/statistic/status', limiter, speedLimiter, async (req, res) => {
    try{
        const response = await axios.get(service1Instances[service1Index] + '/status', {timeout : 5000});
        service1Index = (service1Index + 1) % service1Instances.length;
        res.send(response.data);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(408).send({ error: 'Request timeout' });
        } else {
            console.log(error);
            res.status(500).send({ error: 'Internal server error' });
        }
    }
});

//simple round robin
app.get('/news/status', limiter, speedLimiter, async (req, res) => {
    try{
        const response = await axios.get(service2Instances[service2Index] + '/status', {timeout : 5000});
        service2Index = (service2Index + 1) % service2Instances.length;
        res.send(response.data);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(408).send({ error: 'Request timeout' });
        } else {
            console.log(error);
            res.status(500).send({ error: 'Internal server error' });
        }
    }
});

app.get('/status', limiter, speedLimiter, async (req, res) => {
    try{
        const response1 = await axios.get(service2Instances[service2Index] + '/status', {timeout : 5000});
        service2Index = (service2Index + 1) % service2Instances.length;
        const response2 = await axios.get(service1Instances[service1Index] + '/status', {timeout : 5000});
        service1Index = (service1Index + 1) % service1Instances.length;
        res.json(Object.assign({},{"gatewaystatus": 'running'} , response1.data,  response2.data ));
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(408).send({ error: 'Request timeout' });
        } else {
            console.log(error);
            res.status(500).send({ error: 'Internal server error' });
        }
    }
});

app.get('/countries', limiter, speedLimiter, async (req, res) => {
    if (client.status === 'ready') {
        const key = 'countries';

        // Try to fetch the result from Redis first
        return client.get(key, async (err, result) => {
            if (result) {
                // If the result exists in Redis, return it
                return res.send(JSON.parse(result));
            } else {
                // Otherwise, fetch the result from the service
                try {
                    const response = await axios.get(service1Instances[service1Index] + '/countries', {timeout: 5000});
                    service1Index = (service1Index + 1) % service1Instances.length;

                    // Store the result in Redis for 1 hour
                    client.setex(key, 3600, JSON.stringify(response.data));

                    return res.send(response.data);
                } catch (error) {
                    if (error.code === 'ECONNABORTED') {
                        return res.status(408).send({error: 'Request timeout'});
                    } else {
                        console.log(error);
                        return res.status(500).send({error: 'Internal server error'});
                    }
                }
            }
        });
    } else {
    console.log("reddis client is off");
        try {
                    const response = await axios.get(service1Instances[service1Index] + '/countries', {timeout: 5000});
                    service1Index = (service1Index + 1) % service1Instances.length;
                    return res.send(response.data);
                } catch (error) {
                    if (error.code === 'ECONNABORTED') {
                        return res.status(408).send({error: 'Request timeout'});
                    } else {
                        console.log(error);
                        return res.status(500).send({error: 'Internal server error'});
                    }
                }
    }

});

app.get('/moldova', limiter, speedLimiter, async (req, res) => {
    try{
        const response = await axios.get(service1Instances[service1Index] + '/moldova', {timeout : 5000});
        service1Index = (service1Index + 1) % service1Instances.length;
        res.send(response.data);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(408).send({ error: 'Request timeout' });
        } else {
            console.log(error);
            res.status(500).send({ error: 'Internal server error' });
        }
    }
});

app.get('/moldovanews', limiter, speedLimiter, async (req, res) => {
    try{
        const response = await axios.get(service2Instances[service2Index] + '/moldova', {timeout : 5000});
        service2Index = (service2Index + 1) % service2Instances.length;
        res.send(response.data);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(408).send({ error: 'Request timeout' });
        } else {
            console.log(error);
            res.status(500).send({ error: 'Internal server error' });
        }
    }
});

app.get('/country/:countryName', limiter, speedLimiter, async (req, res) => {
    console.log("request");
    try{
        const response = await axios.get(service1Instances[service1Index] + '/country/' + req.params["countryName"], {timeout : 5000});
        service1Index = (service1Index + 1) % service1Instances.length;
        res.send(response.data);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(408).send({ error: 'Request timeout' });
        } else {
            console.log(error);
            res.status(500).send({ error: 'Internal server error' });
        }
    }
});

app.get('/history/:countryName/day/:day', limiter, speedLimiter, async (req, res) => {
    try{
        const response = await axios.get(service1Instances[service1Index] + '/history/'
                                                + req.params["countryName"] + '/day' + req.params["day"], {timeout : 5000});
        service1Index = (service1Index + 1) % service1Instances.length;
        res.send(response.data);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(408).send({ error: 'Request timeout' });
        } else {
            console.log(error);
            res.status(500).send({ error: 'Internal server error' });
        }
    }
});

app.get('/news', limiter, speedLimiter, async (req, res) => {
    try{
        const response = await axios.get(service2Instances[service2Index] + '/news', {timeout : 5000});
        service2Index = (service2Index + 1) % service2Instances.length;
        res.send(response.data);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(408).send({ error: 'Request timeout' });
        } else {
            console.log(error);
            res.status(500).send({ error: 'Internal server error' });
        }
    }
});

app.get('/newscovid', limiter, speedLimiter, async (req, res) => {
    try{
        const response = await axios.get(service2Instances[service2Index] + '/newscovid', {timeout : 5000});
        service2Index = (service2Index + 1) % service2Instances.length;
        res.send(response.data);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(408).send({ error: 'Request timeout' });
        } else {
            console.log(error);
            res.status(500).send({ error: 'Internal server error' });
        }
    }
});

app.get('/covidimages', limiter, speedLimiter, async (req, res) => {
    try{
        const response = await axios.get(service2Instances[service2Index] + '/covidimages', {timeout : 5000});
        service2Index = (service2Index + 1) % service2Instances.length;
        res.send(response.data);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(408).send({ error: 'Request timeout' });
        } else {
            console.log(error);
            res.status(500).send({ error: 'Internal server error' });
        }
    }
});

app.post('/add_news', limiter, speedLimiter, async (req, res) => {
    try{
        const response = await axios.post(service2Instances[service2Index] + '/add_news', {}, {timeout : 5000});
        service2Index = (service2Index + 1) % service2Instances.length;
        res.send(response.data);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(408).send({ error: 'Request timeout' });
        } else {
            console.log(error);
            res.status(500).send({ error: 'Internal server error' });
        }
    }
});

app.post('/add_statistic', limiter, speedLimiter, async (req, res) => {
    try{
        const response = await axios.post(service1Instances[service1Index] + '/add_statistic', {}, {timeout :5000});
        service1Index = (service1Index + 1) % service1Instances.length;
        res.send(response.data);
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(408).send({ error: 'Request timeout' });
        } else {
            console.log(error);
            res.status(500).send({ error: 'Internal server error' });
        }
    }
});

app.get('/home', limiter, speedLimiter, async (req, res) => {
        if (client.status === 'ready') {

            const key = 'home';

            // Try to fetch the result from Redis first
            return client.get(key, async (err, result) => {
                if (result) {
                    // If the result exists in Redis, return it
                    return res.send(JSON.parse(result));
                } else {
                    // Otherwise, fetch the result from the service
                    try {
                        const response1 = await axios.get(service1Instances[service1Index] + '/countries', {timeout: 5000});
                        service1Index = (service1Index + 1) % service1Instances.length;
                        const response2 = await axios.get(service2Instances[service2Index] + '/news', {timeout: 5000});
                        service2Index = (service2Index + 1) % service2Instances.length;
                        const response3 = await axios.get(service2Instances[service2Index] + '/covidimages', {timeout: 5000});
                        service2Index = (service2Index + 1) % service2Instances.length;

                        const data = Object.assign({}, response1.data, response2.data, response3.data);

                        // Store the result in Redis for 1 hour
                        client.setex(key, 3600, JSON.stringify(data));

                        return res.send(data);
                    } catch (error) {
                        if (error.code === 'ECONNABORTED') {
                            return res.status(408).send({error: 'Request timeout'});
                        } else {
                            console.log(error);
                            return res.status(500).send({error: 'Internal server error'});
                        }
                    }
                }
            });
        }
        else {
        console.log("reddis client is off");
        try {
                        const response1 = await axios.get(service1Instances[service1Index] + '/countries', {timeout: 5000});
                        service1Index = (service1Index + 1) % service1Instances.length;
                        const response2 = await axios.get(service2Instances[service2Index] + '/news', {timeout: 5000});
                        service2Index = (service2Index + 1) % service2Instances.length;
                        const response3 = await axios.get(service2Instances[service2Index] + '/covidimages', {timeout: 5000});
                        service2Index = (service2Index + 1) % service2Instances.length;

                        const data = Object.assign({}, response1.data, response2.data, response3.data);

                        return res.send(data);
                } catch (error) {
                    if (error.code === 'ECONNABORTED') {
                        return res.status(408).send({error: 'Request timeout'});
                    } else {
                        console.log(error);
                        return res.status(500).send({error: 'Internal server error'});
                    }
                }
    }
});

app.get('/home_country/:countryName', limiter, speedLimiter, async (req, res) => {
    try{
        const response1 = await axios.get(service1Instances[service1Index] + '/country/' + req.params["countryName"], {timeout : 5000});
        service1Index = (service1Index + 1) % service1Instances.length;
        const response2 = await axios.get(service2Instances[service2Index] + '/news', {timeout : 5000});
        service2Index = (service2Index + 1) % service2Instances.length;
        res.json(Object.assign({}, response1.data,  response2.data ));

    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(408).send({ error: 'Request timeout' });
        } else {
            console.log(error);
            res.status(500).send({ error: 'Internal server error' });
        }
    }
});

app.get('/home_moldova', limiter, speedLimiter, async (req, res) => {
    try{
        const response1 = await axios.get(service1Instances[service1Index] + '/moldova', {timeout : 5000});
        service1Index = (service1Index + 1) % service1Instances.length;
        const response2 = await axios.get(service2Instances[service2Index] + '/moldova', {timeout : 5000});
        service2Index = (service2Index + 1) % service2Instances.length;
        res.json(Object.assign({}, response1.data,  response2.data ));

    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            res.status(408).send({ error: 'Request timeout' });
        } else {
            console.log(error);
            res.status(500).send({ error: 'Internal server error' });
        }
    }
});


app.listen(3000, () => console.log('Gateway running on port 3000'));