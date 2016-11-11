import {GivenTasks} from '/model/giventasks';

export default function () {
  GivenTasks._ensureIndex({userId: 1}, {background: true});
  GivenTasks._ensureIndex({streamId: 1}, {background: true});
  GivenTasks._ensureIndex({taskId: 1}, {background: true});
  GivenTasks._ensureIndex({programId: 1}, {background: true});
  GivenTasks._ensureIndex({createdAt: 1}, {background: true});
}
