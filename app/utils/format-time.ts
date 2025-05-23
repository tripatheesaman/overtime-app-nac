const convertDecimalToRoundedTime = (decimalTime: number): string => {
  if (decimalTime === null || decimalTime === undefined) return "--"; // Handle missing values

  const totalMinutes = decimalTime * 24 * 60; // Convert fraction to total minutes
  let hours = Math.floor(totalMinutes / 60); // Extract hours
  let minutes = Math.round(totalMinutes % 60); // Extract minutes

  // Round based on the 25-minute rule
  if (minutes < 25) {
    minutes = 0; // Round down
  } else {
    minutes = 0; // Reset minutes
    hours += 1; // Round up to next hour
  }

  return `${hours.toString().padStart(2, "0")}:00`;
};

export default convertDecimalToRoundedTime