// Global variables
let runners = [];
let raceData = {};
let timerInterval;
let startTime;
let raceActive = false;
let raceStarted = false;

// DOM elements
const startBtn = document.getElementById('start-btn');
const endBtn = document.getElementById('end-btn');
const importBtn = document.getElementById('import-btn');
const timerDisplay = document.getElementById('timer');
const raceTable = document.getElementById('race-tbody');
const runnerButtons = document.getElementById('runner-buttons');

// Event listeners
importBtn.addEventListener('click', importRunners);
startBtn.addEventListener('click', startRace);
endBtn.addEventListener('click', endRace);

// Function to generate random names
function generateRandomName() {
    const firstNames = ['Michael', 'Manuel', 'Hans', 'Moritz', 'Hanni', 'Maul', 'Mai', 'Han', 'Luke', 'Thomas', 'Sandra', 'Peter', 'Lisa'];
    const lastNames = ['Mustermann', 'Mauser', 'Zimmer', 'Dampf', 'Bleibtreu', 'Nanni', 'Wurf', 'Leng', 'Solo', 'Skywalker', 'Millhouse', 'Müller', 'Weber'];
    
    return firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' + 
           lastNames[Math.floor(Math.random() * lastNames.length)];
}

// Import runners
function importRunners() {
    // Clear existing data
    runners = [];
    raceData = {};
    raceStarted = false;
    
    // Generate random number of runners (15-30)
    const numRunners = Math.floor(Math.random() * 16) + 15;
    
    // Generate random runners with unique numbers
    const usedNumbers = new Set();
    for (let i = 0; i < numRunners; i++) {
        let number;
        do {
            number = Math.floor(Math.random() * 100) + 1;
        } while (usedNumbers.has(number));
        
        usedNumbers.add(number);
        
        const paddedNumber = number.toString().padStart(3, '0');
        
        runners.push({
            number: paddedNumber,
            name: generateRandomName(),
            place: i + 1
        });
        
        // Initialize race data
        raceData[paddedNumber] = {
            laps: 0,
            times: [],
            lastTime: null,
            diff: ''
        };
    }
    
    // Sort by number
    runners.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    
    // Set initial places based on number order
    runners.forEach((runner, index) => {
        runner.place = index + 1;
    });
    
    // Update table and buttons
    updateTable();
    generateRunnerButtons();
    
    // Enable start button
    startBtn.disabled = false;
}

// Generate runner buttons
function generateRunnerButtons() {
    runnerButtons.innerHTML = '';
    
    // Sort runners by number
    const sortedRunners = [...runners].sort((a, b) => parseInt(a.number) - parseInt(b.number));
    
    // Organize the buttons in rows of 5
    for (let i = 0; i < sortedRunners.length; i += 5) {
        const rowElements = sortedRunners.slice(i, i + 5);
        
        // Create a row div for buttons
        const rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        rowDiv.style.gap = '10px';
        
        // Add buttons for this row
        rowElements.forEach(runner => {
            const button = document.createElement('button');
            button.className = 'runner-btn';
            button.id = `runner-${runner.number}`;
            button.textContent = runner.number;
            button.disabled = true;
            button.addEventListener('click', () => recordTime(runner.number));
            rowDiv.appendChild(button);
        });
        
        runnerButtons.appendChild(rowDiv);
    }
}

// Start race
function startRace() {
    raceActive = true;
    raceStarted = true;
    startTime = new Date();
    
    // Update timer every 10ms
    timerInterval = setInterval(updateTimer, 10);
    
    // Enable runner buttons and end button
    document.querySelectorAll('.runner-btn').forEach(btn => btn.disabled = false);
    startBtn.disabled = true;
    endBtn.disabled = false;
    importBtn.disabled = true;
}

// End race
function endRace() {
    raceActive = false;
    clearInterval(timerInterval);
    
    // Disable runner buttons and enable start button
    document.querySelectorAll('.runner-btn').forEach(btn => btn.disabled = true);
    startBtn.disabled = false;
    endBtn.disabled = true;
    importBtn.disabled = false;
}

// Update timer display
function updateTimer() {
    const now = new Date();
    const diff = now - startTime;
    
    const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
    const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
    
    timerDisplay.textContent = `${hours}:${minutes}:${seconds}`;
}

// Record time for a runner
function recordTime(runnerNumber) {
    if (!raceActive) return;
    
    const now = new Date();
    const lapTime = now - startTime;
        
    // Get the button element
    const button = document.getElementById(`runner-${runnerNumber}`);

    // Check if the button is already clicked
    if (button.style.backgroundColor === 'yellow')
    {        
        // Revert race data
        raceData[runnerNumber].laps--;
        raceData[runnerNumber].times.pop();
        raceData[runnerNumber].lastTime = raceData[runnerNumber].times.length > 0 ? formatTime(raceData[runnerNumber].times[raceData[runnerNumber].times.length - 1]) : null;
        
        // Reset button color and remove event listener
        button.style.backgroundColor = '';
        button.style.color = '';
    }
    // If the button is not clicked
    else
    {
        // Update race data
        raceData[runnerNumber].laps++;
        raceData[runnerNumber].times.push(lapTime);
        raceData[runnerNumber].lastTime = formatTime(lapTime);
        
        // Change button color to yellow
        button.style.backgroundColor = 'yellow';
        button.style.color = 'black';
        
        // Set a timeout to disable the button for 60 seconds if not clicked within 2 seconds
        setTimeout(() => {
            // Check if the undoHandler is still attached
            if (button.style.backgroundColor === 'yellow') {
                // Disable button for 60 seconds
                button.disabled = true;
                button.style.backgroundColor = '';
                button.style.color = '';
                setTimeout(() => {
                    if (raceActive) button.disabled = false;
                }, 56000);
            }
        }, 4000);
    }    
    // Update table with new data
    updateRaceResults();
    updateTable();
}

// Update race results (calculate positions and time differences)
function updateRaceResults() {
    // Create sorted array of runners by laps and time
    const sortedRunners = Object.keys(raceData).map(number => {
        return {
            number,
            laps: raceData[number].laps,
            lastTime: raceData[number].times[raceData[number].times.length - 1] || Infinity
        };
    });
    
    // Sort by laps (descending) and then by time (ascending)
    sortedRunners.sort((a, b) => {
        if (b.laps !== a.laps) return b.laps - a.laps;
        return a.lastTime - b.lastTime;
    });
    
    // Get the time of the leader for each lap count
    const leaderTimes = {};
    sortedRunners.forEach(runner => {
        if (runner.laps > 0 && !leaderTimes[runner.laps]) {
            leaderTimes[runner.laps] = runner.lastTime;
        }
    });
    
    // Calculate differences
    sortedRunners.forEach((runner, index) => {
        if (runner.laps > 0) {
            if (index === 0) {
                // Leader doesn't have a diff
                raceData[runner.number].diff = '';
            } else {
                // Calculate diff to the leader of the same lap count
                const leaderTime = leaderTimes[runner.laps];
                const diff = runner.lastTime - leaderTime;
                raceData[runner.number].diff = '+' + formatTime(diff);
            }
            
            // Update place
            const runnerObj = runners.find(r => r.number === runner.number);
            if (runnerObj) {
                runnerObj.place = index + 1;
            }
        }
    });
}

// Format time in HH:MM:SS format
function formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / 3600000).toString().padStart(2, '0');
    const minutes = Math.floor((milliseconds % 3600000) / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((milliseconds % 60000) / 1000).toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
}

// Update table with current race data
function updateTable() {
    raceTable.innerHTML = '';
    
    let sortedRunners;
    
    if (!raceStarted) {
        // Before race starts, sort by number
        sortedRunners = [...runners].sort((a, b) => parseInt(a.number) - parseInt(b.number));
    } else {
        // After race starts, sort first by laps (runners with times first), then by place
        sortedRunners = [...runners].sort((a, b) => {
            const aLaps = raceData[a.number].laps;
            const bLaps = raceData[b.number].laps;
            
            // First separate runners with laps > 0 from those with laps = 0
            if (aLaps > 0 && bLaps === 0) return -1;
            if (aLaps === 0 && bLaps > 0) return 1;
            
            // Then sort by place
            return a.place - b.place;
        });
    }
    
    sortedRunners.forEach((runner, index) => {
        const row = document.createElement('tr');
        
        // Place
        const placeCell = document.createElement('td');
        placeCell.textContent = runner.place;
        row.appendChild(placeCell);
        
        // Number
        const numberCell = document.createElement('td');
        numberCell.textContent = runner.number;
        row.appendChild(numberCell);
        
        // Name
        const nameCell = document.createElement('td');
        nameCell.textContent = runner.name;
        row.appendChild(nameCell);
        
        // Time (absolute for leader, difference for others)
        const timeCell = document.createElement('td');
        const runnerData = raceData[runner.number];
        
        if (runnerData.laps > 0) {
            if (runnerData.diff === '') {
                timeCell.textContent = runnerData.lastTime;
            } else {
                timeCell.textContent = runnerData.diff;
            }
        } else {
            timeCell.textContent = '';
        }
        row.appendChild(timeCell);
        
        // Laps
        const lapsCell = document.createElement('td');
        lapsCell.textContent = runnerData.laps;
        row.appendChild(lapsCell);
        
        raceTable.appendChild(row);
    });
}
