emailAllowedCheck = (email) => {
  return !process.env.LIMIT_EMAIL_DELIVERY_TO ||
    (process.env.LIMIT_EMAIL_DELIVERY_TO &&
      process.env.LIMIT_EMAIL_DELIVERY_TO.split(',').indexOf(email) !== -1)
}
