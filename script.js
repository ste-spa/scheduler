// Get HTML elements
const algorithmsContainer = document.querySelectorAll('input[type="radio"][name="algorithm"]');
const tasksContainer = document.getElementById('tasks-container');
const statisticsContainer = document.getElementById('statistics-container');
const generateTasksButton = document.getElementById('generate-tasks');
const startButton = document.getElementById('start');
const resetButton = document.getElementById('reset');
const continuousCheckbox = document.getElementById('continuous');

// Array to store tasks
let tasks = [];

// Unique task ID counter
let taskIdCounter = 0;

// A timer to keep generating tasks
let continuousTimer;

// Flags
let stopExecution;



// Object to store algorithm functions
const algorithms = {
  fcfs: 'fcfsAlgorithm',
  sjf: 'sjfAlgorithm',
  prio: 'priorityAlgorithm',
  rr: 'rrAlgorithm',
};

// Function to generate a random number between min and max (inclusive)
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Function to start the scheduling algorithm and update the statistics
function startScheduling() {
  // Disable Input from changing
  disableStartButton();
  // Run the selected scheduling algorithm and update the statistics
  runAlgorithm().then(enableStartButton);
  // Update the tasks container
  //showTasks()
}

// Function to run the selected scheduling algorithm on the tasks array
async function runAlgorithm() {
  // Get the selected scheduling algorithm
  const selectedAlgorithm = algorithms[document.querySelector('input[name="algorithm"]:checked').value];
  const timeToRun = document.querySelector('input[name="run-time"]').value

  // Run the selected algorithm on the tasks array
  switch (selectedAlgorithm) {
    case 'fcfsAlgorithm':
      fcfs_sort();
      await executeTasks(timeToRun);
      break;

    case 'sjfAlgorithm':
      sjf_sort();
      await executeTasks(timeToRun);
      break;

    case 'priorityAlgorithm':
      priority_sort();
      await executeTasks(timeToRun);
      break;

    case 'rrAlgorithm':
      rr_sort();
      await executeTasks(timeToRun, document.querySelector('input[name="quantum"]').value);
      break;

    default:
      break;
  }


  // Update the statistics container with the number of completed tasks, total time taken to complete the tasks, and average time taken per task
   updateStatistics();
}


// First-Come, First-Serve (FCFS) algorithm
function fcfs_sort() {
  tasks.sort((a, b) => a.arrivalTime - b.arrivalTime);
}

// Shortest Job First (SJF) algorithm
function sjf_sort() {
  tasks.sort((a, b) => a.timeRequired - b.timeRequired);
}

// Priority algorithm - sorts tasks by priority and then by arrival time
function priority_sort() {
  tasks.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    } else {
      return a.arrivalTime - b.arrivalTime;
    }
  });
}

// Round-Robin algorithm
function rr_sort() {
  tasks.sort((a, b) => a.arrivalTime - b.arrivalTime);
}

// Function to execute tasks
async function executeTasks(timeToRun,quantum=-1) {
  // Release blocking flag
  stopExecution = false;
  // Iterate through each task
  for (let i = 0; tasks.length > 0 && timeToRun > 0 && !stopExecution; i=i%tasks.length) {
    const task = tasks[i];
    task.oldTime = task.timeRequired;
    [timeToRun, task.timeRequired, i] =
        (quantum === -1) ?
                    timeToRun >= task.timeRequired ? [timeToRun - task.timeRequired, 0, i] : [0, task.timeRequired - timeToRun, ++i] :
                    quantum >= task.timeRequired ? [timeToRun - task.timeRequired, 0, i] : [timeToRun - quantum, task.timeRequired - quantum, ++i];
    if (task.timeRequired === 0)tasks = tasks.filter(t => t !== task);
    await animateTask(task);
    }
  }

async function animateTask(task) {
  const taskDiv = document.getElementById(`task${task.id}`);
  taskDiv.runTime = taskDiv.querySelector("div.runTime");
  taskDiv.classList.add('running');
  while (task.oldTime !== task.timeRequired){
    taskDiv.runTime.textContent= "Time left: " + --task.oldTime + 's';
    await sleep(20);
  }
  taskDiv.classList.remove('running');
  if (task.timeRequired === 0) {
    await finishTask(taskDiv)}
    updateStatistics(statisticsContainer);
}

// Trigger Div remove animations
function finishTask(taskDiv) {
  taskDiv.classList.add('destroy-me');
  return new Promise(resolve => {
    taskDiv.addEventListener('animationend', () => {
      taskDiv.parentNode.removeChild(taskDiv);
      resolve();
    });
  });
  }

// Function to generate tasks
async function generateTasks(numTasks = 1) {
  // Cancel if too much tasks already exist
  if (continuousTimer && tasks.length > 50 )return;
  // Generate a random number of tasks (between 1 and 20) if not input specified
  numTasks = numTasks === 1 ? numTasks : Math.floor(Math.random() * 20) + 1;
  // Generate tasks and add them to the tasks array and tasks container
  for (let i = 0; i < numTasks; i++) {
    let id = taskIdCounter++;
    const task = {
      id: id,
      name: `Task ${id}`,
      arrivalTime: Date.now(),
      startTime: null,
      endTime: null,
      priority: Math.floor( Math.random() * 10) + 1,
      timeRequired: Math.floor(Math.random() * 10) + 1,
    };
    tasks.push(task);
    generateDiv(task);
    await sleep(20);
  }
}

// Function to update the statistics container with the results
function updateStatistics() {
  // Calculate the number of completed tasks
  // to do: assign other value that will count the finished tasks 
  const completedTasks = tasks.filter(task => task.remainingTime === 0).length;
  // Calculate the total time taken to complete the tasks
  const totalTime = tasks.reduce((total, task) => total + task.executionTime, 0);
  // Calculate the average time taken per task
  const averageTime = totalTime.toFixed(2) / tasks.length;
  // Update the statistics container with the results
 // statisticsContainer.innerHTML = `Completed tasks: ${completedTasks} | Total time: ${totalTime} 's' | Average time per task: ${averageTime.toFixed(2)} 's' `;
  document.querySelector(".num-completed .value").textContent = completedTasks;
  document.querySelector(".total-time .value").textContent = totalTime;
  document.querySelector(".avg-time .value").textContent = averageTime;
}

function showTasks(){
  tasksContainer.innerHTML = '';
  tasks.forEach(generateDiv);
}

// Function to generate div for a Task
function generateDiv(task) {
  const taskDiv = document.createElement('div');
  taskDiv.classList.add('task');
  taskDiv.id = `task${task.id}`;
  const arrivalTimeContainer = document.createElement('div');
  arrivalTimeContainer.classList.add('arrivalTimeContainer');
  arrivalTimeContainer.innerText = "Arrival Time : ";
  const arrivalTime = document.createElement('span');
  arrivalTime.classList.add('arrivalTime');
  arrivalTime.innerText =  new Date(task.arrivalTime).toISOString();
  arrivalTimeContainer.appendChild(arrivalTime);
  const name = document.createElement('div');
  name.classList.add('taskId');
  name.innerText = task.name;
  const runTime = document.createElement('div');
  runTime.classList.add('runTime');
  runTime.innerText = "Duration: " + task.timeRequired + 's';
  const priority = document.createElement('div');
  priority.classList.add('priority');
  priority.innerText = "Priority: " + task.priority;
  taskDiv.append(...[name, arrivalTimeContainer, runTime, priority]);
  tasksContainer.appendChild(taskDiv);
}

// Event listener for the generate tasks button
generateTasksButton.addEventListener('click', generateTasks);

// Event listener for the start button
startButton.addEventListener('click', startScheduling);

// Event listener for the continuous checkbox
continuousCheckbox.addEventListener('change', function() {
  // Clear any existing timer
  clearInterval(continuousTimer);
  // If the checkbox is checked, start a timer to continuously generate new tasks
  if (this.checked) {
    continuousTimer = setInterval(generateTasks, 100);
  }
});

// Event listener for the reset button
resetButton.addEventListener('click', function() {
  // Reset the taskIds and update the nextTaskId variable
  tasks = [];
  taskIdCounter = 0;
  tasksContainer.innerHTML = '';
  // Reset the statistics container
  statisticsContainer.innerHTML = '';
  enableStartButton();
});

// Event listener for selecting algorithms
algorithmsContainer.forEach((radioButton) => {
  radioButton.addEventListener('change', () => {
    // Stop the scheduling function here
    stopExecution = true;
  });
});

function sleep(duration) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
}


function disableStartButton() {
  startButton.setAttribute('disabled', true);
}

function enableStartButton() {
  startButton.removeAttribute('disabled');
}