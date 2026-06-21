const FREQ_LABELS = { weekly: 'week', fortnightly: 'fortnight', monthly: 'month' };

export function priceLabel(price, listingType, rentFrequency) {
  const amount = `K${Number(price).toLocaleString()}`;
  if (listingType === 'rent' && rentFrequency) {
    return `${amount} / ${FREQ_LABELS[rentFrequency] || rentFrequency}`;
  }
  return amount;
}
