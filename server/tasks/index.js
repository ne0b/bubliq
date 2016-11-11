import setup from './setup';
import publications from './publications';
import methods from './methods';
import migrations from './migrations';
import jobs from './jobs';
import observers from './observers';

export default function () {
  setup();
  publications();
  methods();
  migrations();
  jobs();
  observers();
}
