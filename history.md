#### HLog

##### Logger cheat sheet
* `Logger.log(type, section, message, info)`
* `Logger.error(section, message, info)` type=ERROR
* `Logger.info(section, message, info)` type=INFO
* `Logger.warning(section, message, info)` type=WARNING
* `Logger.success(section, message, info)` type=SUCCESS

* `Logger.define(defaultSection, defaultInfo)`
* `  LoggerDefinition.log(type, message, info)` section=defaultSection info.extend(defaultInfo)
* `  LoggerDefinition.error(message, info)` type=ERROR section=defaultSection info.extend(defaultInfo)
* `  LoggerDefinition.info(message, info)` type=INFO section=defaultSection info.extend(defaultInfo)
* `  LoggerDefinition.warning(message, info)` type=WARNING section=defaultSection info.extend(defaultInfo)
* `  LoggerDefinition.success(message, info)` type=SUCCESS section=defaultSection info.extend(defaultInfo)

##### upgrade to Meteor 1.3.5.1
1. Clear current cache: $pojectRoot `cd .meteor/local` then `rm -rf !(db)`
2. Update npm deps and reconfig Dev deps: $pojectRoot `npm prune --production && npm i`
3. Update Meteor: $pojectRoot `meteor update --release METEOR@1.3.5.1`
4. Start and update Meteor deps: $pojectRoot `meteor` or `npm start`

##### Meteor 1.3.5.1
1. Project folders named config, develop, production, stage now has a dot (.) in names. It allows Meteor bundler not to watch and not to include them while running.
2. A lot of Meteor packages depricated
3. .env files depricated
4. Folders named tests, .gagarin removed
5. All deps for `meteorhacks:npm` and `npm-container` are depricated and removed. Remove local folders and files if necessary
6. Most of Meteor.settings moved from public to root (private)
7. Node is up to *0.10.46*

##### Meteor 1.3.5.1 Deploy
1. Remove old Mup and Mupc: `sudo npm remove mup mupc -g`
2. Install fresh Mupc: `sudo npm i mupc -g`
3. Make sure you have `mupc.json` files in deployment project folder (i.e. .stage/mupc.json)
4. Make sure you set up correct Node version `nodeVersion: 0.10.46`
5. Deploy the app as for Mup

##### v1.02.00 (010200)
1. Migrations added
2. To migrate to prim version set ```migrateTo: "<[rerun|]version>"``` into settings.json. Otherwise migrates to the latest
3. SyncedCron started after Migrations due to data consistens issues
4. Added ```server/main.js``` as an application entry point
5. Meteor settings could contain ```MIGRATION``` field. Causes to remigrate on provided version
6. Migration control automatically unblocks while startup
