iD.svg.TagClasses = function() {
    var keys = iD.util.trueObj([
        'highway', 'railway', 'motorway', 'amenity', 'natural',
        'landuse', 'building', 'oneway', 'bridge'
    ]), tagClassRe = /^tag-/;

    return function tagClassesSelection(selection) {
        selection.each(function tagClassesEach(d, i) {
            var classes, value = this.className;

            if (value.baseVal !== undefined) value = value.baseVal;

            classes = value.trim().split(/\s+/).filter(function(name) {
                return name.length && !tagClassRe.test(name);
            });

            var tags = d.tags;
            for (var k in tags) {
                if (!keys[k]) continue;
                classes.push('tag-' + k);
                classes.push('tag-' + k + '-' + tags[k]);
            }

            return d3.select(this).attr('class', classes.join(' '));
        });
    };
};
