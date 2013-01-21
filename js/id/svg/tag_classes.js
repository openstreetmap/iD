iD.svg.TagClasses = function() {
    var keys = iD.util.trueObj([
        'highway', 'railway', 'waterway', 'power', 'motorway', 'amenity',
        'natural', 'landuse', 'building', 'oneway', 'bridge', 'boundary',
        'leisure', 'construction'
    ]), tagClassRe = /^tag-/;

    return function tagClassesSelection(selection) {
        selection.each(function tagClassesEach(d, i) {
            var classes, value = this.className;

            if (value.baseVal !== undefined) value = value.baseVal;

            classes = value.trim().split(/\s+/).filter(function(name) {
                return name.length && !tagClassRe.test(name);
            }).join(' ');

            var tags = d.tags;
            for (var k in tags) {
                if (!keys[k]) continue;
                classes += ' tag-' + k + ' ' +
                    'tag-' + k + '-' + tags[k];
            }

            classes = classes.trim();

            if (classes !== value) {
                d3.select(this).attr('class', classes);
            }
        });
    };
};
