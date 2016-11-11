import migrations from './migrations';
import methods from './methods';
import publications from './publications';
import observers from './observers';

export default function () {
  migrations();
  methods();
  publications();
  observers();
}
