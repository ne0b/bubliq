import {Meteor} from 'meteor/meteor';
import {Migrations} from 'meteor/percolate:migrations';

export default function () {
  Migrations.config({
    log: Meteor.isDevelopment,
  });

  Migrations.start = () => {
    const MigrationStore = Migrations._collection;
    const nextVersion = (Meteor.settings.MIGRATION || 'latest').toLowerCase();

    const lastDBVersion = Migrations.getVersion();
    const lastCodeVersion = (_.max(Migrations._list, (m) => m.version) || {version: 0}).version;

    const lastCurrentVersion = Math.min(lastCodeVersion, lastCodeVersion);

    if (nextVersion === 'reset' || !lastCurrentVersion) {
      Migrations._collection.remove('control');
      return Migrations.migrateTo('latest');
    }

    if (lastDBVersion > lastCodeVersion) {
      MigrationStore.update('control', {$set: {locked: false, version: lastCurrentVersion}});
    }

    if (nextVersion === 'latest') {
      return Migrations.migrateTo('latest');
    }

    try {
      const nextVersionInt = parseInt(nextVersion, 0);
      const hasCodeVersion = _.some(Migrations._list, (m) => m.version === nextVersionInt);

      if (hasCodeVersion && nextVersionInt) {
        return Migrations.migrateTo(nextVersionInt);
      }
    } catch (e) {
      return Migrations.migrateTo('latest');
    }
  };
}
