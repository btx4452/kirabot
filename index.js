
import { Telegraf } from "telegraf";
import { message } from 'telegraf/filters';

import OpenAI from "openai";

import dotenv from "dotenv";
dotenv.config(); 

// ------------------------------------------------------------------------------------
// .endv must contain these entries 
//
// BOT_TOKEN= Telegraam bot tocken 
// OPENAI_API_KEY= OpenAI API key 
// CHAT_GPT_PROMPT= system prompt for GPT
// ------------------------------------------------------------------------------------

import express from 'express';
const app = express();


// ------------------------------------------------------------------------------------
// Initialize ChatGPT model 
// ------------------------------------------------------------------------------------

const MODEL = "gpt-3.5-turbo";

const systemPrompt = [
    { 
      role: "system", 
      content: process.env.CHAT_GPT_PROMPT
    }
];


// OpenAI library now reads the OPENAI_API_KEY environment variable by itself   
// I am using the p.dxxxxx account with KiraBot project API key


const openai = new OpenAI();

// ------------------------------------------------------------------------------------
// Control commands 
// ------------------------------------------------------------------------------------



// Listen to the App Engine-specified port, or 8080 otherwise

app.get('/', (req, res) => {
  res.send('Hello from kira bot!');
});

// ------------------------------------------------------------------------------------
// stop 
// ------------------------------------------------------------------------------------

app.get('/stop', (req, res) => {
  res.send('Exiting');
  process.exit(0);
});


// ------------------------------------------------------------------------------------
// memory 
// ------------------------------------------------------------------------------------

app.get('/memory', (req, res) => {

  let str = ""; 
  for (const [key,value] of Object.entries(process.memoryUsage())){
    str += `${key}: ${parseFloat( value / 1024 ).toFixed(2)} KB <br>`;
  }
  res.send(str);
  
});

// ------------------------------------------------------------------------------------
// history 
// ------------------------------------------------------------------------------------

app.get('/history', (req, res) => {

  let str = ""; 

  history.forEach(entry => {
    str +=  `user id: ${entry.user_id}: role: ${entry.role} message: ${entry.content} <br>` 
  });

  res.send(str);
  
});


// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

//import process from "process";


// ------------------------------------------------------------------------------------
// Init bot
// ------------------------------------------------------------------------------------

// This is quick and dirty and the bot will eventually run out of memory. Okay for now.

let history = [];  

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on('sticker', (ctx) => ctx.reply('👍'))

bot.on(message('text'), async (ctx) => {
  
  const message = ctx.message; 

  // save the user's message

  history.push({
    role: "user",
    user_id: message.from.id,
    content: message.text
  })

  // build chat history for this user

  let messagesFromThisUser = structuredClone(systemPrompt); 
  
  // Create history containing both the user's messages the replies from bot

  history.forEach(entry => {
    if ( entry.user_id === message.from.id ) 
    {
      messagesFromThisUser.push( {
        role: entry.role,
        content: entry.content
      }); 
    } 
  });  

  // call ChatGPT
  console.log("--------- call ChatGPT -------------");

  await openai.chat.completions.create({
    model: MODEL,
    messages: messagesFromThisUser,
    max_tokens: 128,
    temperature: 1,
    top_p: 1,
  })
  .then((res) => {
    const answer = res.choices[0].message.content;
   
    // Success. Add the message to the history, reply in Telegram

    history.push({
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

console.log('Kira bot is starting.');
console.log(process.env.CHAT_GPT_PROMPT);
bot.launch();



