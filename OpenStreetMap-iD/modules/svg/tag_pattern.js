
// Patterns only work in Firefox when set directly on element.
// (This is not a bug: https://bugzilla.mozilla.org/show_bug.cgi?id=750632)
var patterns = {
    // tag - pattern name
    // -or-
    // tag - value - pattern name
    // -or-
    // tag - value - rules (optional tag-values, pattern name)
    // (matches earlier rules first, so fallback should be last entry)
    amenity: {
        grave_yard: 'cemetery',
        fountain: 'water_standing'
    },
    landuse: {
        cemetery: [
            { religion: 'christian', pattern: 'cemetery_christian' },
            { religion: 'buddhist', pattern: 'cemetery_buddhist' },
            { religion: 'muslim', pattern: 'cemetery_muslim' },
            { religion: 'jewish', pattern: 'cemetery_jewish' },
            { pattern: 'cemetery' }
        ],
        construction: 'construction',
        farmland: 'farmland',
        farmyard: 'farmyard',
        forest: [
            { leaf_type: 'broadleaved', pattern: 'forest_broadleaved' },
            { leaf_type: 'needleleaved', pattern: 'forest_needleleaved' },
            { leaf_type: 'leafless', pattern: 'forest_leafless' },
            { pattern: 'forest' } // same as 'leaf_type:mixed'
        ],
        grave_yard: 'cemetery',
        grass: 'grass',
        landfill: 'landfill',
        meadow: 'meadow',
        military: 'construction',
        orchard: 'orchard',
        quarry: 'quarry',
        vineyard: 'vineyard'
    },
    leisure: {
        horse_riding: 'farmyard'
    },
    natural: {
        beach: 'beach',
        grassland: 'grass',
        sand: 'beach',
        scrub: 'scrub',
        water: [
            { water: 'pond', pattern: 'pond' },
            { water: 'reservoir', pattern: 'water_standing' },
            { pattern: 'waves' }
        ],
        wetland: [
            { wetland: 'marsh', pattern: 'wetland_marsh' },
            { wetland: 'swamp', pattern: 'wetland_swamp' },
            { wetland: 'bog', pattern: 'wetland_bog' },
            { wetland: 'reedbed', pattern: 'wetland_reedbed' },
            { pattern: 'wetland' }
        ],
        wood: [
            { leaf_type: 'broadleaved', pattern: 'forest_broadleaved' },
            { leaf_type: 'needleleaved', pattern: 'forest_needleleaved' },
            { leaf_type: 'leafless', pattern: 'forest_leafless' },
            { pattern: 'forest' } // same as 'leaf_type:mixed'
        ]
    },
    golf: {
        green: 'golf_green',
        tee: 'grass',
        fairway: 'grass',
        rough: 'scrub'
    },
    surface: {
        grass: 'grass',
        sand: 'beach'
    }
};

export function svgTagPattern(tags) {
    // Skip pattern filling if this is a building (buildings don't get patterns applied)
    if (tags.building && tags.building !== 'no') {
        return null;
    }

    for (var tag in patterns) {
        var entityValue = tags[tag];
        if (!entityValue) continue;

        if (typeof patterns[tag] === 'string') { // extra short syntax (just tag) - pattern name
            return 'pattern-' + patterns[tag];
        } else {
            var values = patterns[tag];
            for (var value in values) {
                if (entityValue !== value) continue;

                var rules = values[value];
                if (typeof rules === 'string') { // short syntax - pattern name
                    return 'pattern-' + rules;
                }

                // long syntax - rule array
                for (var ruleKey in rules) {
                    var rule = rules[ruleKey];

                    var pass = true;
                    for (var criterion in rule) {
                        if (criterion !== 'pattern') { // reserved for pattern name
                            // The only rule is a required tag-value pair
                            var v = tags[criterion];
                            if (!v || v !== rule[criterion]) {
                                pass = false;
                                break;
                            }
                        }
                    }

                    if (pass) {
                        return 'pattern-' + rule.pattern;
                    }
                }
            }
        }
    }

    return null;
}
