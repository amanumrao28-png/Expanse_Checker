export const getPreferredCurrency = () => {
  try {
    const saved = localStorage.getItem('student_profile');
    if (saved) {
      const profile = JSON.parse(saved);
      const cur = profile.currency || '';
      if (cur.includes('INR') || cur.includes('₹')) {
        return { code: 'INR', locale: 'en-IN', symbol: '₹' };
      }
      if (cur.includes('USD') || cur.includes('$')) {
        return { code: 'USD', locale: 'en-US', symbol: '$' };
      }
      if (cur.includes('EUR') || cur.includes('€')) {
        return { code: 'EUR', locale: 'de-DE', symbol: '€' };
      }
      if (cur.includes('GBP') || cur.includes('£')) {
        return { code: 'GBP', locale: 'en-GB', symbol: '£' };
      }
      if (cur.includes('CAD')) {
        return { code: 'CAD', locale: 'en-CA', symbol: 'CA$' };
      }
    }
  } catch (e) {
    console.warn('Could not read preferred currency from profile:', e);
  }

  // Default to INR (₹)
  return { code: 'INR', locale: 'en-IN', symbol: '₹' };
};

export const getCurrencySymbol = () => {
  return getPreferredCurrency().symbol;
};

export const formatCurrency = (amount, customCurrency = null) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || 0);
  const preferred = getPreferredCurrency();
  const currencyCode = customCurrency || preferred.code;
  const locale = currencyCode === 'INR' ? 'en-IN' : (currencyCode === 'USD' ? 'en-US' : preferred.locale);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${preferred.symbol}${num.toFixed(2)}`;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export const formatRelativeDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateString);
};

export const formatPercent = (value) => {
  const num = typeof value === 'number' ? value : parseFloat(value || 0);
  return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
};
