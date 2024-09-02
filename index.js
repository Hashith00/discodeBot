require("dotenv/config");
const { Client, IntentsBitField } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});
const dbConnection = require("./database/dbConnection.js");
const Task = require("./models/tasksModel.js");

// Make the database connections
dbConnection();

// OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

client.on("ready", () => {
  console.log("The bot is online!");
});

// Create conversation log
let conversationLog = [
  { role: "system", content: "You are a friendly chatbot." },
];

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  try {
    if (message.content.substring(0, 4) == "save") {
      console.log("Saved Message", message.content);

      // Save to database
      const taskToSave = new Task({
        name: message.author.globalName,
        task: conversationLog[conversationLog.length - 1].content,
      });
      try {
        const dbSavedResults = await taskToSave.save();
        message.reply("Data Saved");
        return;
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log(message.author.globalName, ": ", message.content);
    }
  } catch (error) {
    console.log(e);
  }

  // OPEN AI
  try {
    await message.channel.sendTyping();
    if (message.author.id == message.author.id) {
      conversationLog.push({
        role: "user",
        content: message.content,
      });
    }

    const result = await openai
      .createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: conversationLog,
        max_tokens: 256, // limit token usage
      })
      .catch((error) => {
        console.log(`OPENAI ERR: ${error}`);
      });
    message.reply(result.data.choices[0].message);

    // Check wheather results are present
    if (result) {
      conversationLog.push({
        role: "assistant",
        content: result.data.choices[0].message.content,
      });
    }
  } catch (error) {
    console.log(`ERR: ${error}`);
  }
});

client.login(process.env.TOKEN);
