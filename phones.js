// Load and process the sounds data
let wordFamilies = [];
let currentFamilyIndex = 0;
let selectedMiddleSquare = null;
let selectedBottomSquare = null;
let wordImages = {};

async function loadSounds() {
    try {
        const [soundsResponse, imagesResponse] = await Promise.all([
            fetch('sounds.json'),
            fetch('word-images.json')
        ]);
        const soundsData = await soundsResponse.json();
        wordImages = await imagesResponse.json();
        // Randomize word families order
        wordFamilies = soundsData.word_families.sort(() => Math.random() - 0.5);
        createSquares();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function createSquares() {
    const container = document.getElementById('container');
    const topSection = container.querySelector('.top-section');
    const middleSection = container.querySelector('.middle-section');
    const bottomSection = container.querySelector('.bottom-section');
    
    middleSection.innerHTML = '';
    bottomSection.innerHTML = '';
    topSection.innerHTML = '';
    
    const currentFamily = wordFamilies[currentFamilyIndex];
    
    // Create image and text display container
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
    topSection.appendChild(topContainer);
    
    // Create squares for extra sounds (middle section)
    currentFamily.extra_sounds.forEach(sound => {
        const square = createSquare(sound, 'extra');
        middleSection.appendChild(square);
    });
    
    // Create square for the main sound (bottom section)
    const mainSquare = createSquare(currentFamily.sound, 'main');
    bottomSection.appendChild(mainSquare);
}

function createSquare(sound, type) {
    const square = document.createElement('div');
    square.className = `square ${type}-square`;
    square.textContent = sound;
    
    square.addEventListener('touchstart', handleTouch);
    square.addEventListener('click', handleClick); // For desktop testing
    
    return square;
}

function handleTouch(event) {
    event.preventDefault(); // Prevent default touch behavior
    handleInteraction(event.target);
}

function handleClick(event) {
    event.preventDefault(); // Prevent any default click behavior
    handleInteraction(event.target);
}

function handleInteraction(square) {
    const isMiddleSquare = square.classList.contains('extra-square');
    const isBottomSquare = square.classList.contains('main-square');
    
    if (isMiddleSquare) {
        if (selectedMiddleSquare === square) {
            // If clicking the same square, deselect it
            square.style.backgroundColor = '#f0f0f0';
            selectedMiddleSquare = null;
        } else {
            // Reset previous middle square if exists
            if (selectedMiddleSquare) {
                selectedMiddleSquare.style.backgroundColor = '#f0f0f0';
            }
            selectedMiddleSquare = square;
            square.style.backgroundColor = '#ffeb3b';
        }
    } else if (isBottomSquare) {
        if (selectedBottomSquare === square) {
            // If clicking the same square, deselect it
            square.style.backgroundColor = '#e0e0ff';
            selectedBottomSquare = null;
        } else {
            // Reset previous bottom square if exists
            if (selectedBottomSquare) {
                selectedBottomSquare.style.backgroundColor = '#e0e0ff';
            }
            selectedBottomSquare = square;
            square.style.backgroundColor = '#ffeb3b';
        }
    }
    
    updateDisplayText();
}

function updateDisplayText() {
    const textDisplay = document.getElementById('textDisplay');
    const imageContainer = document.getElementById('imageContainer');
    const middleText = selectedMiddleSquare ? selectedMiddleSquare.textContent : '';
    const bottomText = selectedBottomSquare ? selectedBottomSquare.textContent : '';
    const word = middleText + bottomText;
    textDisplay.textContent = word;
    
    // Update text display style based on sight word status
    if (wordImages[word] && wordImages[word].sight) {
        textDisplay.classList.add('sight-word');
    } else {
        textDisplay.classList.remove('sight-word');
    }
    
    // Update image if word exists in dictionary
    if (wordImages[word]) {
        imageContainer.innerHTML = `<img src="${wordImages[word].url}" alt="${word}">`;
    } else {
        imageContainer.innerHTML = '';
    }
}

// Add some basic styling
const style = document.createElement('style');
style.textContent = `
    #container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 20px;
    }
    
    .square {
        width: 100px;
        height: 100px;
        border: 2px solid black;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48px;
        font-weight: bold;
        cursor: pointer;
    }
    
    .extra-square {
        background-color: #f0f0f0;
    }
    
    .main-square {
        background-color: #e0e0ff;
    }
    
    .text-display {
        font-size: 64px;
        font-weight: bold;
        text-align: center;
        padding: 20px;
        border: 5px solid transparent; /* Add transparent border by default */
    }
    
    .sight-word {
        border-color: #4CAF50; /* Green border for sight words */
        border-radius: 10px; /* Optional: rounded corners */
    }
    
    .top-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
    }
    
    .image-container {
        width: 300px;
        height: 300px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    .image-container img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }
`;
document.head.appendChild(style);

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', loadSounds);

// Add event listener for Enter key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        moveToNextWord();
    }
});

// Add new function to handle moving to next word
function moveToNextWord() {
    // Reset selections
    if (selectedMiddleSquare) {
        selectedMiddleSquare.style.backgroundColor = '#f0f0f0';
        selectedMiddleSquare = null;
    }
    if (selectedBottomSquare) {
        selectedBottomSquare.style.backgroundColor = '#e0e0ff';
        selectedBottomSquare = null;
    }
    
    // Move to next word family, cycle back to start if at end
    currentFamilyIndex = (currentFamilyIndex + 1) % wordFamilies.length;
    
    // Recreate squares with new word family
    createSquares();
    
    // Clear the display
    updateDisplayText();
}
