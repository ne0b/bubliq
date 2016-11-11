import migrations from './migrations';
import methods from './methods';
import publications from './publications';

export default function () {
  migrations();
  methods();
  publications();
}
