const express = require("express");
const axios = require('axios');
const app = express();
var cache = require('memory-cache');

require('dotenv').config()
app.use(express.json());

// Environment Variables

const PORT = process.env.PORT || 3000;
const serverurl = process.env.SERVER_URL;
const channelName = process.env.CHANNEL_NAME;

//Data Frequency Timing in ms & Title Text

const cacheTimeout = 300000; //300000ms = 5mins
const flashBriefingTitle = 'Rocket Chat Flash Briefing';

//PING ROUTE

app.get('/ping', (req,res) => {

  console.log('PING Request');

  const pongData = ('{"data":"PONG"}');
  var pong = JSON.parse(pongData);
  return res.status(200).json(pong);

})

//MAIN ROUTE

app.get('/', (req,res) => {

  if (cache.get('message')) {

    console.log('Using Cached Data From Memory');

    const resultJSON = JSON.parse(cache.get('message'));
    return res.status(200).json(resultJSON);

  } else {

    console.log('Getting New Data From Rocket Chat Server');

    return axios.get(`${ serverurl }/api/v1/channels.anonymousread?roomName=${ channelName }`)
      .then(response => {

        const responseJSON = JSON.stringify({
          uid: response.data.messages[0]._id,
          updateDate: response.data.messages[0].ts,
          titleText: flashBriefingTitle,
          mainText: response.data.messages[0].msg,
          streamUrl: "https://s3.amazonaws.com/uploads.use1.cloud.rocket.chat/KqCQiHfeFaKdSEGvy/uploads/XLRg3gpC7uZBaHp5u/FpaaN9jwwJT9tsw2a/ep4npMnAkFuMgABbe?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAILPK6SHTK5RJZLHQ%2F20190627%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20190627T090125Z&X-Amz-Expires=120&X-Amz-Signature=28683b1b15e66bd1d6ad33f5180b02ef6c4e9223d6e3e330b0e3ce4862a721b4&X-Amz-SignedHeaders=host",
          redirectionUrl: `${ serverurl }/channel/${ channelName }`
        });

        console.log('Storing Data In Memory.')
        cache.put('message', responseJSON, cacheTimeout);

        const result = JSON.parse(responseJSON);
        return res.status(200).json(result);
      })
      .catch(err => {
        console.log(err);
        return res.status(200).json(err);
      });

  }
});

app.listen(PORT,'0.0.0.0', function () {
  console.log(`Server Now Listening on Port ${PORT}`);
});
