import observers from './observers';
import publications from './publications';
import migrations from './migrations';

export default function () {
  observers();
  publications();
  migrations();
}
