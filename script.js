// HTML elements
const pokemonInput = document.getElementById("pokemon");
const pokemonForm = document.getElementById("pokemon-form");
const move1Select = document.getElementById("move1");
const move2Select = document.getElementById("move2");
const move2DamageInput = document.getElementById("move2-damage");
const move2DamageLabel = document.querySelector('label[for="move2-damage"]');
const downloadButton = document.getElementById("download-card");
const cardContainer = document.getElementById("card-container");
const cardPlaceholder = document.getElementById("card-placeholder");
const cardSprite = document.getElementById("card-sprite");
const cardCry = document.getElementById("card-cry");

// PokeAPI base URL
const baseUrl = "https://pokeapi.co/api/v2/";

// Move arrays
let move1 = [];
let move2 = [];

// Hold data used for Pokemon card
let cardData = {};

// Hold background colors for card container background based on Pokemon type
const primaryCardColors = {
    normal: "#F5F5DC",
    fire: "#FFB347",
    water: "#87CEEB",
    electric: "#FFFF99",
    grass: "#98FB98",
    ice: "#E0FFFF",
    fighting: "#F0B27A",
    poison: "#DDA0DD",
    ground: "#F4A460",
    flying: "#E6E6FA",
    psychic: "#FFB6C1",
    bug: "#ADFF2F",
    rock: "#D2B48C",
    ghost: "#E6E6FA",
    dragon: "#DDA0DD",
    dark: "#D3D3D3",
    steel: "#E5E4E2",
    fairy: "#FFE4E1",
};

// Hold background colors for sprite container based on Pokemon type
const secondaryCardColors = {
    normal: "#E5DCC9",
    fire: "#E6A033",
    water: "#7BB8D3",
    electric: "#E6E680",
    grass: "#85E085",
    ice: "#CCE6E6",
    fighting: "#D99966",
    poison: "#C285C2",
    ground: "#D1934D",
    flying: "#CCCCDD",
    psychic: "#E699A8",
    bug: "#99E632",
    rock: "#BFA175",
    ghost: "#CCCCDD",
    dragon: "#C285C2",
    dark: "#BFBFBF",
    steel: "#D1CFC8",
    fairy: "#E6CCCA",
};

// Event listeners

// Populate move sets when a Pokemon is selected
pokemonInput.addEventListener("input", function (event) {
    const pokemonName = event.target.value;

    // Send request to PokeAPI to fetch Pokemon data
    fetch(`${baseUrl}pokemon/${pokemonName.toLowerCase()}`)
        .then((response) => {
            if (!response.ok) {
                return;
            }
            return response.json();
        })
        .then((data) => {
            if (!data) return;

            // Clear existing moves
            move1 = [];
            move2 = [];

            // Add each move name to both arrays
            data.moves.forEach((moveData) => {
                const moveName = moveData.move.name;
                move1.push(moveName);
                move2.push(moveName);
            });

            // Populate both select elements
            populateSelect(move1Select, move1);
            populateSelect(move2Select, move2);

            // Store and format pokedex description
            fetch(`${baseUrl}pokemon-species/${pokemonName.toLowerCase()}`)
                .then((response) => {
                    if (!response.ok) {
                        return;
                    }
                    return response.json();
                })
                .then((speciesData) => {
                    if (!speciesData) return;

                    // Find the first English flavor text entry
                    const englishEntry = speciesData.flavor_text_entries.find(
                        (entry) => entry.language.name === "en"
                    );

                    // Format Pokedex entry
                    const entry = englishEntry
                        ? englishEntry.flavor_text
                            .replace(/\n/g, " ")
                            .replace(/\f/g, " ")
                            .replace(/\r/g, " ")
                            .replace(/\s+/g, " ")
                            .trim()
                        : "No English description available.";

                    // Store relevant data for Pokemon card
                    cardData = {
                        name: data.name.replace(/(^\w{1})|(\s+\w{1})|(-\w{1})/g, letter => letter.toUpperCase()),
                        type: data.types[0].type.name,
                        sprite: data.sprites.other['official-artwork'].front_default,
                        id: data.id,
                        height: data.height,
                        weight: data.weight,
                        entry: entry,
                        cry: data.cries.latest
                    };

                    console.log("Card Data:", cardData);
                });
        });
});

// Handle Move #1 selection changes
move1Select.addEventListener("change", function (event) {
    const move1Value = event.target.value;
    const move2Value = move2Select.value;

    // Repopulate Move #2 to exclude selected Move #1
    populateSelect(move2Select, move2, move1Value);

    // Restore Move #2 selection if it's still valid
    if (move2Value && move2Value !== move1Value) {
        move2Select.value = move2Value;
    }

    // Store Move #1 type in cardData object
    if (move1Value) {
        fetchMoveType(move1Value).then((moveType) => {
            if (!cardData.moves) cardData.moves = {};
            cardData.moves.move1 = {
                name: formatMoveName(move1Value),
                type: moveType,
            };
        });
    }
});

// Handle Move #2 selection changes
move2Select.addEventListener("change", function (event) {
    const move2Value = event.target.value;
    const move1Value = move1Select.value;

    if (move2Value) {
        move2DamageInput.required = true;
        move2DamageLabel.textContent = "Move #2 Damage (required, from 10 to 150):";
    } else {
        move2DamageInput.required = false;
        move2DamageInput.value = "";
        move2DamageLabel.textContent = "Move #2 Damage (optional, from 10 to 150):";
    }

    // Repopulate Move #1 to exclude selected Move #2
    populateSelect(move1Select, move1, move2Value);

    // Restore Move #1 selection if it's still valid
    if (move1Value && move1Value !== move2Value) {
        move1Select.value = move1Value;
    }

    // Store Move #2 type in cardData object
    if (move2Value) {
        fetchMoveType(move2Value).then((moveType) => {
            if (!cardData.moves) cardData.moves = {};
            cardData.moves.move2 = {
                name: formatMoveName(move2Value),
                type: moveType,
            };
        });
    }
});

// Handle form submission
pokemonForm.addEventListener("submit", function (event) {
    event.preventDefault();

    cardData.hp = document.getElementById("hp").value;

    if (cardData.moves?.move1) {
        cardData.moves.move1.damage = document.getElementById("move1-damage").value;
    }
    if (cardData.moves?.move2) {
        cardData.moves.move2.damage = document.getElementById("move2-damage").value;
    }

    console.log("Final Card Data:", cardData);

    // Convert height from decimetres to feet and inches
    const totalInches = cardData.height * 3.937;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    const formattedHeight = `${feet}'${inches}"`;

    // Convert weight from decagrams to pounds (rounded to one decimal place)
    const formattedWeight = `${(cardData.weight / 28.3495).toFixed(1)} lbs`;

    // Populate card elements with data
    document.getElementById("card-name").textContent = cardData.name;
    document.getElementById("card-hp").textContent = cardData.hp;
    document.getElementById("type-icon").src = 'images/types/' + cardData.type + '.svg';
    document.getElementById("card-sprite").src = cardData.sprite;
    document.getElementById("card-id-value").textContent = cardData.id;
    document.getElementById("card-height-value").textContent = formattedHeight;
    document.getElementById("card-weight-value").textContent = formattedWeight;
    document.getElementById("entry-text").textContent = cardData.entry;

    // Create move elements
    const movesContainer = document.getElementById("card-moves");
    movesContainer.innerHTML = "";

    Object.values(cardData.moves).forEach(move => {
        const moveDiv = document.createElement("div");
        moveDiv.className = "move";
        moveDiv.innerHTML = `
        <img class="move-type" src="images/types/${move.type}.svg" alt="Move Type" />
        <h3 class="move-name">${move.name}</h3>
        <h3 class="move-damage">${move.damage}</h3>
    `;
        movesContainer.appendChild(moveDiv);
    });

    // Apply type colors to card
    const cardContainer = document.getElementById("card-container");
    const spriteContainer = document.getElementById("sprite-container");
    cardContainer.style.backgroundColor = primaryCardColors[cardData.type];
    spriteContainer.style.backgroundColor = secondaryCardColors[cardData.type];

    // Hide the placeholder text
    cardPlaceholder.style.display = "none";

    // Show the card and download button
    cardContainer.style.display = "flex";
    downloadButton.style.display = "block";
});

// Download the card as an image
downloadButton.addEventListener("click", function () {
    html2canvas(cardContainer, { allowTaint: true, useCORS: true }).then((canvas) => {
        const downloadLink = document.createElement("a");
        downloadLink.href = canvas.toDataURL("image/png");
        downloadLink.download = `${cardData.name}_card.png`;
        downloadLink.click();
    });
});

// Play pokemon cry on click
cardSprite.addEventListener("click", function () {
    cardCry.src = cardData.cry;
    cardCry.play();
});

// Helper functions

// Populate select element with moves from the given array
function populateSelect(selectElement, moveArray, excludeMove = null) {
    selectElement.innerHTML = '<option value="">Select a move</option>';

    moveArray
        .filter((move) => move !== excludeMove)
        .sort()
        .forEach((move) => {
            const option = document.createElement("option");

            // Format the move name for display
            const formattedMove = formatMoveName(move);

            option.value = move;
            option.textContent = formattedMove;
            selectElement.appendChild(option);
        });
}

// Fetch move type
async function fetchMoveType(moveName) {
    try {
        const response = await fetch(`${baseUrl}move/${moveName.toLowerCase()}`);
        if (!response.ok) {
            throw new Error("Move not found");
        }
        const moveData = await response.json();
        if (!moveData) throw new Error("No move data");
        return moveData.type.name;
    } catch (error) {
        console.error("Error fetching move type:", error);
        return "unknown";
    }
}

// Format move name
function formatMoveName(move) {
    return move.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}