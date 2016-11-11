Programs.getCurrent = () => {
  return _.find(_.values(Programs._cache), (program) => program.properties.isCurrent);
}

Programs.getNext = () => {
  return _.find(_.values(Programs._cache), (program) => program.properties.isNext);
}

Programs.getPaymentProgram = () => {
  const currentProgram = Programs.getCurrent();
  const nextProgram = Programs.getNext();

  return new Date() > new Date(nextProgram.properties.date0) ? nextProgram : currentProgram;
}
