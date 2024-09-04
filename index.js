require("dotenv/config");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
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
const Summary = require("./models/summaryModel.js");

// Make the database connections
dbConnection();

// Initailize the mail server
// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // Your email address
    pass: process.env.EMAIL_PASSWORD, // Your email password or app password
  },
});

// Define the mail options
const mailOptions = {
  from: process.env.EMAIL, // Sender address
  to: process.env.RECIPIENT_EMAIL, // Recipient address (could be your own email)
  subject: "Summary Saved Successfully", // Subject line
  text: "The summary has been successfully saved to the database.", // Plain text body
};

// OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

// Set the cron job to db save the summary
cron.schedule("* * * * *", async () => {
  // Runs every minute
  try {
    const latestTasks = await Task.find();
    let summary =
      "These are my tasks and the dates that I have done those tasks: \n";

    latestTasks.forEach((taskObject) => {
      if (taskObject.name === "hashith") {
        summary += `${taskObject.task} - created date: ${taskObject.createdAt}\n`;
      }
    });

    if (summary.length > 100) {
      summary += "Generate me a weekly summary of my work.";
      const result = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. And you to generate me summaries based on my given data.",
          },
          { role: "user", content: summary },
        ],
        max_tokens: 512,
      });

      // Save the summary to a new database
      const SummaryToSave = new Summary({
        userName: "hashith",
        summary: result.data.choices[0].message.content,
      });

      try {
        await SummaryToSave.save();
        console.log("Summary saved successfully.");

        // Send the email notification
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log("Error sending email:", error);
          }
          console.log("Email sent: " + info.response);
        });
      } catch (error) {
        console.log("Database Save Error:", error);
      }
    } else {
      console.log("Summary not generated. Not enough content.");
    }
  } catch (error) {
    console.log("Error in cron job:", error);
  }
});

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
