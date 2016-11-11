Meteor.methods({
  editRolePreset: function(rolepreset) {
    check(rolepreset, Object);

    if (!Roles.userIsInRole(this.userId, ['users-manage'])) {
      throw new Meteor.Error('not-authorized');
    }
    this.unblock();

    const newValues = {
      title: rolepreset.title,
      weight: rolepreset.weight,
      rights: rolepreset.rights
    };

    const rolepresetDB = Rolespresets.findOne({
      _id: rolepreset._id
    });
    if (rolepresetDB) {
      Rolespresets.update(rolepresetDB, {
        $set: newValues
      });
    } else {
      Rolespresets.insert(newValues);
    }
  },
  deleteRolePreset: function(rolepresetId) {
    check(rolepresetId, String);

    if (!Roles.userIsInRole(this.userId, ['users-manage'])) {
      throw new Meteor.Error('not-authorized');
    }
    this.unblock();

    Rolespresets.remove(rolepresetId);
  }
});
