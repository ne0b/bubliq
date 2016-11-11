getSearchQuery = (searchString) => {
  let searchQuery = {};

  if (searchString && searchString.length > 0) {
    let searchArray = [];

    searchString.split(' ').forEach((s) => {
      const searchObject = {
        '$regex': '.*' + s || '' + '.*',
        '$options': 'i'
      };
      searchArray.push({
        $or: [{
          "emails.address": searchObject
        }, {
          "profile.name": searchObject
        }, {
          "profile.lastname": searchObject
        }]
      });
    });

    searchQuery = {
      $and: searchArray
    };
  }

  return searchQuery;
}
