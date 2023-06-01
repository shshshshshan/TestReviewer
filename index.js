const express = require('express');
const { Configuration, OpenAIApi } = require('openai');

const app = express();

app.use(express.urlencoded({ extended: true }));

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
        const reviewer = await generateReviewer(ptrs, sets, items);

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
        return;
    }

    console.log('Request success');
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server running and live');
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

async function generateReviewer(pointers, sets, items)
{
    const configuration = new Configuration({
        apiKey : process.env.OPENAI_API_KEY
    })
    const ai = new OpenAIApi(configuration);

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