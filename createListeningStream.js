const { EndBehaviorType, VoiceReceiver } = require('@discordjs/voice')
const { createWriteStream } = require('node:fs')
const prism = require('prism-media')
const { pipeline } = require('node:stream')


function createListeningStream(receiver, userId) {
    const opusStream = receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 100,
        },
    })

    const decoder = new prism.opus.Decoder({frameSize: 640, channels: 1, rate: 16000});

    const filename = `./recordings/${userId}.ogg`;

    //console.log(filename)

    const out = createWriteStream(filename);

    console.log(`👂 Started recording ${filename}`);

    pipeline(opusStream, decoder, out, (err) => {
        if (err) {
            console.warn(`❌ Error recording file ${filename} - ${err.message}`)
        } else {
            console.log(`✅ Recorded ${filename}`)
        }
    })
}

module.exports = createListeningStream