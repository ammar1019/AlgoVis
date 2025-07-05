const gridContainer = document.getElementById("grid");
const pathLengthEl = document.getElementById("pathLength");
const resetBtn = document.getElementById("resetBtn");
const obstacleBtn = document.getElementById("obstacleBtn");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const findPathBtn = document.getElementById("findPathBtn");
const mazeBtn = document.getElementById("mazeBtn");
const speedSlider = document.getElementById("speedSlider");

const ROWS = 20;
const COLS = 20;
let mode = "none";
let animationSpeed = 50;
let isVisualizing = false;
let isLocked = false;

let grid = [];
let startCell = null;
let endCell = null;

// UTIL
function showToast(message, duration = 3000) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("show");
    void toast.offsetWidth;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, duration);
}

// CLEAR ACTIVE ACTION BUTTONS
function clearActiveActionButtons() {
    obstacleBtn.classList.remove("active");
    startBtn.classList.remove("active");
    endBtn.classList.remove("active");
    mode = "none";
}

// GRID CREATION
function createGrid() {
    gridContainer.innerHTML = "";
    grid = [];
    startCell = null;
    endCell = null;
    isLocked = false;
    isVisualizing = false;
    clearActiveActionButtons();

    for (let r = 0; r < ROWS; r++) {
        let row = [];
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener("click", () => handleCellClick(grid[r][c]));
            gridContainer.appendChild(cell);
            row.push({
                row: r,
                col: c,
                element: cell,
                isStart: false,
                isEnd: false,
                isObstacle: false,
                visited: false,
                prev: null
            });
        }
        grid.push(row);
    }
}

// ACTION LOCK GUARD
function canPerformAction(show = true) {
    if (isVisualizing) {
        if (show) requestAnimationFrame(() => showToast("⚠️ Please wait for visualization to finish."));
        return false;
    }
    if (isLocked) {
        if (show) requestAnimationFrame(() => showToast("⚠️ Reset the grid."));
        return false;
    }
    return true;
}

// BUTTON STATE HANDLING
function setMode(newMode, button) {
    if (!canPerformAction()) return;
    if (mode === newMode) {
        mode = "none";
        button.classList.remove("active");
    } else {
        clearActiveActionButtons();
        mode = newMode;
        button.classList.add("active");
    }
}

// CELL CLICK HANDLING
function handleCellClick(cellData) {
    if (!canPerformAction(false)) return;

    if (mode === "start") {
        if (cellData.isObstacle) {
            showToast("Cannot place start on an obstacle.");
            return;
        }
        if (startCell) {
            startCell.isStart = false;
            startCell.element.classList.remove("start");
        }
        cellData.isStart = true;
        cellData.element.classList.add("start");
        startCell = cellData;
    } else if (mode === "end") {
        if (cellData.isObstacle) {
            showToast("Cannot place end on an obstacle.");
            return;
        }
        if (endCell) {
            endCell.isEnd = false;
            endCell.element.classList.remove("end");
        }
        cellData.isEnd = true;
        cellData.element.classList.add("end");
        endCell = cellData;
    } else if (mode === "obstacle") {
        if (cellData.isStart || cellData.isEnd) {
            showToast("Cannot place obstacle on start or end.");
            return;
        }
        cellData.isObstacle = !cellData.isObstacle;
        cellData.element.classList.toggle("obstacle", cellData.isObstacle);
    }
}

// BFS VISUALIZATION
async function bfs() {
    if (!canPerformAction()) return;
    clearActiveActionButtons();
    isVisualizing = true;
    pathLengthEl.textContent = "Path Length: N/A";

    if (!startCell || !endCell) {
        showToast("⚠️ Place both a start and end point.");
        isVisualizing = false;
        return;
    }

    for (let row of grid) {
        for (let cell of row) {
            cell.visited = false;
            cell.prev = null;
            cell.element.classList.remove("visited", "path");
        }
    }

    const queue = [startCell];
    startCell.visited = true;
    const directions = [[0,1],[1,0],[0,-1],[-1,0]];
    let found = false;

    while (queue.length > 0) {
        const current = queue.shift();
        if (current !== startCell && current !== endCell) {
            current.element.classList.add("visited");
            await new Promise(res => setTimeout(res, animationSpeed));
        }
        if (current === endCell) {
            found = true;
            break;
        }
        for (let [dx, dy] of directions) {
            const nr = current.row + dx;
            const nc = current.col + dy;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                const neighbor = grid[nr][nc];
                if (!neighbor.visited && !neighbor.isObstacle) {
                    neighbor.visited = true;
                    neighbor.prev = current;
                    queue.push(neighbor);
                }
            }
        }
    }

    if (found) {
        const path = [];
        let current = endCell;
        while (current) {
            path.push(current);
            current = current.prev;
        }
        path.reverse();
        pathLengthEl.textContent = "Path Length: " + (path.length - 1);
        for (let cell of path) {
            if (cell !== startCell && cell !== endCell) {
                cell.element.classList.remove("visited");
                cell.element.classList.add("path");
                await new Promise(res => setTimeout(res, animationSpeed));
            }
        }
        showToast("🎉 Yay! Shortest Path found.");

    } else {
        showToast("🚫 No path exists. Try again");
    }

    isVisualizing = false;
    isLocked = true;
}

// MAZE GENERATION
function generateMaze() {
    if (!canPerformAction()) return;
    clearActiveActionButtons();

    for (let row of grid) {
        for (let cell of row) {
            if (!cell.isStart && !cell.isEnd) {
                cell.isObstacle = Math.random() < 0.3;
                cell.element.classList.toggle("obstacle", cell.isObstacle);
            }
        }
    }
    pathLengthEl.textContent = "Path Length: N/A";
}

// SPEED SLIDER
speedSlider.addEventListener("input", () => {
    animationSpeed = 155 - parseInt(speedSlider.value);
});

// BUTTON EVENTS
resetBtn.addEventListener("click", () => {
    if (isVisualizing) {
        showToast("⚠️ Please wait for visualization to finish.");
        return;
    }
    createGrid();
    pathLengthEl.textContent = "Path Length: N/A";
});

obstacleBtn.addEventListener("click", () => setMode("obstacle", obstacleBtn));
startBtn.addEventListener("click", () => setMode("start", startBtn));
endBtn.addEventListener("click", () => setMode("end", endBtn));
findPathBtn.addEventListener("click", bfs);
mazeBtn.addEventListener("click", generateMaze);

createGrid();
