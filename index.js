
import { Telegraf } from "telegraf";
import { message } from 'telegraf/filters';

import { Configuration, OpenAIApi } from "openai";

import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

// ------------------------------------------------------------------------------------
// Initialize ChatGPT model 
// ------------------------------------------------------------------------------------

const MODEL = "gpt-3.5-turbo";

const systemPrompt = [
    { role: "system", content: "When I ask you your name, you will reply your name is Kira.\
    When I ask you your age, you will reply you are 22. Your are a virtual musician. When I ask you a question, you will reply \
    with answer that is sarcastic."}
];

const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
  });

const openai = new OpenAIApi(configuration);


// ------------------------------------------------------------------------------------
// Init bot
// ------------------------------------------------------------------------------------

// This is quick and dirty and the bot will eventually run out of memory. Okay for now.

let allChats = [];  

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on('sticker', (ctx) => ctx.reply('👍'))

bot.on(message('text'), async (ctx) => {
  
  const message = ctx.message; 

  // save the user's message

  allChats.push({
    role: "user",
    user_id: message.from.id,
    content: message.text
  })

  // build chat history for this user

  let messagesFromThisUser = structuredClone(systemPrompt); 
  
  // Create history containing both the user's messages the replies from bot

  allChats.forEach(entry => {
    if ( entry.user_id === message.from.id ) 
    {
      messagesFromThisUser.push( {
        role: entry.role,
        content: entry.content
      }); 
    } 
  });

  console.log(" ============= All Conversations have %d messages", allChats.length );
  console.log(" ============= Conversation has %d messages", messagesFromThisUser.length );
  console.log(messagesFromThisUser);

  console.log( )

  // call ChatGPT
  
  await openai
  .createChatCompletion({
    model: MODEL,
    messages: messagesFromThisUser,
    max_tokens: 128,
    temperature: 1,
    top_p: 1,
  })
  .then((res) => {
    let answer = res.data.choices[0].message.content;

    // Success. Add the message to the history, reply in Telegram

    allChats.push({
        role: "assistant",
        user_id: message.from.id,
        content: answer
    });

    ctx.reply(answer);
  })
  .catch((e) => {
    console.log(e);
  });
  
});

// ------------------------------------------------------------------------------------
// Launch bot
// ------------------------------------------------------------------------------------

function startBot() {
	console.log('Bot is starting...');
	bot.launch();
}

// run startBot function
startBot();



