const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lists commands'),
    async execute(interaction) {
        
        await interaction.reply(
            {
                    "tts": false,
                    "embeds": [
                        {
                            "id": 652627557,
                            "title": "**Help commands :3**",
                            "description": "Lists of commands\n\n**Ping**\nCheck ping\n\n**Lyrics <Song name, Song artist>**\nSends lyrics of chosen song\n\n**Karaoke <Channel name, URL of song>**\nBot joins the desired channel and plays the song \n\n**Record**\nRecords the karaoke session",
                            "color": 16749716,
                            "fields": [],
                            "image": {
                            "url": "https://media.tenor.com/UTrLSr85tYEAAAAC/happy-cat-cat.gif"
                            },
                            "thumbnail": {
                            "url": "https://media.tenor.com/XOKm8hiDW3UAAAAC/catshakira-cat.gif"
                            }
                        }
                    ]
                }
        )


    }
}