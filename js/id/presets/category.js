iD.presets.Category = function(category, all) {
    category = _.clone(category);

    category.members = iD.presets.Collection(category.members.map(function(id) {
        return all.item(id);
    }));

    category.matchGeometry = function(entity, resolver) {
        return category.geometry.indexOf(entity.geometry(resolver)) >= 0;
    };

    category.matchTags = function() { return false; };

    category.name = function() {
        return category.id;
    };

    category.terms = function() {
        return [];
    };

    return category;
};
