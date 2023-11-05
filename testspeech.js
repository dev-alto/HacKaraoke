// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');
const fs = require('node:fs')

require('dotenv').config()
console.log(process.env) // remove this after you've confirmed it is working

const client = new speech.SpeechClient();

/**
 * Calls the Speech-to-Text API on a demo audio file.
 */
async function quickstart() {
    // The path to the remote LINEAR16 file stored in Google Cloud Storage
    //const gcsUri = 'gs://cloud-samples-data/speech/brooklyn_bridge.raw';

    // The audio file's encoding, sample rate in hertz, and BCP-47 language code
    const audio = {
        content: fs.readFileSync('./testing.mp3').toString('base64')
        //uri: gcsUri,
    }

    const config = {
        encoding: 'MP3',
        sampleRateHertz: 44100,
        languageCode: 'en-US'
    }

    const request = {
        audio: audio,
        config: config
    }

    // Detects speech in the audio file
    const [response] = await client.recognize(request);
    const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

    console.log(`Transcription: ${transcription}`)
}

quickstart()