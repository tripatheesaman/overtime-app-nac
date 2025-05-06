// Function to find the most likely time columns in a table
function findTimeColumns(table) {
  const headers = Array.from(table.querySelectorAll('th, td')).slice(0, 10); // Look at first 10 cells
  const possibleTimeColumns = [];
  
  headers.forEach((cell, index) => {
    const text = cell.textContent.toLowerCase();
    if (text.includes('time') || text.includes('in') || text.includes('out') || 
        text.includes('check') || text.includes('attendance')) {
      possibleTimeColumns.push(index);
    }
  });

  // If we found exactly two columns, use them
  if (possibleTimeColumns.length === 2) {
    return possibleTimeColumns;
  }

  // If we didn't find time columns, try to detect by content
  const allCells = Array.from(table.querySelectorAll('td'));
  const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  const columnTimeCounts = {};
  allCells.forEach((cell, index) => {
    const colIndex = index % table.rows[0].cells.length;
    if (timePattern.test(cell.textContent.trim())) {
      columnTimeCounts[colIndex] = (columnTimeCounts[colIndex] || 0) + 1;
    }
  });

  // Find the two columns with the most time values
  const sortedColumns = Object.entries(columnTimeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2)
    .map(([col]) => parseInt(col));

  return sortedColumns;
}

// Function to extract time data from a table
function extractTimeData() {
  const tables = document.querySelectorAll('table');
  if (tables.length === 0) {
    return null;
  }

  // Find the table with the most rows (likely the attendance table)
  const mainTable = Array.from(tables).reduce((max, table) => {
    const rowCount = table.rows.length;
    return rowCount > max.rows.length ? table : max;
  }, tables[0]);

  const timeColumns = findTimeColumns(mainTable);
  if (timeColumns.length !== 2) {
    return null;
  }

  const data = [];
  const rows = mainTable.querySelectorAll('tr');
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= Math.max(...timeColumns) + 1) {
      // Always add the row, even if both times are empty
      data.push({
        inTime: cells[timeColumns[0]].textContent.trim() || '',
        outTime: cells[timeColumns[1]].textContent.trim() || ''
      });
    }
  });

  return data;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureData') {
    const data = extractTimeData();
    sendResponse({ data });
  }
}); 