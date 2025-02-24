let soundTrie = {};
let currentNode = null;
let currentWord = '';
let wordImages = {};
let soundHistory = [];
let wordCounts = {};

// Build trie from array of word objects
function buildTrie(wordPairs) {
    const trie = {};
    for (const [word, sounds] of wordPairs) {
        let node = trie;
        for (const sound of sounds) {
            if (!node[sound]) {
                node[sound] = {};
            }
            node = node[sound];
        }
        node.isWord = true;
        node.word = word;
    }
    return trie;
}

async function loadData() {
    try {
        const [trieResponse, imagesResponse] = await Promise.all([
            fetch('sound_trie.json'),
            fetch('word-images.json')
        ]);
        const wordPairs = await trieResponse.json();
        wordImages = await imagesResponse.json();
        
        // Load word counts from localStorage
        const savedCounts = localStorage.getItem('wordCounts');
        wordCounts = savedCounts ? JSON.parse(savedCounts) : {};
        
        soundTrie = buildTrie(wordPairs);
        currentNode = soundTrie;
        createSquares();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function createSquares() {
    const container = document.getElementById('container');
    const topSection = container.querySelector('.top-section');
    const bottomSection = container.querySelector('.bottom-section');
    
    // Clear bottom section
    bottomSection.innerHTML = '';
    
    // Create image and text display container if it doesn't exist
    if (!topSection.querySelector('.top-container')) {
        const topContainer = document.createElement('div');
        topContainer.className = 'top-container';
        
        const imageContainer = document.createElement('div');
        imageContainer.id = 'imageContainer';
        imageContainer.className = 'image-container';
        
        const textDisplay = document.createElement('div');
        textDisplay.id = 'textDisplay';
        textDisplay.className = 'text-display';
        
        topContainer.appendChild(imageContainer);
        topContainer.appendChild(textDisplay);
        topSection.innerHTML = '';
        topSection.appendChild(topContainer);
    }
    
    // Create history line showing selected sounds
    if (soundHistory.length > 0) {
        const historyLine = document.createElement('div');
        historyLine.className = 'history-line';
        soundHistory.forEach(sound => {
            const historySquare = createSquare(sound);
            historySquare.classList.add('selected');
            historyLine.appendChild(historySquare);
        });
        bottomSection.appendChild(historyLine);
    }
    
    // Create new line for current choices
    const currentLine = document.createElement('div');
    currentLine.className = 'current-line';
    
    // Get available sounds and randomly select 5 if there are more
    let sounds = Object.keys(currentNode).filter(key => key !== 'isWord' && key !== 'word');
    if (sounds.length > 5) {
        sounds = sounds
            .sort(() => Math.random() - 0.5)  // Shuffle array
            .slice(0, 5);  // Take first 5 elements
    }
    
    sounds.forEach(sound => {
        const square = createSquare(sound);
        currentLine.appendChild(square);
    });
    
    bottomSection.appendChild(currentLine);
    updateDisplayText();
}

function createSquare(sound) {
    const square = document.createElement('div');
    square.className = 'square main-square';
    square.textContent = sound;
    
    square.addEventListener('touchstart', handleTouch);
    square.addEventListener('click', handleClick);
    
    return square;
}

function handleTouch(event) {
    event.preventDefault();
    handleInteraction(event.target);
}

function handleClick(event) {
    event.preventDefault();
    handleInteraction(event.target);
}

function handleInteraction(square) {
    const sound = square.textContent;
    currentWord += sound;
    soundHistory.push(sound);
    currentNode = currentNode[sound];
    createSquares();
}

function updateDisplayText() {
    const textDisplay = document.getElementById('textDisplay');
    const imageContainer = document.getElementById('imageContainer');
    textDisplay.textContent = currentWord;
    
    // If we've reached a complete word
    if (currentNode.isWord) {
        const word = currentNode.word;
        const wordLower = word.toLowerCase();
        
        // Update visit count
        if (!wordCounts[wordLower]) {
            wordCounts[wordLower] = 0;
        }
        wordCounts[wordLower]++;
        localStorage.setItem('wordCounts', JSON.stringify(wordCounts));
        
        // Create or update count display
        let countDisplay = textDisplay.nextElementSibling;
        if (!countDisplay || !countDisplay.classList.contains('word-count')) {
            countDisplay = document.createElement('div');
            countDisplay.classList.add('word-count');
            textDisplay.parentNode.insertBefore(countDisplay, textDisplay.nextSibling);
        }
        countDisplay.textContent = `Visits: ${wordCounts[wordLower]}`;
        
        // Update text display style based on sight word status
        if (wordImages[wordLower] && wordImages[wordLower].sight) {
            textDisplay.classList.add('sight-word');
        } else {
            textDisplay.classList.remove('sight-word');
        }
        
        // Update image - use specific image or random fallback
        if (wordImages[wordLower] && wordImages[wordLower].url) {
            imageContainer.innerHTML = `<img src="${wordImages[wordLower].url}" alt="${word}">`;
        } else if (wordImages['__'] && wordImages['__'].urls && wordImages['__'].urls.length > 0) {
            const randomIndex = Math.floor(Math.random() * wordImages['__'].urls.length);
            const randomUrl = wordImages['__'].urls[randomIndex];
            imageContainer.innerHTML = `<img src="${randomUrl}" alt="${word}">`;
        }

        // Update button container placement
        if (currentNode.isWord && wordImages['_next'] && wordImages['_next'].urls && wordImages['_next'].urls.length > 0) {
            const randomNextIndex = Math.floor(Math.random() * wordImages['_next'].urls.length);
            const nextUrl = wordImages['_next'].urls[randomNextIndex];
            
            // Create button container if it doesn't exist
            let buttonContainer = document.querySelector('.button-container');
            if (!buttonContainer) {
                buttonContainer = document.createElement('div');
                buttonContainer.className = 'button-container';
                document.body.appendChild(buttonContainer);  // Changed from container to body
            }
            
            const nextButton = document.createElement('button');
            nextButton.className = 'next-button';
            nextButton.innerHTML = `
                <img src="${nextUrl}" alt="next" class="next-gif">
                <span class="arrow">➜</span>
            `;
            nextButton.addEventListener('click', resetGame);
            
            // Clear and update button container
            buttonContainer.innerHTML = '';
            buttonContainer.appendChild(nextButton);
        }
    } else {
        textDisplay.classList.remove('sight-word');
        imageContainer.innerHTML = '';
        // Remove count display if exists
        const countDisplay = textDisplay.nextElementSibling;
        if (countDisplay && countDisplay.classList.contains('word-count')) {
            countDisplay.remove();
        }
        // Remove button container if it exists
        const buttonContainer = document.querySelector('.button-container');
        if (buttonContainer) {
            buttonContainer.remove();
        }
    }
}

function resetGame() {
    currentNode = soundTrie;
    currentWord = '';
    soundHistory = [];
    createSquares();
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', loadData);

// Add event listener for Enter key to reset the game
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        resetGame();
    }
});
