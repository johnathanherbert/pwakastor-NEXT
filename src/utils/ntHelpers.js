/**
 * Calculates the payment deadline (2 hours after creation)
 * @param {string} createdDate - Date in DD/MM/YYYY format
 * @param {string} createdTime - Time in HH:MM format
 * @returns {Date} The deadline as a Date object
 */
export const calculatePaymentDeadline = (createdDate, createdTime) => {
  // Parse the Brazilian date format
  const [day, month, year] = createdDate.split('/').map(Number);
  const [hours, minutes] = createdTime.split(':').map(Number);
  
  // Create a date object (month is 0-indexed in JS)
  const date = new Date(year, month - 1, day, hours, minutes);
  
  // Add 2 hours for the deadline
  date.setHours(date.getHours() + 2);
  
  return date;
};

/**
 * Determines if an item is overdue based on its status and creation time
 * @param {Object} item - NT item object
 * @returns {boolean} True if the item is overdue
 */
export const isItemOverdue = (item) => {
  // If already paid, not overdue
  if (item.status !== 'Ag. Pagamento') return false;
  
  const deadline = calculatePaymentDeadline(item.created_date, item.created_time);
  return new Date() > deadline;
};

/**
 * Calculates the overdue time in minutes
 * @param {Object} item - NT item object
 * @returns {number} Minutes overdue, or 0 if not overdue
 */
export const getOverdueMinutes = (item) => {
  if (item.status !== 'Ag. Pagamento') return 0;
  
  const deadline = calculatePaymentDeadline(item.created_date, item.created_time);
  const now = new Date();
  
  if (now <= deadline) return 0;
  
  const diffMs = now - deadline;
  return Math.floor(diffMs / (1000 * 60));
};

/**
 * Formats overdue time as a human-readable string
 * @param {number} minutes - Minutes overdue
 * @returns {string} Formatted overdue time (e.g., "1h 30min")
 */
export const formatOverdueTime = (minutes) => {
  if (minutes <= 0) return '';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
  }
  
  return `${minutes}min`;
};

/**
 * Calculates the remaining time until the deadline in minutes
 * @param {Object} item - NT item object
 * @returns {number} Minutes remaining until deadline, negative if overdue
 */
export const getRemainingMinutes = (item) => {
  if (item.status !== 'Ag. Pagamento') return 0;
  
  const deadline = calculatePaymentDeadline(item.created_date, item.created_time);
  const now = new Date();
  
  const diffMs = deadline - now;
  return Math.floor(diffMs / (1000 * 60));
};

/**
 * Formats remaining time as a human-readable string
 * @param {number} minutes - Minutes remaining
 * @returns {string} Formatted time remaining
 */
export const formatRemainingTime = (minutes) => {
  if (minutes <= 0) return '';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
  }
  
  return `${minutes}min`;
};

/**
 * Calculates how long ago the item was created in minutes
 * @param {Object} item - NT item object
 * @returns {number} Minutes since creation
 */
export const getElapsedMinutes = (item) => {
  // Parse the created date/time
  const [day, month, year] = item.created_date.split('/').map(Number);
  const [hours, minutes] = item.created_time.split(':').map(Number);
  
  // Create a date object (month is 0-indexed in JS)
  const createdDate = new Date(year, month - 1, day, hours, minutes);
  const now = new Date();
  
  const diffMs = now - createdDate;
  return Math.floor(diffMs / (1000 * 60));
};

/**
 * Formats elapsed time as a human-readable string
 * @param {number} minutes - Minutes elapsed
 * @returns {string} Formatted elapsed time
 */
export const formatElapsedTime = (minutes) => {
  if (minutes <= 0) return 'agora';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
  }
  
  return `${minutes}min`;
};

/**
 * Determines which shift a given timestamp belongs to
 * Shift 1: 07:30 - 15:50
 * Shift 2: 15:50 - 23:20
 * Shift 3: 23:20 - 07:30
 * @param {Date} date - Date object to check
 * @returns {number} Shift number (1, 2, or 3)
 */
export const getShiftNumber = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  // Convert shift boundaries to minutes for easier comparison
  const shift1Start = 7 * 60 + 30;  // 07:30
  const shift1End = 15 * 60 + 50;   // 15:50
  const shift2End = 23 * 60 + 20;   // 23:20
  
  if (totalMinutes >= shift1Start && totalMinutes < shift1End) {
    return 1; // First shift: 07:30 - 15:50
  } else if (totalMinutes >= shift1End && totalMinutes < shift2End) {
    return 2; // Second shift: 15:50 - 23:20
  } else {
    return 3; // Third shift: 23:20 - 07:30
  }
};

/**
 * Gets the current shift number
 * @returns {number} Current shift number (1, 2, or 3)
 */
export const getCurrentShift = () => {
  return getShiftNumber(new Date());
};

/**
 * Converts a Brazilian date (DD/MM/YYYY) and time (HH:MM) to a Date object
 * @param {string} dateStr - Date in DD/MM/YYYY format
 * @param {string} timeStr - Time in HH:MM format
 * @returns {Date} JavaScript Date object
 */
export const parseBrazilianDateTime = (dateStr, timeStr) => {
  const [day, month, year] = dateStr.split('/').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

/**
 * Formats shift name from shift number
 * @param {number} shiftNumber - The shift number (1, 2, or 3)
 * @returns {string} Formatted shift name
 */
export const formatShiftName = (shiftNumber) => {
  switch (shiftNumber) {
    case 1: return "1º Turno (07:30-15:50)";
    case 2: return "2º Turno (15:50-23:20)";
    case 3: return "3º Turno (23:20-07:30)";
    default: return "Todos os turnos";
  }
};
