const { Client, GatewayIntentBits } = require("discord.js");
const OpenAI = require("openai");
const dotenv = require("dotenv");

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
// });

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (msg) => {
    try {
        if (msg.author.bot) return;
        if (!msg.mentions.has(client.user)) return;

        const prompt = msg.content.replace(/<@!?\d+>/g, "").trim();
        if (!prompt) return;

        const thinkingMessage = await msg.reply("🤖 Thinking...");

        // const response = await openai.responses.create({
        //     model: "gpt-4.1-mini",
        //     input: prompt,
        //     max_output_tokens: 150,
        // });
        // console.log(response);

        // const output = response.output?.[0]?.content?.[0]?.text?.value || "No response generated 😅";

        // await thinkingMessage.edit(output);
    } catch (err) {
        console.error("Error in messageCreate event:", err);
        await msg.reply("⚠️ Something went wrong.");
    }
});

client.login(process.env.DISCORD_TOKEN);
