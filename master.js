// Require the necessary discord.js classes
const { Client, Collection, Events,  GatewayIntentBits, } = require('discord.js')
const { token } = require('./config.json')

const fs = require('node:fs')
const path = require('node:path')

const { generateDependencyReport } = require('@discordjs/voice')

// Create a new client instance
const client = new Client({ intents: [
    GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds],
})

const bot = {
    client: client,
    startTime: performance.now(),
    currentVoiceConnection: null,
    audioManager: null,

    formatOptions: function(optionsList) {
        let optionsListString = ``
        for (let i = 0; i < optionsList.length; i++) {
            const option = optionsList[i]
            const optionName = option.name
            const optionValue = option.value
            console.log(`➡ Option "${optionName}" passed as: \`${optionValue}\``)
            optionsListString += `:arrow_forward: Option **${optionName}** passed as: \`${optionValue}\` \n`
        }
        return optionsListString
    },

    formatAssertion: function(title, description) {
        return `# ${title}\n> ${description}`
    },
}

client.commands = new Collection()

const foldersPath = path.join(__dirname, 'commands')
const commandFolders = fs.readdirSync(foldersPath)

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder)
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file)
        const command = require(filePath)
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command)
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
        }
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return
    
    const command = client.commands.get(interaction.commandName)
    if (!command) return
    
    try {
        await command.execute(interaction, bot)
    } catch (error) {
        console.error(error)
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: bot.formatAssertion(`🛑 whoops!`, `Sorry, ${interaction.user}. I ran into an error while processing your command.`), ephemeral: false })
        } else {
            await interaction.reply({ content: bot.formatAssertion(`🛑 whoops!`, `Sorry, ${interaction.user}. I ran into an error while processing your command.`), ephemeral: false })
        }
    }
})

// When the client is ready, run this code (only once)

client.once(Events.ClientReady, c => {
    console.log(`✅ Ready! Logged in as ${c.user.tag}`)
    console.log(generateDependencyReport())

    client.user.setActivity('✅ Ready for Service')
    client.user.setStatus('idle');
})

// Log in to Discord with your client's token
client.login(token)