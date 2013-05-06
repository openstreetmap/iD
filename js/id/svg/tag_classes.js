iD.svg.TagClasses = function() {
    var keys = d3.set([
        'highway', 'railway', 'waterway', 'power', 'motorway', 'amenity',
        'natural', 'landuse', 'building', 'oneway', 'bridge', 'boundary',
        'tunnel', 'leisure', 'construction', 'place', 'aeroway'
    ]), tagClassRe = /^tag-/,
        tags = function(entity) { return entity.tags; };

    var tagClasses = function(selection) {
        selection.each(function tagClassesEach(entity) {
            var classes, value = this.className;

            if (value.baseVal !== undefined) value = value.baseVal;

            classes = value.trim().split(/\s+/).filter(function(name) {
                return name.length && !tagClassRe.test(name);
            }).join(' ');

            var t = tags(entity);
            for (var k in t) {
                if (!keys.has(k)) continue;
                classes += ' tag-' + k + ' tag-' + k + '-' + t[k];
            }

            classes = classes.trim();

            if (classes !== value) {
                d3.select(this).attr('class', classes);
            }
        });
    };

    tagClasses.tags = function(_) {
        if (!arguments.length) return tags;
        tags = _;
        return tagClasses;
    };

    return tagClasses;
};
