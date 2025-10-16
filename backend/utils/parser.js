const formatDate = (date) => {
  if (!date) return null;
  if (/^\d{4}$/.test(date)) return `${date}-01-01`;
  return date;
};

const formatLength = (length) => {
  if (!length) return null;
  const parts = length.split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
};

export { formatDate, formatLength };
