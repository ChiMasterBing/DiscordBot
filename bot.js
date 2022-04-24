require('dotenv').config();

const Discord = require ('discord.js');
//const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
const client = new Discord.Client({
    intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "DIRECT_MESSAGES"],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'DIRECT_MESSAGES'],
});
client.on('ready', () => {
    console.log('hey baldies!');
    triviaActive = false;
});

client.on('message', msg => {
    if(msg.author.id === client.user.id) return;
    
    let s = msg.content;
    if (s[0] == '%') {
        command(s.substring(1), msg);
    }

    let dad = false;
    let text = '';
    //console.log(msg.author.id);
    for (let i=0; i<s.length-7; i++) {
        if (s[i] === 'I' && s[i+1] === '\'' && s[i+2] === 'm' && s[i+3] === ' ' && s[i+4] === 'D' && s[i+5] == 'a' && s[i+6] == 'd') {
            if (i - 3 >= 0) {
                let index = i-3;
                while (index > 0 && s[index] != ' ') {
                    text = s[index] + text;
                    index--;
                }
                dad = true;
            }
        }
    }
    if (dad === true) {
        let reply = 'Hi Dad! You\'re ' + text + '!';
        msg.reply(reply);
    }
});

async function command(text, msg) {
    if (text == 'trivia') {
        trivia(msg);
    }
    if (text == 'trivia add') {
        triviaAdd(msg);
    }
}
let triviaActive = false;

let users = [];
let usernames = [];
let scores = [];
let userAnswers = [];

let questionActive = false;
let questionResponses = 0;

let currentQuestionId = -1;
let correctAnswer = -1;

let obtainedQuestions = false;

function trivia(msg) {
    if (triviaActive == false) {
        getQuestions();
        msg.channel.send('Starting trivia!');
        scores = [];
        users = [];
        usernames = [];
        userAnswers = [];
        triviaActive = true;
        currentQuestionId = 0;
        trivia(msg);
    }
    else if (obtainedQuestions == true){
        if (questionActive == false) {
            askQuestion(msg);
            questionActive = true;
            setTimeout(trivia, 10000, msg);
        }
        else {
            if (questionResponses == 0) {
                triviaActive = false;
                questionActive = false;
                msg.channel.send("trivia has ended! \nthe scores are:");
                let res = '';
                for (let i=0; i<users.length; i++) {
                    res += (usernames[i] + ": ");
                    res += (scores[i] + " points\n");
                }
                if (res != '') {
                    msg.channel.send(res);
                } 
                else {
                    msg.channel.send('none');
                }
            }
            else {
                for (let i=0; i<userAnswers.length; i++) {
                    if (userAnswers[i] == correctAnswer) {
                        scores[i] += 10;
                    }
                }
                questionActive = false;
                setTimeout(trivia, 1000, msg);
            }
        }
    }
    else {
        setTimeout(trivia, 1000, msg);
    }
}
let qs = [];
function askQuestion(msg) {
    let numQuestions = qs.length/6;
    let selection = rand(numQuestions);
    currentQuestionId++;
    correctAnswer = parseInt(qs[selection*6+5]);
    let questionText = '';
    for (let i=selection*6; i<selection*6+5; i++) { 
        if (i - selection*6 == 1) {
            questionText += ('A: ');
        }
        else if (i - selection*6 == 2) { 
            questionText += ('B: ');
        }
        else if (i - selection*6 == 3) {
            questionText += ('C: ');
        }
        else if (i - selection*6 == 4) {
            questionText += ('D: ');
        }
        questionText += (qs[i] + '\n');
    }   
    questionResponses = 0;
    for (let i=0; i<userAnswers.length; i++) {
        userAnswers[i] = '';
    }
    msg.channel.send('Question ' + currentQuestionId + ' : ' + questionText);   
}
var fs = require("fs");
function getQuestions() {
    fs.readFile("questions.txt", "utf-8", (err, data) => {
        let s = data.toString();
        s = s.replaceAll('\r', '');
        let fqs = s.split('\n');
        qs = [];
        for (let i=1; i<=fqs[0]*6; i++) {
            qs.push(fqs[i]);
        }
        obtainedQuestions = true;
    });
}
function rand(max) {
    return Math.floor(Math.random() * max);
}
client.on("message", msg => {
    if(msg.author.id === client.user.id) {
        let s = msg.content;
        if (s.substring(0, 8) == 'Question') {
            msg.react('🇦');
            msg.react('🇧');
            msg.react('🇨');
            msg.react('🇩');
        }
    }
})
async function processReaction(reaction, user) {
    //console.log('reaction recieved');
    let msg = reaction.message, emoji = reaction.emoji;
    let s = msg.content;
    if (s.substring(0, 8) == 'Question') {
        let existing = false;
        let index = -1;
        for (let i=0; i<users.length; i++) {
            if (users[i] == user.id) {
                existing = true;
                index = i;
                break; 
            } 
        }
        if (!existing) {
            users.push(user.id);
            usernames.push(user.tag);
            scores.push(0);
            userAnswers.push('');
            index = users.length-1;
        }
        if (emoji.name == '🇦') {
            userAnswers[index] = 1;
        }
        else if (emoji.name == '🇧') {
            userAnswers[index] = 2;
        }
        else if (emoji.name == '🇨') {
            userAnswers[index] = 3;
        }
        else if (emoji.name == '🇩') {
            userAnswers[index] = 4;
        }
        questionResponses++;
    }
}

client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) { 
			console.error('brhu did u delete something?', error);
			return;
		}
	}
    if (reaction.message.author.id != client.user.id) return;
    if (user.id == client.user.id) return;
    processReaction(reaction, user);
});

const lineReplace = require('line-replace');

async function triviaAdd(msg) {
    let res = '';
    let msg2 = await msg.author.send('You have started the process for adding a question.\nCurrently I only support multiple choice with 4 answers.\nPlease input your question in this format:\n line 1: question statement\n line 2: answer choice 1\n line 3: answer choice 2\n line 4: answer choice 3\n line 5: answer choice 4\n line 6: correct answer choice (the answer choice number, input only a number)\nDo not type "line x" in each line, only the information. \nPlease type each message out seperately. This command will time out in 1 minute\ntype cancel to cancel.');
    let filter = collected => collected.author.id === msg.author.id;
    let collector = msg2.channel.createMessageCollector({
        filter,
        max: 6,
        time: 60000,
    });

    collector.on('collect', (m) => {
        if (m.content == 'cancel') {
            msg.author.send('canceled');
            return;
        }
        res += m.content + '\n';
    });
    collector.on('end', (collected) => {
        console.log(`Collected ${collected.size} items`); 
        try {
            let nq = '';
            nq += (qs.length/6+1) + '\n';
            for (let i=0; i<qs.length; i++) {
                nq += (qs[i] + '\n');
            }
            nq += res;
            fs.writeFileSync('questions.txt', nq);
            getQuestions();

            msg.author.send('Sucessfully created question! :D');
        } catch (err) {
            msg.author.send('Oops, something went wrong. Please try again by starting the command again the server.');
        }
    });
}

client.login(process.env.TOKEN);
getQuestions();