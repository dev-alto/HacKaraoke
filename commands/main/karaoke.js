/*
    TODO:
        + make resourceInfo become passed as a reference to AudioManager instances instead
            (will allow for it to be changed after initializing the resource)
        + move keys outside to more secure place
        + optimze search query parameters down to Music videos, and videos with most views
*/

const fs = require(`node:fs`)

const { 
    joinVoiceChannel,
    VoiceConnectionStatus,
} = require(`@discordjs/voice`)

const { 
    SlashCommandBuilder, 
    ChannelType,
    ActivityType,
} = require(`discord.js`)

const AudioManager = require(`../../AudioManager.js`)

const ytdl = require(`ytdl-core`)

const XMLHttpRequest = require(`xmlhttprequest`).XMLHttpRequest

const TRACK_ENDPOINT = `https://api.spotify.com/v1/tracks/`
const YT_SEARCH_ENDPOINT = `https://www.googleapis.com/youtube/v3/search?`

const YT_API_KEY = `AIzaSyCOYaRyyodqWIhtewgMSjUZyMy3JhU2P1o`

const SPOTIFY_CLIENT_ID = `57f004ef09ca4430a6c05f73e0a6cf94`
const SPOTIFY_CLIENT_SECRET = `e34a9bd5cd664e8f871aa33c61af84f9`

module.exports = {
    
    data: new SlashCommandBuilder()
        .setName(`karaoke`)
        .setDescription(`Replies with Pong!`)

        .addChannelOption(option => option
            .setName(`channel`)
            .setDescription(`The channel to join`)
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )

        .addStringOption(option => option
            .setName(`string`)
            .setRequired(true)
            .setDescription(`Wildcard string`)
        )

        .addNumberOption(option => option
            .setName(`queueindex`)
            .setDescription(`Wildcard number`)
        ),

    async execute(interaction, bot) {
        const executionStartTime = performance.now()

        // define given user inputs
        const inputChannel = interaction.options.getChannel(`channel`)
        let inputString = interaction.options.getString(`string`)
        const inputQueueIndex = interaction.options.getNumber(`queueindex`)

        // define and prepare required bot components
        if (!bot.currentVoiceConnection) {
            bot.currentVoiceConnection = joinVoiceChannel({
                channelId: inputChannel.id,
                guildId: inputChannel.guild.id,
                adapterCreator: inputChannel.guild.voiceAdapterCreator,
            })
            bot.currentVoiceConnection.once(VoiceConnectionStatus.Connecting, () => {
                console.log(`💫🔊 I am now connecting to voice channel: '${inputChannel.name}'`)
            })
        }

        if (!bot.audioManager) { 
            bot.client.user.setActivity(`🎶 Music in a VC`, { type: ActivityType.Playing })

            bot.audioManager = new AudioManager(bot.currentVoiceConnection) 
            bot.audioManager.stateChanged.on(`stopping`, function() {
                //console.log("changing to stopping")
                bot.client.user.setActivity(`VC Requests`, { type: ActivityType.Listening });
            })
            bot.audioManager.stateChanged.on(`playing`, function() {
                //console.log("changing to playing")
                bot.client.user.setActivity(`🎶 Music in a VC`, { type: ActivityType.Playing })
            })
        }
        bot.currentVoiceConnection.subscribe(bot.audioManager.getPlayer())

        // main
        //interaction.reply(`✅ Your command was received. Processing...`)
        //interaction.channel.send(bot.formatOptions(interaction.options._hoistedOptions))

         // TODO
        const resourceInfo = {
            name: ``,
            source: ``,
            length: 0,
            user: `${interaction.user.username}`//#${interaction.user.discriminator}`,
        }

        // Spotify will source audio media from YouTube

        // ⚠️ TODO: currently very unsafe!
        if (inputString.search(`https://open.spotify.com/track/`) != -1) {
            const request_accessToken = new XMLHttpRequest()
            request_accessToken.open(`POST`, `https://accounts.spotify.com/api/token`, false)
            request_accessToken.timeout = 5000

            request_accessToken.setRequestHeader(`Authorization`, `Basic ` + (new Buffer.from(SPOTIFY_CLIENT_ID + `:` + SPOTIFY_CLIENT_SECRET).toString(`base64`))) 
            request_accessToken.setRequestHeader(`Content-Type`, `application/x-www-form-urlencoded`)
            request_accessToken.send(`grant_type=client_credentials`)

            if (request_accessToken.status != 200) { console.warn(`received 200 ${request_accessToken.responseText}`) }

            const response_accessToken = JSON.parse(request_accessToken.responseText)
            console.log(response_accessToken)

            const access_token = response_accessToken.access_token

            ////////////////////////////////////////
            ////////////////////////////////////////
            ////////////////////////////////////////

            const trackID = inputString.replace(`https://open.spotify.com/track/`, ``)

            const request_trackInfo = new XMLHttpRequest()
            request_trackInfo.open(`GET`, `${TRACK_ENDPOINT}${trackID}`, false)
            request_trackInfo.timeout = 5000

            request_trackInfo.setRequestHeader(`Authorization`, `Bearer ${access_token}`)
            request_trackInfo.send()

            const response_trackInfo = JSON.parse(request_trackInfo.responseText)
            //console.log(response_trackInfo)
            console.log(response_trackInfo.name)
            console.log(response_trackInfo.artists[0].name)

            // added proper URI encoding - fixes unsupported characters hanging requests when querying the yt api
            const searchQuery = encodeURI(`${response_trackInfo.artists[0].name} ${response_trackInfo.name}`)
            console.log(`> Decided search query: ${searchQuery}`)

            const _benchmark_2 = performance.now()
            console.log(`📨 Sending search query request to Google's YouTube API...`)

            const request_ytSearch = new XMLHttpRequest()
            request_ytSearch.open(`GET`, `https://www.googleapis.com/youtube/v3/search?key=${YT_API_KEY}&q=instrumental+${searchQuery}`, false)
            request_ytSearch.send()

            console.log(`✅ Response received from Google's YouTube API in ${Math.trunc(performance.now() - _benchmark_2)}ms`)

            const response_ytSearch = JSON.parse(request_ytSearch.responseText)
            inputString = `https://youtube.com/watch?v=${response_ytSearch.items[0].id.videoId}` // currently defaults to first found video
            console.log(inputString)

            resourceInfo.source = `Spotify via `
        }

        ////////////////////////////////////////
        ////////////////////////////////////////
        ////////////////////////////////////////

        if (inputString.search(`youtube.com/watch`) != -1 || inputString.search(`youtu.be/`) != -1) {
            const _benchmark_1 = performance.now()
            const videoInfo = await ytdl.getBasicInfo(inputString)
            resourceInfo.name = videoInfo.videoDetails.title
            resourceInfo.length = Number(videoInfo.videoDetails.lengthSeconds)
            resourceInfo.source += `YouTube`
            //console.log(`retrieved online data. done in ${Math.trunc(performance.now() - _benchmark_1)}ms`)

            const ytStream = ytdl(inputString, { 
                filter: `audioonly`,
                highWaterMark: 1<<25
            })
            bot.audioManager.queueTrack(ytStream, resourceInfo, inputQueueIndex)
        }

        interaction.reply(`✅ Your request was received.\n⏰ Response processed in ${Math.trunc(performance.now() - executionStartTime)}ms`)
        //interaction.channel.send(`💽 — Added \`${resourceInfo.name}\` to the player queue.`))
    },
}

//xo0ky8FomoU
//fU4zb23tKLM

/*
        connection.on(VoiceConnectionStatus.Connecting, () => {
            console.log(`The connection has entered the Connecting state!`)
            interaction.followUp(`The connection has entered the Connecting state!`)
        })

        connection.on(VoiceConnectionStatus.Signalling, () => {
            console.log(`The connection has entered the Signalling state!`)
            interaction.followUp(`The connection has entered the Signalling state!`)
        })

        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log(`The connection has entered the Ready state - ready to play audio!`)
            interaction.followUp(`The connection has entered the Ready state - ready to play audio!`)
        })
*/


