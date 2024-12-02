const express = require('express');
const cors = require('cors');
const { categorizeNote } = require('./notesLogic'); // Importing the function to categorize notes
const app = express();

// Middleware setup
app.use(express.json());
app.use(cors());

// In-memory storage for notes (should ideally use a database for real-world production/scaling)
let notes = [];

// Middleware to check for valid API key in the request
function checkApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key']; // Get the API key from the request header

  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  // Check that it's not empty
  if (!apiKey || apiKey === '') {
    return res.status(403).json({ error: 'Invalid API Key' });
  }

  req.apiKey = apiKey; // Store API key in the request object for downstream use
  next(); // Proceed to the next middleware or route handler
}

// Route for categorizing a note
app.post('/categorize', checkApiKey, async (req, res) => {
  const { noteText } = req.body; // Note text sent in the body
  const { apiKey } = req; // Retrieve API key from request object

  if (!noteText) {
    return res.status(400).json({ error: 'Note text is required' });
  }

  try {
    // Call the categorization function and pass the noteText and apiKey
    const category = await categorizeNote(noteText, apiKey);

    // Save the note and its category in the in-memory store
    const note = { text: noteText, category };
    notes.push(note);

    // Respond with the categorized note
    res.json({ category, noteText });
  } catch (error) {
    res.status(500).json({ error: 'Error categorizing the note.' });
  }
});

// Route for getting notes by category
app.get('/notes/:category', checkApiKey, (req, res) => {
  const { category } = req.params;
  const filteredNotes = notes.filter(note => note.category.toLowerCase() === category.toLowerCase());
  res.json(filteredNotes);
});

// Route to generate a downloadable text file with all notes
app.get('/download-notes', checkApiKey, (req, res) => {
  // Prepare notes grouped by category
  let notesContent = '';
  const groupedNotes = notes.reduce((acc, note) => {
    if (!acc[note.category]) {
      acc[note.category] = [];
    }
    acc[note.category].push(note.text);
    return acc;
  }, {});

  // Create a string for the text file
  for (const category in groupedNotes) {
    notesContent += `Category: ${category}\n`;
    groupedNotes[category].forEach(note => {
      notesContent += `- ${note}\n`;
    });
    notesContent += '\n';
  }

  // Set headers for the response to indicate it's a file download
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename=notes.txt');
  res.send(notesContent); // Send the content as a text file
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});