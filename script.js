function getRandomItems(array, n) {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

function wrapHeaderChars(header) {
  return header.split('').map(char => 
    `<span class="header-char">${char}</span>`
  ).join('');
}

function generateAreas(items) {
  document.getElementById('loading').remove();
  
  const selectedItems = getRandomItems(items, 4);
  
  selectedItems.forEach(item => {
    const areaDiv = document.createElement('div');
    areaDiv.className = 'area';
    areaDiv.innerHTML = `
      <h1>${wrapHeaderChars(item.header)}</h1>
      <div class="text-content"></div>
      <img src="${item.imageUrl}" alt="${item.header}" class="reward-image">
    `;
    document.body.appendChild(areaDiv);
  });

  setupEventListeners();
}

function updateHeaderHighlight(header, text) {
  const headerChars = header.querySelectorAll('.header-char');
  headerChars.forEach((char, index) => {
    if (index < text.length && char.textContent === text[index]) {
      char.classList.add('matched');
    } else {
      char.classList.remove('matched');
    }
  });
}

function setupEventListeners() {
  let activeArea = null;

  document.querySelectorAll('.area').forEach(area => {
    area.addEventListener('click', (e) => {
      if (activeArea) {
        activeArea.classList.remove('active');
      }
      activeArea = e.target.closest('.area');
      activeArea.classList.add('active');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (!activeArea) return;

    const textContent = activeArea.querySelector('.text-content');
    const header = activeArea.querySelector('h1');
    const headerText = header.textContent;
    const rewardImage = activeArea.querySelector('.reward-image');

    if (e.key === 'Backspace') {
      textContent.textContent = textContent.textContent.slice(0, -1);
      updateHeaderHighlight(header, textContent.textContent);
      if (textContent.textContent !== headerText) {
        rewardImage.classList.remove('visible');
      }
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter') {
      textContent.textContent += '\n';
      e.preventDefault();
      return;
    }

    if (e.key.length === 1) {
      if (/[a-zA-Z]/.test(e.key)) {
        textContent.textContent += e.key.toUpperCase();
      } else {
        textContent.textContent += e.key;
      }

      updateHeaderHighlight(header, textContent.textContent);

      if (textContent.textContent === headerText) {
        rewardImage.classList.add('visible');
      } else {
        rewardImage.classList.remove('visible');
      }
    }
  });
}

fetch('data.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (!data.items || data.items.length < 4) {
      throw new Error('Not enough items in data.json (minimum 4 required)');
    }
    generateAreas(data.items);
  })
  .catch(error => {
    document.getElementById('loading').textContent = 
      'Error: ' + error.message;
    console.error('Error:', error);
  }); 