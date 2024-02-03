# PAD_Suplimentar

## Main Ideea
soo the main ideea is an app with 2 microservices both in python, and a gateway in JS, one microservice get all the statistic about covid 19 from web, and the second one get some news, also in the second I have a search 
maked with the power of RapidAPI, sooo the ideea is to get the statistic and news about COVID 19. In postman we can see what I have multiple endpoints,
first is countries to get all the posible countries from API, the second is country/<country> in order to get the information about a specific country, also we have an endpoint for Moldova, one for communication between services , 
one for adding data to db and soo one. In the second microservice, I have 2 endpoints to get news about covid from web, also an endpoint to get photos about covid, also an endpoint to get news about Moldova. 
I tottaly forget about the endpoint history in order to get some statistic about a specific country , in a specific moment of time.
The gateway have 3 endpoints to agregate the data from both microservices, a round Robin load balancer, and all the necesary points like task timeout and concurent tasks limit.
I trully work hard this days , soo I'm not proud of this project but I did my best .

## Last but not Least
## Grafana:
https://killercoseru.grafana.net/d/ddbmypj1u40zkb/statistic?orgId=1&from=1706922676961&to=1706944276961&viewPanel=1
https://killercoseru.grafana.net/d/bdbmyiedd8c1sd/news?orgId=1&from=1706923204956&to=1706944804956&viewPanel=1
