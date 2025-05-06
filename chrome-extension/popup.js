document.addEventListener('DOMContentLoaded', function() {
  const captureBtn = document.getElementById('captureBtn');
  const submitBtn = document.getElementById('submitBtn');
  const dataPreview = document.getElementById('dataPreview');
  const editContainer = document.getElementById('editContainer');
  
  let capturedData = null;

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

  // Function to create editable row
  function createEditableRow(data, index) {
    const row = document.createElement('div');
    row.className = 'edit-row';
    
    const inTimeInput = document.createElement('input');
    inTimeInput.type = 'text';
    inTimeInput.value = data.inTime;
    inTimeInput.placeholder = 'In Time (HH:MM)';
    inTimeInput.dataset.index = index;
    inTimeInput.dataset.type = 'inTime';
    
    const outTimeInput = document.createElement('input');
    outTimeInput.type = 'text';
    outTimeInput.value = data.outTime;
    outTimeInput.placeholder = 'Out Time (HH:MM)';
    outTimeInput.dataset.index = index;
    outTimeInput.dataset.type = 'outTime';

    // Add event listeners to check for incomplete pairs
    const checkIncompletePair = () => {
      const isIncomplete = isIncompleteTimePair(inTimeInput.value, outTimeInput.value);
      inTimeInput.style.backgroundColor = isIncomplete ? '#fff0f0' : '';
      outTimeInput.style.backgroundColor = isIncomplete ? '#fff0f0' : '';
    };

    inTimeInput.addEventListener('input', checkIncompletePair);
    outTimeInput.addEventListener('input', checkIncompletePair);

    // Initial check
    checkIncompletePair();

    row.appendChild(inTimeInput);
    row.appendChild(outTimeInput);
    return row;
  }

  // Function to update data from inputs
  function updateDataFromInputs() {
    const inputs = editContainer.querySelectorAll('input');
    inputs.forEach(input => {
      const index = parseInt(input.dataset.index);
      const type = input.dataset.type;
      if (capturedData[index]) {
        capturedData[index][type] = input.value;
      }
    });
  }

  // Function to validate all times
  function validateAllTimes() {
    const inputs = editContainer.querySelectorAll('input');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!isValidTimeFormat(input.value)) {
        input.style.borderColor = '#D4483B';
        isValid = false;
      } else {
        input.style.borderColor = '#003594';
      }
    });
    
    return isValid;
  }

  // Capture button click handler
  captureBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { action: 'captureData' }, response => {
      if (response && response.data) {
        capturedData = response.data;
        
        // Clear previous data
        editContainer.innerHTML = '';
        
        // Create editable rows
        capturedData.forEach((data, index) => {
          const row = createEditableRow(data, index);
          editContainer.appendChild(row);
        });
        
        // Show preview and submit button
        dataPreview.style.display = 'block';
        submitBtn.style.display = 'block';
      } else {
        alert('No table data found on this page.');
      }
    });
  });

  // Submit button click handler
  submitBtn.addEventListener('click', () => {
    updateDataFromInputs();
    
    if (!validateAllTimes()) {
      alert('Please fix invalid time formats (use HH:MM)');
      return;
    }

    // Log the data being sent
    console.log('Sending data to overtime calculator:', capturedData);

    // Encode the data for URL
    const encodedData = encodeURIComponent(JSON.stringify(capturedData));
    
    // Redirect to the overtime calculator app with the data
    chrome.tabs.create({ 
      url: `http://localhost:3000?extensionData=${encodedData}`
    });
  });
}); 