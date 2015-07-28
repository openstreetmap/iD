iD.svg.TagClasses = function() {
    var primaries = [
            'building', 'highway', 'railway', 'waterway', 'aeroway',
            'motorway', 'boundary', 'power', 'amenity', 'natural', 'landuse',
            'leisure', 'place'
        ],
        statuses = [
            'proposed', 'construction', 'disused', 'abandoned', 'dismantled',
            'razed', 'demolished', 'obliterated'
        ],
        secondaries = [
            'oneway', 'bridge', 'tunnel', 'embankment', 'cutting', 'barrier'
        ],
        tagClassRe = /^tag-/,
        tags = function(entity) { return entity.tags; };


    var tagClasses = function(selection) {
        selection.each(function tagClassesEach(entity) {
            var value = this.className,
                classes, primary, status;

            if (value.baseVal !== undefined) value = value.baseVal;

            classes = value.trim().split(/\s+/).filter(function(name) {
                return name.length && !tagClassRe.test(name);
            }).join(' ');

            var t = tags(entity), i, k, v;

            // pick at most one primary classification tag..
            for (i = 0; i < primaries.length; i++) {
                k = primaries[i];
                v = t[k];
                if (!v || v === 'no') continue;

                primary = k;
                if (statuses.indexOf(v) !== -1) {   // e.g. `railway=abandoned`
                    status = v;
                    classes += ' tag-' + k;
                } else {
                    classes += ' tag-' + k + ' tag-' + k + '-' + v;
                }

                break;
            }

            // add at most one ephemeral status tag, only if relates to primary tag..
            if (!status) {
                for (i = 0; i < statuses.length; i++) {
                    k = statuses[i];
                    v = t[k];
                    if (!v || v === 'no') continue;

                    if (v === 'yes') {   // e.g. `railway=rail + abandoned=yes`
                        status = k;
                    }
                    else if (primary && primary === v) {  // e.g. `railway=rail + abandoned=railway`
                        status = k;
                    } else if (!primary && primaries.indexOf(v) !== -1) {  // e.g. `abandoned=railway`
                        status = k;
                        primary = v;
                        classes += ' tag-' + v;
                    }  // else ignore e.g.  `highway=path + abandoned=railway`

                    if (status) break;
                }
            }

            if (status) {
                classes += ' tag-ephemeral';
            }

            // add any secondary (structure) tags
            for (i = 0; i < secondaries.length; i++) {
                k = secondaries[i];
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
