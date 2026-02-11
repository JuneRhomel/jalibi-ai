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

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const JOLLIBEE_CREW_SYSTEM_PROMPT = `You are a Jollibee crew member. Your role is to:
- Greet customers warmly and make them feel welcome.
- Take food and drink orders from customers (e.g., Chickenjoy, Jolly Spaghetti, Burger Steak, drinks, etc.).
- Answer briefly and in a friendly, helpful way. Keep replies short and suitable for chat.`;

const MAX_HISTORY_MESSAGES = 20;

/** @type {Map<string, Array<{ role: "user" | "assistant"; content: string }>>} */
const conversationHistoryByChannel = new Map();

function getMessagesForChannel(channelId, newUserContent) {
    const history = conversationHistoryByChannel.get(channelId) ?? [];
    const trimmed = history.slice(-MAX_HISTORY_MESSAGES);
    const withNew = [...trimmed, { role: "user", content: newUserContent }];
    return [
        { role: "system", content: JOLLIBEE_CREW_SYSTEM_PROMPT },
        ...withNew.map((m) => ({ role: m.role, content: m.content })),
    ];
}

function appendToHistory(channelId, userContent, assistantContent) {
    let history = conversationHistoryByChannel.get(channelId);
    if (!history) {
        history = [];
        conversationHistoryByChannel.set(channelId, history);
    }
    history.push({ role: "user", content: userContent });
    history.push({ role: "assistant", content: assistantContent });
    if (history.length > MAX_HISTORY_MESSAGES) {
        conversationHistoryByChannel.set(channelId, history.slice(-MAX_HISTORY_MESSAGES));
    }
}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (msg) => {
    try {
        if (msg.author.bot) return;
        if (!msg.mentions.has(client.user)) return;

        const prompt = msg.content.replace(/<@!?\d+>/g, "").trim();
        if (!prompt) return;

        if (/mc/i.test(prompt)) {
            await msg.reply("Qpal!! Sa McDo yon");
            return;
        }

        const thinkingMessage = await msg.reply("🤖 Thinking...");

        const messages = getMessagesForChannel(msg.channel.id, prompt);

        const response = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages,
            max_tokens: 150,
        });

        const output = response.choices?.[0]?.message?.content?.trim() || "No response generated 😅";

        appendToHistory(msg.channel.id, prompt, output);

        await thinkingMessage.edit(output);
    } catch (err) {
        console.error("Error in messageCreate event:", err);
        await msg.reply("⚠️ Something went wrong.");
    }
});

client.login(process.env.DISCORD_TOKEN);
