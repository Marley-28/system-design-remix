const moodButtons = document.querySelectorAll('.mood-btn');
const recommendBtn = document.getElementById('recommendBtn');
const statusEl = document.getElementById('status');
const resultSection = document.getElementById('result');

const exerciseNameEl = document.querySelector('.exercise-name');
const exerciseMetaEl = document.querySelector('.exercise-meta');
const exerciseEquipmentsEl = document.querySelector('.exercise-equipments');
const exerciseInstructionsEl = document.querySelector('.exercise-instructions');
const quoteTextEl = document.querySelector('.quote-text');
const quoteAuthorEl = document.querySelector('.quote-author');

let selectedMood = null;

// Handle mood selection
moodButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    // Update selected mood
    selectedMood = btn.dataset.mood;

    // Update button styles
    moodButtons.forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');

    // Enable the recommend button
    recommendBtn.disabled = false;

    // Clear status
    statusEl.textContent = '';
    statusEl.classList.remove('error');
  });
});

// Handle "Get Recommendation" click
recommendBtn.addEventListener('click', async () => {
  if (!selectedMood) return;

  // UI: loading state
  recommendBtn.disabled = true;
  const originalText = recommendBtn.textContent;
  recommendBtn.textContent = 'Finding a match...';
  statusEl.textContent = 'Talking to the APIs...';
  statusEl.classList.remove('error');

  try {
    const response = await fetch(`/api/recommend?mood=${encodeURIComponent(selectedMood)}`);

    if (!response.ok) {
      let message = 'Something went wrong. Please try again.';
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          message = errorData.error;
        }
      } catch (e) {
        // ignore JSON parse error
      }
      throw new Error(message);
    }

    const data = await response.json();

    // Update exercise card
    exerciseNameEl.textContent = data.exercise.name || 'Exercise suggestion';
    exerciseNameEl.classList.remove('placeholder');

    const metaParts = [];
    if (data.exercise.type) metaParts.push(data.exercise.type);
    if (data.exercise.muscle) metaParts.push(`Muscle: ${data.exercise.muscle}`);
    if (data.exercise.difficulty)
      metaParts.push(
        `Difficulty: ${
          data.exercise.difficulty.charAt(0).toUpperCase() +
          data.exercise.difficulty.slice(1)
        }`
      );

    exerciseMetaEl.textContent = metaParts.join(' • ');

    if (data.exercise.equipments) {
      exerciseEquipmentsEl.textContent = `Equipment: ${data.exercise.equipments}`;
    } else {
      exerciseEquipmentsEl.textContent = '';
    }

    exerciseInstructionsEl.textContent =
      data.exercise.instructions || 'Follow general movement guidelines for this exercise.';

    // Update quote card
    quoteTextEl.textContent = data.quote.text || 'Keep going, one step at a time.';
    quoteTextEl.classList.remove('placeholder');
    quoteAuthorEl.textContent = data.quote.author ? `— ${data.quote.author}` : '';

    // Show result section
    resultSection.classList.remove('hidden');

    statusEl.textContent = `Mood: ${selectedMood[0].toUpperCase() + selectedMood.slice(1)}`;
  } catch (err) {
    statusEl.textContent = err.message || 'Unexpected error. Please try again.';
    statusEl.classList.add('error');
  } finally {
    // Reset button
    recommendBtn.disabled = false;
    recommendBtn.textContent = originalText;
  }
});
