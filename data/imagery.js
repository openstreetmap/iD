iD.data.imagery = [
    {
        "name": "Bing aerial imagery",
        "template": "http://ecn.t{t}.tiles.virtualearth.net/tiles/a{u}.jpeg?g=587&mkt=en-gb&n=z",
        "description": "Satellite imagery.",
        "scaleExtent": [
            0,
            20
        ],
        "subdomains": [
            "0",
            "1",
            "2",
            "3"
        ],
        "default": "yes",
        "sourcetag": "Bing",
        "logo": "bing_maps.png",
        "logo_url": "http://www.bing.com/maps",
        "terms_url": "http://opengeodata.org/microsoft-imagery-details"
    },
    {
        "name": "MapBox Satellite",
        "template": "http://{t}.tiles.mapbox.com/v3/openstreetmap.map-4wvf9l0l/{z}/{x}/{y}.png",
        "description": "Satellite and aerial imagery",
        "scaleExtent": [
            0,
            16
        ],
        "subdomains": [
            "a",
            "b",
            "c"
        ],
        "terms_url": "http://mapbox.com/tos/"
    },
    {
        "name": "OpenStreetMap",
        "template": "http://{t}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "description": "The default OpenStreetMap layer.",
        "scaleExtent": [
            0,
            18
        ],
        "subdomains": [
            "a",
            "b",
            "c"
        ]
    },
    {
        "name": " TIGER 2012 Roads Overlay",
        "template": "http://{t}.tile.openstreetmap.us/tiger2012_roads_expanded/{z}/{x}/{y}.png",
        "subdomains": [
            "a",
            "b",
            "c"
        ],
        "extent": [
            [
                -124.81,
                24.055
            ],
            [
                -66.865,
                49.386
            ]
        ]
    },
    {
        "name": " TIGER 2012 Roads Overlay",
        "template": "http://{t}.tile.openstreetmap.us/tiger2012_roads_expanded/{z}/{x}/{y}.png",
        "subdomains": [
            "a",
            "b",
            "c"
        ],
        "extent": [
            [
                -179.754,
                50.858
            ],
            [
                -129.899,
                71.463
            ]
        ]
    },
    {
        "name": " TIGER 2012 Roads Overlay",
        "template": "http://{t}.tile.openstreetmap.us/tiger2012_roads_expanded/{z}/{x}/{y}.png",
        "subdomains": [
            "a",
            "b",
            "c"
        ],
        "extent": [
            [
                -174.46,
                18.702
            ],
            [
                -154.516,
                26.501
            ]
        ]
    },
    {
        "name": " USGS Topographic Maps",
        "template": "http://{t}.tile.openstreetmap.us/usgs_scanned_topos/{z}/{x}/{y}.png",
        "subdomains": [
            "a",
            "b",
            "c"
        ],
        "extent": [
            [
                -125.991,
                24.005
            ],
            [
                -65.988,
                50.009
            ]
        ]
    },
    {
        "name": " USGS Topographic Maps",
        "template": "http://{t}.tile.openstreetmap.us/usgs_scanned_topos/{z}/{x}/{y}.png",
        "subdomains": [
            "a",
            "b",
            "c"
        ],
        "extent": [
            [
                -160.579,
                18.902
            ],
            [
                -154.793,
                22.508
            ]
        ]
    },
    {
        "name": " USGS Topographic Maps",
        "template": "http://{t}.tile.openstreetmap.us/usgs_scanned_topos/{z}/{x}/{y}.png",
        "subdomains": [
            "a",
            "b",
            "c"
        ],
        "extent": [
            [
                -178.001,
                51.255
            ],
            [
                -130.004,
                71.999
            ]
        ]
    },
    {
        "name": " USGS Large Scale Aerial Imagery",
        "template": "http://{t}.tile.openstreetmap.us/usgs_large_scale/{z}/{x}/{y}.jpg",
        "subdomains": [
            "a",
            "b",
            "c"
        ],
        "extent": [
            [
                -124.819,
                24.496
            ],
            [
                -66.931,
                49.443
            ]
        ]
    },
    {
        "name": "British Columbia bc_mosaic",
        "template": "http://{t}.imagery.paulnorman.ca/tiles/bc_mosaic/{z}/{x}/{y}.png",
        "subdomains": [
            "a",
            "b",
            "c",
            "d"
        ],
        "extent": [
            [
                -123.441,
                48.995
            ],
            [
                -121.346,
                50.426
            ]
        ],
        "sourcetag": "bc_mosaic",
        "terms_url": "http://imagery.paulnorman.ca/tiles/about.html"
    },
    {
        "name": "OS OpenData Streetview",
        "template": "http://os.openstreetmap.org/sv/{z}/{x}/{y}.png",
        "extent": [
            [
                -8.72,
                49.86
            ],
            [
                1.84,
                60.92
            ]
        ],
        "sourcetag": "OS_OpenData_StreetView"
    },
    {
        "name": "OS OpenData Locator",
        "template": "http://tiles.itoworld.com/os_locator/{z}/{x}/{y}.png",
        "extent": [
            [
                -9,
                49.8
            ],
            [
                1.9,
                61.1
            ]
        ],
        "sourcetag": "OS_OpenData_Locator"
    },
    {
        "name": "OS 1:25k historic (OSM)",
        "template": "http://ooc.openstreetmap.org/os1/{z}/{x}/{y}.jpg",
        "extent": [
            [
                -9,
                49.8
            ],
            [
                1.9,
                61.1
            ]
        ],
        "sourcetag": "OS 1:25k"
    },
    {
        "name": "OS 1:25k historic (NLS)",
        "template": "http://geo.nls.uk/mapdata2/os/25000/{z}/{x}/{y}.png",
        "extent": [
            [
                -9,
                49.8
            ],
            [
                1.9,
                61.1
            ]
        ],
        "sourcetag": "OS 1:25k",
        "logo": "icons/logo_nls70-nq8.png",
        "logo_url": "http://geo.nls.uk/maps/"
    },
    {
        "name": "OS 7th Series historic (OSM)",
        "template": "http://ooc.openstreetmap.org/os7/{z}/{x}/{y}.jpg",
        "extent": [
            [
                -9,
                49.8
            ],
            [
                1.9,
                61.1
            ]
        ],
        "sourcetag": "OS7"
    },
    {
        "name": "OS 7th Series historic (NLS)",
        "template": "http://geo.nls.uk/mapdata2/os/seventh/{z}/{x}/{y}.png",
        "extent": [
            [
                -9,
                49.8
            ],
            [
                1.9,
                61.1
            ]
        ],
        "sourcetag": "OS7",
        "logo": "icons/logo_nls70-nq8.png",
        "logo_url": "http://geo.nls.uk/maps/"
    },
    {
        "name": "OS New Popular Edition historic",
        "template": "http://ooc.openstreetmap.org/npe/{z}/{x}/{y}.png",
        "extent": [
            [
                -5.8,
                49.8
            ],
            [
                1.9,
                55.8
            ]
        ],
        "sourcetag": "NPE"
    },
    {
        "name": "OS Scottish Popular historic",
        "template": "http://ooc.openstreetmap.org/npescotland/tiles/{z}/{x}/{y}.jpg",
        "extent": [
            [
                -7.8,
                54.5
            ],
            [
                -1.1,
                61.1
            ]
        ],
        "sourcetag": "NPE"
    },
    {
        "name": "Surrey aerial",
        "template": "http://gravitystorm.dev.openstreetmap.org/surrey/{z}/{x}/{y}.png",
        "extent": [
            [
                -0.856,
                51.071
            ],
            [
                0.062,
                51.473
            ]
        ],
        "sourcetag": "Surrey aerial"
    },
    {
        "name": "Haiti - GeoEye Jan 13",
        "template": "http://gravitystorm.dev.openstreetmap.org/imagery/haiti/{z}/{x}/{y}.jpg",
        "extent": [
            [
                -74.5,
                17.95
            ],
            [
                -71.58,
                20.12
            ]
        ],
        "sourcetag": "Haiti GeoEye"
    },
    {
        "name": "Haiti - GeoEye Jan 13+",
        "template": "http://maps.nypl.org/tilecache/1/geoeye/{z}/{x}/{y}.jpg",
        "extent": [
            [
                -74.5,
                17.95
            ],
            [
                -71.58,
                20.12
            ]
        ],
        "sourcetag": "Haiti GeoEye"
    },
    {
        "name": "Haiti - DigitalGlobe",
        "template": "http://maps.nypl.org/tilecache/1/dg_crisis/{z}/{x}/{y}.jpg",
        "extent": [
            [
                -74.5,
                17.95
            ],
            [
                -71.58,
                20.12
            ]
        ],
        "sourcetag": "Haiti DigitalGlobe"
    },
    {
        "name": "Haiti - Street names",
        "template": "http://hypercube.telascience.org/tiles/1.0.0/haiti-city/{z}/{x}/{y}.jpg",
        "extent": [
            [
                -74.5,
                17.95
            ],
            [
                -71.58,
                20.12
            ]
        ],
        "sourcetag": "Haiti streetnames"
    },
    {
        "name": "NAIP",
        "template": "http://cube.telascience.org/tilecache/tilecache.py/NAIP_ALL/{z}/{x}/{y}.png",
        "description": "National Agriculture Imagery Program",
        "extent": [
            [
                -125.8,
                24.2
            ],
            [
                -62.3,
                49.5
            ]
        ],
        "sourcetag": "NAIP"
    },
    {
        "name": "NAIP",
        "template": "http://cube.telascience.org/tilecache/tilecache.py/NAIP_ALL/{z}/{x}/{y}.png",
        "description": "National Agriculture Imagery Program",
        "extent": [
            [
                -168.5,
                55.3
            ],
            [
                -140,
                71.5
            ]
        ],
        "sourcetag": "NAIP"
    },
    {
        "name": "Ireland - NLS Historic Maps",
        "template": "http://geo.nls.uk/maps/ireland/gsgs4136/{z}/{x}/{y}.png",
        "extent": [
            [
                -10.71,
                51.32
            ],
            [
                -5.37,
                55.46
            ]
        ],
        "sourcetag": "NLS Historic Maps",
        "logo": "icons/logo_nls70-nq8.png",
        "logo_url": "http://geo.nls.uk/maps/"
    },
    {
        "name": "Denmark - Fugro Aerial Imagery",
        "template": "http://tile.openstreetmap.dk/fugro2005/{z}/{x}/{y}.jpg",
        "extent": [
            [
                7.81,
                54.44
            ],
            [
                15.49,
                57.86
            ]
        ],
        "sourcetag": "Fugro (2005)"
    },
    {
        "name": "Denmark - Stevns Kommune",
        "template": "http://tile.openstreetmap.dk/stevns/2009/{z}/{x}/{y}.jpg",
        "extent": [
            [
                12.09144,
                55.23403
            ],
            [
                12.47712,
                55.43647
            ]
        ],
        "sourcetag": "Stevns Kommune (2009)"
    },
    {
        "name": "Austria - geoimage.at",
        "template": "http://geoimage.openstreetmap.at/4d80de696cd562a63ce463a58a61488d/{z}/{x}/{y}.jpg",
        "extent": [
            [
                9.36,
                46.33
            ],
            [
                17.28,
                49.09
            ]
        ],
        "sourcetag": "geoimage.at"
    },
    {
        "name": "Russia - Kosmosnimki.ru IRS Satellite",
        "template": "http://irs.gis-lab.info/?layers=irs&request=GetTile&z={z}&x={x}&y={y}",
        "extent": [
            [
                19.02,
                40.96
            ],
            [
                77.34,
                70.48
            ]
        ],
        "sourcetag": "Kosmosnimki.ru IRS"
    },
    {
        "name": "Belarus - Kosmosnimki.ru SPOT4 Satellite",
        "template": "http://irs.gis-lab.info/?layers=spot&request=GetTile&z={z}&x={x}&y={y}",
        "extent": [
            [
                23.16,
                51.25
            ],
            [
                32.83,
                56.19
            ]
        ],
        "sourcetag": "Kosmosnimki.ru SPOT4"
    },
    {
        "name": "Australia - Geographic Reference Image",
        "template": "http://agri.openstreetmap.org/{z}/{x}/{y}.png",
        "extent": [
            [
                96,
                -44
            ],
            [
                168,
                -9
            ]
        ],
        "sourcetag": "AGRI"
    },
    {
        "name": "Switzerland - Canton Aargau - AGIS 25cm 2011",
        "template": "http://tiles.poole.ch/AGIS/OF2011/{z}/{x}/{y}.png",
        "extent": [
            [
                7.69,
                47.13
            ],
            [
                8.48,
                47.63
            ]
        ],
        "sourcetag": "AGIS OF2011"
    },
    {
        "name": "Switzerland - Canton Solothurn - SOGIS 2007",
        "template": "http://mapproxy.sosm.ch:8080/tiles/sogis2007/EPSG900913/{z}/{x}/{y}.png?origin=nw",
        "extent": [
            [
                7.33,
                47.06
            ],
            [
                8.04,
                47.5
            ]
        ],
        "sourcetag": "Orthofoto 2007 WMS Solothurn"
    },
    {
        "name": "Poland - Media-Lab fleet GPS masstracks",
        "template": "http://masstracks.media-lab.com.pl/{z}/{x}/{y}.png",
        "extent": [
            [
                14,
                48.9
            ],
            [
                24.2,
                55
            ]
        ],
        "sourcetag": "masstracks"
    },
    {
        "name": "South Africa - CD:NGI Aerial",
        "template": "http://{t}.aerial.openstreetmap.org.za/ngi-aerial/{z}/{x}/{y}.jpg",
        "subdomains": [
            "a",
            "b",
            "c"
        ],
        "extent": [
            [
                17.64,
                -34.95
            ],
            [
                32.87,
                -22.05
            ]
        ],
        "sourcetag": "ngi-aerial"
    }
];