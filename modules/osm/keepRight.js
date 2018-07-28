var keepRightSchema = {
        'schema': '',
        'error_id': 0,
        'error_type': 0,
        'error_name': 0,
        'object_type': ['node',
'way',
'relation'],
        'object_id': 0,
        'state': ['new',
'reopened',
'ignore_temporarily',
'ignore'],
        'first_occurrence': new Date(),
        'last_checked': new Date(),
        'object_timestamp': new Date(),
        'user_name': '',
        'lat': 0,
        'lon': 0,
        'comment': '',
        'comment_timestamp': new Date(),
        'msgid': '',
        'txt1': '',
        'txt2': '',
        'txt3': '',
        'txt4': '',
        'txt5': ''
    };

    var errorSchema = {
        errors: {
            0: {
                errorType: 0,
                errorName: '',
                message: '',
                subTypes: {}
            },
            30: {
                errorType: 30,
                errorName: 'non_closed_areas',
                message: 'This way is tagged with \'$1=$2\' and should be closed-loop',
                subTypes: {}
            },
            40: {
                errorType: 40,
                errorName: 'dead ended oneways',
                message: 'The first node (id $1) of this one-way is not connected to any other way',
                subTypes: {
                    41: {
                        errorType: 41,
                        errorName: '',
                        message: 'The last node (id $1) of this one-way is not connected to any other way'
                    },
                    42: {
                        errorType: 42,
                        errorName: '',
                        message: 'This node cannot be reached, because one-ways only lead away from here'
                    },
                    43: {
                        errorType: 43,
                        errorName: '',
                        message: 'You cannot escape from this node, because one-ways only lead to here'
                    },
                }
            },
            50: {
                errorType: 50,
                errorName: 'almost junctions',
                message: 'This node is very close but not connected to way #$1',
                subTypes: {}
            },
            60: {
                errorType: 60,
                errorName: 'depreciated tags',
                message: 'This $1 uses deprecated tag $2 = $3. Please use $4 instead!',
                subTypes: {}
            },
            70: {
                errorType: 70,
                errorName: 'missing tags',
                message: 'This $1 has an empty tag: $2',
                71: {
                        errorType: 71,
                        errorName: '',
                        message: 'This way has no tags'
                    },
                    72: {
                        errorType: 72,
                        errorName: '',
                        message: 'This node is not member of any way and does not have any tags'
                    }
            },
            90: {
                errorType: 90,
                errorName: 'motorways without ref',
                message: 'This way is tagged as motorway and therefore needs a ref, nat_ref or int_ref tag'
            },
            100: {
                errorType: 100,
                errorName: 'places of worship without religion',
                message: 'This $1 is tagged as place of worship and therefore needs a religion tag'
            },
            110: {
                errorType: 110,
                errorName: 'point of interest without name',
                message: 'This node is tagged as $1 and therefore needs a name tag'
            },
            120: {
                errorType: 120,
                errorName: 'ways without nodes',
                message: 'This way has just one single node'
            },
            130: {
                errorType: 130,
                errorName: 'floating islands',
                message: 'This way is not connected to the rest of the map'
            },
            150: {
                errorType: 150,
                errorName: 'railway crossing without tag',
                message: 'This crossing of a highway and a railway needs to be tagged as railway=crossing or railway=level_crossing'
            },
            160: {
                errorType: 160,
                errorName: 'wrongly used railway tag',
                message: 'There are ways in different layers coming together in this railway crossing. There are ways tagged as tunnel or bridge coming together in this railway crossing'
            },
            170: {
                errorType: 0,
                errorName: 'FIXME tagged items',
                message: '$1'
            },
            180: {
                errorType: 180,
                errorName: 'relations without type',
                message: 'This relation has no type tag, which is mandatory for relations'
            },
            190: {
                errorType: 190,
                errorName: 'intersections without junctions',
                message: 'Finds way crossings on same layer without common node as a junction',
                subtypes: {
                    191: {
                        errorType: 191,
                        errorName: 'highway-highway',
                        message: 'This $1 intersects the $2 #$3 but there is no junction node'
                    },
                    192: {
                        errorType: 192,
                        errorName: 'highway-waterway',
                        message: 'This $1 intersects the $2 #$3'
                    },
                    193: {
                        errorType: 193,
                        errorName: 'highway-riverbank',
                        message: 'This $1 intersects the $2 #$3'
                    },
                    194: {
                        errorType: 194,
                        errorName: 'waterway-waterway',
                        message: 'This $1 intersects the $2 #$3 but there is no junction node'
                    },
                    195: {
                        errorType: 195,
                        errorName: 'cycleway-cycleway',
                        message: 'This $1 intersects the $2 #$3 but there is no junction node'
                    },
                    196: {
                        errorType: 196,
                        errorName: 'highway-cycleway',
                        message: 'This $1 intersects the $2 #$3 but there is no junction node'
                    },
                    197: {
                        errorType: 197,
                        errorName: 'cycleway-waterway',
                        message: 'This $1 intersects the $2 #$3'
                    },
                    198: {
                        errorType: 198,
                        errorName: 'cycleway-riverbank',
                        message: 'This $1 intersects the $2 #$3'
                    }
                }
            },
            200: {
                errorType: 200,
                errorName: 'intersections without junctions',
                message: 'Finds overlapping ways on same layer.',
                subtypes: {
                    201: {
                        errorType: 201,
                        errorName: 'highway-highway',
                        message: 'This $1 overlaps the $2 #$3'
                    },
                    202: {
                        errorType: 202,
                        errorName: 'highway-waterway',
                        message: 'This $1 overlaps the $2 #$3'
                    },
                    203: {
                        errorType: 203,
                        errorName: 'highway-riverbank',
                        message: 'This $1 overlaps the $2 #$3'
                    },
                    204: {
                        errorType: 204,
                        errorName: 'waterway-waterway',
                        message: 'This $1 overlaps the $2 #$3'
                    },
                    205: {
                        errorType: 205,
                        errorName: 'cycleway-cycleway',
                        message: 'This $1 overlaps the $2 #$3'
                    },
                    206: {
                        errorType: 206,
                        errorName: 'highway-cycleway',
                        message: 'This $1 overlaps the $2 #$3'
                    },
                    207: {
                        errorType: 207,
                        errorName: 'cycleway-waterway',
                        message: 'This $1 overlaps the $2 #$3'
                    },
                    208: {
                        errorType: 208,
                        errorName: 'cycleway-riverbank',
                        message: 'This $1 overlaps the $2 #$3'
                    }
                }
            },
            210: {
                errorType: 210,
                errorName: 'loopings',
                message: 'These errors contain self intersecting ways',
                subTypes: {
                    211: {
                        errorType: 211,
                        errorName: '',
                        message: 'This way contains more than one node at least twice. Nodes are $1. This may or may not be an error'
                    },
                    212: {
                        errorType: 212,
                        errorName: '',
                        message: 'This way has only two different nodes and contains one of them more than once'
                    },
                }
            },
            220: {
                errorType: 220,
                errorName: 'misspelled tags',
                message: ' This $1 is tagged \'$2=$3\' where $4 looks like $5',
                subTypes: {
                    221: {
                        errorType: 221,
                        errorName: 'misspelled tags',
                        message: 'The key of this $1\'s tag is \'key\': $2'
                    }
                }
            },
            230: {
                errorType: 230,
                errorName: 'layer conflicts',
                message: '',
                subTypes: {
                    231: {
                        errorType: 231,
                        errorName: 'mixed layers intersection',
                        message: 'This node is a junction of ways on different layers: $1'
                    },
                    232: {
                        errorType: 232,
                        errorName: 'strange layers',
                        message: 'This $1 is tagged with layer $2. This need not be an error, but it looks strange'
                    }
                }
            },
            270: {
                errorType: 270,
                errorName: 'motorways connected directly',
                message: 'This node is a junction of a motorway and a highway other than motorway, motorway_link, trunk, rest_area or construction. Service or unclassified is only valid if it has access=no/private or if it is a service=parking_aisle.'
            },
            280: {
                errorType: 280,
                errorName: 'boundaries',
                message: '',
                subTypes: {
                    281: {
                        errorType: 281,
                        errorName: 'missing name',
                        message: 'This boundary has no name'
                    },
                    282: {
                        errorType: 282,
                        errorName: 'missing admin level',
                        message: 'The boundary of $1 has no valid numeric admin_level. Please do not use admin levels like for example 6;7. Always tag the lowest admin_level of all boundaries.'
                    },
                    283: {
                        errorType: 283,
                        errorName: 'no closed loop',
                        message: 'The boundary of $1 is not closed-loop'
                    },
                    284: {
                        errorType: 284,
                        errorName: 'splitting boundary',
                        message: 'The boundary of $1 splits here'
                    },
                    285: {
                        errorType: 285,
                        errorName: 'admin_level too high',
                        message: 'This boundary-way has admin_level $1 but belongs to a relation with lower admin_level (higher priority); it should have the lowest admin_level of all relations'
                    },
                }
            },
            290: {
                errorType: 290,
                errorName: 'faulty restrictions',
                message: 'Analyses all relations tagged type=restriction or following variations type=restriction:hgv, type=restriction:caravan, type=restriction:motorcar, type=restriction:bus, type=restriction:agricultural, type=restriction:motorcycle, type=restriction:bicycle and type=restriction:hazmat.',
                subTypes: {
                    291: {
                        errorType: 291,
                        errorName: 'missing type',
                        message: 'This turn-restriction has no known restriction type'
                    },
                    292: {
                        errorType: 292,
                        errorName: 'missing from way',
                        message: 'A turn-restriction needs exactly one $1 member. This one has $2'
                    },
                    293: {
                        errorType: 293,
                        errorName: 'missing to way',
                        message: 'A turn-restriction needs exactly one $1 member. This one has $2'
                    },
                    294: {
                        errorType: 294,
                        errorName: 'from or to not a way',
                        message: 'From- and To-members of turn restrictions need to be ways. $1'
                    },
                    295: {
                        errorType: 295,
                        errorName: 'via is not on the way ends',
                        message: 'via (node #$1) is not the first or the last member of from (way #$2)'
                    },
                    296: {
                        errorType: 296,
                        errorName: 'wrong restriction angle',
                        message: 'restriction type is $1, but angle is $2 degrees. Maybe the restriction type is not appropriate?'
                    },
                    297: {
                        errorType: 297,
                        errorName: 'wrong direction of to member',
                        message: 'wrong direction of to way $1'
                    },
                    298: {
                        errorType: 298,
                        errorName: 'already restricted by oneway',
                        message: 'entry already prohibited by oneway tag on $1'
                    },
                }
            },
            310: {
                errorType: 310,
                errorName: 'roundabouts',
                message: 'Analyses ways with tag junction=roundabout. More then one way can form a roundabout. It supports tag oneway=-1.',
                subTypes: {
                    311: {
                        errorType: 311,
                        errorName: 'not closed loop',
                        message: 'This way is part of a roundabout but is not closed-loop. (split carriageways approaching a roundabout should not be tagged as roundabout)'
                    },
                    312: {
                        errorType: 312,
                        errorName: 'wrong direction',
                        message: 'If this roundabout is in a country with right-hand traffic then its orientation goes the wrong way around | If this roundabout is in a country with left-hand traffic then its orientation goes the wrong way around | If this mini_roundabout is in a country with right-hand traffic then its orientation goes the wrong way around | If this mini_roundabout is in a country with left-hand traffic then its orientation goes the wrong way around'
                    },
                    313: {
                        errorType: 313,
                        errorName: 'faintly connected',
                        message: 'This roundabout has only $1 other roads connected. Roundabouts typically have three.'
                    },
                }
            },
            320: {
                errorType: 320,
                errorName: '*link connections',
                message: 'This way is tagged as highway=$1_link but doesn\'t have a connection to any other $1 or $1_link'
            },
            350: {
                errorType: 350,
                errorName: 'bridge tags',
                message: 'This bridge does not have a tag in common with its surrounding ways that shows the purpose of this bridge. There should be one of these tags: $1'
            },
            370: {
                errorType: 370,
                errorName: 'doubled places',
                message: 'This node has tags in common with the surrounding way #$1 and seems to be redundand | This node has tags in common with the surrounding way #$1 (including the name \'$2\') and seems to be redundand'
            },
            380: {
                errorType: 380,
                errorName: 'non-physical use of sportage',
                message: 'This way is tagged $1 but has no physical tag like e.g. leisure, building, amenity or highway'
            },
            400: {
                errorType: 400,
                errorName: 'geometry glitches',
                message: '',
                subTypes: {
                    401: {
                        errorType: 401,
                        errorName: 'missing turn restrictions',
                        message: 'ways $1 and $2 join in a very sharp angle here and there is no oneway tag or turn restriction that prevents turning'
                    },
                    402: {
                        errorType: 402,
                        errorName: 'impossible angles',
                        message: 'this way bends in a very sharp angle here'
                    },
                }
            },
            410: {
                errorType: 410,
                errorName: 'websites',
                message: 'Web pages are analyzed. Web page is defined by any of the following tags website=*, url=*, website:mobile=*, contact:website=*, contact:url=*, image=*, source:website=* or source:url=*.',
                subTypes: {
                    411: {
                        errorType: 411,
                        errorName: 'http error',
                        message: 'The URL (<a target="_blank" href="$1">$1</a>) cannot be opened (HTTP status code $2)'
                    },
                    412: {
                        errorType: 412,
                        errorName: 'domain hijacking',
                        message: 'Possible domain squatting: <a target=\"_blank\" href="$1">$1</a>. Suspicious text is: "$2"'
                    },
                    413: {
                        errorType: 413,
                        errorName: 'non-match',
                        message: 'Content of the URL (<a target=\"_blank\" href="$1">$1</a>) did not contain these keywords: ($2)'
                    },
                }
            }
        },
         warnings: {
             20: {
                errorType: 20,
                errorName: 'multiple nodes on the same spot',
                message: ' There is more than one node in this spot. Offending node IDs: $1'
            },
            60: {
                errorType: 60,
                errorName: '',
                message: ''
            },
            300: {
                errorType: 300,
                errorName: 'missing maxspeed',
                message: 'missing maxspeed tag'
            },
            360: {
                errorType: 360,
                errorName: 'language unknown',
                message: 'It would be nice if this $1 had an additional tag \'name:XX=$2\' where XX shows the language of its name \'$2\'.'
            },
            390: {
                errorType: 390,
                errorName: 'missing tracktype',
                message: 'This track doesn\'t have a tracktype'
            },
        },
    };