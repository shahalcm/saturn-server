const calculateCommission = (amount, type, commissionRate = 15) => {
  const commission = (amount * commissionRate) / 100;
  const providerEarning = amount - commission;
  return {
    totalAmount: amount,
    commissionRate,
    commissionAmount: Math.round(commission),
    providerEarning: Math.round(providerEarning),
  };
};

module.exports = calculateCommission;
