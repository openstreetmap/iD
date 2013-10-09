iD.svg.TagClasses = function() {
    var primary = [
            'highway', 'railway', 'waterway', 'aeroway', 'motorway',
            'power', 'amenity', 'natural', 'landuse', 'building', 'leisure',
            'place', 'boundary'
        ],
        secondary = [
            'oneway', 'bridge', 'tunnel', 'construction'
        ],
        tagClassRe = /^tag-/,
        tags = function(entity) { return entity.tags; };

    var tagClasses = function(selection) {
        selection.each(function tagClassesEach(entity) {
            var classes, value = this.className;

            if (value.baseVal !== undefined) value = value.baseVal;

            classes = value.trim().split(/\s+/).filter(function(name) {
                return name.length && !tagClassRe.test(name);
            }).join(' ');

            var t = tags(entity), i, k, v;

            for (i = 0; i < primary.length; i++) {
                k = primary[i];
                v = t[k];
                if (!v || v === 'no') continue;
                classes += ' tag-' + k + ' tag-' + k + '-' + v;
                break;
            }

            for (i = 0; i < secondary.length; i++) {
                k = secondary[i];
                v = t[k];
                if (!v || v === 'no') continue;
                classes += ' tag-' + k + ' tag-' + k + '-' + v;
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
