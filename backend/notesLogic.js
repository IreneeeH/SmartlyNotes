require('dotenv').config();
const { CohereClient } = require("cohere-ai");

// Function to send prompt to CohereAI API
async function categorizeNote(noteText, apiKey) {
    try {
        // Initialize the Cohere client with the provided API key
        const cohere = new CohereClient({ token: apiKey });

        // Make the API call to Cohere's chat endpoint
        const response = await cohere.chat(
            {
                message: `Categorize this note into a relevant category (questions, feedback, deadlines, announcements, ideas, and other). Only mention the category, nothing else and no punctuation:\n\n${noteText}`,
                model: "command-r-08-2024"
            }
        );

        // Extract the category from the response
        const category = response.text.trim().toLowerCase();
        return category;
    } catch (error) {
        console.error('Error while categorizing note:', error);
        throw error; // Rethrow error for handling in the calling function
    }
}

module.exports = { categorizeNote };