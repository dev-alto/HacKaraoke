const { SlashCommandBuilder } = require(`discord.js`)

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`ping`)
        .setDescription(`Starts a round-trip latency test with the bot and Discord's server clusters`),

    async execute(interaction, bot) {
        await interaction.deferReply()

        const reply = await interaction.fetchReply()
        console.log(reply)
        const pingTime = reply.createdTimestamp - interaction.createdTimestamp
        console.log(pingTime)
        
        interaction.editReply(bot.formatAssertion(`🏓 Pong!`, `Hey, ${interaction.user}. Here are the results:\n* Client Round-Trip Latency: ${pingTime}ms\n* Discord's WebSocketShard Average Ping: ${bot.client.ws.ping}ms`))
    },
}