const {
    entersState,
    VoiceReceiver,
    joinVoiceChannel,
    VoiceConnectionStatus,
} = require(`@discordjs/voice`)

const ffmpeg = require('ffmpeg');

const fs = require('node:fs')
const path = require('node:path')
const prism = require('prism-media')

const { OpusEncoder } = require('@discordjs/opus')

const opusDecoderConfig = {
    frameSize: 1000,
    cahnnels: 2,
    rate: 48000
}

const createListeningStream = require(`../../createListeningStream.js`)
const recordingsPath = `./recordings/`

const { AttachmentBuilder, ChannelType, SlashCommandBuilder } = require(`discord.js`)

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`tape`)
        .setDescription(`test`)

        .addChannelOption(option => option
            .setName(`channel`)
            .setDescription(`The channel to join`)
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        ),

    async execute(interaction, bot) {
        const message = interaction.message
        const client = bot.client

        const inputChannel = interaction.options.getChannel(`channel`)

        console.log(interaction)
        /* Get the voice channel the user is in */
        const voiceChannel = inputChannel
        /* Check if the bot is in voice channel *

        /* If the bot is not in voice channel */
        if (!bot.currentVoiceConnection) {
            /* if user is not in any voice channel then return the error message */

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

            /* Add voice state to collection */
            await entersState(bot.currentVoiceConnection, VoiceConnectionStatus.Ready, 20e3)
            const receiver = bot.currentVoiceConnection.receiver;
            
            /* When user speaks in vc*/
            receiver.speaking.on('start', (userId) => {
                if(userId !== interaction.user.id) return;
                /* create live stream to save audio */
                createListeningStream(receiver, userId)
            })

            /* Return success message */
            return interaction.channel.send(`🎙️ I am now recording ${voiceChannel.name}`)
        
            /* If the bot is in voice channel */
        } else if (bot.currentVoiceConnection) {
            /* Send waiting message */
            const msg = await interaction.channel.send("Please wait while I am preparing your recording...")
            /* wait for 5 seconds */

            setTimeout(function() {

                /* disconnect the bot from voice channel */
                bot.currentVoiceConnection.destroy();

                /* Remove voice state from collection */    
                //client.voiceManager.delete(interaction.channel.guild.id)

                const filename = `${recordingsPath}${interaction.user.id}`;
                console.log(filename)

                /* Create ffmpeg command to convert pcm to mp3 */
                const process = new ffmpeg(`${filename}.pcm`);
                process.then(function (audio) {
                    audio.fnExtractSoundToMP3(`./${filename}.mp3`, async function (error, file) {
                        //edit message with recording as attachment
                        await msg.edit({
                            content: `🔉 Here is your recording!`,
                            files: [new AttachmentBuilder(`./${filename}.mp3`, 'recording.mp3')]
                        })

                        //delete both files
                        //fs.unlinkSync(`${filename}.pcm`)
                        //fs.unlinkSync(`${filename}.mp3`)
                    })
                }, function (err) {
                    /* handle error by sending error message to discord */
                    return msg.edit(`❌ An error occurred while processing your recording: ${err.message}`)
                })
                
            }, 5000)
        }
    },
}