// an index of tag -> marker image combinations, taken from
// http://svn.openstreetmap.org/applications/rendering/mapnik/inc/layer-amenity-symbols.xml.inc
iD._markers = [
    {
        tags: { aeroway: 'helipad' },
        icon: 'helipad'
    },
    {
        tags: { aeroway: 'airport' },
        icon: 'airport'
    },
    {
        tags: { aeroway: 'aerodrome' },
        icon: 'aerodrome'
    },
    {
        tags: { railway: 'level_crossing' },
        icon: 'level_crossing'
    },
    {
        tags: { man_made: 'lighthouse' },
        icon: 'lighthouselevel_crossing'
    },
    {
        tags: { natural: 'peak' },
        icon: 'peak'
    },
    {
        tags: { natural: 'volcano' },
        icon: 'volcano'
    },
    {
        tags: { natural: 'cave_entrance' },
        icon: 'poi_cave'
    },
    {
        tags: { natural: 'spring' },
        icon: 'spring'
    },
    {
        tags: { natural: 'tree' },
        icon: 'tree'
    },
    {
        tags: {
            power: 'generator',
            'generator:source': 'wind'
        },
        icon: 'power_wind'
    },
    {
        tags: {
            power: 'generator',
            power_source: 'wind'
        },
        icon: 'power_wind'
    },
    {
        tags: {
            man_made: 'power_wind'
        },
        icon: 'power_wind'
    },
    {
        tags: {
            man_made: 'windmill'
        },
        icon: 'windmill'
    },
    {
        tags: {
            man_made: 'mast'
        },
        icon: 'communications'
    },
    {
        tags: {
            highway: 'mini_roundabout'
        },
        icon: 'mini_roundabout'
    },
    {
        tags: {
            highway: 'gate'
        },
        icon: 'gate2'
    },
    {
        tags: {
            barrier: 'gate'
        },
        icon: 'gate2'
    },
    {
        tags: {
            barrier: 'lift_gate'
        },
        icon: 'liftgate'
    },
    {
        tags: {
            barrier: 'bollard'
        },
        icon: 'bollard'
    },
    {
        tags: {
            barrier: 'block'
        },
        icon: 'bollard'
    },
    {
        "icon": "alpinehut",
        "tags": {
            "tourism": "alpine_hut"
        }
    },
    {
        "icon": "shelter2",
        "tags": {
            "amenity": "shelter"
        }
    },
    {
        "icon": "atm2",
        "tags": {
            "amenity": "atm"
        }
    },
    {
        "icon": "bank2",
        "tags": {
            "amenity": "bank"
        }
    },
    {
        "icon": "bar",
        "tags": {
            "amenity": "bar"
        }
    },
    {
        "icon": "rental_bicycle",
        "tags": {
            "amenity": "bicycle_rental"
        }
    },
    {
        "icon": "bus_stop_small",
        "tags": {
            "amenity": "bus_stop"
        }
    },
    {
        "icon": "bus_stop",
        "tags": {
            "amenity": "bus_stop"
        }
    },
    {
        "icon": "bus_station",
        "tags": {
            "amenity": "bus_station"
        }
    },
    {
        "icon": "traffic_light",
        "tags": {
            "highway": "traffic_signals"
        }
    },
    {
        "icon": "cafe",
        "tags": {
            "amenity": "cafe"
        }
    },
    {
        "icon": "camping",
        "tags": {
            "tourism": "camp_site"
        }
    },
    {
        "icon": "transport_ford",
        "tags": {
            "highway": "ford"
        }
    },
    {
        "icon": "caravan_park",
        "tags": {
            "tourism": "caravan_site"
        }
    },
    {
        "icon": "car_share",
        "tags": {
            "amenity": "car_sharing"
        }
    },
    {
        "icon": "chalet",
        "tags": {
            "tourism": "chalet"
        }
    },
    {
        "icon": "cinema",
        "tags": {
            "amenity": "cinema"
        }
    },
    {
        "icon": "firestation",
        "tags": {
            "amenity": "fire_station"
        }
    },
    {
        "icon": "fuel",
        "tags": {
            "amenity": "fuel"
        }
    },
    {
        "icon": "guest_house",
        "tags": {
            "tourism": "guest_house"
        }
    },
    {
        "icon": "bandb",
        "tags": {
            "tourism": "bed_and_breakfast"
        }
    },
    {
        "icon": "hospital",
        "tags": {
            "amenity": "hospital"
        }
    },
    {
        "icon": "hostel",
        "tags": {
            "tourism": "hostel"
        }
    },
    {
        "icon": "hotel2",
        "tags": {
            "tourism": "hotel"
        }
    },
    {
        "icon": "motel",
        "tags": {
            "tourism": "motel"
        }
    },
    {
        "icon": "information",
        "tags": {
            "tourism": "information"
        }
    },
    {
        "icon": "embassy",
        "tags": {
            "amenity": "embassy"
        }
    },
    {
        "icon": "library",
        "tags": {
            "amenity": "library"
        }
    },
    {
        "icon": "amenity_court",
        "tags": {
            "amenity": "courthouse"
        }
    },
    {
        "icon": "lock_gate",
        "tags": {
            "waterway": "lock"
        }
    },
    {
        "icon": "communications",
        "tags": {
            "man_made": "mast"
        }
    },
    {
        "icon": "museum",
        "tags": {
            "tourism": "museum"
        }
    },
    {
        "icon": "parking",
        "tags": {
            "amenity": "parking"
        }
    },
    {
        "icon": "parking_private",
        "tags": {
            "amenity": "parking"
        }
    },
    {
        "icon": "pharmacy",
        "tags": {
            "amenity": "pharmacy"
        }
    },
    {
        "icon": "christian3",
        "tags": {
            "amenity": "place_of_worship"
        }
    },
    {
        "icon": "islamic3",
        "tags": {
            "amenity": "place_of_worship"
        }
    },
    {
        "icon": "sikh3",
        "tags": {
            "amenity": "place_of_worship"
        }
    },
    {
        "icon": "jewish3",
        "tags": {
            "amenity": "place_of_worship"
        }
    },
    {
        "icon": "place_of_worship3",
        "tags": {
            "amenity": "place_of_worship"
        }
    },
    {
        "icon": "police",
        "tags": {
            "amenity": "police"
        }
    },
    {
        "icon": "post_box",
        "tags": {
            "amenity": "post_box"
        }
    },
    {
        "icon": "post_office",
        "tags": {
            "amenity": "post_office"
        }
    },
    {
        "icon": "pub",
        "tags": {
            "amenity": "pub"
        }
    },
    {
        "icon": "biergarten",
        "tags": {
            "amenity": "biergarten"
        }
    },
    {
        "icon": "recycling",
        "tags": {
            "amenity": "recycling"
        }
    },
    {
        "icon": "restaurant",
        "tags": {
            "amenity": "restaurant"
        }
    },
    {
        "icon": "fast_food",
        "tags": {
            "amenity": "fast_food"
        }
    },
    {
        "icon": "telephone",
        "tags": {
            "amenity": "telephone"
        }
    },
    {
        "icon": "sosphone",
        "tags": {
            "amenity": "emergency_phone"
        }
    },
    {
        "icon": "theatre",
        "tags": {
            "amenity": "theatre"
        }
    },
    {
        "icon": "toilets",
        "tags": {
            "amenity": "toilets"
        }
    },
    {
        "icon": "food_drinkingtap",
        "tags": {
            "amenity": "drinking_water"
        }
    },
    {
        "icon": "amenity_prison",
        "tags": {
            "amenity": "prison"
        }
    },
    {
        "icon": "view_point",
        "tags": {
            "tourism": "viewpoint"
        }
    },
    {
        "icon": "tower_water",
        "tags": {
            "man_made": "water_tower"
        }
    },
    {
        "icon": "tourist_memorial",
        "tags": {
            "historic": "memorial"
        }
    },
    {
        "icon": "tourist_archaeological2",
        "tags": {
            "historic": "archaeological_site"
        }
    },
    {
        "icon": "shop_supermarket",
        "tags": {
            "shop": "supermarket"
        }
    },
    {
        "icon": "shop_bakery",
        "tags": {
            "shop": "bakery"
        }
    },
    {
        "icon": "shop_butcher",
        "tags": {
            "shop": "butcher"
        }
    },
    {
        "icon": "shop_clothes",
        "tags": {
            "shop": "clothes"
        }
    },
    {
        "icon": "shop_convenience",
        "tags": {
            "shop": "convenience"
        }
    },
    {
        "icon": "department_store",
        "tags": {
            "shop": "department_store"
        }
    },
    {
        "icon": "shop_diy",
        "tags": {
            "shop": "doityourself"
        }
    },
    {
        "icon": "florist",
        "tags": {
            "shop": "florist"
        }
    },
    {
        "icon": "shop_hairdresser",
        "tags": {
            "shop": "hairdresser"
        }
    },
    {
        "icon": "shopping_car",
        "tags": {
            "shop": "car"
        }
    },
    {
        "icon": "shopping_car_repair",
        "tags": {
            "shop": "car_repair"
        }
    },
    {
        "icon": "shopping_bicycle",
        "tags": {
            "shop": "bicycle"
        }
    },
    {
        "icon": "playground",
        "tags": {
            "leisure": "playground"
        }
    },
    {
        "icon": "picnic",
        "tags": {
            "amenity": "picnic_site"
        }
    },
    {
        "icon": "transport_slipway",
        "tags": {
            "leisure": "slipway"
        }
    }
];

// generate a fast lookup table for marker styling
iD._markertable = (function(markers) {
    var table = {};
    for (var i = 0; i < markers.length; i++) {
        var marker = markers[i];
        // single-tag matches, the easy case
        if (Object.keys(marker.tags).length === 1) {
            for (var k in marker.tags) {
                var key = k + '=' + marker.tags[k];
                table[key] = marker.icon;
            }
        }
    }
    return table;
})(iD._markers);
