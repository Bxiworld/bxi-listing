const CommaSeparator = (valueOrProps) => {
  const number =
    valueOrProps && typeof valueOrProps === 'object'
      ? valueOrProps.Price
      : valueOrProps;

  const roundedNumber = Number(number);
  const isValidNumber = !Number.isNaN(roundedNumber);

  if (!isValidNumber) return '';

  const hasDecimals = roundedNumber % 1 !== 0;
  const formattedNumber = roundedNumber.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  });

  return Number.isInteger(roundedNumber) ? `${formattedNumber}` : formattedNumber;
};

export default CommaSeparator;
