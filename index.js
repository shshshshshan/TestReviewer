const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid'); 

const app = express();
const SESSION_EXPIRATION_THRESHOLD = 3_600_000;

app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: 'PaVxNCSvC&7ANnkmF2!',
        resave: false,
        saveUninitialized: true,
        cookie: { secure : false},
    })
)

const userSessions = {};

app.post('/submit', async (request, response) => {
    const payload = request.body;
    const keys = Object.keys(payload)

    const ptrs = payload['ptrs'];
    const sets = payload['sets'];
    const items = payload['items'];

    if (keys.length > 3 || !ptrs || !sets || !items)
    {
        response.statusCode = 400;
        response.setHeader('Content-Type', 'text/plain');
        response.end('Bad Request: Missing required payload\n');
        return;
    }

    try 
    {
        const userID = request.session.userID;
        let sessionData = getSessionData(userID);

        if (!sessionData || isSessionExpired(sessionData)) 
        {
            createNewSession(request);
            sessionData = getSessionData(request.session.userID);
            console.log('New session')
        }

        const reviewer = await generateReviewer(ptrs, sets, items, sessionData.ai_assigned);

        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/plain');
        response.end(reviewer['content']);
    } 

    catch (error) 
    {
        console.error('Error:', error);
        response.statusCode = 500;
        response.setHeader('Content-Type', 'text/plain');
        response.end('Internal Server Error');
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server running on port 3000');
});

async function performPrompt(message, ai) 
{
    const completion = await ai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages : [{
            role : 'user',
            content : message
        }]
    })

    return completion.data.choices[0].message;
}

async function generateReviewer(pointers, sets, items, ai)
{
    const template = `
    Take on the persona of a professional instructor.

    You are tasked to create a test questionnaire for an upcoming exam.
    The test questionnaire is based on this excerpt:

    ${pointers}

    Strictly generate the test questionnaire with strictly ${sets} number of set(s) in increasing difficulty through each set (if there are 2 or more number of sets)  and strictly ${items} number of item(s) per set.

    Generate the answer based on the excerpt also and attach it at the final line of the questionnaire separated by double line breaks.

    Make sure to only include in the questionnaire the most relevant points.
    `

    return performPrompt(template, ai)
}

function createNewSession(request) 
{
    const configuration = new Configuration({
        apiKey : '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'
    })
    const ai_assigned = new OpenAIApi(configuration);
    
    const userID = uuidv4();
    request.session.userID = userID;

    const sessionData = {
        ai_assigned, 
        startTime: Date.now()
    };

    userSessions[userID] = sessionData;
}

function getSessionData(userID) 
{
    return userSessions[userID];
}

function isSessionExpired(userID) 
{
    const sessionData = getSessionData(userID);
    return Date.now() - sessionData.startTime >= SESSION_EXPIRATION_THRESHOLD;
}