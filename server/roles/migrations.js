// 01.00.07 setup Roles presets
const migrateAt10007 = () => {
  const guestrole = Rolespresets.findOne({"title": "Гость"});
  if (!guestrole) {
    const guestrole = {
      "title": "Гость",
      "rights": {
        "usersmanage": false,
        "mentorassign": false,
        "programsmanage": false,
        "moderator": false,
        "usersviewall": false,
        "usersviewown": false,
        "programsviewall": false,
        "programsviewfree": false,
        "tasksreview": false,
        "tasksassign": false,
        "programstakeall": false,
        "programstakefree": false
      }
    }

    Rolespresets.insert({
      title: guestrole.title,
      rights: guestrole.rights
    });
  }

  const freerole = Rolespresets.findOne({"title": "Зевака"});
  if (!freerole) {
    const freerole = {
      "title": "Зевака",
      "rights": {
        "usersmanage": false,
        "mentorassign": false,
        "programsmanage": false,
        "moderator": false,
        "usersviewall": false,
        "usersviewown": false,
        "programsviewall": true,
        "programsviewfree": true,
        "tasksreview": false,
        "tasksassign": false,
        "programstakeall": false,
        "programstakefree": true
      }
    }

    Rolespresets.insert({
      title: freerole.title,
      rights: freerole.rights
    });
  }

  const paidrole = Rolespresets.findOne({"title": "Rookie"});
  if (!paidrole) {
    const paidrole = {
      "title": "Rookie",
      "rights": {
        "usersmanage": false,
        "mentorassign": false,
        "programsmanage": false,
        "moderator": false,
        "usersviewall": false,
        "usersviewown": true,
        "programsviewall": true,
        "programsviewfree": true,
        "tasksreview": false,
        "tasksassign": false,
        "programstakeall": true,
        "programstakefree": true
      }
    }

    Rolespresets.insert({
      title: paidrole.title,
      rights: paidrole.rights
    });
  }

  const expaidrole = Rolespresets.findOne({"title": "ExRookie"});
  if (!expaidrole) {
    const expaidrole = {
      "title": "ExRookie",
      "rights": {
        "usersmanage": false,
        "mentorassign": false,
        "programsmanage": false,
        "moderator": false,
        "usersviewall": false,
        "usersviewown": false,
        "programsviewall": true,
        "programsviewfree": true,
        "tasksreview": false,
        "tasksassign": false,
        "programstakeall": false,
        "programstakefree": true
      }
    }

    Rolespresets.insert({
      title: expaidrole.title,
      rights: expaidrole.rights
    });
  }

  const captainrole = Rolespresets.findOne({"title": "Капитан"});
  if (!captainrole) {
    const captainrole = {
      "title": "Капитан",
      "rights": {
        "usersmanage": false,
        "mentorassign": false,
        "programsmanage": false,
        "moderator": false,
        "usersviewall": true,
        "usersviewown": true,
        "programsviewall": true,
        "programsviewfree": true,
        "tasksreview": true,
        "tasksassign": false,
        "programstakeall": true,
        "programstakefree": true
      }
    }

    Rolespresets.insert({
      title: captainrole.title,
      rights: captainrole.rights
    });
  }

  const coordinatorrole = Rolespresets.findOne({"title": "Координатор"});
  if (!coordinatorrole) {
    const coordinatorrole = {
      "title": "Координатор",
      "rights": {
        "usersmanage": false,
        "mentorassign": false,
        "programsmanage": false,
        "moderator": false,
        "usersviewall": true,
        "usersviewown": true,
        "programsviewall": false,
        "programsviewfree": false,
        "tasksreview": true,
        "tasksassign": true,
        "programstakeall": true,
        "programstakefree": true
      }
    }

    Rolespresets.insert({
      title: coordinatorrole.title,
      rights: coordinatorrole.rights
    });
  }
};

// 01.00.07 setup Roles presets
Migrations.add({
  version: 10007,
  name: 'setup Roles presets',
  up: migrateAt10007,
});
