require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (front-end)
app.use(express.static(path.join(__dirname, 'public')));

// Map moods to exercise API parameters
// Docs: https://api.api-ninjas.com/api/exercises
const MOOD_CONFIG = {
  stressed: {
    type: 'stretching',
    difficulty: 'beginner'
  },
  anxious: {
    type: 'stretching',
    difficulty: 'intermediate'
  },
  sad: {
    type: 'cardio',
    difficulty: 'beginner'
  },
  unmotivated: {
    type: 'strength',
    difficulty: 'beginner'
  },
  energetic: {
    type: 'cardio',
    difficulty: 'intermediate'
  },
  happy: {
    type: 'cardio',
    difficulty: 'intermediate'
  }
};

// Helper: pick a random item from an array
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// API route: /api/recommend?mood=stressed
app.get('/api/recommend', async (req, res) => {
  const mood = (req.query.mood || '').toLowerCase();

  if (!mood || !MOOD_CONFIG[mood]) {
    return res.status(400).json({
      error: 'Unknown mood. Please choose one of the provided moods.'
    });
  }

  if (!process.env.API_NINJAS_KEY) {
    return res.status(500).json({
      error: 'Server is missing API_NINJAS_KEY configuration.'
    });
  }

  const exerciseParams = MOOD_CONFIG[mood];

  try {
    // Call both APIs in parallel
    const [exerciseResponse, quoteResponse] = await Promise.all([
      axios.get('https://api.api-ninjas.com/v1/exercises', {
        params: exerciseParams,
        headers: {
          'X-Api-Key': process.env.API_NINJAS_KEY
        }
      }),
      axios.get('https://zenquotes.io/api/random')
    ]);

    // --- Handle exercises ---
    const exercises = exerciseResponse.data;

    if (!Array.isArray(exercises) || exercises.length === 0) {
      return res.status(502).json({
        error:
          'No exercises found for this mood. Try another mood or adjust the mapping.'
      });
    }

    const exercise = getRandomItem(exercises);

    // --- Handle quote ---
    // ZenQuotes returns an array like [{ q: "...", a: "Author", h: "<blockquote>..." }]
    const quoteRaw = Array.isArray(quoteResponse.data)
      ? quoteResponse.data[0]
      : quoteResponse.data;

    const quote = {
      text:
        quoteRaw.q ||
        quoteRaw.quote ||
        'Keep going. Small steps still count.',
      author: quoteRaw.a || quoteRaw.author || 'Unknown'
    };

    // Build clean response
    res.json({
      mood,
      exercise: {
        name: exercise.name,
        type: exercise.type,
        muscle: exercise.muscle,
        difficulty: exercise.difficulty,
        equipments: Array.isArray(exercise.equipments)
          ? exercise.equipments.join(', ')
          : exercise.equipments || 'Bodyweight / simple equipment',
        instructions: exercise.instructions
      },
      quote
    });
  } catch (err) {
    console.error('Error in /api/recommend:', err.response?.data || err.message);
    res.status(500).json({
      error:
        'Something went wrong talking to the external APIs. Please try again in a moment.'
    });
  }
});

// Fallback for any other route (optional, lets refresh on /)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
