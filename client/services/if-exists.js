angular.module('bubliq').factory('ifExists', function() {
  return (obj, str) => {
    if (typeof obj !== 'object') return false;

    const props = str.split('.');

    let value;
    for (let i = 0; i < props.length; i++ ) {
      const prop = props[i];

      value = value ? value[prop] : obj[prop];

      if (value === undefined) {
          return false;
      }
    }

    return value;
  }
});
