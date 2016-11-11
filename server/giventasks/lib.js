
export const subscribeUserToGivenTask = (taskId, userId) => {
  const task = GivenTasks.findOne(taskId, { fields: { subscribers: 1 } });

  if (!task) return;

  let subscribers = task.subscribers || [];
  let result = !subscribers.includes(userId);

  if (subscribers.includes(userId)) {
    subscribers = subscribers.filter((id) => id !== userId);
  }
  else {
    subscribers.push(userId);
  }

  GivenTasks.update(taskId, { $set: { subscribers } });

  return result;
}
