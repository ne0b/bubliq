import configSyncedCron from './syncedcron';
import configMigrations from './migrations';

export default function () {
	configSyncedCron();
	configMigrations();
}
