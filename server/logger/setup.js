import {Meteor} from 'meteor/meteor';
import {Logger} from '/model/logger';

// CHEAT SHEET
// Logger.log(type, section, message, info)
// Logger.error(section, message, info), type=ERROR
// Logger.info(section, message, info), type=INFO
// Logger.warning(section, message, info), type=WARNING
// Logger.success(section, message, info), type=SUCCESS
//
// Logger.define(defaultSection, defaultInfo)
//  LoggerDefinition.log(type, message, info), section=defaultSection info.extend(defaultInfo)
//  LoggerDefinition.error(message, info), type=ERROR section=defaultSection info.extend(defaultInfo)
//  LoggerDefinition.info(message, info), type=INFO section=defaultSection info.extend(defaultInfo)
//  LoggerDefinition.warning(message, info), type=WARNING section=defaultSection info.extend(defaultInfo)
//  LoggerDefinition.success(message, info), type=SUCCESS section=defaultSection info.extend(defaultInfo)

/**
 * Adds new log record
 * @param  {String}  type     Record type [ERROR, INFO, WARNING, SUCCESS], INFO by default
 * @param  {String}  section  Section filter for log (i.e. 'aoo', 'payment', 'chats')
 * @param  {String}  message  Message (optional)
 * @param  {Object}  info     Addinional data info
 * @return  {Void}  none
 */
Logger.log = (type, section, message, info = {}) => {
  const defferedType = Logger.TYPES[(type || '').toUpperCase()] || Logger.TYPES.INFO;
  const data = {
    info,
    section: section || 'app',
    type: defferedType,
    message: message || 'no message provided',
    createdAt: new Date(),
  };
  return Logger.insert(data, () => {});
};

/**
 * Logger Class definition
 */
class LoggerDefinition {
  constructor(section, info = {}) {
    this.section = section;
    this.extInfo = info;

    this.log = (type, message, internalInfo = {}) => {
      Logger.log(type, this.section, message, _.extend(this.extInfo, internalInfo));
    };

    _.each(Logger.TYPES, (type) => {
      this[type.toLowerCase()] = (message, internalInfo) => {
        this.log(type, message, internalInfo);
      };
    });
  }
}

/**
 * Defines new LoggerDefinition. Works the same as Logger but with predefined Section and Info
 * @param  {String}  section  Section filter
 * @param  {Object}  info     Additional info
 * @return  {Void}  none
 */
Logger.define = (section, info) => {
  return new LoggerDefinition(section, info);
};


export default function () {
  Logger._ensureIndex({type: 1, section: 1, createdAt: 1}, {background: true});

  _.each(Logger.TYPES, (type) => {
    Logger[type.toLowerCase()] = (section, message, info) => {
      Logger.log(type, message, info);
    };
  });
}
