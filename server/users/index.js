import setup from './setup';
import publications from './publications';
import methods from './methods';
import migrations from './migrations';
import jobs from './jobs';

export default function () {
  setup();
  publications();
  methods();
  migrations();
  jobs();
}
