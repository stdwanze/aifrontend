const { Porcupine, BuiltinKeyword } = require("@picovoice/porcupine-node");
const { PvRecorder } = require("@picovoice/pvrecorder-node");
const AudioRecorder = require('node-audiorecorder');
const { exec } = require('child_process');
const fs = require('fs');
const OpenAI = require('openai');
const axios = require('axios');
const {setupAndListen} = require('./playResponse');
const { config } = require("./config");
let _wait = false;
let player ="aplay -D 'plughw:1'";
//let player = "afplay";
const options = {
    //program: `sox`, // Which program to use, either `arecord`, `rec`, or `sox`.
    //device: "plughw:0", // Recording device to use, e.g. `hw:1,0`

    program: `arecord`, // Which program to use, either `arecord`, `rec`, or `sox`.
    device: "plughw:0,0", // Recording device to use, e.g. `hw:1,0`
  
    bits: 16, // Sample size. (only for `rec` and `sox`)
    channels: 1, // Channel count.
    encoding: `signed-integer`, // Encoding type. (only for `rec` and `sox`)
    format: `S16_LE`, // Encoding type. (only for `arecord`)
    rate: 16000, // Sample rate.
    type: `wav`, // Format type.

    // Following options only available when using `rec` or `sox`.
    silence: 2, // Duration of silence in seconds before it stops recording.
    thresholdStart: 1, // Silence threshold to start recording.
    thresholdStop: 0.5, // Silence threshold to stop recording.
    keepSilence: true, // Keep the silence in the recording.
}

setupAndListen(setWaitToFalse,playResponse);
let audioRecorder = new AudioRecorder(options, console);
audioRecorder.on('end', async function () {
    console.warn('Recording ended.');
   // audioRecorder.stop();
    
    transcribe();
    let start = new Date();
    let transcription = {
        text: await postAudio()
    };
    let transcribed = new Date();

    console.log(transcribed-start);
    /*const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream("sound.wav"),
        model: "whisper-1",
    });*/

    console.log(JSON.stringify(transcription) + " send it"); 
    await axios({
        method: 'post',
        url: 'http://192.168.1.216:5678/webhook/7c6341df-c6d3-4ab6-ae3f-cc04afbaa7c1',
        //url: 'https://localhost/webhook/7c6341df-c6d3-4ab6-ae3f-cc04afbaa7c1',
        data: {
          transcription
        }
      });
    think();

});

const porcupine = new Porcupine(
     config.porcupine,
    [BuiltinKeyword.COMPUTER],
    [0.5]
);

const recorder = new PvRecorder(porcupine.frameLength, -1);
const openai = new OpenAI({ apiKey: config.openai });

async function postAudio(){
    
    _wait = true;
    let data = fs.readFileSync('sound.wav');

    let config = {
        method: 'post',
      //  maxBodyLength: Infinity,
        url: 'http://192.168.1.216:3444',
        headers: { 
          'Content-Type': 'audio/wave'
        },
        data : data
      };


    let transcript = await axios.request(config);
    console.log(transcript.data);
   return transcript.data;

}
function beep() {
    exec(player+' beep.wav', () => { console.log("played") });

}
function think()
{
    exec(player+' think.wav', () => { console.log("played") });

}
function transcribe(){
    exec(player+' erkenne.wav', () => { console.log("played") });
}
function wait(){
    exec(player+' wait.wav', () => { console.log("played") });
}
function playResponse(){
    exec(player+' audio.wav', () => { console.log("played") });
}
function setWaitToFalse(){
    console.log("wait = false");
    _wait = false;
}


function playWaitConditionaly(){
    if(_wait)
    {
        console.log("wait is true");
        wait();
    }
    setTimeout(playWaitConditionaly,5000);
}

async function start() {

    playWaitConditionaly();

    recorder.start();

    while (1) {
      
        const frames = await recorder.read();
        const index = porcupine.process(frames);
        if (index !== -1) {

            const fileStream = fs.createWriteStream("sound.wav", { encoding: 'binary' });
            beep();
            
            audioRecorder
            .start()
            .stream()
            .pipe(fileStream);


            console.log(`Detected 'COMPUTER'`);
        }
    }

}

start();
console.log(`Listening for 'COMPUTER'...`);
process.stdin.resume();
console.log("Press ctrl+c to exit.");
