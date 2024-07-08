document.getElementById("num-processes").addEventListener("change", generateProcessInputs);
document.getElementById("algorithm").addEventListener("change", toggleQuantumInput);

function generateProcessInputs() {
    const numProcesses = parseInt(document.getElementById("num-processes").value);
    const processDetailsDiv = document.getElementById("process-details");
    processDetailsDiv.innerHTML = '';

    for (let i = 1; i <= numProcesses; i += 2) {
        const processDiv = document.createElement("div");
        processDiv.className = "process-row";

        const processLeft = `
            <div class="process-input">
                <label>Process P${i}:</label>
                <input type="number" placeholder="Arrival Time" id="arrival-${i}" min="0" required>
                <input type="number" placeholder="Burst Time" id="burst-${i}" min="1" required>
            </div>
        `;
        let processRight = '';
        if (i + 1 <= numProcesses) {
            processRight = `
                <div class="process-input">
                    <label>Process P${i + 1}:</label>
                    <input type="number" placeholder="Arrival Time" id="arrival-${i + 1}" min="0" required>
                    <input type="number" placeholder="Burst Time" id="burst-${i + 1}" min="1" required>
                </div>
            `;
        }

        processDiv.innerHTML = processLeft + processRight;
        processDetailsDiv.appendChild(processDiv);
    }
}

document.getElementById("algorithm").addEventListener("change", displayAlgorithmDescription);

function displayAlgorithmDescription() {
    const algorithm = document.getElementById("algorithm").value;
    let description = "";

    switch (algorithm) {
        case "FCFS":
            description = "First Come First Serve (FCFS): Processes are scheduled in the order they arrive.";
            break;
        case "SJF":
            description = "Shortest Job First (SJF): Processes with the shortest burst time are scheduled first.";
            break;
        case "SRTF":
            description = "Shortest Remaining Time First (SRTF): Processes with the shortest remaining time are scheduled first.";
            break;
        case "RR":
            description = "Round Robin (RR): Each process is assigned a fixed time in cyclic order.";
            break;
    }

    document.getElementById("algorithm-description").innerText = description;
}

// Call the function when the page loads
document.addEventListener("DOMContentLoaded", displayAlgorithmDescription);



document.getElementById("add-process").addEventListener("click", addProcess);
document.getElementById("remove-process").addEventListener("click", removeProcess);

function addProcess() {
    const numProcessesInput = document.getElementById("num-processes");
    numProcessesInput.value = parseInt(numProcessesInput.value) + 1;
    generateProcessInputs();
}

function removeProcess() {
    const numProcessesInput = document.getElementById("num-processes");
    const currentCount = parseInt(numProcessesInput.value);
    if (currentCount > 1) {
        numProcessesInput.value = currentCount - 1;
        generateProcessInputs();
    }
}

function toggleQuantumInput() {
    const algorithm = document.getElementById("algorithm").value;
    const quantumLabel = document.getElementById("quantum-label");
    const quantumInput = document.getElementById("quantum");
    if (algorithm === "RR") {
        quantumLabel.style.display = "block";
        quantumInput.style.display = "block";
    } else {
        quantumLabel.style.display = "none";
        quantumInput.style.display = "none";
    }
}

// Call the function when the page loads
document.addEventListener("DOMContentLoaded", toggleQuantumInput);

function validateInputs() {
    const numProcesses = parseInt(document.getElementById("num-processes").value);
    for (let i = 1; i <= numProcesses; i++) {
        const arrivalTime = document.getElementById(`arrival-${i}`).value;
        const burstTime = document.getElementById(`burst-${i}`).value;
        if (arrivalTime === "" || burstTime === "") {
            alert(`Please fill in all fields for Process P${i}`);
            return false;
        }
        if (parseInt(arrivalTime) < 0) {
            alert(`Arrival time for Process P${i} cannot be negative`);
            return false;
        }
        if (parseInt(burstTime) <= 0) {
            alert(`Burst time for Process P${i} must be a positive integer`);
            return false;
        }
    }
    return true;
}


function scheduleProcesses() {
    if (!validateInputs()) return;
    const numProcesses = parseInt(document.getElementById("num-processes").value);
    const algorithm = document.getElementById("algorithm").value;
    const quantum = parseInt(document.getElementById("quantum").value) || 1;
    const processes = [];

    for (let i = 1; i <= numProcesses; i++) {
        const arrivalTime = parseInt(document.getElementById(`arrival-${i}`).value);
        const burstTime = parseInt(document.getElementById(`burst-${i}`).value);
        processes.push({ pid: `P${i}`, arrival: arrivalTime, burst: burstTime });
    }

    if (algorithm === "FCFS") {
        fcfsScheduling(processes);
    } else if (algorithm === "SJF") {
        sjfScheduling(processes);
    } else if (algorithm === "SRTF") {
        srtfScheduling(processes);
    } else if (algorithm === "RR") {
        rrScheduling(processes, quantum);
    }
}

function fcfsScheduling(processes) {
    processes.sort((a, b) => a.arrival - b.arrival);

    let currentTime = 0;
    const waitTimes = [];
    const tatTimes = [];
    const completionTimes = [];
    const ganttChart = [];

    processes.forEach(process => {
        if (currentTime < process.arrival) {
            currentTime = process.arrival;
        }
        ganttChart.push({ process: process.pid, start: currentTime, end: currentTime + process.burst });
        completionTimes.push(currentTime + process.burst);
        tatTimes.push(currentTime + process.burst - process.arrival);
        waitTimes.push(currentTime - process.arrival);
        currentTime += process.burst;
    });

    displayOutput(processes, waitTimes, tatTimes, completionTimes, "FCFS", ganttChart);
}

function sjfScheduling(processes) {
    const n = processes.length;
    const waitTimes = new Array(n).fill(0);
    const tatTimes = new Array(n).fill(0);
    const completionTimes = new Array(n).fill(0);
    const ganttChart = [];

    let currentTime = 0;
    let completed = 0;

    while (completed < n) {
        let idx = -1;
        let minBurst = Infinity;

        for (let i = 0; i < n; i++) {
            if (processes[i].arrival <= currentTime && !completionTimes[i] && processes[i].burst < minBurst) {
                minBurst = processes[i].burst;
                idx = i;
            }
        }

        if (idx === -1) {
            currentTime++;
        } else {
            ganttChart.push({ process: processes[idx].pid, start: currentTime, end: currentTime + processes[idx].burst });
            currentTime += processes[idx].burst;
            completionTimes[idx] = currentTime;
            tatTimes[idx] = completionTimes[idx] - processes[idx].arrival;
            waitTimes[idx] = tatTimes[idx] - processes[idx].burst;
            completed++;
        }
    }

    displayOutput(processes, waitTimes, tatTimes, completionTimes, "SJF", ganttChart);
}

function srtfScheduling(processes) {
    const n = processes.length;
    const remainingTimes = processes.map(p => p.burst);
    const waitTimes = new Array(n).fill(0);
    const tatTimes = new Array(n).fill(0);
    const completionTimes = new Array(n).fill(0);
    const ganttChart = [];

    let currentTime = 0;
    let completed = 0;
    let previousProcess = null;

    while (completed < n) {
        let idx = -1;
        let minRemaining = Infinity;

        for (let i = 0; i < n; i++) {
            if (processes[i].arrival <= currentTime && remainingTimes[i] > 0 && remainingTimes[i] < minRemaining) {
                minRemaining = remainingTimes[i];
                idx = i;
            }
        }

        if (idx === -1) {
            currentTime++;
        } else {
            if (previousProcess !== null && previousProcess !== processes[idx].pid) {
                ganttChart[ganttChart.length - 1].end = currentTime;
                ganttChart.push({ process: processes[idx].pid, start: currentTime });
            } else if (previousProcess === null) {
                ganttChart.push({ process: processes[idx].pid, start: currentTime });
            }

            previousProcess = processes[idx].pid;
            remainingTimes[idx]--;
            currentTime++;

            if (remainingTimes[idx] === 0) {
                completionTimes[idx] = currentTime;
                tatTimes[idx] = completionTimes[idx] - processes[idx].arrival;
                waitTimes[idx] = tatTimes[idx] - processes[idx].burst;
                completed++;
            }
        }
    }

    ganttChart[ganttChart.length - 1].end = currentTime;

    displayOutput(processes, waitTimes, tatTimes, completionTimes, "SRTF", ganttChart);
}


function rrScheduling(processes, quantum) {
    processes.sort((a, b) => a.arrival - b.arrival);

    const n = processes.length;
    const remainingTimes = processes.map(p => p.burst);
    const waitTimes = new Array(n).fill(0);
    const tatTimes = new Array(n).fill(0);
    const completionTimes = new Array(n).fill(0);
    const queue = [];
    let currentTime = 0;
    let idx = 0;
    const ganttChart = [];
    
    while (queue.length > 0 || idx < n) {
        while (idx < n && processes[idx].arrival <= currentTime) {
            queue.push(idx);
            idx++;
        }

        if (queue.length === 0) {
            currentTime = processes[idx].arrival;
            queue.push(idx);
            idx++;
        }

        const currentIdx = queue.shift();
        const timeSpent = Math.min(quantum, remainingTimes[currentIdx]);
        remainingTimes[currentIdx] -= timeSpent;
        currentTime += timeSpent;
        ganttChart.push({ process: processes[currentIdx].pid, start: currentTime - timeSpent, end: currentTime });

        if (remainingTimes[currentIdx] > 0) {
            while (idx < n && processes[idx].arrival <= currentTime) {
                queue.push(idx);
                idx++;
            }
            queue.push(currentIdx);
        } else {
            completionTimes[currentIdx] = currentTime;
            tatTimes[currentIdx] = completionTimes[currentIdx] - processes[currentIdx].arrival;
            waitTimes[currentIdx] = tatTimes[currentIdx] - processes[currentIdx].burst;
        }
    }

    displayOutput(processes, waitTimes, tatTimes, completionTimes, "Round Robin", ganttChart);
}

function displayOutput(processes, waitTimes, tatTimes, completionTimes, algorithm, ganttChart = []) {
    processes.sort((a, b) => a.pid.localeCompare(b.pid));

    const outputDiv = document.getElementById("output");
    outputDiv.innerHTML = `<h2>${algorithm} Scheduling</h2>`;
    
    let tableHTML = `<table>
                        <tr>
                            <th>Process ID</th>
                            <th>Arrival Time</th>
                            <th>Burst Time</th>
                            <th>Completion Time</th>
                            <th>Turnaround Time</th>
                            <th>Waiting Time</th>
                        </tr>`;
                        
    processes.forEach((process, index) => {
        tableHTML += `<tr>
                        <td>${process.pid}</td>
                        <td>${process.arrival}</td>
                        <td>${process.burst}</td>
                        <td>${completionTimes[index]}</td>
                        <td>${tatTimes[index]}</td>
                        <td>${waitTimes[index]}</td>
                      </tr>`;
    });

    tableHTML += `</table>`;
    outputDiv.innerHTML += tableHTML;

    const averageTurnaroundTime = tatTimes.reduce((sum, tat) => sum + tat, 0) / tatTimes.length;
    const averageWaitingTime = waitTimes.reduce((sum, wt) => sum + wt, 0) / waitTimes.length;

    document.getElementById("average-turnaround-time").innerText = `Average Turnaround Time: ${averageTurnaroundTime.toFixed(2)}`;
    document.getElementById("average-waiting-time").innerText = `Average Waiting Time: ${averageWaitingTime.toFixed(2)}`;

    if (ganttChart.length > 0) {
        let ganttHTML = '<br>'; 
        ganttHTML += '<div class="gantt-chart">';
        ganttChart.forEach((block, index) => {
            ganttHTML += `<div class="gantt-block" style="flex-grow: ${block.end - block.start};">
                            <span class="start">${block.start}</span>
                            <span class="process-id">${block.process}</span>`;
            if (index === ganttChart.length - 1 || ganttChart[index + 1].start !== block.end) {
                ganttHTML += `<span class="end">${block.end}</span>`;
            }
            ganttHTML += `</div>`;
        });
        ganttHTML += '</div>';
        outputDiv.innerHTML += ganttHTML;
    }
}
