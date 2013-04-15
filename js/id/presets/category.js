iD.presets.Category = function(id, category, all) {
    category = _.clone(category);

    category.id = id;

    category.members = iD.presets.Collection(category.members.map(function(id) {
        return all.item(id);
    }));

    category.matchGeometry = function(entity, resolver) {
        return category.geometry.indexOf(entity.geometry(resolver)) >= 0;
    };

    category.matchTags = function() { return false; };

    category.name = function() {
        return t('presets.categories.' + id + '.name', {'default': id});
    };

    category.terms = function() {
        return [];
    };

    return category;
};
