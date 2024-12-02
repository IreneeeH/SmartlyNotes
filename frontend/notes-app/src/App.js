import React, { useState } from 'react';
import './App.css';

function App() {
  const [noteText, setNoteText] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [notesByCategory, setNotesByCategory] = useState({}); // Store notes categorized by their category
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState(''); // Store the API Key entered by the user

  // Handle note submission and categorization
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCategory('');

    // Check if an API key is provided
    if (!apiKey) {
      setError('Please provide an API key.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey, // Send the API key in the request header
        },
        body: JSON.stringify({ noteText }), // Send the note text to be categorized
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to categorize the note');
      }

      const data = await response.json();
      setCategory(data.category);  // Set the category for the current note

      // Update categories state (add the new category button if it's not already there)
      setCategories((prevCategories) => {
        if (!prevCategories.includes(data.category)) {
          return [...prevCategories, data.category];
        }
        return prevCategories;
      });

      // Update the notes for the category
      setNotesByCategory((prev) => {
        const updatedNotes = prev[data.category] || [];
        return {
          ...prev,
          [data.category]: [...updatedNotes, { text: noteText, category: data.category }],
        };
      });

      // Clear the note text after successfully categorizing
      setNoteText('');
    } catch (err) {
      setError(err.message || 'Error categorizing note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle category button click to display notes for that specific category
  const handleCategoryClick = async (category) => {
    if (notesByCategory[category]) {
      // If notes for this category are already stored, just show them
      setNotesByCategory({ [category]: notesByCategory[category] });
    } else {
      // Fetch the notes from the backend if not available locally
      try {
        const response = await fetch(`http://localhost:5001/notes/${category}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey, // Send the API key in the request header
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error fetching notes.');
        }

        const data = await response.json();
        setNotesByCategory({ [category]: data });
      } catch (err) {
        setError('Error fetching notes. Please try again.');
      }
    }
    setCategory(category); // Update current category
  };

  // Download all notes as a text file
  const handleDownloadNotes = async () => {
    if (!apiKey) {
      setError('Please provide an API key.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/download-notes', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey, // Send the API key in the request header
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to download notes');
      }

      // Create a link element to trigger the download
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'notes.txt'; // Set the filename for download
      link.click(); // Trigger the download
    } catch (err) {
      setError(err.message || 'Error downloading notes.');
    }
  };

  // Handle Enter key press to trigger note submission
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Enter key pressed without Shift (to avoid new line)
      e.preventDefault(); // Prevent the default behavior of Enter key
      handleSubmit(e); // Trigger the submit logic
    }
  };

  return (
    <div className="App">
      <h1>Smart Note Categorization</h1>

      {/* API Key Input */}
      <div>
        <input
          type="text"
          placeholder="Enter API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <br />
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Write your note here..."
          rows="6"
          cols="40"
          onKeyDown={handleKeyDown} // Add keydown handler for Enter key
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Categorizing...' : 'Categorize Note'}
        </button>
      </form>

      {/* Button to download all notes */}
      <button onClick={handleDownloadNotes}>
        Download All Notes as Text File
      </button>

      {category && (
        <div>
          <h3>Category:</h3>
          <p>{category}</p>
        </div>
      )}

      {/* Category display and note listing */}
      {categories.length > 0 && (
        <div>
          <h3>Categories:</h3>
          <p>Click on any category to view all the notes in them</p>
          <div>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                style={{ margin: '5px' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3>Notes:</h3>
        {notesByCategory[category] && notesByCategory[category].length > 0 ? (
          <ul>
            {notesByCategory[category].map((note, index) => (
              <li key={index}>
                <strong>{note.category}:</strong> {note.text}
              </li>
            ))}
          </ul>
        ) : (
          <p>No notes available for this category.</p>
        )}
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;