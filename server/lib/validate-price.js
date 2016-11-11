
validatePrice = (LMI_PAYMENT_AMOUNT) => {
  const paymentProgram = Programs.getPaymentProgram();
  const { properties } = paymentProgram;

  const prices = [];
  if (new Date() > new Date(properties.date1) && new Date() < new Date(properties.date2)) {
    prices.push(`${properties.priceBase2}.00`);
    prices.push(`${properties.priceTrial2}.00`);
  }
  else if (new Date() > new Date(properties.date0) && new Date() < new Date(properties.date1)) {
    prices.push(`${properties.priceBase1}.00`);
    prices.push(`${properties.priceTrial1}.00`);
  }

  return prices.includes(LMI_PAYMENT_AMOUNT);
}

validatePriceWithUser = (LMI_PAYMENT_AMOUNT, user) => {
  const paymentProgram = Programs.getPaymentProgram();
  const { properties } = paymentProgram;

  const hasTrialProgram = _.findWhere(user.trialPrograms, { _id: paymentProgram._id });
  const pre = new Date() > new Date(properties.date0) && new Date() < new Date(properties.date1);
  const sur1 = new Date() > new Date(properties.date1) && new Date() < new Date(properties.date2);
  const sur2 = new Date() > new Date(properties.date2) && new Date() < new Date(properties.date3);

  return (pre && !hasTrialProgram && (LMI_PAYMENT_AMOUNT === `${properties.priceBase1}.00` ||
                               LMI_PAYMENT_AMOUNT === `${properties.priceTrial1}.00`)) ||
  (pre && hasTrialProgram && LMI_PAYMENT_AMOUNT === `${properties.priceTrial1Pre}.00`) ||
  (sur1 && !hasTrialProgram && (LMI_PAYMENT_AMOUNT === `${properties.priceBase2}.00` ||
                                LMI_PAYMENT_AMOUNT === `${properties.priceTrial2}.00`)) ||
  (sur1 && hasTrialProgram && ((LMI_PAYMENT_AMOUNT === `${properties.priceTrial0Sur1}.00` && hasTrialProgram.free) ||
                               (LMI_PAYMENT_AMOUNT === `${properties.priceTrial1Sur1}.00` && !hasTrialProgram.free &&
                                 (hasTrialProgram.addedAt > new Date(properties.date0) && hasTrialProgram.addedAt < new Date(properties.date1))) ||
                               (LMI_PAYMENT_AMOUNT === `${properties.priceTrial2Sur1}.00` && !hasTrialProgram.free))) ||
  (sur2 && hasTrialProgram && ((LMI_PAYMENT_AMOUNT === `${properties.priceTrial1Sur2}.00` && !hasTrialProgram.free &&
                                (hasTrialProgram.addedAt > new Date(properties.date0) && hasTrialProgram.addedAt < new Date(properties.date1))) ||
                               (LMI_PAYMENT_AMOUNT === `${properties.priceTrial2Sur2}.00` && !hasTrialProgram.free) &&
                                (hasTrialProgram.addedAt > new Date(properties.date1) && hasTrialProgram.addedAt < new Date(properties.date2))));
}

getCurrentPeriod = () => {
  const paymentProgram = Programs.getPaymentProgram();
  const { properties } = paymentProgram;

  return new Date() > new Date(properties.date0) && new Date() < new Date(properties.date1) ? 'pre' :
         new Date() > new Date(properties.date1) && new Date() < new Date(properties.date2) ? 'sur1' :
         new Date() > new Date(properties.date2) && new Date() < new Date(properties.date3) ? 'sur2' : '';
}
