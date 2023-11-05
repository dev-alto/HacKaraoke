const {
    EndBehaviorType,
    joinVoiceChannel,
    VoiceConnectionStatus,
} = require(`@discordjs/voice`)

const fs = require('node:fs')
const path = require('node:path')
const prism = require('prism-media')

const { OpusEncoder } = require("@discordjs/opus")

const opusDecoderConfig = {
    frameSize: 1000,
    cahnnels: 2,
    rate: 48000
}

const createListeningStream = require(`../../createListeningStream.js`)

const { ChannelType, SlashCommandBuilder } = require(`discord.js`)

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`recording`)
        .setDescription(`test`)

        .addChannelOption(option => option
            .setName(`channel`)
            .setDescription(`The channel to join`)
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        ),

    async execute(interaction, bot) {
        const executionStartTime = performance.now()

        // define given user inputs
        const inputChannel = interaction.options.getChannel(`channel`)

        await interaction.deferReply()

        if (!bot.currentVoiceConnection) {
            bot.currentVoiceConnection = joinVoiceChannel({
                channelId: inputChannel.id,
                guildId: inputChannel.guild.id,
                adapterCreator: inputChannel.guild.voiceAdapterCreator,
                selfDeaf: false,
            })
            bot.currentVoiceConnection.once(VoiceConnectionStatus.Connecting, () => {
                console.log(`💫🔊 I am now connecting to voice channel: '${inputChannel.name}'`)
            })
        }

        bot.currentVoiceConnection.receiver.speaking.on(`start`, userID => function() {
            
        })

        const audioReceiveStream = bot.currentVoiceConnection.receiver.subscribe(userID,{
            end: {
                behavior: EndBehaviorType.AfterSilence,
                duration: 500,
            }
        }).on('error', (error) => {
            console.log("audioReceiveStream error: ", error);
        });
    
        const filename = `./recordings/${talkingUser}_${time}.pcm`
        const out = fs.createWriteStream(filename)
        // Create a decoder to decode the Opus audio data into PCM
        const opusDecoder = new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 })
    
        // Let's add some logging to the stream to make sure data is flowing
        const logStream = new (require('stream').Transform)({
            transform(chunk, encoding, callback) {
                //console.log(`Received ${chunk.length} bytes of data.`);
                callback(null, chunk);
            }
        })
    
        pipeline(audioReceiveStream, opusDecoder, logStream, out, (err) => {
            if (err) {
                console.error('Pipeline failed.', err);
            } else {
                console.log('Pipeline succeeded.');
            }
        })
    },
}