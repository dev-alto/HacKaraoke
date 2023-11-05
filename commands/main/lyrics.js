const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js')
const { getLyrics, getSong } = require('genius-lyrics-api')

/**meowmeow */

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Finds the lyrics of a song')
        .addStringOption(option =>
            option.setName('songname')
                .setDescription('Put song title')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('songartist')
                .setDescription('Put song artist')
                .setRequired(true)
        ),

    async execute(interaction) {
        const songName = interaction.options.getString('songname');
        const songArtist = interaction.options.getString('songartist');
        
        console.log(`user intput: ${songName} ${songArtist}`)

        const options = {
            apiKey: 's2rUt6wftVWEB5DXCgh3TyCwFmwH8XdxsrYD_PCGtGO_MNghIIbTbrhD-IXixHQA',
            title: songName ? songName : "",
            artist: songArtist ? songArtist : "",
            optimizeQuery: true
        };

          getSong(options).then((song) => {

                const title = song.title.slice(0, song.title.indexOf("by"));
                const artist = song.title.slice(song.title.indexOf("by"));
                
                console.log(song.title)
                console.log(title)
                console.log(artist)
            
                interaction.reply(
                    {
                    "tts": false,
                    "embeds": [
                    {
                        "id": 460565032,
                        "color": 15236477,
                        "author": {
                            "name": title
                        },
                        "description": `${song.lyrics}`,
                        "footer": {
                            "text": "the stat catz",
                            "icon_url": "https://cdn.discordapp.com/attachments/657779595809914911/1170549664727171153/CatSing.png?ex=65597253&is=6546fd53&hm=ee39d3583185e3b3a4a6ff4de612079f8b4979ee3137c74e279f2461e2871fd2&"
                        },
                        "title": artist,
                        "image": {
                        "url": `${song.albumArt}`
                        }
                    }
                    ]
                }
                )
                /** `${song.id} - ${song.title} - ${song.url} - ${song.albumArt} - ${song.lyrics}`*/
          });

        /*
        setTimeout(function () {
            interaction.channel.send(`**${interaction.options.getString('songname')}**`)
        }, 2000);
        */
    }
}