const { 
    SlashCommandBuilder, 
} = require(`discord.js`)

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`testskip`)
        .setDescription(`Replies with Pong!`),

        async execute(interaction, bot) {

        const executionStartTime = performance.now()

        // define and prepare required bot components
        await interaction.reply(`✅ Your command was received. Processing...`)
        if (!bot.audioManager || !bot.currentVoiceConnection) {
            return interaction.channel.send(`no audio playing rip`)
        }

        // main
        const audioManager = bot.audioManager
        if (audioManager.playing) {
            audioManager.skip()
        }

        interaction.channel.send(`⏰ Response processed in ${Math.trunc(performance.now() - executionStartTime)}ms`)
    },
}