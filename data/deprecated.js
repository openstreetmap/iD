// from http://wiki.openstreetmap.org/wiki/Deprecated_features
// TODO: deal with deprecated 'class' tag
// does not deal with landuse=wood because of indecision
// we will not care about http://taginfo.openstreetmap.org/tags/bicycle_parking=sheffield
iD.data.deprecated = [
    {
        old: { barrier: 'wire_fence' },
        replace: {
            barrier: 'fence',
            fence_type: 'chain'
        }
    },
    {
        old: { barrier: 'wood_fence' },
        replace: {
            barrier: 'fence',
            fence_type: 'wood'
        }
    },
    {
        old: { highway: 'ford' },
        replace: {
            ford: 'yes'
        }
    },
    {
        old: { highway: 'ford' },
        replace: {
            ford: 'yes'
        }
    },
    {
        old: { highway: 'ford' },
        replace: {
            ford: 'yes'
        }
    },
    {
        old: { highway: 'stile' },
        replace: {
            barrier: 'stile'
        }
    },
    {
        old: { highway: 'incline' },
        replace: {
            highway: 'road',
            incline: 'up'
        }
    },
    {
        old: { highway: 'incline_steep' },
        replace: {
            highway: 'road',
            incline: 'up'
        }
    },
    {
        old: { highway: 'unsurfaced' },
        replace: {
            highway: 'road',
            incline: 'unpaved'
        }
    },
    {
        old: { highway: 'unsurfaced' },
        replace: {
            highway: 'road',
            incline: 'unpaved'
        }
    },
    {
        old: { landuse: 'wood' },
        replace: {
            highway: 'road',
            incline: 'unpaved'
        }
    },
    {
        old: { natural: 'marsh' },
        replace: {
            natural: 'wetland',
            wetland: 'marsh'
        }
    },
    {
        old: { shop: 'organic' },
        replace: {
            shop: 'supermarket',
            organic: 'only'
        }
    },
    {
        old: { power_source: '*' },
        replace: {
            'generator:source': '$1'
        }
    },
    {
        old: { power_rating: '*' },
        replace: {
            'generator:output': '$1'
        }
    },
    {
        old: { bicycle_parking: 'organic' },
        replace: {
            shop: 'supermarket',
            organic: 'only'
        }
    }
];
