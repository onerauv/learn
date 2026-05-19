const textarea = document.getElementById('searchInput');
const resultDiv = document.getElementById('result');
const submitBtn = document.getElementById('submitBtn');
const suggestionsBox = document.getElementById('suggestions');
const downloadIcon = document.getElementById('downloadIcon');
const downloadTooltip = document.getElementById('downloadTooltip');

async function typeText(container, text, delay = 15) {
  container.textContent = '';

  for (let i = 0; i < text.length; i++) {
    container.textContent += text[i];
    await new Promise(r => setTimeout(r, delay));
  }
}

async function fetchWikiSummary(query) {
  if (!query.trim()) {
    resultDiv.style.display = 'none';
    return;
  }

  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;

  try {
    resultDiv.style.display = 'flex';
    resultDiv.innerHTML = '<em>Thinking...</em>';

    const response = await fetch(url);

    if (!response.ok) throw new Error('No article found');

    const data = await response.json();

    if (data.type === "disambiguation") {
      resultDiv.style.flexDirection = 'column';

      resultDiv.innerHTML = `
        <h2>${data.title}</h2>
        <p>This term is ambiguous, please be more specific.</p>
      `;
    }

    else if (data.extract) {
      let imgHtml = '';

      if (data.originalimage?.source) {
        imgHtml = `<img src="${data.originalimage.source}" alt="${data.title}" />`;
      }

      else if (data.thumbnail?.source) {
        imgHtml = `<img src="${data.thumbnail.source}" alt="${data.title}" />`;
      }

      resultDiv.style.flexDirection = 'row';

      resultDiv.innerHTML = `
        <div class="result-text">
          <h2>${data.title}</h2>
          <p></p>
        </div>
        ${imgHtml}
      `;

      const p = resultDiv.querySelector('.result-text p');

      await typeText(p, data.extract, 1);
    }

    else {
      resultDiv.style.flexDirection = 'column';
      resultDiv.innerHTML = `<p>No summary available.</p>`;
    }

  } catch (error) {
    resultDiv.style.flexDirection = 'column';
    resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

async function fetchSuggestions(term) {
  if (term.trim().length < 2) {
    suggestionsBox.style.display = 'none';
    return;
  }

  try {
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${encodeURIComponent(term)}&origin=*`;

    const res = await fetch(url);
    const data = await res.json();

    const suggestions = data[1];

    if (suggestions.length > 0) {
      suggestionsBox.innerHTML = suggestions
        .slice(0, 20)
        .map(item => `<div>${item}</div>`)
        .join('');

      suggestionsBox.style.display = 'block';
    }

    else {
      suggestionsBox.style.display = 'none';
    }

  } catch {
    suggestionsBox.style.display = 'none';
  }
}

suggestionsBox.addEventListener('click', (e) => {
  if (e.target.tagName === 'DIV') {
    textarea.value = e.target.textContent;
    suggestionsBox.style.display = 'none';
    fetchWikiSummary(textarea.value);
  }
});

textarea.addEventListener('input', () => {
  fetchSuggestions(textarea.value);
});

textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    suggestionsBox.style.display = 'none';
    fetchWikiSummary(textarea.value);
  }
});

submitBtn.addEventListener('click', () => {
  suggestionsBox.style.display = 'none';
  fetchWikiSummary(textarea.value);
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-box')) {
    suggestionsBox.style.display = 'none';
  }
});

downloadIcon.addEventListener('mouseenter', () => {
  downloadTooltip.classList.add('visible');
});

downloadIcon.addEventListener('mouseleave', () => {
  downloadTooltip.classList.remove('visible');
});
