
/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */

// load required modules
// helps control asynchronous flow
var async = require('async');
// utility for handling file paths
var path = require('path');
// runs a command in a shell and buffers the output
var exec = require('child_process').exec;
// launches a child process
var spawn = require('child_process').spawn;
// http request client
var request = require('request');
// IBM Watson services client
var watson = require('watson-developer-cloud');
// robotics programming framework
var five = require('johnny-five');
// edison IO library
var Edison = require('edison-io');
// english number utility
var numify = require('numstr').numify;
//node-pixel pixel controller

// globals
// reference to the led strip
// reference to led object
var led = null;
// keeps track of if we are already working on a command
var working = false;
var privacyOn = false;

var username;
// initialize watson text-to-speech service
var textToSpeech = watson.text_to_speech({
  username: 'c3f77887-ce72-4e6f-898e-5ec84586311f',
  password: 'Zjehoy3O86U6',
  version: 'v1'
});

// initialize watson speech-to-text service
var speechToText = watson.speech_to_text({
  username: 'f41a73ac-5a2d-4d8d-afc9-913ae23edaf4',
  password: 'YIBaFt8W8pR2',
  version: 'v1'
});

// accepts a string and reads it aloud
function tts(text, cb) {
  // build tts parameters
  var params = {
    text: text,
    accept: 'audio/wav'
  };

  var paramsA = {
    text: 'I am sorry, but I could not complete your request.',
    accept: 'audio/wav'
  };
  textToSpeech.synthesize(paramsA);

  // create gtstreamer child process to play audio
  // 'fdsrc fd=0' says file to play will be on stdin
  // 'wavparse' processes the file as audio/wav
  // 'pulsesink' sends the audio to the default pulse audio sink device
  var gst = exec('gst-launch-1.0 fdsrc fd=0 ! wavparse ! pulsesink',
    function(err) {
      if (cb) {
        if (err) { return cb(err); }
        cb();
      }

    });
  // use watson and pipe the text-to-speech results directly to gst
  textToSpeech.synthesize(params).pipe(gst.stdin);
}

// listens for audio then returns text
function stt(cb, duration) {
  console.log('listening for %s ms ...', duration);
  // create an arecord child process to record audio
  var arecord = spawn('arecord', ['-D', 'hw:2,0', '-f', 'S16_LE', '-r44100']);
  // build stt params using the stdout of arecord as the audio source
  var params = {
    audio: arecord.stdout,
    content_type: 'audio/wav',
    continuous: true    // listen for audio the full 5 seconds
  };
  // use watson to get answer text
  speechToText.recognize(params, function(err, res) {
      if (cb) {
        if (err) { return cb(err); }
        var text = '';
        try {
          text = res.results[0].alternatives[0].transcript;
        } catch (e) { }
        console.log('you said: "%s"', text);
        if (!text.includes('xfinity')) {
          return;
        }
        if (text.includes('my name is')) {
          username = text.substring(11, 40);
          console.log('your name is ' + username);
          speak('Hello' + username + ' It\'s nice to meet you');
          finish();
          return;
        } else if (text.includes('what is my name')) {
          if (username) {
            speak('You haven\'t told me your name yet.');
            finish();
            return;
          } else {
            speak('Well, you told me that your name is' + username);
            finish();
            return;
          }
        }
        text = text.replace('xfinity', '');
        cb(null, text.trim());
      }

    });
  // record for duration then kill the child process
  setTimeout(function() {
    arecord.kill('SIGINT');
  }, duration);
}

function requestLedPattern(pattern) {
  var url = 'http://10.0.0.149/' + pattern;

  request.get(url)
  .on('error', function(err) {
    console.log(err);
  });
}
// plays a local wav file
function playWav(file, cb) {
  var filePath = path.resolve(__dirname, file);
  // create gtstreamer child process to play audio
  // 'filesrc location=' says use a file at the location as the src
  // 'wavparse' processes the file as audio/wav
  // 'volume' sets the output volume, accepts value 0 - 1
  // 'pulsesink' sends the audio to the default pulse audio sink device
  exec('gst-launch-1.0 filesrc location=' + filePath +
    ' ! wavparse ! volume volume=0.08 ! pulsesink', function(err) {
        if (cb) {
          return cb(err);
        }
      });
}

// initialize edison board
var board = new five.Board({
  io: new Edison(),
  repl: false           // we don't need the repl for this project
});

// when the board is ready, listen for a button press
board.on('ready', function() {
  requestLedPattern('powerOn');
  tts('Ready');
  // var button = new five.Button('J19-5');
  led = new five.Led(33);
  led.off();
  //button.on('press', main);
  main();
});

// main function
function main() {
  setTimeout(function() {
    if (privacyOn || working) {
      return;
    }
    main();
  }, 8000);
  working = true;

  async.waterfall([
    listen,
    speak
  ], finish);
}

function clearBackgroundListen() {
  working = false;
}
// handle any errors clear led and working flag
function finish(err) {
  if (err) {
    tts('Nope.');
    requestLedPattern('error');
    console.log(err);
  }
  // stop blinking and turn off
  led.stop().off();
  working = false;
  main();
}

// listen for the audio input
function listen(cb) {
  // turn on the led
  led.on();
  stt(cb, 8000);
  requestLedPattern('listen');
}

// perform a search using the duckduckgo instant answer api
function search(q, cb) {
  if (!q) {
    if (cb) {
      requestLedPattern('listenError');
      return cb(null, 'I\'m sorry I didn\'t hear you.');
    }

  }
  // blick the led every 100 ms
  led.blink(100);
  playWav('XR-18-FinishListen.wav');
  requestLedPattern('processing');

  // run the query through numify for better support of calculations in
  // duckduckgo
  q = numify(q);
  console.log('searching for: %s', q);
  var requestOptions = {
    url: 'https://api.duckduckgo.com/',
    accept: 'application/json',
    qs: {
      q: q,
      format: 'json',
      no_html: 1,
      skip_disambig: 1
    }
  };
  request(requestOptions, function(err, res, body) {
      if (cb) {
        if (err) { return cb(err); }
        var result = JSON.parse(body);
        // default response
        var text = 'I\'m sorry, I was unable to find any information on ' + q;
        if (result.Answer) {
          text = result.Answer;
        } else if (result.Definition) {
          text = result.Definition;
        } else if (result.AbstractText) {
          text = result.AbstractText;
        }
        cb(null, text);
      }
    });
}

// read the search results
function speak(text, cb) {
  // stop blinking and turn off
  led.stop().off();
  if (!text) {

    text = 'I am sorry, but I could not complete the request';
  }
  tts(text, cb);
}
