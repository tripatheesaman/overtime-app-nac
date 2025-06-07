import config from './config.js';

document.addEventListener('DOMContentLoaded', function() {
  const setupForm = document.getElementById('setupForm');
  const setupBtn = document.getElementById('setupBtn');
  const captureSection = document.getElementById('captureSection');
  const submitBtn = document.getElementById('submitBtn');
  const resetBtn = document.getElementById('resetBtn');
  const editModal = document.getElementById('editModal');
  const editTableBody = document.getElementById('editTableBody');
  const offDaySelect = document.getElementById('offDay');
  
  let capturedData = null;
  let dayDetails = null;
  let selectedOffDay = null;

  // Function to fetch day details
  async function fetchDayDetails() {
    try {
      const response = await fetch(`${config.BASE_URL}/api/extension-data?data=` + encodeURIComponent(JSON.stringify({ action: 'getCurrentMonthDetails' })));
      const data = await response.json();
      if (data.success && data.data) {
        return data.data;
      }
      throw new Error(data.error || 'Failed to fetch day details');
    } catch (error) {
      console.error('Error fetching day details:', error);
      return null;
    }
  }

  // Function to get remarks for a specific day
  function getRemarksForDay(index) {
    if (!dayDetails || !selectedOffDay) return '';
    
    const { startDay, holidays } = dayDetails;
    const dayOfWeekIndex = (startDay + index) % 7;
    const dayOfMonth = index + 1;
    
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekName = daysOfWeek[dayOfWeekIndex];
    
    let remarks = [];
    if (holidays.includes(dayOfMonth)) {
      remarks.push('CHD');
    }
    if (dayOfWeekName === selectedOffDay) {
      remarks.push('Off');
    }
    
    return remarks.join(', ') || 'Working';
  }

  // Function to validate time format
  function isValidTimeFormat(time) {
    if (!time) return true; // Empty time is valid
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timePattern.test(time);
  }

  // Function to check if a time pair is incomplete
  function isIncompleteTimePair(inTime, outTime) {
    return (inTime && !outTime) || (!inTime && outTime);
  }

  // Function to scroll to invalid input
  function scrollToInvalidInput(input) {
    const tableContainer = document.querySelector('.table-container');
    const inputRect = input.getBoundingClientRect();
    const containerRect = tableContainer.getBoundingClientRect();
    
    if (inputRect.top < containerRect.top || inputRect.bottom > containerRect.bottom) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Function to create table row
  function createTableRow(data, index) {
    const row = document.createElement('tr');
    
    // SN column
    const snCell = document.createElement('td');
    snCell.textContent = index + 1;
    row.appendChild(snCell);
    
    // In Time column
    const inTimeCell = document.createElement('td');
    const inTimeInput = document.createElement('input');
    inTimeInput.type = 'text';
    inTimeInput.value = data.inTime;
    inTimeInput.placeholder = 'HH:MM';
    inTimeInput.dataset.index = index;
    inTimeInput.dataset.type = 'inTime';
    inTimeCell.appendChild(inTimeInput);
    row.appendChild(inTimeCell);
    
    // Out Time column
    const outTimeCell = document.createElement('td');
    const outTimeInput = document.createElement('input');
    outTimeInput.type = 'text';
    outTimeInput.value = data.outTime;
    outTimeInput.placeholder = 'HH:MM';
    outTimeInput.dataset.index = index;
    outTimeInput.dataset.type = 'outTime';
    outTimeCell.appendChild(outTimeInput);
    row.appendChild(outTimeCell);
    
    // Remarks column (read-only)
    const remarksCell = document.createElement('td');
    remarksCell.textContent = getRemarksForDay(index);
    remarksCell.style.color = '#666';
    row.appendChild(remarksCell);

    // Add event listeners to check for incomplete pairs
    const checkIncompletePair = () => {
      const isIncomplete = isIncompleteTimePair(inTimeInput.value, outTimeInput.value);
      inTimeInput.classList.toggle('invalid', isIncomplete);
      outTimeInput.classList.toggle('invalid', isIncomplete);
      
      if (isIncomplete) {
        scrollToInvalidInput(inTimeInput);
      }
    };

    inTimeInput.addEventListener('input', checkIncompletePair);
    outTimeInput.addEventListener('input', checkIncompletePair);

    // Initial check
    checkIncompletePair();

    return row;
  }

  // Function to update data from inputs
  function updateDataFromInputs() {
    const inputs = editTableBody.querySelectorAll('input');
    inputs.forEach(input => {
      const index = parseInt(input.dataset.index);
      const type = input.dataset.type;
      if (capturedData.attendanceData[index]) {
        capturedData.attendanceData[index][type] = input.value;
      }
    });
  }

  // Function to validate all times
  function validateAllTimes() {
    const inputs = editTableBody.querySelectorAll('input[data-type="inTime"], input[data-type="outTime"]');
    let isValid = true;
    let firstInvalidInput = null;
    
    inputs.forEach(input => {
      if (!isValidTimeFormat(input.value)) {
        input.classList.add('invalid');
        isValid = false;
        if (!firstInvalidInput) {
          firstInvalidInput = input;
        }
      } else {
        // Only remove invalid class if it's not part of an incomplete pair
        const index = parseInt(input.dataset.index);
        const type = input.dataset.type;
        const otherType = type === 'inTime' ? 'outTime' : 'inTime';
        const otherInput = editTableBody.querySelector(`input[data-index="${index}"][data-type="${otherType}"]`);
        
        if (!isIncompleteTimePair(input.value, otherInput.value)) {
          input.classList.remove('invalid');
        }
      }
    });
    
    if (firstInvalidInput) {
      scrollToInvalidInput(firstInvalidInput);
    }
    
    return isValid;
  }

  // Function to capture table data
  async function captureTableData() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id, { action: 'captureData' }, response => {
        if (response && response.data) {
          resolve(response.data);
        } else {
          reject(new Error('No table data found on this page.'));
        }
      });
    });
  }

  // Function to save data to chrome.storage
  function saveData() {
    chrome.storage.session.set({
      capturedData,
      selectedOffDay,
      dayDetails
    });
  }

  // Function to load data from chrome.storage
  async function loadData() {
    return new Promise((resolve) => {
      chrome.storage.session.get(['capturedData', 'selectedOffDay', 'dayDetails'], (result) => {
        if (result.capturedData && result.selectedOffDay && result.dayDetails) {
          capturedData = result.capturedData;
          selectedOffDay = result.selectedOffDay;
          dayDetails = result.dayDetails;
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  // Function to reset data
  function resetData() {
    chrome.storage.session.remove(['capturedData', 'selectedOffDay', 'dayDetails'], () => {
      capturedData = null;
      selectedOffDay = null;
      dayDetails = null;
      setupForm.style.display = 'block';
      captureSection.style.display = 'none';
      editModal.style.display = 'none';
    });
  }

  // Setup button click handler
  setupBtn.addEventListener('click', async () => {
    const offDay = offDaySelect.value;
    if (!offDay) {
      alert('Please select an off day');
      return;
    }

    selectedOffDay = offDay;
    dayDetails = await fetchDayDetails();
    
    if (!dayDetails) {
      alert('Error fetching day details. Please try again.');
      return;
    }

    try {
      capturedData = await captureTableData();
      
      // Clear previous data
      editTableBody.innerHTML = '';
      
      // Create table rows
      capturedData.attendanceData.forEach((data, index) => {
        const row = createTableRow(data, index);
        editTableBody.appendChild(row);
      });
      
      // Save data
      saveData();
      
      // Show modal
      editModal.style.display = 'block';
      
      // Hide setup form
      setupForm.style.display = 'none';
    } catch (error) {
      alert(error.message);
    }
  });

  // Submit button click handler
  submitBtn.addEventListener('click', () => {
    updateDataFromInputs();
    
    if (!validateAllTimes()) {
      alert('Please fix invalid time formats (use HH:MM)');
      return;
    }

    // Check for incomplete time pairs
    const inputs = editTableBody.querySelectorAll('input');
    let hasIncompletePair = false;
    let firstIncompleteInput = null;
    
    inputs.forEach(input => {
      const index = parseInt(input.dataset.index);
      const type = input.dataset.type;
      const otherType = type === 'inTime' ? 'outTime' : 'inTime';
      const otherInput = editTableBody.querySelector(`input[data-index="${index}"][data-type="${otherType}"]`);
      
      if (isIncompleteTimePair(input.value, otherInput.value)) {
        hasIncompletePair = true;
        input.classList.add('invalid');
        otherInput.classList.add('invalid');
        if (!firstIncompleteInput) {
          firstIncompleteInput = input;
        }
      }
    });

    if (hasIncompletePair) {
      if (firstIncompleteInput) {
        scrollToInvalidInput(firstIncompleteInput);
      }
      alert('Please ensure both in and out times are filled for each day');
      return;
    }

    // Add off day to the data being sent
    const dataToSend = {
      inOutTimes: capturedData.attendanceData.map(record => ({
        inTime: record.inTime || '',
        outTime: record.outTime || ''
      })),
      regularOffDay: selectedOffDay,
      ...capturedData.employeeData // Include employee data
    };

    // Save updated data
    saveData();

    // Encode the data for URL
    const encodedData = encodeURIComponent(JSON.stringify(dataToSend));
    
    // Redirect to the overtime calculator app with the data
    chrome.tabs.create({ 
      url: `${config.BASE_URL}?extensionData=${encodedData}`
    });
  });

  // Reset button click handler
  resetBtn.addEventListener('click', resetData);

  // Load saved data on startup
  loadData().then(hasData => {
    if (hasData) {
      // Clear previous data
      editTableBody.innerHTML = '';
      
      // Create table rows
      capturedData.attendanceData.forEach((data, index) => {
        const row = createTableRow(data, index);
        editTableBody.appendChild(row);
      });
      
      // Show modal
      editModal.style.display = 'block';
      
      // Hide setup form
      setupForm.style.display = 'none';
    }
  });
}); 