// utils/formatDate.js
import { format, parseISO } from "date-fns";

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  try {
    const date = parseISO(dateString);
    return format(date, "MMM dd, yyyy 'at' hh:mm a"); // e.g., Sep 07, 2025 at 11:41 AM
  } catch (error) {
    console.error("Invalid date format:", dateString, error);
    return "Invalid Date";
  }
};