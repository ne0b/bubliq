
recountUsersAnswers = (userId) => {
  const answersCount = Answers.find({ userId: userId, read: false }).count();

  setUsersCounter(userId, 'newAnswersCount', answersCount);
}
