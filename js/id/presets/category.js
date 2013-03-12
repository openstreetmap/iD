iD.presets.Category = function(category, all) {
    category = _.clone(category);

    category.members = iD.presets.Collection(category.members.map(function(name) {
        return all.item(name);
    }));

    category.matchType = function(entity, resolver) {
        return category.match.type.indexOf(entity.geometry(resolver)) >= 0;
    };

    category.matchTags = function() { return false; };

    return category;
};
