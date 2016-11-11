EmailCheck = Match.Where(function(str) {
  check(str, String);
  const regexp = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return regexp.test(str);
});
