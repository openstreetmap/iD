locale.en = {
    "modes": {
        "add_area": {
            "title": "Area",
            "description": "Add parks, buildings, lakes or other areas to the map.",
            "tail": "Click on the map to start drawing an area, like a park, lake, or building."
        },
        "add_line": {
            "title": "Line",
            "description": "Add highways, streets, pedestrian paths, canals or other lines to the map.",
            "tail": "Click on the map to start drawing a road, path, or route."
        },
        "add_point": {
            "title": "Point",
            "description": "Add restaurants, monuments, postal boxes or other points to the map.",
            "tail": "Click on the map to add a point."
        },
        "browse": {
            "title": "Browse",
            "description": "Pan and zoom the map."
        },
        "draw_area": {
            "tail": "Click to add points to your area. Click the first point to finish the area."
        },
        "draw_line": {
            "tail": "Click to add more points to the line. Click on other lines to connect to them, and double-click to end the line."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Added a point.",
                "vertex": "Added a node to a way."
            }
        },
        "start": {
            "annotation": {
                "line": "Started a line.",
                "area": "Started an area."
            }
        },
        "continue": {
            "annotation": {
                "line": "Continued a line.",
                "area": "Continued an area."
            }
        },
        "cancel_draw": {
            "annotation": "Canceled drawing."
        },
        "change_tags": {
            "annotation": "Changed tags."
        },
        "circularize": {
            "title": "Circularize",
            "description": {
                "line": "Make this line circular.",
                "area": "Make this area circular."
            },
            "key": "O",
            "annotation": {
                "line": "Made a line circular.",
                "area": "Made an area circular."
            },
            "not_closed": "This can't be made circular because it's not a loop."
        },
        "orthogonalize": {
            "title": "Orthogonalize",
            "description": "Square these corners.",
            "key": "Q",
            "annotation": {
                "line": "Squared the corners of a line.",
                "area": "Squared the corners of an area."
            },
            "not_closed": "This can't be made square because it's not a loop."
        },
        "delete": {
            "title": "Delete",
            "description": "Remove this from the map.",
            "annotation": {
                "point": "Deleted a point.",
                "vertex": "Deleted a node from a way.",
                "line": "Deleted a line.",
                "area": "Deleted an area.",
                "relation": "Deleted a relation.",
                "multiple": "Deleted {n} objects."
            }
        },
        "connect": {
            "annotation": {
                "point": "Connected a way to a point.",
                "vertex": "Connected a way to another.",
                "line": "Connected a way to a line.",
                "area": "Connected a way to an area."
            }
        },
        "disconnect": {
            "title": "Disconnect",
            "description": "Disconnect these lines/areas from each other.",
            "key": "D",
            "annotation": "Disconnected lines/areas.",
            "not_connected": "There aren't enough lines/areas here to disconnect."
        },
        "merge": {
            "title": "Merge",
            "description": "Merge these lines.",
            "key": "C",
            "annotation": "Merged {n} lines.",
            "not_eligible": "These features can't be merged.",
            "not_adjacent": "These lines can't be merged because they aren't connected."
        },
        "move": {
            "title": "Move",
            "description": "Move this to a different location.",
            "key": "M",
            "annotation": {
                "point": "Moved a point.",
                "vertex": "Moved a node in a way.",
                "line": "Moved a line.",
                "area": "Moved an area.",
                "multiple": "Moved multiple objects."
            },
            "incomplete_relation": "This feature can't be moved because it hasn't been fully downloaded."
        },
        "rotate": {
            "title": "Rotate",
            "description": "Rotate this object around its centre point.",
            "key": "R",
            "annotation": {
                "line": "Rotated a line.",
                "area": "Rotated an area."
            }
        },
        "reverse": {
            "title": "Reverse",
            "description": "Make this line go in the opposite direction.",
            "key": "V",
            "annotation": "Reversed a line."
        },
        "split": {
            "title": "Split",
            "description": {
                "line": "Split this line into two at this point.",
                "area": "Split the boundary of this area into two.",
                "multiple": "Split the lines/area boundaries at this point into two."
            },
            "key": "X",
            "annotation": {
                "line": "Split a line.",
                "area": "Split an area boundary.",
                "multiple": "Split {n} lines/area boundaries."
            },
            "not_eligible": "Lines can't be split at their beginning or end.",
            "multiple_ways": "There are too many lines here to split."
        }
    },
    "nothing_to_undo": "Nothing to undo.",
    "nothing_to_redo": "Nothing to redo.",
    "just_edited": "You just edited OpenStreetMap!",
    "browser_notice": "This editor is supported in Firefox, Chrome, Safari, Opera, and Internet Explorer 9 and above. Please upgrade your browser or use Potlatch 2 to edit the map.",
    "view_on_osm": "View on OSM",
    "zoom_in_edit": "zoom in to edit the map",
    "logout": "logout",
    "loading_auth": "Connecting to OpenStreetMap...",
    "report_a_bug": "report a bug",
    "commit": {
        "title": "Save Changes",
        "description_placeholder": "Brief description of your contributions",
        "message_label": "Commit message",
        "upload_explanation": "The changes you upload as {user} will be visible on all maps that use OpenStreetMap data.",
        "save": "Save",
        "cancel": "Cancel",
        "warnings": "Warnings",
        "modified": "Modified",
        "deleted": "Deleted",
        "created": "Created"
    },
    "contributors": {
        "list": "Contributed by {users}",
        "truncated_list": "Contributed by {users} and {count} others"
    },
    "geocoder": {
        "title": "Find a place",
        "placeholder": "Find a place",
        "no_results": "Couldn't locate a place named '{name}'"
    },
    "geolocate": {
        "title": "Show My Location"
    },
    "inspector": {
        "no_documentation_combination": "There is no documentation available for this tag combination",
        "no_documentation_key": "There is no documentation available for this key",
        "show_more": "Show More",
        "new_tag": "New tag",
        "view_on_osm": "View on OSM →",
        "editing_feature": "Editing {feature}",
        "additional": "Additional tags",
        "choose": "Select feature type",
        "results": "{n} results for {search}",
        "reference": "View on OpenStreetMap Wiki →",
        "back_tooltip": "Change feature type"
    },
    "background": {
        "title": "Background",
        "description": "Background settings",
        "percent_brightness": "{opacity}% brightness",
        "fix_misalignment": "Fix misalignment",
        "reset": "reset"
    },
    "restore": {
        "heading": "You have unsaved changes",
        "description": "Do you wish to restore unsaved changes from a previous editing session?",
        "restore": "Restore",
        "reset": "Reset"
    },
    "save": {
        "title": "Save",
        "help": "Save changes to OpenStreetMap, making them visible to other users.",
        "no_changes": "No changes to save.",
        "error": "An error occurred while trying to save",
        "uploading": "Uploading changes to OpenStreetMap.",
        "unsaved_changes": "You have unsaved changes"
    },
    "splash": {
        "welcome": "Welcome to the iD OpenStreetMap editor",
        "text": "iD is a friendly but powerful tool for contributing to the world's best free world map. This is development version {version}. For more information see {website} and report bugs at {github}.",
        "walkthrough": "Start the Walkthrough",
        "start": "Edit Now"
    },
    "source_switch": {
        "live": "live",
        "lose_changes": "You have unsaved changes. Switching the map server will discard them. Are you sure you want to switch servers?",
        "dev": "dev"
    },
    "tag_reference": {
        "description": "Description",
        "on_wiki": "{tag} on wiki.osm.org",
        "used_with": "used with {type}"
    },
    "validations": {
        "untagged_point": "Untagged point which is not part of a line or area",
        "untagged_line": "Untagged line",
        "untagged_area": "Untagged area",
        "many_deletions": "You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        "tag_suggests_area": "The tag {tag} suggests line should be area, but it is not an area",
        "deprecated_tags": "Deprecated tags: {tags}"
    },
    "zoom": {
        "in": "Zoom In",
        "out": "Zoom Out"
    },
    "cannot_zoom": "Cannot zoom out further in current mode.",
    "gpx": {
        "local_layer": "Local GPX file",
        "drag_drop": "Drag and drop a .gpx file on the page"
    },
    "help": {
        "title": "Help",
        "help": "# Help\n\nThis is an editor for [OpenStreetMap](http://www.openstreetmap.org/), the\nfree and editable map of the world. You can use it to add and update\ndata in your area, making an open-source and open-data map of the world\nbetter for everyone.\n\nEdits that you make on this map will be visible to everyone who uses\nOpenStreetMap. In order to make an edit, you'll need a\n[free OpenStreetMap account](https://www.openstreetmap.org/user/new).\n\nThe [iD editor](http://ideditor.com/) is a collaborative project with [source\ncode available on GitHub](https://github.com/systemed/iD).\n",
        "editing_saving": "# Editing & Saving\n\nThis editor is designed to work primarily online, and you're accessing\nit through a website right now.\n\n### Selecting Features\n\nTo select a map feature, like a road or point of interest, click\non it on the map. This will highlight the selected feature, open a panel with\ndetails about it, and show a menu of things you can do with the feature.\n\nMultiple features can be selected by holding the 'Shift' key, clicking,\nand dragging on the map. This will select all features within the box\nthat's drawn, allowing you to do things with several features at once.\n\n### Saving Edits\n\nWhen you make changes like editing roads, buildings, and places, these are\nstored locally until you save them to the server. Don't worry if you make\na mistake - you can undo changes by clicking the undo button, and redo\nchanges by clicking the redo button.\n\nClick 'Save' to finish a group of edits - for instance, if you've completed\nan area of town and would like to start on a new area. You'll have a chance\nto review what you've done, and the editor supplies helpful suggestions\nand warnings if something doesn't seem right about the changes.\n\nIf everything looks good, you can enter a short comment explaining the change\nyou made, and click 'Save' again to post the changes\nto [OpenStreetMap.org](http://www.openstreetmap.org/), where they are visible\nto all other users and available for others to build and improve upon.\n\nIf you can't finish your edits in one sitting, you can leave the editor\nwindow and come back (on the same browser and computer), and the\neditor application will offer to restore your work.\n",
        "roads": "# Roads\n\nYou can create, fix, and delete roads with this editor. Roads can be all\nkinds: paths, highways, trails, cycleways, and more - any often-crossed\nsegment should be mappable.\n\n### Selecting\n\nClick on a road to select it. An outline should become visible, along\nwith a small tools menu on the map and a sidebar showing more information\nabout the road.\n\n### Modifying\n\nOften you'll see roads that aren't aligned to the imagery behind them\nor to a GPS track. You can adjust these roads so they are in the correct\nplace.\n\nFirst click on the road you want to change. This will highlight it and show\ncontrol points along it that you can drag to better locations. If\nyou want to add new control points for more detail, double-click a part\nof the road without a point, and one will be added.\n\nIf the road connects to another road, but doesn't properly connect on\nthe map, you can drag one of its control points onto the other road in\norder to join them. Having roads connect is important for the map\nand essential for providing driving directions.\n\nYou can also click the 'Move' tool or press the `M` shortcut key to move the entire road at\none time, and then click again to save that movement.\n\n### Deleting\n\nIf a road is entirely incorrect - you can see that it doesn't exist in satellite\nimagery and ideally have confirmed locally that it's not present - you can delete\nit, which removes it from the map. Be cautious when deleting features -\nlike any other edit, the results are seen by everyone and satellite imagery\nis often out of date, so the road could simply be newly built.\n\nYou can delete a road by clicking on it to select it, then clicking the\ntrash can icon or pressing the 'Delete' key.\n\n### Creating\n\nFound somewhere there should be a road but there isn't? Click the 'Line'\nicon in the top-left of the editor or press the shortcut key `2` to start drawing\na line.\n\nClick on the start of the road on the map to start drawing. If the road\nbranches off from an existing road, start by clicking on the place where they connect.\n\nThen click on points along the road so that it follows the right path, according\nto satellite imagery or GPS. If the road you are drawing crosses another road, connect\nit by clicking on the intersection point. When you're done drawing, double-click\nor press 'Return' or 'Enter' on your keyboard.\n",
        "gps": "# GPS\n\nGPS data is the most trusted source of data for OpenStreetMap. This editor\nsupports local traces - `.gpx` files on your local computer. You can collect\nthis kind of GPS trace with a number of smartphone applications as well as\npersonal GPS hardware.\n\nFor information on how to perform a GPS survey, read\n[Surveying with a GPS](http://learnosm.org/en/beginner/using-gps/).\n\nTo use a GPX track for mapping, drag and drop the GPX file onto the map\neditor. If it's recognized, it will be added to the map as a bright green\nline. Click on the 'Background Settings' menu on the left side to enable,\ndisable, or zoom to this new GPX-powered layer.\n\nThe GPX track isn't directly uploaded to OpenStreetMap - the best way to\nuse it is to draw on the map, using it as a guide for the new features that\nyou add.\n",
        "imagery": "# Imagery\n\nAerial imagery is an important resource for mapping. A combination of\nairplane flyovers, satellite views, and freely-compiled sources are available\nin the editor under the 'Background Settings' menu on the left.\n\nBy default a [Bing Maps](http://www.bing.com/maps/) satellite layer is\npresented in the editor, but as you pan and zoom the map to new geographical\nareas, new sources will become available. Some countries, like the United\nStates, France, and Denmark have very high-quality imagery available for some areas.\n\nImagery is sometimes offset from the map data because of a mistake on the\nimagery provider's side. If you see a lot of roads shifted from the background,\ndon't immediately move them all to match the background. Instead you can adjust\nthe imagery so that it matches the existing data by clicking 'Fix alignment' at\nthe bottom of the Background Settings UI.\n",
        "addresses": "# Addresses\n\nAddresses are some of the most useful information for the map.\n\nAlthough addresses are often represented as parts of streets, in OpenStreetMap\nthey're recorded as attributes of buildings and places along streets.\n\nYou can add address information to places mapped as building outlines as well\nas well as those mapped as single points. The optimal source of address\ndata is from an on-the-ground survey or personal knowledge - as with any\nother feature, copying from commercial sources like Google Maps is strictly\nforbidden.\n",
        "inspector": "# Using the Inspector\n\nThe inspector is the user interface element on the right-hand side of the\npage that appears when a feature is selected and allows you to edit its details.\n\n### Selecting a Feature Type\n\nAfter you add a point, line, or area, you can choose what type of feature it\nis, like whether it's a highway or residential road, supermarket or cafe.\nThe inspector will display buttons for common feature types, and you can\nfind others by typing what you're looking for in the search box.\n\nClick the 'i' in the bottom-right-hand corner of a feature type button to\nlearn more about it. Click a button to choose that type.\n\n### Using Forms and Editing Tags\n\nAfter you choose a feature type, or when you select a feature that already\nhas a type assigned, the inspector will display fields with details about\nthe feature like its name and address.\n\nBelow the fields you see, you can click icons to add other details,\nlike [Wikipedia](http://www.wikipedia.org/) information, wheelchair\naccess, and more.\n\nAt the bottom of the inspector, click 'Additional tags' to add arbitrary\nother tags to the element. [Taginfo](http://taginfo.openstreetmap.org/) is a\ngreat resource for learn more about popular tag combinations.\n\nChanges you make in the inspector are automatically applied to the map.\nYou can undo them at any time by clicking the 'Undo' button.\n\n### Closing the Inspector\n\nYou can close the inspector by clicking the close button in the top-right,\npressing the 'Escape' key, or clicking on the map.\n",
        "buildings": "# Buildings\n\nOpenStreetMap is the world's largest database of buildings. You can create\nand improve this database.\n\n### Selecting\n\nYou can select a building by clicking on its border. This will highlight the\nbuilding and open a small tools menu and a sidebar showing more information\nabout the building.\n\n### Modifying\n\nSometimes buildings are incorrectly placed or have incorrect tags.\n\nTo move an entire building, select it, then click the 'Move' tool. Move your\nmouse to shift the building, and click when it's correctly placed.\n\nTo fix the specific shape of a building, click and drag the points that form\nits border into better places.\n\n### Creating\n\nOne of the main questions around adding buildings to the map is that\nOpenStreetMap records buildings both as shapes and points. The rule of thumb\nis to _map a building as a shape whenever possible_, and map companies, homes,\namenities, and other things that operate out of buildings as points placed\nwithin the building shape.\n\nStart drawing a building as a shape by clicking the 'Area' button in the top\nleft of the interface, and end it either by pressing 'Return' on your keyboard\nor clicking on the first point drawn to close the shape.\n\n### Deleting\n\nIf a building is entirely incorrect - you can see that it doesn't exist in satellite\nimagery and ideally have confirmed locally that it's not present - you can delete\nit, which removes it from the map. Be cautious when deleting features -\nlike any other edit, the results are seen by everyone and satellite imagery\nis often out of date, so the road could simply be newly built.\n\nYou can delete a building by clicking on it to select it, then clicking the\ntrash can icon or pressing the 'Delete' key.\n"
    },
    "intro": {
        "navigation": {
            "drag": "The main map area shows OpenStreetMap data on top of a background. You can navigate by dragging and scrolling, just like any web map. **Drag the map!**",
            "select": "Map features are represented three ways: using points, lines or areas. All features can be selected by clicking on them. **Click on the point to select it.**",
            "header": "The header shows us the feature type.",
            "pane": "When a feature is selected, the feature editor is displayed. The header shows us the feature type and the main pane shows the feature's attributes, such as its name and address. **Close the feature editor with the close button in the top right.**"
        },
        "points": {
            "add": "Points can be used to represent features such as shops, restaurants and monuments. They mark a specific location, and describe what's there. **Click the Point button to add a new point.**",
            "place": "The point can be placed by clicking on the map. **Place the point on top of the building.**",
            "search": "There many different features that can be represented by points. The point you just added is a Cafe. **Search for 'Cafe' **",
            "choose": "**Choose Cafe from the grid.**",
            "describe": "The point is now marked as a cafe. Using the feature editor, we can add more information about the feature. **Add a name**",
            "close": "The feature editor can be closed by clicking on the close button. **Close the feature editor**",
            "reselect": "Often points will already exist, but have mistakes or be incomplete. We can edit existing points. **Select the point you just created.**",
            "fixname": "**Change the name and close the feature editor.**",
            "reselect_delete": "All features on the map can be deleted. **Click on the point you created.**",
            "delete": "The menu around the point contains operations that can be performed on it, including delete. **Delete the point.**"
        },
        "areas": {
            "add": "Areas are a more detailed way to represent features. They provide information on the boundaries of the feature. Areas can be used for most features types points can be used for, and are often preferred. **Click the Area button to add a new area.**",
            "corner": "Areas are drawn by placing nodes that mark the boundary of the area. **Place the starting node on one of the corners of the playground.**",
            "place": "Draw the area by placing more nodes. Finish the area by clicking on the starting point. **Draw an area for the playground.**",
            "search": "**Search for Playground.**",
            "choose": "**Choose Playground from the grid.**",
            "describe": "**Add a name, and close the feature editor**"
        },
        "lines": {
            "add": "Lines are used to represent features such as roads, railways and rivers. **Click the Line button to add a new line.**",
            "start": "**Start the line by clicking on the end of the road.**",
            "intersect": "Click to add more points to the line. You can drag the map while drawing if necessary. Roads, and many other types of lines, are part of a larger network. It is important for these lines to be connected properly in order for routing applications to work. **Click on Flower Street, to create an intersection connecting the two lines.**",
            "finish": "Lines can be finished by clicking on the last point again. **Finish drawing the road.**",
            "road": "**Select Road from the grid**",
            "residential": "There are different types of roads, the most common of which is Residential. **Choose the Residential road type**",
            "describe": "**Name the road and close the feature editor.**",
            "restart": "The road needs to intersect Flower Street."
        },
        "startediting": {
            "help": "More documentation and this walkthrough are available here.",
            "save": "Don't forget to regularly save your changes!",
            "start": "Start mapping!"
        }
    },
    "presets": {
        "fields": {
            "access": {
                "label": "Access"
            },
            "address": {
                "label": "Address",
                "placeholders": {
                    "housename": "Housename",
                    "number": "123",
                    "street": "Street",
                    "city": "City"
                }
            },
            "admin_level": {
                "label": "Admin Level"
            },
            "aeroway": {
                "label": "Type"
            },
            "amenity": {
                "label": "Type"
            },
            "atm": {
                "label": "ATM"
            },
            "barrier": {
                "label": "Type"
            },
            "bicycle_parking": {
                "label": "Type"
            },
            "building": {
                "label": "Building"
            },
            "building_area": {
                "label": "Building"
            },
            "building_yes": {
                "label": "Building"
            },
            "capacity": {
                "label": "Capacity"
            },
            "collection_times": {
                "label": "Collection Times"
            },
            "construction": {
                "label": "Type"
            },
            "country": {
                "label": "Country"
            },
            "crossing": {
                "label": "Type"
            },
            "cuisine": {
                "label": "Cuisine"
            },
            "denomination": {
                "label": "Denomination"
            },
            "denotation": {
                "label": "Denotation"
            },
            "elevation": {
                "label": "Elevation"
            },
            "emergency": {
                "label": "Emergency"
            },
            "entrance": {
                "label": "Type"
            },
            "fax": {
                "label": "Fax"
            },
            "fee": {
                "label": "Fee"
            },
            "highway": {
                "label": "Type"
            },
            "historic": {
                "label": "Type"
            },
            "internet_access": {
                "label": "Internet Access",
                "options": {
                    "yes": "Yes",
                    "no": "No",
                    "wlan": "Wifi",
                    "wired": "Wired",
                    "terminal": "Terminal"
                }
            },
            "landuse": {
                "label": "Type"
            },
            "layer": {
                "label": "Layer"
            },
            "leisure": {
                "label": "Type"
            },
            "levels": {
                "label": "Levels"
            },
            "man_made": {
                "label": "Type"
            },
            "maxspeed": {
                "label": "Speed Limit"
            },
            "name": {
                "label": "Name"
            },
            "natural": {
                "label": "Natural"
            },
            "network": {
                "label": "Network"
            },
            "note": {
                "label": "Note"
            },
            "office": {
                "label": "Type"
            },
            "oneway": {
                "label": "One Way"
            },
            "oneway_yes": {
                "label": "One Way"
            },
            "opening_hours": {
                "label": "Hours"
            },
            "operator": {
                "label": "Operator"
            },
            "phone": {
                "label": "Phone"
            },
            "place": {
                "label": "Type"
            },
            "power": {
                "label": "Type"
            },
            "railway": {
                "label": "Type"
            },
            "ref": {
                "label": "Reference"
            },
            "religion": {
                "label": "Religion",
                "options": {
                    "christian": "Christian",
                    "muslim": "Muslim",
                    "buddhist": "Buddhist",
                    "jewish": "Jewish",
                    "hindu": "Hindu",
                    "shinto": "Shinto",
                    "taoist": "Taoist"
                }
            },
            "service": {
                "label": "Type"
            },
            "shelter": {
                "label": "Shelter"
            },
            "shop": {
                "label": "Type"
            },
            "source": {
                "label": "Source"
            },
            "sport": {
                "label": "Sport"
            },
            "structure": {
                "label": "Structure",
                "options": {
                    "bridge": "Bridge",
                    "tunnel": "Tunnel",
                    "embankment": "Embankment",
                    "cutting": "Cutting"
                }
            },
            "surface": {
                "label": "Surface"
            },
            "tourism": {
                "label": "Type"
            },
            "water": {
                "label": "Type"
            },
            "waterway": {
                "label": "Type"
            },
            "website": {
                "label": "Website"
            },
            "wetland": {
                "label": "Type"
            },
            "wheelchair": {
                "label": "Wheelchair Access"
            },
            "wikipedia": {
                "label": "Wikipedia"
            },
            "wood": {
                "label": "Type"
            }
        },
        "presets": {
            "aeroway": {
                "name": "Aeroway",
                "terms": ""
            },
            "aeroway/aerodrome": {
                "name": "Airport",
                "terms": "airplane,airport,aerodrome"
            },
            "aeroway/helipad": {
                "name": "Helipad",
                "terms": "helicopter,helipad,heliport"
            },
            "amenity": {
                "name": "Amenity",
                "terms": ""
            },
            "amenity/bank": {
                "name": "Bank",
                "terms": "coffer,countinghouse,credit union,depository,exchequer,fund,hoard,investment firm,repository,reserve,reservoir,safe,savings,stock,stockpile,store,storehouse,thrift,treasury,trust company,vault"
            },
            "amenity/bar": {
                "name": "Bar",
                "terms": ""
            },
            "amenity/bench": {
                "name": "Bench",
                "terms": ""
            },
            "amenity/bicycle_parking": {
                "name": "Bicycle Parking",
                "terms": ""
            },
            "amenity/bicycle_rental": {
                "name": "Bicycle Rental",
                "terms": ""
            },
            "amenity/cafe": {
                "name": "Cafe",
                "terms": "coffee,tea,coffee shop"
            },
            "amenity/cinema": {
                "name": "Cinema",
                "terms": "big screen,bijou,cine,drive-in,film,flicks,motion pictures,movie house,movie theater,moving pictures,nabes,photoplay,picture show,pictures,playhouse,show,silver screen"
            },
            "amenity/courthouse": {
                "name": "Courthouse",
                "terms": ""
            },
            "amenity/embassy": {
                "name": "Embassy",
                "terms": ""
            },
            "amenity/fast_food": {
                "name": "Fast Food",
                "terms": ""
            },
            "amenity/fire_station": {
                "name": "Fire Station",
                "terms": ""
            },
            "amenity/fuel": {
                "name": "Gas Station",
                "terms": ""
            },
            "amenity/grave_yard": {
                "name": "Graveyard",
                "terms": ""
            },
            "amenity/hospital": {
                "name": "Hospital",
                "terms": "clinic,emergency room,health service,hospice,infirmary,institution,nursing home,rest home,sanatorium,sanitarium,sick bay,surgery,ward"
            },
            "amenity/library": {
                "name": "Library",
                "terms": ""
            },
            "amenity/marketplace": {
                "name": "Marketplace",
                "terms": ""
            },
            "amenity/parking": {
                "name": "Parking",
                "terms": ""
            },
            "amenity/pharmacy": {
                "name": "Pharmacy",
                "terms": ""
            },
            "amenity/place_of_worship": {
                "name": "Place of Worship",
                "terms": "abbey,basilica,bethel,cathedral,chancel,chantry,chapel,church,fold,house of God,house of prayer,house of worship,minster,mission,mosque,oratory,parish,sacellum,sanctuary,shrine,synagogue,tabernacle,temple"
            },
            "amenity/place_of_worship/christian": {
                "name": "Church",
                "terms": "christian,abbey,basilica,bethel,cathedral,chancel,chantry,chapel,church,fold,house of God,house of prayer,house of worship,minster,mission,oratory,parish,sacellum,sanctuary,shrine,tabernacle,temple"
            },
            "amenity/place_of_worship/jewish": {
                "name": "Synagogue",
                "terms": "jewish,synagogue"
            },
            "amenity/place_of_worship/muslim": {
                "name": "Mosque",
                "terms": "muslim,mosque"
            },
            "amenity/police": {
                "name": "Police",
                "terms": "badge,bear,blue,bluecoat,bobby,boy scout,bull,constable,constabulary,cop,copper,corps,county mounty,detective,fed,flatfoot,force,fuzz,gendarme,gumshoe,heat,law,law enforcement,man,narc,officers,patrolman,police"
            },
            "amenity/post_box": {
                "name": "Mailbox",
                "terms": "letter drop,letterbox,mail drop,mailbox,pillar box,postbox"
            },
            "amenity/post_office": {
                "name": "Post Office",
                "terms": ""
            },
            "amenity/pub": {
                "name": "Pub",
                "terms": ""
            },
            "amenity/restaurant": {
                "name": "Restaurant",
                "terms": "bar,cafeteria,café,canteen,chophouse,coffee shop,diner,dining room,dive*,doughtnut shop,drive-in,eatery,eating house,eating place,fast-food place,greasy spoon,grill,hamburger stand,hashery,hideaway,hotdog stand,inn,joint*,luncheonette,lunchroom,night club,outlet*,pizzeria,saloon,soda fountain,watering hole"
            },
            "amenity/school": {
                "name": "School",
                "terms": "academy,alma mater,blackboard,college,department,discipline,establishment,faculty,hall,halls of ivy,institute,institution,jail*,schoolhouse,seminary,university"
            },
            "amenity/swimming_pool": {
                "name": "Swimming Pool",
                "terms": ""
            },
            "amenity/telephone": {
                "name": "Telephone",
                "terms": ""
            },
            "amenity/theatre": {
                "name": "Theater",
                "terms": "theatre,performance,play,musical"
            },
            "amenity/toilets": {
                "name": "Toilets",
                "terms": ""
            },
            "amenity/townhall": {
                "name": "Town Hall",
                "terms": "village hall,city government,courthouse,municipal building,municipal center"
            },
            "amenity/university": {
                "name": "University",
                "terms": ""
            },
            "barrier": {
                "name": "Barrier",
                "terms": ""
            },
            "barrier/block": {
                "name": "Block",
                "terms": ""
            },
            "barrier/bollard": {
                "name": "Bollard",
                "terms": ""
            },
            "barrier/cattle_grid": {
                "name": "Cattle Grid",
                "terms": ""
            },
            "barrier/city_wall": {
                "name": "City Wall",
                "terms": ""
            },
            "barrier/cycle_barrier": {
                "name": "Cycle Barrier",
                "terms": ""
            },
            "barrier/ditch": {
                "name": "Ditch",
                "terms": ""
            },
            "barrier/entrance": {
                "name": "Entrance",
                "terms": ""
            },
            "barrier/fence": {
                "name": "Fence",
                "terms": ""
            },
            "barrier/gate": {
                "name": "Gate",
                "terms": ""
            },
            "barrier/hedge": {
                "name": "Hedge",
                "terms": ""
            },
            "barrier/kissing_gate": {
                "name": "Kissing Gate",
                "terms": ""
            },
            "barrier/lift_gate": {
                "name": "Lift Gate",
                "terms": ""
            },
            "barrier/retaining_wall": {
                "name": "Retaining Wall",
                "terms": ""
            },
            "barrier/stile": {
                "name": "Stile",
                "terms": ""
            },
            "barrier/toll_booth": {
                "name": "Toll Booth",
                "terms": ""
            },
            "barrier/wall": {
                "name": "Wall",
                "terms": ""
            },
            "boundary/administrative": {
                "name": "Administrative Boundary",
                "terms": ""
            },
            "building": {
                "name": "Building",
                "terms": ""
            },
            "building/apartments": {
                "name": "Apartments",
                "terms": ""
            },
            "building/entrance": {
                "name": "Entrance",
                "terms": ""
            },
            "building/house": {
                "name": "House",
                "terms": ""
            },
            "entrance": {
                "name": "Entrance",
                "terms": ""
            },
            "highway": {
                "name": "Highway",
                "terms": ""
            },
            "highway/bridleway": {
                "name": "Bridle Path",
                "terms": "bridleway,equestrian trail,horse riding path,bridle road,horse trail"
            },
            "highway/bus_stop": {
                "name": "Bus Stop",
                "terms": ""
            },
            "highway/crossing": {
                "name": "Crossing",
                "terms": "crosswalk,zebra crossing"
            },
            "highway/cycleway": {
                "name": "Cycle Path",
                "terms": ""
            },
            "highway/footway": {
                "name": "Foot Path",
                "terms": "beaten path,boulevard,clearing,course,cut*,drag*,footpath,highway,lane,line,orbit,passage,pathway,rail,rails,road,roadway,route,street,thoroughfare,trackway,trail,trajectory,walk"
            },
            "highway/motorway": {
                "name": "Motorway",
                "terms": ""
            },
            "highway/motorway_link": {
                "name": "Motorway Link",
                "terms": "ramp,on ramp,off ramp"
            },
            "highway/path": {
                "name": "Path",
                "terms": ""
            },
            "highway/primary": {
                "name": "Primary Road",
                "terms": ""
            },
            "highway/primary_link": {
                "name": "Primary Link",
                "terms": "ramp,on ramp,off ramp"
            },
            "highway/residential": {
                "name": "Residential Road",
                "terms": ""
            },
            "highway/road": {
                "name": "Unknown Road",
                "terms": ""
            },
            "highway/secondary": {
                "name": "Secondary Road",
                "terms": ""
            },
            "highway/secondary_link": {
                "name": "Secondary Link",
                "terms": "ramp,on ramp,off ramp"
            },
            "highway/service": {
                "name": "Service Road",
                "terms": ""
            },
            "highway/steps": {
                "name": "Steps",
                "terms": "stairs,staircase"
            },
            "highway/tertiary": {
                "name": "Tertiary Road",
                "terms": ""
            },
            "highway/tertiary_link": {
                "name": "Tertiary Link",
                "terms": "ramp,on ramp,off ramp"
            },
            "highway/track": {
                "name": "Track",
                "terms": ""
            },
            "highway/traffic_signals": {
                "name": "Traffic Signals",
                "terms": "light,stoplight,traffic light"
            },
            "highway/trunk": {
                "name": "Trunk Road",
                "terms": ""
            },
            "highway/trunk_link": {
                "name": "Trunk Link",
                "terms": "ramp,on ramp,off ramp"
            },
            "highway/turning_circle": {
                "name": "Turning Circle",
                "terms": ""
            },
            "highway/unclassified": {
                "name": "Unclassified Road",
                "terms": ""
            },
            "historic": {
                "name": "Historic Site",
                "terms": ""
            },
            "historic/archaeological_site": {
                "name": "Archaeological Site",
                "terms": ""
            },
            "historic/boundary_stone": {
                "name": "Boundary Stone",
                "terms": ""
            },
            "historic/castle": {
                "name": "Castle",
                "terms": ""
            },
            "historic/memorial": {
                "name": "Memorial",
                "terms": ""
            },
            "historic/monument": {
                "name": "Monument",
                "terms": ""
            },
            "historic/ruins": {
                "name": "Ruins",
                "terms": ""
            },
            "historic/wayside_cross": {
                "name": "Wayside Cross",
                "terms": ""
            },
            "historic/wayside_shrine": {
                "name": "Wayside Shrine",
                "terms": ""
            },
            "landuse": {
                "name": "Landuse",
                "terms": ""
            },
            "landuse/allotments": {
                "name": "Allotments",
                "terms": ""
            },
            "landuse/basin": {
                "name": "Basin",
                "terms": ""
            },
            "landuse/cemetery": {
                "name": "Cemetery",
                "terms": ""
            },
            "landuse/commercial": {
                "name": "Commercial",
                "terms": ""
            },
            "landuse/construction": {
                "name": "Construction",
                "terms": ""
            },
            "landuse/farm": {
                "name": "Farm",
                "terms": ""
            },
            "landuse/farmyard": {
                "name": "Farmyard",
                "terms": ""
            },
            "landuse/forest": {
                "name": "Forest",
                "terms": ""
            },
            "landuse/grass": {
                "name": "Grass",
                "terms": ""
            },
            "landuse/industrial": {
                "name": "Industrial",
                "terms": ""
            },
            "landuse/meadow": {
                "name": "Meadow",
                "terms": ""
            },
            "landuse/orchard": {
                "name": "Orchard",
                "terms": ""
            },
            "landuse/quarry": {
                "name": "Quarry",
                "terms": ""
            },
            "landuse/residential": {
                "name": "Residential",
                "terms": ""
            },
            "landuse/vineyard": {
                "name": "Vineyard",
                "terms": ""
            },
            "leisure": {
                "name": "Leisure",
                "terms": ""
            },
            "leisure/garden": {
                "name": "Garden",
                "terms": ""
            },
            "leisure/golf_course": {
                "name": "Golf Course",
                "terms": ""
            },
            "leisure/marina": {
                "name": "Marina",
                "terms": ""
            },
            "leisure/park": {
                "name": "Park",
                "terms": "esplanade,estate,forest,garden,grass,green,grounds,lawn,lot,meadow,parkland,place,playground,plaza,pleasure garden,recreation area,square,tract,village green,woodland"
            },
            "leisure/pitch": {
                "name": "Sport Pitch",
                "terms": ""
            },
            "leisure/pitch/american_football": {
                "name": "American Football Field",
                "terms": ""
            },
            "leisure/pitch/baseball": {
                "name": "Baseball Diamond",
                "terms": ""
            },
            "leisure/pitch/basketball": {
                "name": "Basketball Court",
                "terms": ""
            },
            "leisure/pitch/soccer": {
                "name": "Soccer Field",
                "terms": ""
            },
            "leisure/pitch/tennis": {
                "name": "Tennis Court",
                "terms": ""
            },
            "leisure/playground": {
                "name": "Playground",
                "terms": ""
            },
            "leisure/slipway": {
                "name": "Slipway",
                "terms": ""
            },
            "leisure/stadium": {
                "name": "Stadium",
                "terms": ""
            },
            "leisure/swimming_pool": {
                "name": "Swimming Pool",
                "terms": ""
            },
            "man_made": {
                "name": "Man Made",
                "terms": ""
            },
            "man_made/lighthouse": {
                "name": "Lighthouse",
                "terms": ""
            },
            "man_made/pier": {
                "name": "Pier",
                "terms": ""
            },
            "man_made/survey_point": {
                "name": "Survey Point",
                "terms": ""
            },
            "man_made/wastewater_plant": {
                "name": "Wastewater Plant",
                "terms": "sewage works,sewage treatment plant,water treatment plant,reclamation plant"
            },
            "man_made/water_tower": {
                "name": "Water Tower",
                "terms": ""
            },
            "man_made/water_works": {
                "name": "Water Works",
                "terms": ""
            },
            "natural": {
                "name": "Natural",
                "terms": ""
            },
            "natural/bay": {
                "name": "Bay",
                "terms": ""
            },
            "natural/beach": {
                "name": "Beach",
                "terms": ""
            },
            "natural/cliff": {
                "name": "Cliff",
                "terms": ""
            },
            "natural/coastline": {
                "name": "Coastline",
                "terms": "shore"
            },
            "natural/glacier": {
                "name": "Glacier",
                "terms": ""
            },
            "natural/grassland": {
                "name": "Grassland",
                "terms": ""
            },
            "natural/heath": {
                "name": "Heath",
                "terms": ""
            },
            "natural/peak": {
                "name": "Peak",
                "terms": "acme,aiguille,alp,climax,crest,crown,hill,mount,mountain,pinnacle,summit,tip,top"
            },
            "natural/scrub": {
                "name": "Scrub",
                "terms": ""
            },
            "natural/spring": {
                "name": "Spring",
                "terms": ""
            },
            "natural/tree": {
                "name": "Tree",
                "terms": ""
            },
            "natural/water": {
                "name": "Water",
                "terms": ""
            },
            "natural/water/lake": {
                "name": "Lake",
                "terms": "lakelet,loch,mere"
            },
            "natural/water/pond": {
                "name": "Pond",
                "terms": "lakelet,millpond,tarn,pool,mere"
            },
            "natural/water/reservoir": {
                "name": "Reservoir",
                "terms": ""
            },
            "natural/wetland": {
                "name": "Wetland",
                "terms": ""
            },
            "natural/wood": {
                "name": "Wood",
                "terms": ""
            },
            "office": {
                "name": "Office",
                "terms": ""
            },
            "other": {
                "name": "Other",
                "terms": ""
            },
            "other_area": {
                "name": "Other",
                "terms": ""
            },
            "place": {
                "name": "Place",
                "terms": ""
            },
            "place/hamlet": {
                "name": "Hamlet",
                "terms": ""
            },
            "place/island": {
                "name": "Island",
                "terms": "archipelago,atoll,bar,cay,isle,islet,key,reef"
            },
            "place/locality": {
                "name": "Locality",
                "terms": ""
            },
            "place/village": {
                "name": "Village",
                "terms": ""
            },
            "power": {
                "name": "Power",
                "terms": ""
            },
            "power/generator": {
                "name": "Power Plant",
                "terms": ""
            },
            "power/line": {
                "name": "Power Line",
                "terms": ""
            },
            "power/pole": {
                "name": "Power Pole",
                "terms": ""
            },
            "power/sub_station": {
                "name": "Substation",
                "terms": ""
            },
            "power/tower": {
                "name": "High-Voltage Tower",
                "terms": ""
            },
            "power/transformer": {
                "name": "Transformer",
                "terms": ""
            },
            "railway": {
                "name": "Railway",
                "terms": ""
            },
            "railway/abandoned": {
                "name": "Abandoned Railway",
                "terms": ""
            },
            "railway/disused": {
                "name": "Disused Railway",
                "terms": ""
            },
            "railway/level_crossing": {
                "name": "Level Crossing",
                "terms": "crossing,railroad crossing,railway crossing,grade crossing,road through railroad,train crossing"
            },
            "railway/monorail": {
                "name": "Monorail",
                "terms": ""
            },
            "railway/rail": {
                "name": "Rail",
                "terms": ""
            },
            "railway/subway": {
                "name": "Subway",
                "terms": ""
            },
            "railway/subway_entrance": {
                "name": "Subway Entrance",
                "terms": ""
            },
            "railway/tram": {
                "name": "Tram",
                "terms": "streetcar"
            },
            "shop": {
                "name": "Shop",
                "terms": ""
            },
            "shop/alcohol": {
                "name": "Liquor Store",
                "terms": ""
            },
            "shop/bakery": {
                "name": "Bakery",
                "terms": ""
            },
            "shop/beauty": {
                "name": "Beauty Shop",
                "terms": ""
            },
            "shop/beverages": {
                "name": "Beverage Store",
                "terms": ""
            },
            "shop/bicycle": {
                "name": "Bicycle Shop",
                "terms": ""
            },
            "shop/books": {
                "name": "Bookstore",
                "terms": ""
            },
            "shop/boutique": {
                "name": "Boutique",
                "terms": ""
            },
            "shop/butcher": {
                "name": "Butcher",
                "terms": ""
            },
            "shop/car": {
                "name": "Car Dealership",
                "terms": ""
            },
            "shop/car_parts": {
                "name": "Car Parts Store",
                "terms": ""
            },
            "shop/car_repair": {
                "name": "Car Repair Shop",
                "terms": ""
            },
            "shop/chemist": {
                "name": "Chemist",
                "terms": ""
            },
            "shop/clothes": {
                "name": "Clothing Store",
                "terms": ""
            },
            "shop/computer": {
                "name": "Computer Store",
                "terms": ""
            },
            "shop/confectionery": {
                "name": "Confectionery",
                "terms": ""
            },
            "shop/convenience": {
                "name": "Convenience Store",
                "terms": ""
            },
            "shop/deli": {
                "name": "Deli",
                "terms": ""
            },
            "shop/department_store": {
                "name": "Department Store",
                "terms": ""
            },
            "shop/doityourself": {
                "name": "DIY Store",
                "terms": ""
            },
            "shop/dry_cleaning": {
                "name": "Dry Cleaners",
                "terms": ""
            },
            "shop/electronics": {
                "name": "Electronics Store",
                "terms": ""
            },
            "shop/fishmonger": {
                "name": "Fishmonger",
                "terms": ""
            },
            "shop/florist": {
                "name": "Florist",
                "terms": ""
            },
            "shop/furniture": {
                "name": "Furniture Store",
                "terms": ""
            },
            "shop/garden_centre": {
                "name": "Garden Center",
                "terms": ""
            },
            "shop/gift": {
                "name": "Gift Shop",
                "terms": ""
            },
            "shop/greengrocer": {
                "name": "Greengrocer",
                "terms": ""
            },
            "shop/hairdresser": {
                "name": "Hairdresser",
                "terms": ""
            },
            "shop/hardware": {
                "name": "Hardware Store",
                "terms": ""
            },
            "shop/hifi": {
                "name": "Hifi Store",
                "terms": ""
            },
            "shop/jewelry": {
                "name": "Jeweler",
                "terms": ""
            },
            "shop/kiosk": {
                "name": "Kiosk",
                "terms": ""
            },
            "shop/laundry": {
                "name": "Laundry",
                "terms": ""
            },
            "shop/mall": {
                "name": "Mall",
                "terms": ""
            },
            "shop/mobile_phone": {
                "name": "Mobile Phone Store",
                "terms": ""
            },
            "shop/motorcycle": {
                "name": "Motorcycle Dealership",
                "terms": ""
            },
            "shop/music": {
                "name": "Music Store",
                "terms": ""
            },
            "shop/newsagent": {
                "name": "Newsagent",
                "terms": ""
            },
            "shop/optician": {
                "name": "Optician",
                "terms": ""
            },
            "shop/outdoor": {
                "name": "Outdoor Store",
                "terms": ""
            },
            "shop/pet": {
                "name": "Pet Store",
                "terms": ""
            },
            "shop/shoes": {
                "name": "Shoe Store",
                "terms": ""
            },
            "shop/sports": {
                "name": "Sporting Goods Store",
                "terms": ""
            },
            "shop/stationery": {
                "name": "Stationery Store",
                "terms": ""
            },
            "shop/supermarket": {
                "name": "Supermarket",
                "terms": "bazaar,boutique,chain,co-op,cut-rate store,discount store,five-and-dime,flea market,galleria,mall,mart,outlet,outlet store,shop,shopping center,shopping plaza,stand,store,supermarket,thrift shop"
            },
            "shop/toys": {
                "name": "Toy Store",
                "terms": ""
            },
            "shop/travel_agency": {
                "name": "Travel Agency",
                "terms": ""
            },
            "shop/tyres": {
                "name": "Tire Store",
                "terms": ""
            },
            "shop/vacant": {
                "name": "Vacant Shop",
                "terms": ""
            },
            "shop/variety_store": {
                "name": "Variety Store",
                "terms": ""
            },
            "shop/video": {
                "name": "Video Store",
                "terms": ""
            },
            "tourism": {
                "name": "Tourism",
                "terms": ""
            },
            "tourism/alpine_hut": {
                "name": "Alpine Hut",
                "terms": ""
            },
            "tourism/artwork": {
                "name": "Artwork",
                "terms": ""
            },
            "tourism/attraction": {
                "name": "Tourist Attraction",
                "terms": ""
            },
            "tourism/camp_site": {
                "name": "Camp Site",
                "terms": ""
            },
            "tourism/caravan_site": {
                "name": "RV Park",
                "terms": ""
            },
            "tourism/chalet": {
                "name": "Chalet",
                "terms": ""
            },
            "tourism/guest_house": {
                "name": "Guest House",
                "terms": "B&B,Bed & Breakfast,Bed and Breakfast"
            },
            "tourism/hostel": {
                "name": "Hostel",
                "terms": ""
            },
            "tourism/hotel": {
                "name": "Hotel",
                "terms": ""
            },
            "tourism/information": {
                "name": "Information",
                "terms": ""
            },
            "tourism/motel": {
                "name": "Motel",
                "terms": ""
            },
            "tourism/museum": {
                "name": "Museum",
                "terms": "exhibition,exhibits archive,foundation,gallery,hall,institution,library,menagerie,repository,salon,storehouse,treasury,vault"
            },
            "tourism/picnic_site": {
                "name": "Picnic Site",
                "terms": ""
            },
            "tourism/theme_park": {
                "name": "Theme Park",
                "terms": ""
            },
            "tourism/viewpoint": {
                "name": "Viewpoint",
                "terms": ""
            },
            "tourism/zoo": {
                "name": "Zoo",
                "terms": ""
            },
            "waterway": {
                "name": "Waterway",
                "terms": ""
            },
            "waterway/canal": {
                "name": "Canal",
                "terms": ""
            },
            "waterway/dam": {
                "name": "Dam",
                "terms": ""
            },
            "waterway/ditch": {
                "name": "Ditch",
                "terms": ""
            },
            "waterway/drain": {
                "name": "Drain",
                "terms": ""
            },
            "waterway/river": {
                "name": "River",
                "terms": "beck,branch,brook,course,creek,estuary,rill,rivulet,run,runnel,stream,tributary,watercourse"
            },
            "waterway/riverbank": {
                "name": "Riverbank",
                "terms": ""
            },
            "waterway/stream": {
                "name": "Stream",
                "terms": "beck,branch,brook,burn,course,creek,current,drift,flood,flow,freshet,race,rill,rindle,rivulet,run,runnel,rush,spate,spritz,surge,tide,torrent,tributary,watercourse"
            },
            "waterway/weir": {
                "name": "Weir",
                "terms": ""
            }
        }
    }
};
locale.zh = {
    "modes": {
        "add_area": {
            "title": "面",
            "description": "在地图上添加公园，建筑物，湖泊或其他面状区域。",
            "tail": "在地图上点击开始绘制一个区域，像一个公园，湖边，或建筑物。"
        },
        "add_line": {
            "title": "线",
            "description": "在地图上添加公路，街道，行人路，运河或其他线路。",
            "tail": "在地图上点击开始绘制道路，路径或路线。"
        },
        "add_point": {
            "title": "点",
            "description": "在地图上添加餐馆，古迹，邮箱或其他点。",
            "tail": "在地图上点击添加一个点。"
        },
        "browse": {
            "title": "浏览",
            "description": "平移和缩放地图。"
        },
        "draw_area": {
            "tail": "通过点击给你的面添加结点。单击第一个点完成面的绘制。"
        },
        "draw_line": {
            "tail": "通过单击给线添加更多的点。点击其他线路连接它们，双击结束。"
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "添加一个点。",
                "vertex": "给线添加一个节点。"
            }
        },
        "start": {
            "annotation": {
                "line": "开始一条线。",
                "area": "开始一个面。"
            }
        },
        "continue": {
            "annotation": {
                "line": "接着绘制一条线。",
                "area": "接着绘制一个面。"
            }
        },
        "cancel_draw": {
            "annotation": "取消绘图。"
        },
        "change_tags": {
            "annotation": "改变标签。"
        },
        "circularize": {
            "title": "圆",
            "key": "O",
            "annotation": {
                "line": "把线制作成圆形。",
                "area": "把面制作成圆形。"
            }
        },
        "orthogonalize": {
            "title": "直角化",
            "description": "边角直角化。",
            "key": "Q",
            "annotation": {
                "line": "线直角化。",
                "area": "面直角化。"
            }
        },
        "delete": {
            "title": "删除",
            "description": "从地图中删除此。",
            "annotation": {
                "point": "删除一个点。",
                "vertex": "删除线上一个结点。",
                "line": "删除一条点。",
                "area": "删除一个面。",
                "relation": "删除一个关系。",
                "multiple": "删除{n}个对象。"
            }
        },
        "connect": {
            "annotation": {
                "point": "连接线到一个点上。",
                "vertex": "连接线到另一条线上。",
                "line": "连接线到一条线上。",
                "area": "连接线到一个面上。"
            }
        },
        "disconnect": {
            "title": "断开",
            "description": "断开这些线。",
            "key": "D",
            "annotation": "断开线。"
        },
        "merge": {
            "title": "合并",
            "description": "合并这些线。",
            "key": "C",
            "annotation": "合并{n}条线。"
        },
        "move": {
            "title": "移动",
            "description": "移动到其他的位置。",
            "key": "M",
            "annotation": {
                "point": "移动一个点。",
                "vertex": "移动线上一个结点",
                "line": "移动一条线。",
                "area": "移动一个面。",
                "multiple": "移动多个对象。"
            }
        },
        "rotate": {
            "title": "旋转",
            "description": "绕其中心点旋转该对象。",
            "key": "R",
            "annotation": {
                "line": "旋转一条线。",
                "area": "旋转一个面。"
            }
        },
        "reverse": {
            "title": "反转",
            "description": "这条线走在相反的方向。",
            "key": "V",
            "annotation": "反转一条线。"
        },
        "split": {
            "title": "分割",
            "key": "X"
        }
    },
    "nothing_to_undo": "没有可撤消的。",
    "nothing_to_redo": "没有可重做的。",
    "just_edited": "你正在编辑的OpenStreetMap！",
    "browser_notice": "该编辑器支持Firefox、Chrome、Safari、Opera和Internet Explorer9及以上的浏览器。请升级您的浏览器或者使用Potlatch 2来编辑地图。",
    "view_on_osm": "在OSM上查看",
    "zoom_in_edit": "放大编辑地图",
    "logout": "退出",
    "report_a_bug": "报告bug",
    "commit": {
        "title": "保存更改",
        "description_placeholder": "简要说明你的贡献",
        "message_label": "提交说明",
        "upload_explanation": "{user}你上传的更新将会显示在所有使用OpenStreetMap数据的地图上。",
        "save": "保存",
        "cancel": "取消",
        "warnings": "警告",
        "modified": "修改的",
        "deleted": "删除的",
        "created": "创建的"
    },
    "contributors": {
        "list": "查看{users}的贡献",
        "truncated_list": "查看{users}和其他{count}个成员的贡献"
    },
    "geocoder": {
        "title": "查找位置",
        "placeholder": "查找位置",
        "no_results": "无法找到叫'{name}'的地方"
    },
    "geolocate": {
        "title": "显示我的位置"
    },
    "inspector": {
        "no_documentation_combination": "没有关于此标签组合的文档",
        "no_documentation_key": "没有关于此键的文档",
        "show_more": "显示更多",
        "new_tag": "新建标签",
        "view_on_osm": "在OSM上查看",
        "editing_feature": "编辑{feature}",
        "additional": "附加标签",
        "choose": "选择对象的类型",
        "results": "{search}共有{n}个结果",
        "reference": "查看 OpenStreetMap Wiki →",
        "back_tooltip": "修改对象的类型"
    },
    "background": {
        "title": "背景",
        "description": "设置背景",
        "percent_brightness": "{opacity}% 亮度",
        "fix_misalignment": "修复错位",
        "reset": "重置"
    },
    "restore": {
        "heading": "您有未保存的更改",
        "description": "上次您有未保存的更改。你想恢复这些更改吗？",
        "restore": "恢复",
        "reset": "重置"
    },
    "save": {
        "title": "保存",
        "help": "保存更改到OpenStreetMap上，使其他用户可以看见。",
        "no_changes": "没有可以保存的更改。",
        "error": "保存发生错误",
        "uploading": "正在向OpenStreetMap上传更改。",
        "unsaved_changes": "您有未保存的更改"
    },
    "splash": {
        "welcome": "欢迎使用OpenStreetMap编辑器iD",
        "text": "这是开发版本{version}。欲了解更多信息，请参阅{website}，在{github}报告bug。",
        "walkthrough": "开始练习",
        "start": "现在编辑"
    },
    "source_switch": {
        "live": "live",
        "lose_changes": "您有未保存的更改。切换地图服务器会丢弃他们。你确定要切换服务器吗？",
        "dev": "dev"
    },
    "tag_reference": {
        "description": "描述",
        "on_wiki": "在wiki.osm.org查看{tag}",
        "used_with": "使用{type}"
    },
    "validations": {
        "untagged_point": "未标记点，他并不是线或面的一部分",
        "untagged_line": "未标记的线",
        "untagged_area": "未标记的面",
        "many_deletions": "您正在删除{n}个对象。你确定你想这样做吗？所有的其他openstreetmap.org用户都将在地图上看不到这些数据。",
        "tag_suggests_area": "{tag}这个标签建议使用在面上，但是他不是一个面",
        "deprecated_tags": "已过时标签：{tags}"
    },
    "zoom": {
        "in": "放大",
        "out": "缩小"
    },
    "gpx": {
        "local_layer": "本地GPX文件",
        "drag_drop": "把GPX文件拖到页面上。"
    },
    "help": {
        "title": "帮助"
    },
    "presets": {
        "fields": {
            "access": {
                "label": "通道"
            },
            "address": {
                "label": "地址",
                "placeholders": {
                    "housename": "房屋名称",
                    "number": "123",
                    "street": "街道",
                    "city": "城市"
                }
            },
            "aeroway": {
                "label": "类型"
            },
            "amenity": {
                "label": "类型"
            },
            "atm": {
                "label": "ATM"
            },
            "barrier": {
                "label": "类型"
            },
            "bicycle_parking": {
                "label": "类型"
            },
            "building": {
                "label": "建筑物"
            },
            "building_area": {
                "label": "建筑物"
            },
            "building_yes": {
                "label": "建筑物"
            },
            "capacity": {
                "label": "容量"
            },
            "collection_times": {
                "label": "收集时间"
            },
            "construction": {
                "label": "类型"
            },
            "country": {
                "label": "国家"
            },
            "crossing": {
                "label": "类型"
            },
            "cuisine": {
                "label": "美食"
            },
            "denomination": {
                "label": "教派"
            },
            "denotation": {
                "label": "意思"
            },
            "elevation": {
                "label": "海拔"
            },
            "emergency": {
                "label": "急诊"
            },
            "entrance": {
                "label": "类型"
            },
            "fax": {
                "label": "传真"
            },
            "fee": {
                "label": "费用"
            },
            "highway": {
                "label": "类型"
            },
            "historic": {
                "label": "类型"
            },
            "internet_access": {
                "label": "互联网接入",
                "options": {
                    "wlan": "无线网络",
                    "wired": "有线网络",
                    "terminal": "终端"
                }
            },
            "landuse": {
                "label": "类型"
            },
            "layer": {
                "label": "层"
            },
            "leisure": {
                "label": "类型"
            },
            "levels": {
                "label": "级别"
            },
            "man_made": {
                "label": "类型"
            },
            "maxspeed": {
                "label": "限速"
            },
            "name": {
                "label": "名称"
            },
            "natural": {
                "label": "自然"
            },
            "network": {
                "label": "网络"
            },
            "note": {
                "label": "备注"
            },
            "office": {
                "label": "类型"
            },
            "oneway": {
                "label": "单行"
            },
            "oneway_yes": {
                "label": "单行"
            },
            "opening_hours": {
                "label": "小时"
            },
            "operator": {
                "label": "经营者"
            },
            "phone": {
                "label": "手机"
            },
            "place": {
                "label": "类型"
            },
            "power": {
                "label": "类型"
            },
            "railway": {
                "label": "类型"
            },
            "ref": {
                "label": "参考"
            },
            "religion": {
                "label": "宗教",
                "options": {
                    "christian": "基督教",
                    "muslim": "穆斯林",
                    "buddhist": "佛教",
                    "jewish": "犹太教",
                    "hindu": "印度教",
                    "shinto": "神道教",
                    "taoist": "道教"
                }
            },
            "service": {
                "label": "类型"
            },
            "shelter": {
                "label": "避难所"
            },
            "shop": {
                "label": "类型"
            },
            "source": {
                "label": "来源"
            },
            "sport": {
                "label": "运动"
            },
            "structure": {
                "label": "结构",
                "options": {
                    "bridge": "桥",
                    "tunnel": "隧道",
                    "embankment": "堤岸",
                    "cutting": "开凿"
                }
            },
            "surface": {
                "label": "表面"
            },
            "tourism": {
                "label": "类型"
            },
            "water": {
                "label": "类型"
            },
            "waterway": {
                "label": "类型"
            },
            "website": {
                "label": "网站"
            },
            "wetland": {
                "label": "类型"
            },
            "wheelchair": {
                "label": "轮椅通道"
            },
            "wikipedia": {
                "label": "维基百科"
            },
            "wood": {
                "label": "类型"
            }
        },
        "presets": {
            "aeroway": {
                "name": "机场相关道路"
            },
            "aeroway/aerodrome": {
                "name": "机场",
                "terms": "飞机,机场,机场"
            },
            "aeroway/helipad": {
                "name": "直升机场",
                "terms": "直升机,直升机停机坪,直升机场"
            },
            "amenity": {
                "name": "便利设施"
            },
            "amenity/bank": {
                "name": "银行"
            },
            "amenity/bar": {
                "name": "酒吧"
            },
            "amenity/bench": {
                "name": "长凳"
            },
            "amenity/bicycle_parking": {
                "name": "自行车停放处"
            },
            "amenity/bicycle_rental": {
                "name": "自行车租赁处"
            },
            "amenity/cafe": {
                "name": "咖啡",
                "terms": "咖啡,茶,咖啡馆"
            },
            "amenity/cinema": {
                "name": "电影院"
            },
            "amenity/courthouse": {
                "name": "法院"
            },
            "amenity/embassy": {
                "name": "使馆"
            },
            "amenity/fast_food": {
                "name": "快餐"
            },
            "amenity/fire_station": {
                "name": "消防站"
            },
            "amenity/fuel": {
                "name": "加油站"
            },
            "amenity/grave_yard": {
                "name": "墓地"
            },
            "amenity/hospital": {
                "name": "医院"
            },
            "amenity/library": {
                "name": "图书馆"
            },
            "amenity/marketplace": {
                "name": "市场"
            },
            "amenity/parking": {
                "name": "停车场"
            },
            "amenity/pharmacy": {
                "name": "药房"
            },
            "amenity/place_of_worship": {
                "name": "礼拜场所"
            },
            "amenity/place_of_worship/christian": {
                "name": "教堂"
            },
            "amenity/place_of_worship/jewish": {
                "name": "犹太教堂",
                "terms": "犹太人,犹太教堂"
            },
            "amenity/place_of_worship/muslim": {
                "name": "清真寺",
                "terms": "穆斯林,清真寺"
            },
            "amenity/police": {
                "name": "警察局"
            },
            "amenity/post_box": {
                "name": "邮箱",
                "terms": "邮件投递,信箱,邮筒,邮箱"
            },
            "amenity/post_office": {
                "name": "邮局"
            },
            "amenity/pub": {
                "name": "酒馆"
            },
            "amenity/restaurant": {
                "name": "餐馆"
            },
            "amenity/school": {
                "name": "学校"
            },
            "amenity/swimming_pool": {
                "name": "游泳池"
            },
            "amenity/telephone": {
                "name": "电话"
            },
            "amenity/theatre": {
                "name": "剧院"
            },
            "amenity/toilets": {
                "name": "厕所"
            },
            "amenity/townhall": {
                "name": "市政府"
            },
            "amenity/university": {
                "name": "大学"
            },
            "barrier": {
                "name": "屏障"
            },
            "barrier/block": {
                "name": "街区"
            },
            "barrier/bollard": {
                "name": "短柱"
            },
            "barrier/cattle_grid": {
                "name": "家畜栅栏"
            },
            "barrier/city_wall": {
                "name": "城墙"
            },
            "barrier/ditch": {
                "name": "沟"
            },
            "barrier/entrance": {
                "name": "入口"
            },
            "barrier/fence": {
                "name": "篱笆"
            },
            "barrier/gate": {
                "name": "门"
            },
            "barrier/lift_gate": {
                "name": "电梯门"
            },
            "barrier/retaining_wall": {
                "name": "挡土墙"
            },
            "barrier/toll_booth": {
                "name": "收费站"
            },
            "barrier/wall": {
                "name": "墙"
            },
            "building": {
                "name": "建筑物"
            },
            "building/apartments": {
                "name": "酒店公寓"
            },
            "building/entrance": {
                "name": "入口"
            },
            "entrance": {
                "name": "入口"
            },
            "highway": {
                "name": "公路"
            },
            "highway/bridleway": {
                "name": "马道",
                "terms": "楼梯"
            },
            "highway/bus_stop": {
                "name": "公交车站"
            },
            "highway/crossing": {
                "name": "路口",
                "terms": "人行横道,斑马线"
            },
            "highway/cycleway": {
                "name": "自行车道"
            },
            "highway/footway": {
                "name": "人行道"
            },
            "highway/motorway": {
                "name": "高速公路"
            },
            "highway/motorway_link": {
                "name": "高速公路匝道"
            },
            "highway/path": {
                "name": "路"
            },
            "highway/primary": {
                "name": "主要道路"
            },
            "highway/primary_link": {
                "name": "主要道路匝道"
            },
            "highway/residential": {
                "name": "住宅区道路"
            },
            "highway/road": {
                "name": "未知道路"
            },
            "highway/secondary": {
                "name": "次要道路"
            },
            "highway/secondary_link": {
                "name": "次要道路匝道"
            },
            "highway/service": {
                "name": "辅助道路"
            },
            "highway/steps": {
                "name": "台阶",
                "terms": "楼梯"
            },
            "highway/tertiary": {
                "name": "三级道路"
            },
            "highway/tertiary_link": {
                "name": "三级道路匝道"
            },
            "highway/track": {
                "name": "小路"
            },
            "highway/traffic_signals": {
                "name": "红绿灯",
                "terms": "灯,刹车灯,交通灯"
            },
            "highway/trunk": {
                "name": "干线道路"
            },
            "highway/trunk_link": {
                "name": "干线道路匝道"
            },
            "highway/turning_circle": {
                "name": "环岛"
            },
            "highway/unclassified": {
                "name": "未分级的道路"
            },
            "historic": {
                "name": "历史遗迹"
            },
            "historic/archaeological_site": {
                "name": "考古遗址"
            },
            "historic/boundary_stone": {
                "name": "界桩"
            },
            "historic/castle": {
                "name": "城堡"
            },
            "historic/memorial": {
                "name": "纪念馆"
            },
            "historic/monument": {
                "name": "纪念碑"
            },
            "historic/ruins": {
                "name": "废墟"
            },
            "historic/wayside_cross": {
                "name": "路边的十字架"
            },
            "historic/wayside_shrine": {
                "name": "路边的神社"
            },
            "landuse": {
                "name": "土地用途"
            },
            "landuse/allotments": {
                "name": "社区花园"
            },
            "landuse/basin": {
                "name": "水池"
            },
            "landuse/cemetery": {
                "name": "墓地"
            },
            "landuse/commercial": {
                "name": "商业区"
            },
            "landuse/construction": {
                "name": "建筑物"
            },
            "landuse/farm": {
                "name": "农场"
            },
            "landuse/farmyard": {
                "name": "农场"
            },
            "landuse/forest": {
                "name": "森林"
            },
            "landuse/grass": {
                "name": "草坪"
            },
            "landuse/industrial": {
                "name": "工业区"
            },
            "landuse/meadow": {
                "name": "牧场"
            },
            "landuse/orchard": {
                "name": "果园"
            },
            "landuse/quarry": {
                "name": "采石场"
            },
            "landuse/residential": {
                "name": "住宅区"
            },
            "landuse/vineyard": {
                "name": "葡萄园"
            },
            "leisure": {
                "name": "休闲场所"
            },
            "leisure/garden": {
                "name": "花园"
            },
            "leisure/golf_course": {
                "name": "高尔夫球场"
            },
            "leisure/marina": {
                "name": "码头"
            },
            "leisure/park": {
                "name": "公园"
            },
            "leisure/pitch": {
                "name": "运动场所"
            },
            "leisure/pitch/american_football": {
                "name": "美式足球场"
            },
            "leisure/pitch/baseball": {
                "name": "棒球场"
            },
            "leisure/pitch/basketball": {
                "name": "篮球场"
            },
            "leisure/pitch/soccer": {
                "name": "足球场"
            },
            "leisure/pitch/tennis": {
                "name": "网球场"
            },
            "leisure/playground": {
                "name": "运动场"
            },
            "leisure/slipway": {
                "name": "下水滑道"
            },
            "leisure/stadium": {
                "name": "体育场"
            },
            "leisure/swimming_pool": {
                "name": "游泳池"
            },
            "man_made": {
                "name": "人造的"
            },
            "man_made/lighthouse": {
                "name": "灯塔"
            },
            "man_made/pier": {
                "name": "码头"
            },
            "man_made/survey_point": {
                "name": "测量点"
            },
            "man_made/water_tower": {
                "name": "水塔"
            },
            "natural": {
                "name": "自然"
            },
            "natural/bay": {
                "name": "海湾"
            },
            "natural/beach": {
                "name": "海滩"
            },
            "natural/cliff": {
                "name": "悬崖"
            },
            "natural/coastline": {
                "name": "海岸线",
                "terms": "岸"
            },
            "natural/glacier": {
                "name": "冰川"
            },
            "natural/grassland": {
                "name": "草原"
            },
            "natural/heath": {
                "name": "荒野"
            },
            "natural/peak": {
                "name": "山峰"
            },
            "natural/scrub": {
                "name": "灌木丛"
            },
            "natural/spring": {
                "name": "泉水"
            },
            "natural/tree": {
                "name": "树"
            },
            "natural/water": {
                "name": "水"
            },
            "natural/water/lake": {
                "name": "湖泊",
                "terms": "小湖,湖"
            },
            "natural/water/pond": {
                "name": "池塘"
            },
            "natural/water/reservoir": {
                "name": "水库"
            },
            "natural/wetland": {
                "name": "湿地"
            },
            "natural/wood": {
                "name": "树林"
            },
            "office": {
                "name": "办公室"
            },
            "other": {
                "name": "其他"
            },
            "other_area": {
                "name": "其他"
            },
            "place": {
                "name": "地点"
            },
            "place/hamlet": {
                "name": "小村庄"
            },
            "place/island": {
                "name": "岛屿"
            },
            "place/locality": {
                "name": "位置"
            },
            "place/village": {
                "name": "村庄"
            },
            "power": {
                "name": "电力设施"
            },
            "power/generator": {
                "name": "发电厂"
            },
            "power/line": {
                "name": "电路线"
            },
            "power/pole": {
                "name": "电线杆"
            },
            "power/sub_station": {
                "name": "变电站"
            },
            "power/tower": {
                "name": "高压电塔"
            },
            "power/transformer": {
                "name": "变压器"
            },
            "railway": {
                "name": "铁路"
            },
            "railway/abandoned": {
                "name": "废弃的铁路"
            },
            "railway/disused": {
                "name": "废弃的铁路"
            },
            "railway/level_crossing": {
                "name": "平交路口"
            },
            "railway/monorail": {
                "name": "单轨铁路"
            },
            "railway/rail": {
                "name": "铁轨"
            },
            "railway/subway": {
                "name": "地铁"
            },
            "railway/subway_entrance": {
                "name": "地铁口"
            },
            "railway/tram": {
                "name": "电车",
                "terms": "电车"
            },
            "shop": {
                "name": "商店"
            },
            "shop/alcohol": {
                "name": "酒品店"
            },
            "shop/bakery": {
                "name": "面包店"
            },
            "shop/beauty": {
                "name": "美容店"
            },
            "shop/beverages": {
                "name": "饮料店"
            },
            "shop/bicycle": {
                "name": "自行车店"
            },
            "shop/books": {
                "name": "书店"
            },
            "shop/boutique": {
                "name": "精品店"
            },
            "shop/butcher": {
                "name": "肉贩"
            },
            "shop/car": {
                "name": "汽车经销商"
            },
            "shop/car_parts": {
                "name": "汽车配件店"
            },
            "shop/car_repair": {
                "name": "汽车修理店"
            },
            "shop/chemist": {
                "name": "药房"
            },
            "shop/clothes": {
                "name": "服装店"
            },
            "shop/computer": {
                "name": "电脑店"
            },
            "shop/confectionery": {
                "name": "糕饼"
            },
            "shop/convenience": {
                "name": "便利店"
            },
            "shop/deli": {
                "name": "熟食店"
            },
            "shop/department_store": {
                "name": "百货店"
            },
            "shop/doityourself": {
                "name": "DIY商店"
            },
            "shop/dry_cleaning": {
                "name": "干洗店"
            },
            "shop/electronics": {
                "name": "家电店"
            },
            "shop/fishmonger": {
                "name": "鱼贩"
            },
            "shop/florist": {
                "name": "花店"
            },
            "shop/furniture": {
                "name": "家具店"
            },
            "shop/garden_centre": {
                "name": "花店"
            },
            "shop/gift": {
                "name": "礼品店"
            },
            "shop/greengrocer": {
                "name": "蔬菜水果店"
            },
            "shop/hairdresser": {
                "name": "理发师"
            },
            "shop/hardware": {
                "name": "五金商店"
            },
            "shop/hifi": {
                "name": "音响店"
            },
            "shop/jewelry": {
                "name": "珠宝店"
            },
            "shop/kiosk": {
                "name": "报刊亭"
            },
            "shop/laundry": {
                "name": "洗衣店"
            },
            "shop/mall": {
                "name": "购物中心"
            },
            "shop/mobile_phone": {
                "name": "手机店"
            },
            "shop/motorcycle": {
                "name": "摩托车经销商"
            },
            "shop/music": {
                "name": "音乐店"
            },
            "shop/newsagent": {
                "name": "书报"
            },
            "shop/optician": {
                "name": "眼镜店"
            },
            "shop/outdoor": {
                "name": "户外店"
            },
            "shop/pet": {
                "name": "宠物店"
            },
            "shop/shoes": {
                "name": "鞋店"
            },
            "shop/sports": {
                "name": "体育用品店"
            },
            "shop/stationery": {
                "name": "文化用品店"
            },
            "shop/supermarket": {
                "name": "超级市场"
            },
            "shop/toys": {
                "name": "玩具店"
            },
            "shop/travel_agency": {
                "name": "旅行社"
            },
            "shop/tyres": {
                "name": "轮胎店"
            },
            "shop/vacant": {
                "name": "空置铺位"
            },
            "shop/variety_store": {
                "name": "杂货店"
            },
            "shop/video": {
                "name": "影像店"
            },
            "tourism": {
                "name": "旅游业"
            },
            "tourism/alpine_hut": {
                "name": "高山小屋"
            },
            "tourism/artwork": {
                "name": "艺术品"
            },
            "tourism/attraction": {
                "name": "旅游景点"
            },
            "tourism/camp_site": {
                "name": "露营区"
            },
            "tourism/caravan_site": {
                "name": "房车营地"
            },
            "tourism/chalet": {
                "name": "木屋"
            },
            "tourism/guest_house": {
                "name": "宾馆"
            },
            "tourism/hostel": {
                "name": "招待所"
            },
            "tourism/hotel": {
                "name": "旅馆"
            },
            "tourism/information": {
                "name": "信息板"
            },
            "tourism/motel": {
                "name": "汽车旅馆"
            },
            "tourism/museum": {
                "name": "博物馆"
            },
            "tourism/picnic_site": {
                "name": "郊游地点"
            },
            "tourism/theme_park": {
                "name": "主题公园"
            },
            "tourism/viewpoint": {
                "name": "景点"
            },
            "tourism/zoo": {
                "name": "动物园"
            },
            "waterway": {
                "name": "航道"
            },
            "waterway/canal": {
                "name": "运河"
            },
            "waterway/dam": {
                "name": "水坝"
            },
            "waterway/ditch": {
                "name": "沟渠"
            },
            "waterway/drain": {
                "name": "下水道"
            },
            "waterway/river": {
                "name": "河流"
            },
            "waterway/riverbank": {
                "name": "河堤"
            },
            "waterway/stream": {
                "name": "溪流"
            },
            "waterway/weir": {
                "name": "堤坝"
            }
        }
    }
};
locale.zh_TW = {
    "modes": {
        "add_area": {
            "title": "區域",
            "description": "在地圖上添加公園、建築物、湖泊或其他區域。",
            "tail": "按一下地圖來開始繪製一個區域，如公園、湖泊或建築物。"
        },
        "add_line": {
            "title": "線",
            "description": "在地圖上添加公路、街道、行人徑、運河或其他線段。",
            "tail": "按一下地圖來開始繪製道路、小徑或路徑。"
        },
        "add_point": {
            "title": "點",
            "description": "在地圖上添加餐廳、古蹪、郵箱或其他地點。",
            "tail": "按一下地圖來添加一個點。"
        },
        "browse": {
            "title": "瀏覽",
            "description": "平移及縮放地圖。"
        },
        "draw_area": {
            "tail": "按一下你的區域來為它添加點。按第一點來完成繪製這個區域。"
        },
        "draw_line": {
            "tail": "點擊線段以便添加更多點。按一下其他線段去連接它們，按兩下去完成繒製。"
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "添加了一點。",
                "vertex": "給路徑添加了一節點。"
            }
        },
        "start": {
            "annotation": {
                "line": "開始繪製一線段。",
                "area": "開始繪製一區域。"
            }
        },
        "continue": {
            "annotation": {
                "line": "繼續繪製一線段。",
                "area": "繼續繪製一區域。"
            }
        },
        "cancel_draw": {
            "annotation": "取消了繪圖。"
        },
        "change_tags": {
            "annotation": "修改了標籤。"
        },
        "circularize": {
            "title": "環形化",
            "key": "O",
            "annotation": {
                "line": "把一線段製成圓形。",
                "area": "把一區域製成圓形。"
            }
        },
        "orthogonalize": {
            "title": "直角化",
            "description": "把角落轉換成轉角。",
            "key": "Q",
            "annotation": {
                "line": "把線段上的角落換成轉角。",
                "area": "把區域的角落換成轉角"
            }
        },
        "delete": {
            "title": "刪除",
            "description": "從地圖上移除這個物件。",
            "annotation": {
                "point": "刪除了一點。",
                "vertex": "刪除了路徑上的一個節點。",
                "line": "刪除了一線段。",
                "area": "刪除了一區域。",
                "relation": "刪除了一關係",
                "multiple": "刪除了 {n} 個物件。"
            }
        },
        "connect": {
            "annotation": {
                "point": "已連接路徑到一點。",
                "vertex": "已連接路徑到另一路徑。",
                "line": "已連接路徑到一線段。",
                "area": "已連接路徑到一區域。"
            }
        },
        "disconnect": {
            "title": "斷開",
            "description": "斷開這些路徑。",
            "key": "D",
            "annotation": "斷開了路徑。"
        },
        "merge": {
            "title": "合併",
            "description": "合併這些線段。",
            "key": "C",
            "annotation": "合併了 {n} 條線段。"
        },
        "move": {
            "title": "移動",
            "description": "移動這物件到另一處。",
            "key": "M",
            "annotation": {
                "point": "移動了一點。",
                "vertex": "移動了路徑上的一節點。",
                "line": "移動了一線段。",
                "area": "移動了一區域。",
                "multiple": "移動了數個物件。"
            }
        },
        "rotate": {
            "title": "旋轉",
            "description": "讓這物件圍繞其中心點旋轉。",
            "key": "R",
            "annotation": {
                "line": "旋轉了一線段。",
                "area": "旋轉了一區域。"
            }
        },
        "reverse": {
            "title": "反轉",
            "description": "讓這線段循相反方向走。",
            "key": "V",
            "annotation": "反轉一線段。"
        },
        "split": {
            "title": "分割",
            "key": "X"
        }
    },
    "nothing_to_undo": "沒有動作可以撤銷。",
    "nothing_to_redo": "沒有動作可以重做。",
    "just_edited": "你剛剛編輯了OpenStreetMap！",
    "browser_notice": "這編輯器支援Firefox、Chrome、Safari、Opera及Internet Explorer 9或以上。請先把你的瀏覽器升級或使用Potlatch 2來編輯地圖。",
    "view_on_osm": "於OSM上顯示",
    "zoom_in_edit": "放大地圖以開始編輯",
    "logout": "登出",
    "report_a_bug": "報導錯誤",
    "commit": {
        "title": "儲存修改",
        "description_placeholder": "簡要描述你的貢獻",
        "upload_explanation": "你以 {user} 具名的修改將會在所有使用OpenStreetMap數據的地圖上看得見。",
        "save": "儲存",
        "cancel": "取消",
        "warnings": "警告",
        "modified": "已修改",
        "deleted": "已刪除",
        "created": "已創建"
    },
    "contributors": {
        "list": "正在觀看 {users} 的貢獻",
        "truncated_list": "正在觀看 {users} 和另外 {count} 個用戶的貢獻"
    },
    "geocoder": {
        "title": "尋找一地方",
        "placeholder": "尋找一地方",
        "no_results": "找不到名為 '{name}' 的地方"
    },
    "geolocate": {
        "title": "顯示我的位置"
    },
    "inspector": {
        "no_documentation_combination": "這個標籤組合沒有可用的文檔",
        "no_documentation_key": "這個鍵值沒有可用的文檔",
        "show_more": "顯示更多",
        "new_tag": "新的標籤",
        "view_on_osm": "在OSM上顯示",
        "editing_feature": "正在編輯 {feature}",
        "additional": "附加的標籤",
        "choose": "選擇功能種類",
        "results": "{search} 的 {n} 個結果",
        "reference": "查看OpenStreetMap Wiki →",
        "back_tooltip": "修改功能種類"
    },
    "background": {
        "title": "背景",
        "description": "背景設定",
        "percent_brightness": "{opacity}%的光度",
        "fix_misalignment": "校準",
        "reset": "重設"
    },
    "restore": {
        "description": "上一次你仍有未儲存的修改，你想恢復這些修改嗎﹖",
        "restore": "恢復",
        "reset": "重設"
    },
    "save": {
        "title": "儲存",
        "help": "儲存修改至OpenStreetMap，使其他用戶均可觀看你的修改。",
        "no_changes": "沒有修改需要儲存。",
        "error": "儲存時發生錯誤",
        "uploading": "正在上傳修改至OpenStreetMap。",
        "unsaved_changes": "你有未儲存的修改"
    },
    "splash": {
        "welcome": "歡迎使用iD OpenStreetMap編輯器",
        "text": "這是開發版本 {version}。欲知詳情請瀏覽 {website} 及於 {github} 報告錯誤。"
    },
    "source_switch": {
        "live": "實況模式",
        "dev": "開發模式"
    },
    "tag_reference": {
        "description": "描述",
        "on_wiki": "於wiki.osm.org上的 {tag}",
        "used_with": "可與 {type} 使用"
    },
    "validations": {
        "untagged_point": "未標記的點—不在任何線段或區域內",
        "untagged_line": "未標記的線段",
        "untagged_area": "未標記的區域",
        "many_deletions": "你正在刪除 {n} 個物件。這樣會從openstreetmap.org的地圖上刪除，你是否確定需要這樣做？",
        "tag_suggests_area": "{tag} 標籤所建議的線段應為區域，但這個不是一區域",
        "deprecated_tags": "已棄用的標籤︰{tags}"
    },
    "zoom": {
        "in": "放大",
        "out": "縮小"
    },
    "gpx": {
        "local_layer": "本機GPX檔案",
        "drag_drop": "拖放一個.gpx格式的檔案到本頁"
    },
    "presets": {
        "fields": {
            "access": {
                "label": "通道"
            },
            "address": {
                "label": "地址",
                "placeholders": {
                    "housename": "屋宇名稱",
                    "number": "123",
                    "street": "街道",
                    "city": "城市"
                }
            },
            "aeroway": {
                "label": "種類"
            },
            "amenity": {
                "label": "種類"
            },
            "atm": {
                "label": "自動取款機"
            },
            "bicycle_parking": {
                "label": "種類"
            },
            "building": {
                "label": "建築物"
            },
            "building_area": {
                "label": "建築物"
            },
            "building_yes": {
                "label": "建築物"
            },
            "capacity": {
                "label": "容量"
            },
            "collection_times": {
                "label": "收集時間"
            },
            "construction": {
                "label": "種類"
            },
            "country": {
                "label": "國家"
            },
            "crossing": {
                "label": "種類"
            },
            "cuisine": {
                "label": "美饌"
            },
            "denomination": {
                "label": "教派"
            },
            "denotation": {
                "label": "表示"
            },
            "elevation": {
                "label": "高度"
            },
            "emergency": {
                "label": "緊急"
            },
            "entrance": {
                "label": "種類"
            },
            "fax": {
                "label": "傳真"
            },
            "fee": {
                "label": "費用"
            },
            "highway": {
                "label": "種類"
            },
            "historic": {
                "label": "種類"
            },
            "internet_access": {
                "label": "網際網絡連接",
                "options": {
                    "wlan": "無線網絡",
                    "wired": "有線網絡",
                    "terminal": "終端"
                }
            },
            "landuse": {
                "label": "種類"
            },
            "layer": {
                "label": "層"
            },
            "leisure": {
                "label": "種類"
            },
            "levels": {
                "label": "級別"
            },
            "man_made": {
                "label": "種類"
            },
            "maxspeed": {
                "label": "速度限制"
            },
            "natural": {
                "label": "自然"
            },
            "network": {
                "label": "網絡"
            },
            "note": {
                "label": "備註"
            },
            "office": {
                "label": "種類"
            },
            "oneway": {
                "label": "單程"
            },
            "opening_hours": {
                "label": "小時"
            },
            "operator": {
                "label": "營運商"
            },
            "phone": {
                "label": "電話"
            },
            "place": {
                "label": "種類"
            },
            "railway": {
                "label": "種類"
            },
            "ref": {
                "label": "參考"
            },
            "religion": {
                "label": "宗教",
                "options": {
                    "christian": "基督教徒",
                    "muslim": "穆斯林",
                    "buddhist": "佛教徒",
                    "jewish": "猶太教徒",
                    "hindu": "印度教徒",
                    "shinto": "神道教徒",
                    "taoist": "道教徒"
                }
            },
            "service": {
                "label": "種類"
            },
            "shelter": {
                "label": "遮雨棚／涼亭"
            },
            "shop": {
                "label": "種類"
            },
            "source": {
                "label": "來源"
            },
            "sport": {
                "label": "運動"
            },
            "structure": {
                "label": "結構",
                "options": {
                    "bridge": "橋樑",
                    "tunnel": "隧道",
                    "embankment": "堤岸",
                    "cutting": "切割"
                }
            },
            "surface": {
                "label": "表面"
            },
            "tourism": {
                "label": "種類"
            },
            "water": {
                "label": "種類"
            },
            "waterway": {
                "label": "種類"
            },
            "website": {
                "label": "網站"
            },
            "wetland": {
                "label": "種類"
            },
            "wheelchair": {
                "label": "輪椅通道"
            },
            "wikipedia": {
                "label": "維基百科"
            },
            "wood": {
                "label": "種類"
            }
        },
        "presets": {
            "aeroway": {
                "name": "機場相關設施"
            },
            "aeroway/aerodrome": {
                "name": "機場",
                "terms": "飛機，飛機場，飛行場"
            },
            "aeroway/helipad": {
                "name": "直昇機場",
                "terms": "直升機，直升機坪，直升機場"
            },
            "amenity": {
                "name": "便利設施"
            },
            "amenity/bank": {
                "name": "銀行",
                "terms": "保險箱，帳房，信用合作社，受托人，國庫，基金，窖藏，投資機構，儲存庫，儲備，儲備，保險箱，存款，庫存，庫存，倉庫，倉庫，儲蓄及貸款協會，國庫，信託公司，窖"
            },
            "amenity/bar": {
                "name": "酒吧"
            },
            "amenity/bench": {
                "name": "長凳"
            },
            "amenity/bicycle_parking": {
                "name": "腳踏車停泊處"
            },
            "amenity/bicycle_rental": {
                "name": "腳踏車租賃"
            },
            "amenity/cafe": {
                "name": "咖啡廳",
                "terms": "咖啡，茶，咖啡店"
            },
            "amenity/cinema": {
                "name": "戲院",
                "terms": "大銀幕，電影院，電影，得來速影院，電影，電影，電影，電影院，電影院，電影，電影院，電影院，電影，電影，劇場，表演，銀幕"
            },
            "amenity/courthouse": {
                "name": "法院"
            },
            "amenity/embassy": {
                "name": "使館"
            },
            "amenity/fast_food": {
                "name": "快餐店"
            },
            "amenity/fire_station": {
                "name": "消防局"
            },
            "amenity/fuel": {
                "name": "加油站"
            },
            "amenity/grave_yard": {
                "name": "墓地"
            },
            "amenity/hospital": {
                "name": "醫院",
                "terms": "診所，急診室，衛生服務，安養院，醫院，醫院，療養院，療養院，療養院，療養院，醫務室，手術室，病房"
            },
            "amenity/library": {
                "name": "圖書館"
            },
            "amenity/parking": {
                "name": "停車場"
            },
            "amenity/pharmacy": {
                "name": "藥房"
            },
            "amenity/place_of_worship": {
                "name": "禮拜地方",
                "terms": "隱修院，宗座聖殿，伯特利，座堂，聖壇，附屬小教堂，小聖堂，教堂，信徒，神殿，祈禱場所，宗教場所，修道院附屬的教堂，傳道部，清真寺，小教堂，教區，小聖堂，聖所，聖地，猶太教堂，禮拜堂，寺廟"
            },
            "amenity/place_of_worship/christian": {
                "name": "教堂",
                "terms": "基督教，隱修院，宗座聖殿，伯特利，座堂，聖壇，附屬小教堂，小聖堂，教堂，信徒，神殿，祈禱場所，宗教場所，修道院附屬的教堂，傳道部，清真寺，小教堂，教區，小聖堂，聖所，聖地，猶太教堂，禮拜堂，寺廟"
            },
            "amenity/place_of_worship/jewish": {
                "name": "猶太教堂",
                "terms": "猶太教，猶太教堂"
            },
            "amenity/place_of_worship/muslim": {
                "name": "清真寺",
                "terms": "穆斯林，清真寺"
            },
            "amenity/police": {
                "name": "警察局",
                "terms": "徽章，警官，警官，警官，警官，男童軍，警官，警官，警官，警官，警官，軍團，警車，偵探，警官，警官，部隊，警官，憲兵，刑警，警官， 法律，執法，警官，警官，警官，警官，警察"
            },
            "amenity/post_box": {
                "name": "郵箱",
                "terms": "信箱，信箱，郵箱，郵箱，郵筒，郵箱"
            },
            "amenity/post_office": {
                "name": "郵政局"
            },
            "amenity/pub": {
                "name": "酒館"
            },
            "amenity/restaurant": {
                "name": "餐廳"
            },
            "amenity/school": {
                "name": "學校"
            },
            "amenity/swimming_pool": {
                "name": "游泳池"
            },
            "amenity/telephone": {
                "name": "電話"
            },
            "amenity/theatre": {
                "name": "劇院"
            },
            "amenity/toilets": {
                "name": "廁所"
            },
            "amenity/townhall": {
                "name": "市政廳"
            },
            "amenity/university": {
                "name": "大學"
            },
            "building": {
                "name": "建築物"
            },
            "building/entrance": {
                "name": "入口"
            },
            "entrance": {
                "name": "入口"
            },
            "highway": {
                "name": "公路"
            },
            "highway/bus_stop": {
                "name": "公共汽車站"
            },
            "highway/crossing": {
                "name": "路口"
            },
            "highway/cycleway": {
                "name": "自行車道"
            },
            "highway/footway": {
                "name": "小徑"
            },
            "highway/motorway": {
                "name": "高速公路"
            },
            "highway/path": {
                "name": "路徑"
            },
            "highway/primary": {
                "name": "主要道路"
            },
            "highway/residential": {
                "name": "住宅區道路"
            },
            "highway/secondary": {
                "name": "次要道路"
            },
            "highway/service": {
                "name": "輔助道路"
            },
            "highway/steps": {
                "name": "樓梯"
            },
            "highway/tertiary": {
                "name": "三級道路"
            },
            "highway/track": {
                "name": "軌道"
            },
            "highway/traffic_signals": {
                "name": "交通訊號"
            },
            "highway/trunk": {
                "name": "幹道"
            },
            "highway/turning_circle": {
                "name": "回轉圈"
            },
            "highway/unclassified": {
                "name": "未分類的道路"
            },
            "historic": {
                "name": "歷史遺址"
            },
            "historic/monument": {
                "name": "古蹟"
            },
            "landuse": {
                "name": "土地用途"
            },
            "landuse/allotments": {
                "name": "社區花園"
            },
            "landuse/basin": {
                "name": "水池"
            },
            "landuse/cemetery": {
                "name": "墳場"
            },
            "landuse/commercial": {
                "name": "商業區"
            },
            "landuse/construction": {
                "name": "施工"
            },
            "landuse/farm": {
                "name": "農場"
            },
            "landuse/farmyard": {
                "name": "農莊"
            },
            "landuse/forest": {
                "name": "森林"
            },
            "landuse/grass": {
                "name": "草地"
            },
            "landuse/industrial": {
                "name": "工業區"
            },
            "landuse/meadow": {
                "name": "牧場"
            },
            "landuse/orchard": {
                "name": "果園"
            },
            "landuse/quarry": {
                "name": "礦場"
            },
            "landuse/residential": {
                "name": "住宅區"
            },
            "landuse/vineyard": {
                "name": "酒莊"
            },
            "leisure": {
                "name": "優閒設施"
            },
            "leisure/garden": {
                "name": "花園"
            },
            "leisure/golf_course": {
                "name": "高爾夫球場"
            },
            "leisure/park": {
                "name": "公園"
            },
            "leisure/pitch": {
                "name": "運動場所"
            },
            "leisure/pitch/american_football": {
                "name": "美式足球場"
            },
            "leisure/pitch/baseball": {
                "name": "棒球場"
            },
            "leisure/pitch/basketball": {
                "name": "籃球場"
            },
            "leisure/pitch/soccer": {
                "name": "足球場"
            },
            "leisure/pitch/tennis": {
                "name": "網球場"
            },
            "leisure/playground": {
                "name": "遊樂場"
            },
            "leisure/stadium": {
                "name": "體育場"
            },
            "leisure/swimming_pool": {
                "name": "游泳池"
            },
            "man_made": {
                "name": "人造"
            },
            "man_made/lighthouse": {
                "name": "燈塔"
            },
            "man_made/pier": {
                "name": "碼頭"
            },
            "man_made/survey_point": {
                "name": "測量點"
            },
            "man_made/water_tower": {
                "name": "水塔"
            },
            "natural": {
                "name": "自然"
            },
            "natural/bay": {
                "name": "海灣"
            },
            "natural/beach": {
                "name": "沙灘"
            },
            "natural/cliff": {
                "name": "懸崖"
            },
            "natural/coastline": {
                "name": "海岸線",
                "terms": "岸"
            },
            "natural/glacier": {
                "name": "冰川"
            },
            "natural/grassland": {
                "name": "草原"
            },
            "natural/heath": {
                "name": "荒地"
            },
            "natural/peak": {
                "name": "山頂"
            },
            "natural/scrub": {
                "name": "灌木叢"
            },
            "natural/spring": {
                "name": "溫泉"
            },
            "natural/tree": {
                "name": "樹"
            },
            "natural/water": {
                "name": "水"
            },
            "natural/water/lake": {
                "name": "湖泊"
            },
            "natural/water/pond": {
                "name": "池塘"
            },
            "natural/water/reservoir": {
                "name": "水塘"
            },
            "natural/wetland": {
                "name": "濕地"
            },
            "natural/wood": {
                "name": "樹林"
            },
            "office": {
                "name": "辦公室"
            },
            "place": {
                "name": "可歸類的地方"
            },
            "place/hamlet": {
                "name": "村莊"
            },
            "place/island": {
                "name": "島嶼"
            },
            "place/locality": {
                "name": "未能歸類的地方"
            },
            "place/village": {
                "name": "村鎮"
            },
            "power/sub_station": {
                "name": "變電站"
            },
            "railway": {
                "name": "火車站"
            },
            "railway/level_crossing": {
                "name": "平交道"
            },
            "railway/rail": {
                "name": "鐵路"
            },
            "railway/subway": {
                "name": "地鐵"
            },
            "railway/subway_entrance": {
                "name": "地鐵入口"
            },
            "shop": {
                "name": "商店"
            },
            "shop/butcher": {
                "name": "肉販"
            },
            "shop/supermarket": {
                "name": "超級市場"
            },
            "tourism": {
                "name": "旅遊業"
            },
            "tourism/alpine_hut": {
                "name": "高山小屋"
            },
            "tourism/artwork": {
                "name": "藝術品"
            },
            "tourism/attraction": {
                "name": "觀光點"
            },
            "tourism/camp_site": {
                "name": "營地"
            },
            "tourism/caravan_site": {
                "name": "露營車停車場"
            },
            "tourism/chalet": {
                "name": "木屋"
            },
            "tourism/guest_house": {
                "name": "賓館"
            },
            "tourism/hostel": {
                "name": "旅舍"
            },
            "tourism/hotel": {
                "name": "酒店"
            },
            "tourism/information": {
                "name": "資訊"
            },
            "tourism/motel": {
                "name": "汽車旅館"
            },
            "tourism/museum": {
                "name": "博物館"
            },
            "tourism/picnic_site": {
                "name": "野餐地點"
            },
            "tourism/theme_park": {
                "name": "主題公園"
            },
            "tourism/viewpoint": {
                "name": "觀景點"
            },
            "tourism/zoo": {
                "name": "動物園"
            },
            "waterway": {
                "name": "水道"
            },
            "waterway/canal": {
                "name": "運河"
            },
            "waterway/dam": {
                "name": "堤壩"
            },
            "waterway/ditch": {
                "name": "溝"
            },
            "waterway/drain": {
                "name": "渠"
            },
            "waterway/river": {
                "name": "河流"
            },
            "waterway/riverbank": {
                "name": "河床"
            },
            "waterway/stream": {
                "name": "溪流"
            },
            "waterway/weir": {
                "name": "堤堰"
            }
        }
    }
};
locale.cs = {
    "modes": {
        "add_area": {
            "title": "Plocha",
            "description": "Přidat do mapy parky, budovy, jezera či jiné plochy.",
            "tail": "Klikněte na mapu a začněte tak kreslit plochu, jako třeba park, jezero nebo budovu."
        },
        "add_line": {
            "title": "Cesta",
            "description": "Přidat do mapy silnice, ulice, stezky, potoky či jiné cesty.",
            "tail": "Klikněte na mapu a začněte tak kreslit silnice, stezky nebo trasy."
        },
        "add_point": {
            "title": "Uzel",
            "description": "Přidat do mapy restaurace, poštovní schránky, zastávky či jiné uzly.",
            "tail": "Klikněte na mapu a přidejte tak uzel."
        },
        "browse": {
            "title": "Procházet",
            "description": "Posunutí a zvětšení mapy."
        },
        "draw_area": {
            "tail": "Uzly k oblasti přidáte kliknutím. Oblast uzavřete kliknutím na první uzel."
        },
        "draw_line": {
            "tail": "Uzly k cestě přidáte kliknutím. Když kliknete na jinou cestu, připojíte cesty k sobě. Cestu ukončíte dvojklikem."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Uzel přidán.",
                "vertex": "Uzel byl přidán k cestě."
            }
        },
        "start": {
            "annotation": {
                "line": "Vytvořen začátek cesty.",
                "area": "Vytvořen začátek plochy."
            }
        },
        "continue": {
            "annotation": {
                "line": "Cesta pokračuje.",
                "area": "Plocha pokračuje."
            }
        },
        "cancel_draw": {
            "annotation": "Kreslení přerušeno."
        },
        "change_tags": {
            "annotation": "Upraveny vlastnosti."
        },
        "circularize": {
            "title": "Zakulatit",
            "key": "O",
            "annotation": {
                "line": "Cesta zakulacena.",
                "area": "Plocha zakulacena."
            }
        },
        "orthogonalize": {
            "title": "Zhranatit",
            "description": "Udělat rohy čtvercové.",
            "key": "Q",
            "annotation": {
                "line": "Záhyby cesty byly zhranatěny.",
                "area": "Rohy plochy byly zhranatěny."
            }
        },
        "delete": {
            "title": "Smazat",
            "description": "Odstranit objekt z mapy.",
            "annotation": {
                "point": "Uzel byl smazán.",
                "vertex": "Uzel byl odstraněn z cesty.",
                "line": "Cesta byla smazána.",
                "area": "Plocha byla smazána.",
                "relation": "Relace byla smazána.",
                "multiple": "Bylo odstraněno {n} objektů."
            }
        },
        "connect": {
            "annotation": {
                "point": "Cesta byla připojena k uzlu.",
                "vertex": "Cesta byla připojena k jiné cestě.",
                "line": "Cesta byla připojena k cestě.",
                "area": "Cesta byla připojena k ploše."
            }
        },
        "disconnect": {
            "title": "Rozpojit",
            "description": "Rozpojit tyto cesty.",
            "key": "D",
            "annotation": "Odpojené cesty."
        },
        "merge": {
            "title": "Spojit",
            "description": "Spojit tyto cesty.",
            "key": "C",
            "annotation": "Bylo spojeno {n} cest."
        },
        "move": {
            "title": "Posunout",
            "description": "Posunout objekt na jiné místo.",
            "key": "M",
            "annotation": {
                "point": "Uzel posunut.",
                "vertex": "Uzel v cestě byl posunut.",
                "line": "Cesta byla posunuta.",
                "area": "Plocha byla posunuta.",
                "multiple": "Objekty byly posunuty."
            }
        },
        "rotate": {
            "title": "Otočit",
            "description": "Otočit tento objekt okolo středu.",
            "key": "R",
            "annotation": {
                "line": "Cesta byla otočena.",
                "area": "Plocha byla pootočena."
            }
        },
        "reverse": {
            "title": "Převrátit",
            "description": "Změnit směr cesty na opačný.",
            "key": "V",
            "annotation": "Ceta byla převrácena."
        },
        "split": {
            "title": "Rozdělit",
            "key": "X"
        }
    },
    "nothing_to_undo": "Není co vracet.",
    "nothing_to_redo": "Není co znovu provádět.",
    "just_edited": "Právě jste upravil OpenStreetMap!",
    "browser_notice": "Tento editor funguje ve Firefoxu, Chrome, Safari, Opeře a Internet Exploreru od verze 9. Musíte tedy upgradovat na novější verzi prohlížeče; nebo použijte editor Potlatch 2.",
    "view_on_osm": "Zobrazit na OSM",
    "zoom_in_edit": "zvětšit mapu kvůli editaci",
    "logout": "odhlásit",
    "loading_auth": "Připojuji se na OpenStreetMap...",
    "report_a_bug": "ohlásit chybu",
    "commit": {
        "title": "Uložit změny",
        "description_placeholder": "Stručný popis vašich úprav",
        "message_label": "Zpráva k publikaci",
        "upload_explanation": "Změny provedené pod jménem {user} budou viditelné na všech mapách postavených na datech z OpenStreetMap.",
        "save": "Uložit",
        "cancel": "Storno",
        "warnings": "Varování",
        "modified": "Upraveno",
        "deleted": "Smazáno",
        "created": "Vytvořeno"
    },
    "contributors": {
        "list": "Přispěli {users}",
        "truncated_list": "Přispěli {users} a {count} další."
    },
    "geocoder": {
        "title": "Najít místo",
        "placeholder": "Najít místo",
        "no_results": "Místo '{name}' nenalezeno"
    },
    "geolocate": {
        "title": "Ukázat moji polohu"
    },
    "inspector": {
        "no_documentation_combination": "K této kombinaci tagů není k dispozici dokumentace",
        "no_documentation_key": "K tomuto klíči není k dispozici dokumentace",
        "show_more": "Zobrazit víc",
        "new_tag": "Nová vlastnost",
        "view_on_osm": "Zobrazit na OSM →",
        "editing_feature": "Editace {feature}",
        "additional": "Další vlastnosti",
        "choose": "Vyberte typ vlastnosti",
        "results": "{search} nalezeno {n} krát",
        "reference": "Zobrazit na Wiki OpenStreetMap →",
        "back_tooltip": "Změnit typ vlastnosti"
    },
    "background": {
        "title": "Pozadí",
        "description": "Nastavení pozadí",
        "percent_brightness": "{opacity}% viditelnost",
        "fix_misalignment": "Vyrovnat posunutí pozadí",
        "reset": "vrátit na začátek"
    },
    "restore": {
        "heading": "Vaše úpravy nebyly uloženy",
        "description": "Přejete si obnovit úpravy, které při minulém spuštění nebyly uloženy?",
        "restore": "Obnovit",
        "reset": "Zahodit"
    },
    "save": {
        "title": "Uložit",
        "help": "Uložit změny do OpenStreetMap, aby je viděli ostatní uživatelé.",
        "no_changes": "Není co uložit.",
        "error": "Při ukládání došlo k chybě.",
        "uploading": "Ukládám úpravy na OpenStreetMap.",
        "unsaved_changes": "Vaše úpravy nebyly uloženy"
    },
    "splash": {
        "welcome": "Vítá vás iD, program pro editaci OpenStreetMap",
        "text": "iD je uživatelsky přátelský, ale silný nástroj pro editaci nejrozsáhlejší svobodné mapy světa. Toto je vývojová verze {version}. Více informací na {website}, chybová hlášení na {github}.",
        "start": "Hned upravit"
    },
    "source_switch": {
        "live": "live",
        "lose_changes": "Vaše úpravy nebyly uloženy. Když přepnete mapový server, změny budou ztraceny. Opravdu chcete přepnout server?",
        "dev": "dev"
    },
    "tag_reference": {
        "description": "Popis",
        "on_wiki": "{tag} na wiki.osm.org",
        "used_with": "užito s {type}"
    },
    "validations": {
        "untagged_point": "Neotagovaný uzel, který není částí cesty ani plochy",
        "untagged_line": "Neotagovaná cesta",
        "untagged_area": "Neotagovaná plocha",
        "many_deletions": "Pokoušíte se smazat {n} objektů. Opravdu to chcete provést? Odstranilo by je z globální mapy na openstreetmap.org.",
        "tag_suggests_area": "Tag {tag} obvykle označuje oblast - ale objekt není oblast",
        "deprecated_tags": "Zastaralé tagy: {tag}"
    },
    "zoom": {
        "in": "Zvětšit",
        "out": "Zmenšit"
    },
    "gpx": {
        "local_layer": "Vlastní GPX soubor",
        "drag_drop": "Přetáhněte na stránku soubor .gpx."
    },
    "help": {
        "title": "Pomoc",
        "help": "# Pomoc\n\nToto je editor [OpenStreetMap](http://www.openstreetmap.org/), svobodné a otevřené mapy světa, vytvářené jako open-source a open-data. S pomocí editoru můžete přidávat a upravovat data v mapě třeba ve svém okolí, a zlepšovat tak celou mapu pro každého.\n\nVaše úpravy mapy budou viditelné každým, kdo používá OpenStreetMap. Je ovšem třeba mít uživatelský účet na OpenStreetMap, který si můžete [snadno a zdarma zřídit](https://www.openstreetmap.org/user/new).\n\n[iD editor](http://ideditor.com/) je projekt vytvářený spoluprácí více lidí, se [zdrojovým kódem na GitHubu](https://github.com/systemed/iD).\n",
        "editing_saving": "# Editace a publikace\n\nTento editor pracuje primárně online - právě teď k němu přistupujete prostřednictvím webové stránky.\n\n### Výběr objektů\n\nChcete-li vybrat objekt, jako třeba silnici nebo obchod, klikněte na něj v mapě. Objekt se takto označí, otevře se boční panel s vlastnostmi objektu a zobrazí se nabídka akcemi, které lze s objektem provést.\n\nMůžete označit a pracovat s několika objekty najednou: podržte klávesu 'Shift', klikněte na mapu a táhněte myší či prstem. Takto se označí všechny objekty uvnitř příslušného obdélníku - a můžete pracovat se všemi najednou.\n\n### Publikace změn\n\nKdyž provedete nějaké úpravy objektů v mapě, úpravy jsou uloženy lokálně ve vašem prohlížeči. Nebojte se, když uděláte chybu - úpravy lze vrátit zpět tlačítkem Zpět, a naopak je znovu provést tlačítkem Znovu.\n\nPo dokončení bloku úprav klikněte na 'Uložit' - například když jste upravili jednu část města, a chcete začít úpravy někde jinde. Zobrazí se přehled úprav, které jste provedli, editor tyto úpravy zkontroluje, a když se mu něco nebude zdát, zobrazí varování a návrhy.\n\nKdyž bude všechno v pořádku, můžete přidat krátký komentář s vysvětlením vašich úprav a kliknout znovu 'Uložit'. Úpravy se tímto publikují na [OpenStreetMap.org](http://www.openstreetmap.org/), kde za chvíli budou viditelné pro všechny uživatele a bude na nich možné provádět další úpravy.\n\nPokud nechcete nebo nemůžete pravy dokončit teď, stačí prostě odejít ze stránky pryč. Až příště navštívíte stránku (na stejném počítači, ve stejném prohlížeči), editor vám nabídne možnost znovu načíst neuložené úpravy.\n"
    },
    "intro": {
        "startediting": {
            "save": "Nezapomeňte pravidelně ukládat své úpravy!",
            "start": "Začít mapovat!"
        }
    },
    "presets": {
        "fields": {
            "access": {
                "label": "Přístup"
            },
            "address": {
                "label": "Adresa",
                "placeholders": {
                    "housename": "Název budovy",
                    "number": "123",
                    "street": "Ulice",
                    "city": "Město"
                }
            },
            "aeroway": {
                "label": "Typ"
            },
            "amenity": {
                "label": "Typ"
            },
            "atm": {
                "label": "Bankomat"
            },
            "barrier": {
                "label": "Typ"
            },
            "bicycle_parking": {
                "label": "Typ"
            },
            "building": {
                "label": "Budova"
            },
            "building_area": {
                "label": "Budova"
            },
            "building_yes": {
                "label": "Budova"
            },
            "capacity": {
                "label": "Kapacita"
            },
            "collection_times": {
                "label": "Čas výběru"
            },
            "construction": {
                "label": "Typ"
            },
            "country": {
                "label": "Stát"
            },
            "crossing": {
                "label": "Typ"
            },
            "cuisine": {
                "label": "Kuchyně"
            },
            "denomination": {
                "label": "Vyznání"
            },
            "denotation": {
                "label": "Označení"
            },
            "elevation": {
                "label": "Nadmořská výška"
            },
            "emergency": {
                "label": "Pohotovost"
            },
            "entrance": {
                "label": "Typ"
            },
            "fax": {
                "label": "Fax"
            },
            "fee": {
                "label": "Poplatek"
            },
            "highway": {
                "label": "Typ"
            },
            "historic": {
                "label": "Typ"
            },
            "internet_access": {
                "label": "Přístup k internetu",
                "options": {
                    "wlan": "Wifi",
                    "terminal": "Terminál"
                }
            },
            "landuse": {
                "label": "Typ"
            },
            "layer": {
                "label": "Vrstva"
            },
            "leisure": {
                "label": "Typ"
            },
            "levels": {
                "label": "Úrovní"
            },
            "man_made": {
                "label": "Typ"
            },
            "maxspeed": {
                "label": "Povolená rychlost"
            },
            "name": {
                "label": "Název"
            },
            "natural": {
                "label": "Přírodní objekt"
            },
            "network": {
                "label": "Síť"
            },
            "note": {
                "label": "Poznámka"
            },
            "office": {
                "label": "Typ"
            },
            "oneway": {
                "label": "Jednosměrka"
            },
            "oneway_yes": {
                "label": "Jednosměrka"
            },
            "operator": {
                "label": "Operátor"
            },
            "phone": {
                "label": "Telefon"
            },
            "place": {
                "label": "Typ"
            },
            "power": {
                "label": "yp"
            },
            "railway": {
                "label": "Typ"
            },
            "ref": {
                "label": "Reference"
            },
            "religion": {
                "label": "Náboženství",
                "options": {
                    "christian": "Křesťanství",
                    "muslim": "Islám",
                    "buddhist": "Buddhismus",
                    "jewish": "Judaismus",
                    "hindu": "Hinduismus",
                    "shinto": "Šintoismus",
                    "taoist": "Taoismus"
                }
            },
            "service": {
                "label": "Typ"
            },
            "shelter": {
                "label": "Přístřešek"
            },
            "shop": {
                "label": "Typ"
            },
            "source": {
                "label": "Zdroj"
            },
            "sport": {
                "label": "Spor"
            },
            "structure": {
                "label": "Stavba",
                "options": {
                    "bridge": "Most",
                    "tunnel": "Tune",
                    "embankment": "Násep"
                }
            },
            "surface": {
                "label": "Povrch"
            },
            "tourism": {
                "label": "Typ"
            },
            "water": {
                "label": "Typ"
            },
            "waterway": {
                "label": "Typ"
            },
            "website": {
                "label": "Webová stránka"
            },
            "wetland": {
                "label": "Typ"
            },
            "wheelchair": {
                "label": "Pro vozíčkáře"
            },
            "wikipedia": {
                "label": "Wikipedia"
            },
            "wood": {
                "label": "Typ"
            }
        },
        "presets": {
            "aeroway": {
                "name": "Přistávací dráha"
            },
            "aeroway/aerodrome": {
                "name": "Letiště"
            },
            "aeroway/helipad": {
                "name": "Helipor"
            },
            "amenity": {
                "name": "Zařízení"
            },
            "amenity/bank": {
                "name": "Banka"
            },
            "amenity/bar": {
                "name": "Bar"
            },
            "amenity/bench": {
                "name": "Lavička"
            },
            "amenity/bicycle_parking": {
                "name": "Parkování kol"
            },
            "amenity/bicycle_rental": {
                "name": "Půjčovna kol"
            },
            "amenity/cafe": {
                "name": "Kavárna"
            },
            "amenity/cinema": {
                "name": "Kino"
            },
            "amenity/courthouse": {
                "name": "Soud"
            },
            "amenity/embassy": {
                "name": "Velvyslanectví"
            },
            "amenity/fast_food": {
                "name": "Rychlé občerstvení"
            },
            "amenity/fire_station": {
                "name": "Hasiči"
            },
            "amenity/fuel": {
                "name": "Čerpací stanice"
            },
            "amenity/grave_yard": {
                "name": "Pohřebiště"
            },
            "amenity/hospital": {
                "name": "Nemocnice"
            },
            "amenity/library": {
                "name": "Knihovna"
            },
            "amenity/marketplace": {
                "name": "Trhoviště"
            },
            "amenity/parking": {
                "name": "Parkoviště"
            },
            "amenity/pharmacy": {
                "name": "Lékárna"
            },
            "amenity/place_of_worship": {
                "name": "Chrám"
            },
            "amenity/place_of_worship/christian": {
                "name": "Kostel"
            },
            "amenity/place_of_worship/jewish": {
                "name": "Synagoga"
            },
            "amenity/place_of_worship/muslim": {
                "name": "Mešita"
            },
            "amenity/police": {
                "name": "Policie"
            },
            "amenity/post_box": {
                "name": "Poštovní schránka"
            },
            "amenity/post_office": {
                "name": "Pošta"
            },
            "amenity/pub": {
                "name": "Hospoda"
            },
            "amenity/restaurant": {
                "name": "Restaurace"
            },
            "amenity/school": {
                "name": "Škola"
            },
            "amenity/swimming_pool": {
                "name": "Plavecký bazén"
            },
            "amenity/telephone": {
                "name": "Telefon"
            },
            "amenity/theatre": {
                "name": "Divadlo"
            },
            "amenity/toilets": {
                "name": "Záchodky"
            },
            "amenity/townhall": {
                "name": "Radnice"
            },
            "amenity/university": {
                "name": "Univerzita"
            },
            "barrier": {
                "name": "Zábrana"
            },
            "barrier/block": {
                "name": "Masivní blok"
            },
            "barrier/bollard": {
                "name": "Sloupek"
            },
            "barrier/cattle_grid": {
                "name": "Přejezdový rošt"
            },
            "barrier/city_wall": {
                "name": "Hradby"
            },
            "barrier/cycle_barrier": {
                "name": "Zábrana proti kolům"
            },
            "barrier/ditch": {
                "name": "Příkop"
            },
            "barrier/entrance": {
                "name": "Vchod"
            },
            "barrier/fence": {
                "name": "Plot"
            },
            "barrier/gate": {
                "name": "Brána"
            },
            "barrier/hedge": {
                "name": "Živý plot"
            },
            "barrier/kissing_gate": {
                "name": "Turniket"
            },
            "barrier/lift_gate": {
                "name": "Závora"
            },
            "barrier/retaining_wall": {
                "name": "Opěrná zeď"
            },
            "barrier/stile": {
                "name": "Schůdky přes ohradu"
            },
            "barrier/toll_booth": {
                "name": "Mýtná brána"
            },
            "barrier/wall": {
                "name": "Zeď"
            },
            "building": {
                "name": "Budova"
            },
            "building/apartments": {
                "name": "Byty"
            },
            "building/entrance": {
                "name": "Vchod"
            },
            "entrance": {
                "name": "Vchod"
            },
            "highway": {
                "name": "Silnice"
            },
            "highway/bridleway": {
                "name": "Stezka pro koně"
            },
            "highway/bus_stop": {
                "name": "Autobusová zastávka"
            },
            "highway/crossing": {
                "name": "Přechod"
            },
            "highway/cycleway": {
                "name": "Cyklostezka"
            },
            "highway/footway": {
                "name": "Pěšina"
            },
            "highway/motorway": {
                "name": "Dálnice"
            },
            "highway/motorway_link": {
                "name": "Dálnice - nájezd"
            },
            "highway/path": {
                "name": "Cesta"
            },
            "highway/primary": {
                "name": "Silnice 1. třídy"
            },
            "highway/primary_link": {
                "name": "Silnice 1. třídy - nájezd"
            },
            "highway/residential": {
                "name": "Ulice"
            },
            "highway/road": {
                "name": "Silnice neznámého typu"
            },
            "highway/secondary": {
                "name": "Silnice 2. třídy"
            },
            "highway/secondary_link": {
                "name": "Silnice 2. třídy - nájezd"
            },
            "highway/service": {
                "name": "Účelová komunikace, příjezd"
            },
            "highway/steps": {
                "name": "Schody"
            },
            "highway/tertiary": {
                "name": "Silnice 3. třídy"
            },
            "highway/tertiary_link": {
                "name": "Silnice 3. třídy - nájezd"
            },
            "highway/track": {
                "name": "Polní, lesní cesta"
            },
            "highway/traffic_signals": {
                "name": "Semafory"
            },
            "highway/trunk": {
                "name": "Víceproudá silnice"
            },
            "highway/trunk_link": {
                "name": "Víceproudá silnice - nájezd"
            },
            "highway/turning_circle": {
                "name": "Obratiště"
            },
            "highway/unclassified": {
                "name": "Silnice bez klasifikace"
            },
            "historic": {
                "name": "Památné místo"
            },
            "historic/archaeological_site": {
                "name": "Archeologické naleziště"
            },
            "historic/boundary_stone": {
                "name": "Hraniční káme"
            },
            "historic/castle": {
                "name": "Hrad, zámek"
            },
            "historic/memorial": {
                "name": "Památník"
            },
            "historic/monument": {
                "name": "Monument"
            },
            "historic/ruins": {
                "name": "Zřícenina, ruiny"
            },
            "historic/wayside_cross": {
                "name": "Kříž"
            },
            "historic/wayside_shrine": {
                "name": "Boží muka"
            },
            "landuse": {
                "name": "Užití krajiny"
            },
            "landuse/allotments": {
                "name": "Zahrádky"
            },
            "landuse/basin": {
                "name": "Umělá vodní plocha"
            },
            "landuse/cemetery": {
                "name": "Hřbitov"
            },
            "landuse/commercial": {
                "name": "Obchody"
            },
            "landuse/construction": {
                "name": "Výstavba"
            },
            "landuse/farm": {
                "name": "Zemědělská půda"
            },
            "landuse/farmyard": {
                "name": "Farma"
            },
            "landuse/forest": {
                "name": "Les"
            },
            "landuse/grass": {
                "name": "Tráva"
            },
            "landuse/industrial": {
                "name": "Průmysl"
            },
            "landuse/meadow": {
                "name": "Louka"
            },
            "landuse/orchard": {
                "name": "Sad"
            },
            "landuse/quarry": {
                "name": "Lom"
            },
            "landuse/residential": {
                "name": "Rezidenční oblast"
            },
            "landuse/vineyard": {
                "name": "Vinice"
            },
            "leisure": {
                "name": "Volný čas"
            },
            "leisure/garden": {
                "name": "Zahrada"
            },
            "leisure/golf_course": {
                "name": "Golfové hřiště"
            },
            "leisure/marina": {
                "name": "Přístaviště"
            },
            "leisure/park": {
                "name": "Park"
            },
            "leisure/pitch": {
                "name": "Hřiště"
            },
            "leisure/pitch/american_football": {
                "name": "Hřiště pro americký fotbal"
            },
            "leisure/pitch/baseball": {
                "name": "Baseballové hřiště"
            },
            "leisure/pitch/basketball": {
                "name": "Basketbalové hřiště"
            },
            "leisure/pitch/soccer": {
                "name": "Fotbalové hřiště"
            },
            "leisure/pitch/tennis": {
                "name": "Tenisové kurty"
            },
            "leisure/playground": {
                "name": "Dětské hřiště"
            },
            "leisure/slipway": {
                "name": "Vodní skluz"
            },
            "leisure/stadium": {
                "name": "Stadion"
            },
            "leisure/swimming_pool": {
                "name": "Plavecký bazén"
            },
            "man_made": {
                "name": "Umělý objekt"
            },
            "man_made/lighthouse": {
                "name": "Maják"
            },
            "man_made/pier": {
                "name": "Molo"
            },
            "man_made/survey_point": {
                "name": "Triangulační bod"
            },
            "man_made/water_tower": {
                "name": "Vodárna"
            },
            "natural": {
                "name": "Přírodní objekt"
            },
            "natural/bay": {
                "name": "Záliv"
            },
            "natural/beach": {
                "name": "Pláž"
            },
            "natural/cliff": {
                "name": "Útes"
            },
            "natural/coastline": {
                "name": "Pobřeží"
            },
            "natural/glacier": {
                "name": "Ledove"
            },
            "natural/grassland": {
                "name": "Travnatá plocha"
            },
            "natural/heath": {
                "name": "Vřesoviště"
            },
            "natural/peak": {
                "name": "Vrchol"
            },
            "natural/scrub": {
                "name": "Křoví"
            },
            "natural/spring": {
                "name": "Pramen"
            },
            "natural/tree": {
                "name": "Strom"
            },
            "natural/water": {
                "name": "Vodní plocha"
            },
            "natural/water/lake": {
                "name": "Jezero"
            },
            "natural/water/pond": {
                "name": "Rybník"
            },
            "natural/water/reservoir": {
                "name": "Přehrada"
            },
            "natural/wetland": {
                "name": "Močál"
            },
            "natural/wood": {
                "name": "Les"
            },
            "office": {
                "name": "Kanceláře"
            },
            "other": {
                "name": "Jiné"
            },
            "other_area": {
                "name": "Jiné"
            },
            "place": {
                "name": "Místo"
            },
            "place/hamlet": {
                "name": "Chata"
            },
            "place/island": {
                "name": "Ostro"
            },
            "place/locality": {
                "name": "Jiné místo"
            },
            "place/village": {
                "name": "Vesnice"
            },
            "power": {
                "name": "Energetika"
            },
            "power/generator": {
                "name": "Elektrárna"
            },
            "power/line": {
                "name": "Elektrické vedení"
            },
            "power/pole": {
                "name": "Eletrický sloup"
            },
            "power/sub_station": {
                "name": "Transformátorová stanice"
            },
            "power/tower": {
                "name": "Elektrický stožár"
            },
            "power/transformer": {
                "name": "Transformátor"
            },
            "railway": {
                "name": "Železnice"
            },
            "railway/abandoned": {
                "name": "Opuštěná železnice"
            },
            "railway/disused": {
                "name": "Nepoužívaná železnice"
            },
            "railway/level_crossing": {
                "name": "Úrovňové křížení"
            },
            "railway/monorail": {
                "name": "Jednokolejka"
            },
            "railway/rail": {
                "name": "Kolej"
            },
            "railway/subway": {
                "name": "Metro"
            },
            "railway/subway_entrance": {
                "name": "Vstup do metra"
            },
            "railway/tram": {
                "name": "Tramvaj"
            },
            "shop": {
                "name": "Obchod"
            },
            "shop/alcohol": {
                "name": "Prodejna alkoholu"
            },
            "shop/bakery": {
                "name": "Pekařství"
            },
            "shop/beauty": {
                "name": "Kosmetický salón"
            },
            "shop/beverages": {
                "name": "Prodejna nápojů"
            },
            "shop/bicycle": {
                "name": "Cykloprodejna"
            },
            "shop/books": {
                "name": "Knihkupectví"
            },
            "shop/boutique": {
                "name": "Módní butik"
            },
            "shop/butcher": {
                "name": "Řeznictví"
            },
            "shop/car": {
                "name": "Prodejna aut"
            },
            "shop/car_parts": {
                "name": "Náhradní díly pro auta"
            },
            "shop/car_repair": {
                "name": "Autoopravna"
            },
            "shop/chemist": {
                "name": "Drogérie"
            },
            "shop/clothes": {
                "name": "Oblečení"
            },
            "shop/computer": {
                "name": "Počítače"
            },
            "shop/confectionery": {
                "name": "Cukrovinky"
            },
            "shop/convenience": {
                "name": "Smíšené zboží"
            },
            "shop/deli": {
                "name": "Lahůdkářství"
            },
            "shop/department_store": {
                "name": "Obchodní dům"
            },
            "shop/doityourself": {
                "name": "Obchod pro kutily"
            },
            "shop/dry_cleaning": {
                "name": "Čistírna"
            },
            "shop/electronics": {
                "name": "Elektro"
            },
            "shop/fishmonger": {
                "name": "Rybárna"
            },
            "shop/florist": {
                "name": "Květinářství"
            },
            "shop/furniture": {
                "name": "Nábytek"
            },
            "shop/garden_centre": {
                "name": "Zahradnictví"
            },
            "shop/greengrocer": {
                "name": "Ovoce a zelenina"
            },
            "shop/hairdresser": {
                "name": "Kadeřnictví"
            },
            "shop/hardware": {
                "name": "Železářství"
            },
            "shop/hifi": {
                "name": "Hifi elektronika"
            },
            "shop/jewelry": {
                "name": "Klenotnictví"
            },
            "shop/kiosk": {
                "name": "Stánek"
            },
            "shop/laundry": {
                "name": "Prádelna"
            },
            "shop/mall": {
                "name": "Obchodní centrum"
            },
            "shop/mobile_phone": {
                "name": "Obchod s mobily"
            },
            "shop/motorcycle": {
                "name": "Obchod s motocykly"
            },
            "shop/music": {
                "name": "Obchod s hudbou"
            },
            "shop/newsagent": {
                "name": "Trafika"
            },
            "shop/optician": {
                "name": "Optika"
            },
            "shop/outdoor": {
                "name": "Vybavení do přírody"
            },
            "shop/pet": {
                "name": "Chovatelské potřeby"
            },
            "shop/shoes": {
                "name": "Obuvnictví"
            },
            "shop/sports": {
                "name": "Sportovní potřeby"
            },
            "shop/stationery": {
                "name": "Kancelářské potřeby"
            },
            "shop/supermarket": {
                "name": "Supermarket"
            },
            "shop/toys": {
                "name": "Hračkářství"
            },
            "shop/travel_agency": {
                "name": "Cestovní kancelář"
            },
            "shop/tyres": {
                "name": "Pneuservis"
            },
            "shop/vacant": {
                "name": "Neobsazený obchod"
            },
            "shop/video": {
                "name": "Video obchod"
            },
            "tourism": {
                "name": "Turismus"
            },
            "tourism/alpine_hut": {
                "name": "Horská chata"
            },
            "tourism/artwork": {
                "name": "Umělecké dílo"
            },
            "tourism/attraction": {
                "name": "Pamětihodnost"
            },
            "tourism/camp_site": {
                "name": "Kemp"
            },
            "tourism/caravan_site": {
                "name": "Místo pro karavany"
            },
            "tourism/chalet": {
                "name": "Horská bouda"
            },
            "tourism/guest_house": {
                "name": "Penzion"
            },
            "tourism/hostel": {
                "name": "Hostel"
            },
            "tourism/hotel": {
                "name": "Hotel"
            },
            "tourism/information": {
                "name": "Informace"
            },
            "tourism/motel": {
                "name": "Motel"
            },
            "tourism/museum": {
                "name": "Muzeum"
            },
            "tourism/picnic_site": {
                "name": "Místo pro piknik"
            },
            "tourism/theme_park": {
                "name": "Zábavní park"
            },
            "tourism/viewpoint": {
                "name": "Výhled"
            },
            "tourism/zoo": {
                "name": "ZOO"
            },
            "waterway": {
                "name": "Vodní tok"
            },
            "waterway/canal": {
                "name": "Vodní kanál"
            },
            "waterway/dam": {
                "name": "Hráz"
            },
            "waterway/ditch": {
                "name": "Příkop"
            },
            "waterway/drain": {
                "name": "Odvodňovací strouha"
            },
            "waterway/river": {
                "name": "Řeka"
            },
            "waterway/riverbank": {
                "name": "Břeh řeky"
            },
            "waterway/stream": {
                "name": "Potok"
            },
            "waterway/weir": {
                "name": "Jez"
            }
        }
    }
};
locale.da = {
    "modes": {
        "add_area": {
            "title": "Område",
            "description": "Tilføj parker, bygninger, søer, eller andre områder til kortet.",
            "tail": "Klik på kortet for at indtegne et område fx en park, sø eller bygning."
        },
        "add_line": {
            "title": "Linje",
            "description": "Linjer kan være veje, gader eller stier selv kanaler kan være linjer.",
            "tail": "Klik på kortet for at indtegne en vej, sti eller rute."
        },
        "add_point": {
            "title": "Punkt",
            "description": "Restauranter, mindesmærker og postkasser er punkter.",
            "tail": "Klik på kortet for at tilføje et punkt."
        },
        "browse": {
            "title": "Gennemse",
            "description": "Træk rundt og zoom på kortet."
        },
        "draw_area": {
            "tail": "Klik her for at tilføje punkter til dit område. Klik på første punkt igen for at færdiggøre området."
        },
        "draw_line": {
            "tail": "Klik her for at tilføje flere punkter til linjen. Klik på andre linjer for at forbinde dem og dobbeltklik for at afslutte linjen."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Tilføjede et punkt.",
                "vertex": "Tilføjede en node til en vej."
            }
        },
        "start": {
            "annotation": {
                "line": "Startede en linje.",
                "area": "Startede et område."
            }
        },
        "continue": {
            "annotation": {
                "line": "Fortsatte en linje.",
                "area": "Fortsatte et område."
            }
        },
        "cancel_draw": {
            "annotation": "Annullerede indtegning."
        },
        "change_tags": {
            "annotation": "Ændret tags."
        },
        "circularize": {
            "title": "Cirkularisere",
            "description": {
                "area": "Lav dette område rundt."
            },
            "key": "O",
            "annotation": {
                "line": "Lavede en linje rund.",
                "area": "Lave et område rundt."
            },
            "not_closed": "Dette kan ikke laves rundt da det ikke er område."
        },
        "orthogonalize": {
            "title": "Ortogonalisering",
            "description": "Gør disse hjørner firkantet.",
            "key": "Q",
            "annotation": {
                "line": "Lavede hjørner på en linje firkantet.",
                "area": "Lavede hjørner på et område firkantet."
            },
            "not_closed": "Dette kan ikke laves firkantet da det ikke er et område."
        },
        "delete": {
            "title": "Slet",
            "description": "Fjern dette fra kortet.",
            "annotation": {
                "point": "Slettede et punkt.",
                "vertex": "Slettede en node fra en vej.",
                "line": "Slettede en linje.",
                "area": "Slettede et område.",
                "relation": "Sletede en relation.",
                "multiple": "Slettede {n} objekter."
            }
        },
        "connect": {
            "annotation": {
                "point": "Forbandt en vej til et punkt.",
                "vertex": "Forbandt en vej til en anden vej.",
                "line": "Forbandt en vej til en linje.",
                "area": "Forbandt en vej til et område."
            }
        },
        "disconnect": {
            "title": "Afbryd",
            "description": "Afbryd disse veje fra hinanden.",
            "key": "D",
            "annotation": "Afbryd vejene."
        },
        "merge": {
            "title": "Flet",
            "description": "Flet disse linjer.",
            "key": "C",
            "annotation": "Flettede {n} linjer."
        },
        "move": {
            "title": "Flyt",
            "description": "Flyt dette til en anden lokation.",
            "key": "M",
            "annotation": {
                "point": "Flyttede et punkt.",
                "vertex": "Flyttede en node i en vej.",
                "line": "Flyttede en linje.",
                "area": "Flyttede et område.",
                "multiple": "Flyttede flere objekter."
            }
        },
        "rotate": {
            "title": "Roter",
            "description": "Roter dette objekt omkring centerpunktet.",
            "key": "R",
            "annotation": {
                "line": "Roterede en linje.",
                "area": "Roterede et område."
            }
        },
        "reverse": {
            "title": "Omvendt",
            "description": "Lad denne linje gå i modsat retning.",
            "key": "V",
            "annotation": "Omvendte en linje."
        },
        "split": {
            "title": "Del op",
            "description": {
                "line": "Del denne linje op i to ved dette punkt."
            },
            "key": "X",
            "annotation": {
                "line": "Klip en linje op."
            }
        }
    },
    "nothing_to_undo": "Ingenting at fortryde.",
    "nothing_to_redo": "Ingenting at gendanne.",
    "just_edited": "Du har lige rettet i OpenStreetMap!",
    "browser_notice": "Dette værktøj er understøttet i Firefox, Chrome, Safari, Opera og Internet Explorer 9 og højere. Vær venlig at opgradere din browser eller benyt Potlatch 2 for at rette i kortet.",
    "view_on_osm": "Vis på OSM",
    "zoom_in_edit": "zoom ind for at rette på kortet",
    "logout": "log ud",
    "report_a_bug": "rapportere en fejl",
    "commit": {
        "title": "Gem ændringer",
        "description_placeholder": "Kort beskrivelse af dine bidrag",
        "message_label": "Tilføj en besked",
        "upload_explanation": "Dine ændringer vil som brugernavn {user} blive synligt på alle kort der bruger OpenStreetMap data.",
        "save": "Gem",
        "cancel": "Fortryd",
        "warnings": "Advarsler",
        "modified": "Modificeret",
        "deleted": "Slettede",
        "created": "Lavede"
    },
    "contributors": {
        "list": "Vis bidrag fra {users}",
        "truncated_list": "Vis bidrag fra {users} og {count} andre"
    },
    "geocoder": {
        "title": "Find et sted",
        "placeholder": "Find et sted",
        "no_results": "Kunne ikke finde '{name}'"
    },
    "geolocate": {
        "title": "Vis min lokalitet"
    },
    "inspector": {
        "no_documentation_combination": "Der er ingen dokumentation for denne tag kombination",
        "no_documentation_key": "Der er ingen dokumentation tilgængelig for denne nøgle",
        "show_more": "Vis mere",
        "new_tag": "Nyt tag",
        "view_on_osm": "Vis på OSM",
        "editing_feature": "Redigerer {feature}",
        "additional": "Flere tags",
        "choose": "Vælg funktionstype",
        "results": "{n} resultater for {search}",
        "reference": "Vis på OpenStreetMap Wiki →",
        "back_tooltip": "Gem funktionstype"
    },
    "background": {
        "title": "Baggrund",
        "description": "Baggrundsindstillinger",
        "percent_brightness": "{opacity}% lysstyrke",
        "fix_misalignment": "Lav fejljustering",
        "reset": "nulstil"
    },
    "restore": {
        "heading": "Du har ændringer der ikke er gemt endnu",
        "description": "Du har ændringer fra forrige session som ikke er gemt. Ønsker du at gendanne disse ændringer?",
        "restore": "Gendan",
        "reset": "Nulstil"
    },
    "save": {
        "title": "Gem",
        "help": "Gem ændringer til OpenStreetMap vil gøre dem synlige for andre brugere.",
        "no_changes": "Ingen ændringer at gemme.",
        "error": "Der skete en fejl da du prøvede at gemme",
        "uploading": "Gemmer nu ændringer til OpenStreetMap.",
        "unsaved_changes": "Du har ændringer der ikke er gemt endnu"
    },
    "splash": {
        "welcome": "Velkommen til iD OpenStreetMap værktøjet",
        "text": "Dette er udviklingsversion {version}. Mere information se {website} og rapportere fejl på {github}.",
        "walkthrough": "Start gennemgangen",
        "start": "Redigerer nu"
    },
    "source_switch": {
        "live": "live",
        "dev": "dev"
    },
    "tag_reference": {
        "description": "Beskrivelse",
        "on_wiki": "{tag} på wiki.osm.org",
        "used_with": "brugt med {type}"
    },
    "validations": {
        "untagged_point": "Mangler et tag på punkt som ikke er del af en linje eller område",
        "untagged_line": "Mangler tag på linje",
        "untagged_area": "Mangler tag på område",
        "many_deletions": "You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        "tag_suggests_area": "Dette tag {tag} mener denne linje skule være et område, men dette er ikke et område",
        "deprecated_tags": "Uønskede tags: {tags}"
    },
    "zoom": {
        "in": "Zoom ind",
        "out": "Zoom ud"
    },
    "gpx": {
        "local_layer": "Lokal GPX fil",
        "drag_drop": "Træk og slip en .gpx fil på denne her side"
    },
    "help": {
        "title": "Hjælp"
    },
    "intro": {
        "areas": {
            "search": "**Søg efter baggrund.**",
            "choose": "**Vælg baggrund fra gitteret.**",
            "describe": "**Tilføj et navn og luk så funktionsværktøjet**"
        },
        "startediting": {
            "start": "Start kortlægning"
        }
    },
    "presets": {
        "fields": {
            "access": {
                "label": "Adgang"
            },
            "address": {
                "label": "Adresse",
                "placeholders": {
                    "housename": "Husnavn",
                    "number": "123",
                    "street": "Gade",
                    "city": "By"
                }
            },
            "aeroway": {
                "label": "Type"
            },
            "amenity": {
                "label": "Type"
            },
            "atm": {
                "label": "Pengeautomat"
            },
            "barrier": {
                "label": "Type"
            },
            "bicycle_parking": {
                "label": "Type"
            },
            "building": {
                "label": "Bygning"
            },
            "building_area": {
                "label": "Bygning"
            },
            "building_yes": {
                "label": "Bygning"
            },
            "capacity": {
                "label": "Kapacitet"
            },
            "collection_times": {
                "label": "Indsamlingstid"
            },
            "construction": {
                "label": "Type"
            },
            "country": {
                "label": "Land"
            },
            "crossing": {
                "label": "Type"
            },
            "cuisine": {
                "label": "Cuisine"
            },
            "denomination": {
                "label": "Trosretning"
            },
            "denotation": {
                "label": "Denotation"
            },
            "elevation": {
                "label": "Højde over havet"
            },
            "emergency": {
                "label": "Nødkald"
            },
            "entrance": {
                "label": "Type"
            },
            "fax": {
                "label": "Fax"
            },
            "fee": {
                "label": "Gebyr"
            },
            "highway": {
                "label": "Type"
            },
            "historic": {
                "label": "Type"
            },
            "internet_access": {
                "label": "Internetadgang",
                "options": {
                    "wlan": "Wifi",
                    "wired": "Kabeladgang",
                    "terminal": "Terminal"
                }
            },
            "landuse": {
                "label": "Type"
            },
            "layer": {
                "label": "Lag"
            },
            "leisure": {
                "label": "Type"
            },
            "levels": {
                "label": "Niveauer"
            },
            "man_made": {
                "label": "Type"
            },
            "maxspeed": {
                "label": "Hastighedsbegræsning"
            },
            "name": {
                "label": "Navn"
            },
            "network": {
                "label": "Netværk"
            },
            "note": {
                "label": "Bemærkning"
            },
            "office": {
                "label": "Type"
            },
            "oneway": {
                "label": "Ensrettet vej"
            },
            "oneway_yes": {
                "label": "Ensrettet vej"
            },
            "opening_hours": {
                "label": "Timer"
            },
            "operator": {
                "label": "Operatør"
            },
            "phone": {
                "label": "Telefon"
            },
            "place": {
                "label": "Type"
            },
            "power": {
                "label": "Type"
            },
            "railway": {
                "label": "Type"
            },
            "ref": {
                "label": "Reference"
            },
            "religion": {
                "label": "Religion",
                "options": {
                    "christian": "Kristen",
                    "muslim": "Muslimsk",
                    "buddhist": "Buddhist",
                    "jewish": "Jødisk",
                    "hindu": "Hinduisme",
                    "shinto": "Shinto",
                    "taoist": "Taoist"
                }
            },
            "service": {
                "label": "Type"
            },
            "shelter": {
                "label": "Shelter"
            },
            "shop": {
                "label": "Type"
            },
            "source": {
                "label": "Kilde"
            },
            "sport": {
                "label": "Sport"
            },
            "structure": {
                "label": "Struktur",
                "options": {
                    "bridge": "Bro",
                    "tunnel": "Tunnel",
                    "embankment": "Forhøjning til tog, vej",
                    "cutting": "Udskæring"
                }
            },
            "surface": {
                "label": "Overflade"
            },
            "tourism": {
                "label": "Type"
            },
            "water": {
                "label": "Type"
            },
            "waterway": {
                "label": "Type"
            },
            "website": {
                "label": "Webside"
            },
            "wetland": {
                "label": "Type"
            },
            "wheelchair": {
                "label": "Kørestolsadgang"
            },
            "wikipedia": {
                "label": "Wikipedia"
            },
            "wood": {
                "label": "Type"
            }
        },
        "presets": {
            "aeroway/aerodrome": {
                "name": "Lufthavn",
                "terms": "fly,lufthavn,lufthavnsområde"
            },
            "aeroway/helipad": {
                "name": "Helikopterlandningsplads",
                "terms": "helikopter,helipad,helikopterlandsplads"
            },
            "amenity/bank": {
                "name": "Bank"
            },
            "amenity/bar": {
                "name": "Bar"
            },
            "amenity/bench": {
                "name": "Bænk"
            },
            "amenity/bicycle_parking": {
                "name": "Cykelparkering"
            },
            "amenity/bicycle_rental": {
                "name": "Cykeludlejning"
            },
            "amenity/cafe": {
                "name": "Cafe",
                "terms": "kaffe,te, kaffebutik"
            },
            "amenity/cinema": {
                "name": "Biograf"
            },
            "amenity/courthouse": {
                "name": "Domstolsbygning"
            },
            "amenity/embassy": {
                "name": "Ambassade"
            },
            "amenity/fast_food": {
                "name": "Fast food"
            },
            "amenity/fire_station": {
                "name": "Brandstation"
            },
            "amenity/fuel": {
                "name": "Tankstation"
            },
            "amenity/grave_yard": {
                "name": "Gravsted"
            },
            "amenity/hospital": {
                "name": "Hospital"
            },
            "amenity/library": {
                "name": "Bibliotek"
            },
            "amenity/marketplace": {
                "name": "Markedsplads"
            },
            "amenity/parking": {
                "name": "Parkering"
            },
            "amenity/pharmacy": {
                "name": "Apotek"
            },
            "amenity/place_of_worship": {
                "name": "Religiøst tilbedelsessted"
            },
            "amenity/place_of_worship/christian": {
                "name": "Kirke"
            },
            "amenity/place_of_worship/jewish": {
                "name": "Synagoge",
                "terms": "jødisk,synagoge"
            },
            "amenity/place_of_worship/muslim": {
                "name": "Moské",
                "terms": "muslimsk,moské"
            },
            "amenity/police": {
                "name": "Politi"
            },
            "amenity/post_box": {
                "name": "Postkasse",
                "terms": "brevkasse,postboks"
            },
            "amenity/post_office": {
                "name": "Postkontor"
            },
            "amenity/pub": {
                "name": "Værtshus"
            },
            "amenity/restaurant": {
                "name": "Restaurant"
            },
            "amenity/school": {
                "name": "Skole"
            },
            "amenity/swimming_pool": {
                "name": "Svømmebassin"
            },
            "amenity/telephone": {
                "name": "Telefon"
            },
            "amenity/theatre": {
                "name": "Teater",
                "terms": "teater,performance,skuespil,musical"
            },
            "amenity/toilets": {
                "name": "Toiletter"
            },
            "amenity/townhall": {
                "name": "Rådhus"
            },
            "amenity/university": {
                "name": "Universitet"
            },
            "barrier": {
                "name": "Barrier"
            },
            "barrier/block": {
                "name": "Blok"
            },
            "barrier/bollard": {
                "name": "Pullert"
            },
            "barrier/cattle_grid": {
                "name": "Kreaturrist"
            },
            "barrier/city_wall": {
                "name": "Bymur"
            },
            "barrier/cycle_barrier": {
                "name": "Cykelbarrier"
            },
            "barrier/ditch": {
                "name": "Grøft"
            },
            "barrier/entrance": {
                "name": "Indgang"
            },
            "barrier/fence": {
                "name": "Hegn"
            },
            "barrier/gate": {
                "name": "Port"
            },
            "barrier/hedge": {
                "name": "Læhegn"
            },
            "barrier/stile": {
                "name": "Stente"
            },
            "barrier/toll_booth": {
                "name": "Vejafgifthus"
            },
            "barrier/wall": {
                "name": "Mur"
            },
            "building": {
                "name": "Bygning"
            },
            "building/apartments": {
                "name": "Lejligheder"
            },
            "building/entrance": {
                "name": "Indgang"
            },
            "entrance": {
                "name": "Indgang"
            },
            "highway": {
                "name": "Veje"
            },
            "highway/bridleway": {
                "name": "Hestesti"
            },
            "highway/bus_stop": {
                "name": "Busstoppested"
            },
            "highway/crossing": {
                "name": "Kryds"
            },
            "highway/cycleway": {
                "name": "Cykelsti"
            },
            "highway/footway": {
                "name": "Gangsti"
            },
            "highway/motorway": {
                "name": "Motorvej"
            },
            "highway/path": {
                "name": "Sti"
            },
            "highway/primary": {
                "name": "Primærvej"
            },
            "highway/primary_link": {
                "terms": "rampe, påkørelsesrampe, afkørelsesrampe"
            },
            "highway/residential": {
                "name": "Villavej"
            },
            "highway/road": {
                "name": "Ukendt vejtype"
            },
            "highway/secondary": {
                "name": "Mindre stor vej"
            },
            "highway/secondary_link": {
                "name": "Sekundærvej",
                "terms": "ramp,on ramp,off ramp"
            },
            "highway/service": {
                "name": "Servicevej"
            },
            "highway/steps": {
                "name": "Trappe"
            },
            "highway/tertiary": {
                "name": " Tertiær vej"
            },
            "highway/tertiary_link": {
                "terms": "ramp,on ramp,off ramp"
            },
            "highway/track": {
                "name": "Mark/Skovvej"
            },
            "highway/traffic_signals": {
                "name": "Trafiksignal",
                "terms": "lys,stoplys,traffiklys"
            },
            "highway/trunk_link": {
                "terms": "rampe, påkørelsesrampe, afkørelsesrampe"
            },
            "highway/turning_circle": {
                "name": "Vendeplads"
            },
            "highway/unclassified": {
                "name": "Mindre vej"
            },
            "historic": {
                "name": "Historisk sted"
            },
            "historic/archaeological_site": {
                "name": "Arkæologisksted"
            },
            "historic/boundary_stone": {
                "name": "Grænsesten"
            },
            "historic/castle": {
                "name": "Slot"
            },
            "historic/memorial": {
                "name": "Mindesmærke"
            },
            "historic/monument": {
                "name": "Monument"
            },
            "historic/ruins": {
                "name": "Ruiner"
            },
            "historic/wayside_cross": {
                "name": "Vejsidemindesmærker"
            },
            "historic/wayside_shrine": {
                "name": "Vejsideskrin"
            },
            "landuse": {
                "name": "Områdebrug"
            },
            "landuse/allotments": {
                "name": "Kolonihaver"
            },
            "landuse/basin": {
                "name": "Basin"
            },
            "landuse/cemetery": {
                "name": " Begravelsesplads "
            },
            "landuse/commercial": {
                "name": "Indkøbsområde"
            },
            "landuse/construction": {
                "name": "Under konstruktion"
            },
            "landuse/farm": {
                "name": "Landbrug"
            },
            "landuse/farmyard": {
                "name": "Gård"
            },
            "landuse/forest": {
                "name": "Skov"
            },
            "landuse/grass": {
                "name": "Græs"
            },
            "landuse/industrial": {
                "name": "Industriområde"
            },
            "landuse/meadow": {
                "name": "Eng"
            },
            "landuse/orchard": {
                "name": "Frugtplantage"
            },
            "landuse/quarry": {
                "name": "Råstofudvinding"
            },
            "landuse/residential": {
                "name": "Beboelsesområde"
            },
            "landuse/vineyard": {
                "name": "Vingård"
            },
            "leisure": {
                "name": "Fritid"
            },
            "leisure/garden": {
                "name": "Have"
            },
            "leisure/golf_course": {
                "name": "Golfbane"
            },
            "leisure/marina": {
                "name": "Lystbådehavn"
            },
            "leisure/park": {
                "name": "Park"
            },
            "leisure/pitch": {
                "name": "Sportsbane"
            },
            "leisure/pitch/american_football": {
                "name": "Amerikansk fodboldbane"
            },
            "leisure/pitch/baseball": {
                "name": "Baseballbane"
            },
            "leisure/pitch/basketball": {
                "name": "Basketballbane"
            },
            "leisure/pitch/soccer": {
                "name": "Fodboldbane"
            },
            "leisure/pitch/tennis": {
                "name": "Tenninsbane"
            },
            "leisure/playground": {
                "name": "Legeplads"
            },
            "leisure/slipway": {
                "name": "Bådrampe"
            },
            "leisure/stadium": {
                "name": "Stadion"
            },
            "leisure/swimming_pool": {
                "name": "Svømmebassin"
            },
            "man_made": {
                "name": "Menneskeskabt"
            },
            "man_made/lighthouse": {
                "name": "Fyr (navigation)"
            },
            "man_made/pier": {
                "name": "Bade-gang bro (ved vandet)"
            },
            "man_made/survey_point": {
                "name": "Geografisk fixpunkt"
            },
            "man_made/water_tower": {
                "name": "Vandtårn"
            },
            "natural": {
                "name": "Naturlig"
            },
            "natural/bay": {
                "name": "Bugt"
            },
            "natural/beach": {
                "name": "Strand"
            },
            "natural/cliff": {
                "name": "Klint"
            },
            "natural/coastline": {
                "name": "Kystlinje"
            },
            "natural/glacier": {
                "name": "Gletsjer"
            },
            "natural/grassland": {
                "name": "Græsmark"
            },
            "natural/heath": {
                "name": "Hede"
            },
            "natural/peak": {
                "name": "Højdedrag"
            },
            "natural/scrub": {
                "name": "Buskområde"
            },
            "natural/spring": {
                "name": "Kilde (vand)"
            },
            "natural/tree": {
                "name": "Træ"
            },
            "natural/water": {
                "name": "Vand"
            },
            "natural/water/lake": {
                "name": "Sø"
            },
            "natural/water/pond": {
                "name": "Dam"
            },
            "natural/water/reservoir": {
                "name": "Reservoir"
            },
            "natural/wetland": {
                "name": "Vådområde"
            },
            "natural/wood": {
                "name": "Naturskov"
            },
            "office": {
                "name": "Kontor"
            },
            "other": {
                "name": "Andet"
            },
            "other_area": {
                "name": "Andet"
            },
            "place": {
                "name": "Lokalitet"
            },
            "place/hamlet": {
                "name": "Mindre beboet område"
            },
            "place/island": {
                "name": "Ø"
            },
            "place/locality": {
                "name": "Lokalitet"
            },
            "place/village": {
                "name": "Landsby"
            },
            "power": {
                "name": "Energi"
            },
            "power/generator": {
                "name": "Kraftværk"
            },
            "power/line": {
                "name": "Elledning"
            },
            "power/pole": {
                "name": "Elmast (telefonmast)"
            },
            "power/sub_station": {
                "name": "Transformatorstation"
            },
            "power/tower": {
                "name": "Højspændingsmast"
            },
            "power/transformer": {
                "name": "Transformer"
            },
            "railway": {
                "name": "Jernbane"
            },
            "railway/disused": {
                "name": "Ej brugt jernbanespor"
            },
            "railway/level_crossing": {
                "name": "Jernbaneoverskæring"
            },
            "railway/monorail": {
                "name": "Monorail"
            },
            "railway/rail": {
                "name": "Jernbanespor"
            },
            "railway/subway": {
                "name": "S-togspor"
            },
            "railway/subway_entrance": {
                "name": "S-togstationsindgang"
            },
            "railway/tram": {
                "name": "Sporvogn",
                "terms": "delebil"
            },
            "shop": {
                "name": "Butik"
            },
            "shop/alcohol": {
                "name": "Vinforhandler"
            },
            "shop/bakery": {
                "name": "Bager"
            },
            "shop/beauty": {
                "name": "Parfumebutik"
            },
            "shop/beverages": {
                "name": "Vinforhandler"
            },
            "shop/bicycle": {
                "name": "Cykelbutik"
            },
            "shop/books": {
                "name": "Boghandler"
            },
            "shop/boutique": {
                "name": "Boutique"
            },
            "shop/butcher": {
                "name": "Slagter"
            },
            "shop/car": {
                "name": "Bilforhandler"
            },
            "shop/car_parts": {
                "name": "Autoudstyrsbutik"
            },
            "shop/car_repair": {
                "name": "Autoværksted"
            },
            "shop/chemist": {
                "name": "Kemiforhandler"
            },
            "shop/clothes": {
                "name": "Tøjbutik"
            },
            "shop/computer": {
                "name": "Computerforhandler"
            },
            "shop/confectionery": {
                "name": "Slikbutik"
            },
            "shop/convenience": {
                "name": "Minimarked"
            },
            "shop/deli": {
                "name": "Deli"
            },
            "shop/department_store": {
                "name": "Stormagasin"
            },
            "shop/doityourself": {
                "name": "Gør-det-selv butik"
            },
            "shop/dry_cleaning": {
                "name": "Tøjrenseri"
            },
            "shop/electronics": {
                "name": "Elektronikbutik"
            },
            "shop/fishmonger": {
                "name": "Fiskeforretning"
            },
            "shop/florist": {
                "name": "Blomsterbutik"
            },
            "shop/furniture": {
                "name": "Møbelforhandler"
            },
            "shop/garden_centre": {
                "name": "Havecenter"
            },
            "shop/gift": {
                "name": "Gavebutik"
            },
            "shop/greengrocer": {
                "name": "Grønthandler"
            },
            "shop/hairdresser": {
                "name": "Frisør"
            },
            "shop/hardware": {
                "name": "Værktøjsbutik"
            },
            "shop/hifi": {
                "name": "Radioforhandler"
            },
            "shop/jewelry": {
                "name": "Juvelér"
            },
            "shop/kiosk": {
                "name": "Kiosk"
            },
            "shop/laundry": {
                "name": "Vaskeri"
            },
            "shop/mall": {
                "name": "Indkøbscenter"
            },
            "shop/mobile_phone": {
                "name": "Mobiltelefonforhandler"
            },
            "shop/motorcycle": {
                "name": "Motorcykelforhandler"
            },
            "shop/music": {
                "name": "Musikbutik"
            },
            "shop/newsagent": {
                "name": "Bladforhandler"
            },
            "shop/optician": {
                "name": "Optiker"
            },
            "shop/outdoor": {
                "name": "Friluftudstyrsbutik"
            },
            "shop/pet": {
                "name": "Kæledyrsbutik"
            },
            "shop/shoes": {
                "name": "Skobutik"
            },
            "shop/sports": {
                "name": "Sportsudstyrsbutik"
            },
            "shop/stationery": {
                "name": "Papirforhandler"
            },
            "shop/supermarket": {
                "name": "Supermarked"
            },
            "shop/toys": {
                "name": "Legetøjsbutik"
            },
            "shop/travel_agency": {
                "name": "Rejsebureau"
            },
            "shop/tyres": {
                "name": "Dækbutik"
            },
            "shop/vacant": {
                "name": "Lukket butik (ingen salg pt)"
            },
            "shop/video": {
                "name": "Videobutik"
            },
            "tourism": {
                "name": "Turisme"
            },
            "tourism/alpine_hut": {
                "name": "Bjerghytte"
            },
            "tourism/artwork": {
                "name": "Kunstværk"
            },
            "tourism/attraction": {
                "name": "Turistattraktion"
            },
            "tourism/camp_site": {
                "name": "Campingplads"
            },
            "tourism/caravan_site": {
                "name": "Autocamperplads"
            },
            "tourism/chalet": {
                "name": "Bjergferiehytte"
            },
            "tourism/guest_house": {
                "name": "Gæstehus",
                "terms": "B&B,Bed & Breakfast,Bed and Breakfast"
            },
            "tourism/hostel": {
                "name": "Vandrehjem"
            },
            "tourism/hotel": {
                "name": "Hotel"
            },
            "tourism/information": {
                "name": "Information"
            },
            "tourism/motel": {
                "name": "Motel"
            },
            "tourism/museum": {
                "name": "Museum"
            },
            "tourism/picnic_site": {
                "name": "Picnic"
            },
            "tourism/theme_park": {
                "name": "Forlystelsespark"
            },
            "tourism/viewpoint": {
                "name": "Udsigtspunkt"
            },
            "tourism/zoo": {
                "name": "Zoologisk have"
            },
            "waterway": {
                "name": "Vandvej"
            },
            "waterway/canal": {
                "name": "Kanal"
            },
            "waterway/dam": {
                "name": "Dam"
            },
            "waterway/ditch": {
                "name": "Grøft"
            },
            "waterway/drain": {
                "name": "Drænløb"
            },
            "waterway/river": {
                "name": "Flod"
            },
            "waterway/riverbank": {
                "name": "Flodbred"
            },
            "waterway/stream": {
                "name": "Å"
            },
            "waterway/weir": {
                "name": "Stemmeværk"
            }
        }
    }
};
locale.nl = {
    "modes": {
        "add_area": {
            "title": "Vlak",
            "description": "Voeg parken, gebouwen, meren of andere vlakken aan de kaart toe.",
            "tail": "Klik in de kaart om het tekenen van een vlak zoals een park, gebouw of meer te starten."
        },
        "add_line": {
            "title": "Lijn",
            "description": "Lijnen zijn bijvoorbeeld rijkswegen, straten, voetpaden of kanalen.",
            "tail": "Klik in de kaart om het tekenen van straat, pad of route te starten."
        },
        "add_point": {
            "title": "Punt",
            "description": "Restaurants, monumenten en brievenbussen zijn bijvoorbeeld punten.",
            "tail": "Klik in de kaart om een punt toe te voegen."
        },
        "browse": {
            "title": "Navigatie",
            "description": "Verschuif en zoom in op de kaart."
        },
        "draw_area": {
            "tail": "Klik om punten aan het vlak toe te voegen. Klik op het eerste punt om het vlak te sluiten."
        },
        "draw_line": {
            "tail": "Klik om meer punten aan de lijn toe te voegen. Klik op een andere lijn om de lijnen te verbinden en dubbelklik om de lijn af te sluiten."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Punt toegevoegd.",
                "vertex": "Knoop aan een weg toegevoegd."
            }
        },
        "start": {
            "annotation": {
                "line": "Lijn begonnen.",
                "area": "Vlak begonnen."
            }
        },
        "continue": {
            "annotation": {
                "line": "Lijn voortgezet.",
                "area": "Vlak voortgezet."
            }
        },
        "cancel_draw": {
            "annotation": "Tekenen afgebroken."
        },
        "change_tags": {
            "annotation": "Tags aangepast."
        },
        "circularize": {
            "title": "Rond maken",
            "description": {
                "line": "Maak een lijn rond.",
                "area": "Maak dit vlak rond."
            },
            "key": "O",
            "annotation": {
                "line": "Maak een lijn rond.",
                "area": "Maak een vlak rond."
            },
            "not_closed": "Dit kan niet rond worden gemaakt omdat het geen lus is."
        },
        "orthogonalize": {
            "title": "Haaks maken",
            "description": "Maak deze hoeken haaks.",
            "key": "Q",
            "annotation": {
                "line": "Hoeken van een lijn zijn haaks gemaakt.",
                "area": "Hoeken van een vlak zijn haaks gemaakt."
            },
            "not_closed": "Dit kan niet haaks worden gemaakt, omdat het geen lus is."
        },
        "delete": {
            "title": "Verwijderen",
            "description": "Verwijder dit van de kaart.",
            "annotation": {
                "point": "Punt verwijderd.",
                "vertex": "Knoop uit een weg verwijderd.",
                "line": "Lijn verwijderd.",
                "area": "Vlak verwijderd.",
                "relation": "Relatie verwijderd.",
                "multiple": "{n} objecten verwijderd."
            }
        },
        "connect": {
            "annotation": {
                "point": "Weg aan een punt verbonden.",
                "vertex": "Weg aan een andere weg verbonden.",
                "line": "Weg aan een lijn  verbonden.",
                "area": "Weg aan een vlak verbonden."
            }
        },
        "disconnect": {
            "title": "Losmaken",
            "description": "Maak deze wegen van elkaar los.",
            "key": "D",
            "annotation": "Wegen losgemaakt.",
            "not_connected": "Er zijn hier niet genoeg lijnen/vlakken om los te maken."
        },
        "merge": {
            "title": "Samenvoegen",
            "description": "Voeg deze lijnen samen.",
            "key": "C",
            "annotation": "{n} lijnen samengevoegd.",
            "not_eligible": "Deze objecten kunnen niet worden samengevoegd.",
            "not_adjacent": "Deze lijnen kunnen niet worden samengevoegd omdat ze niet zijn verbonden."
        },
        "move": {
            "title": "Verschuiven",
            "description": "Verschuif dit object naar een andere plek.",
            "key": "M",
            "annotation": {
                "point": "Punt verschoven.",
                "vertex": "Knoop van een weg verschoven.",
                "line": "Lijn verschoven.",
                "area": "Vlak verschoven.",
                "multiple": "Meerdere objecten verschoven."
            },
            "incomplete_relation": "Dit object kan niet worden verplaatst omdat het niet volledig is gedownload."
        },
        "rotate": {
            "title": "Roteer",
            "description": "Roteer dit object om zijn middelpunt.",
            "key": "R",
            "annotation": {
                "line": "Lijn geroteerd.",
                "area": "Vlak geroteerd."
            }
        },
        "reverse": {
            "title": "Omdraaien",
            "description": "Draai de richting van deze lijn om.",
            "key": "V",
            "annotation": "Lijnrichting omgedraaid."
        },
        "split": {
            "title": "Splitsen",
            "description": {
                "line": "Deze lijn op dit punt gesplitst.",
                "area": "De grens van dit gebied in tweeën gesplitst.",
                "multiple": "De lijnen/grenzen van het vlak op dit punt in tweeën gesplitst."
            },
            "key": "X",
            "annotation": {
                "line": "Lijn opgesplitst.",
                "area": "Grens van een vlak opgesplitst.",
                "multiple": "{n} lijnen/grenzen van vlakken opgesplitst."
            },
            "not_eligible": "lijnen kunnen niet op hun begin op eindpunt worden gesplitst.",
            "multiple_ways": "Er zijn hier teveel lijnen om op te splitsen."
        }
    },
    "nothing_to_undo": "Niets om ongedaan te maken.",
    "nothing_to_redo": "Niets om opnieuw uit te voeren.",
    "just_edited": "Je hebt zojuist OpenStreetMap aangepast!",
    "browser_notice": "Deze editor wordt door Firefox, Chrome, Safari, Opera en Internet Explorer (versie 9 en hoger) ondersteund. Download een nieuwere versie van je browser of gebruik Potlatch 2 om de kaart aan te passen.",
    "view_on_osm": "Bekijk op OSM",
    "zoom_in_edit": "Zoom in om de kaart aan te passen.",
    "logout": "Afmelden",
    "loading_auth": "Verbinden met OpenStreetMap...",
    "report_a_bug": "Meld een softwareprobleem",
    "commit": {
        "title": "Aanpassingen opslaan",
        "description_placeholder": "Een korte omschrijving van je bijdragen",
        "message_label": "Bevestig notitie",
        "upload_explanation": "Aanpassingen die je als {user} uploadt worden zichtbaar op alle kaarten die de gegevens van OpenStreetMap gebruiken.",
        "save": "Opslaan",
        "cancel": "Afbreken",
        "warnings": "Waarschuwingen",
        "modified": "Aangepast",
        "deleted": "Verwijderd",
        "created": "Aangemaakt"
    },
    "contributors": {
        "list": "Deze kaartuitsnede bevat bijdragen van:",
        "truncated_list": "Deze kaartuitsnede bevat bijdragen van: {users} en {count} anderen"
    },
    "geocoder": {
        "title": "Zoek een plaats",
        "placeholder": "Zoek een plaats",
        "no_results": "De plaats '{name}' kan niet worden gevonden"
    },
    "geolocate": {
        "title": "Toon mijn locatie"
    },
    "inspector": {
        "no_documentation_combination": "Voor deze tag is geen documentatie beschikbaar.",
        "no_documentation_key": "Voor deze sleutel is geen documentatie beschikbaar",
        "show_more": "Toon meer",
        "new_tag": "Nieuwe tag",
        "view_on_osm": "Bekijk op OSM",
        "editing_feature": "{feature} aan het aanpassen",
        "additional": "Additional tags",
        "choose": "What are you adding?",
        "results": "{n} results for {search}",
        "reference": "Bekijk op de OpenStreetMap Wiki",
        "back_tooltip": "Wijzig het soort object"
    },
    "background": {
        "title": "Achtergrond",
        "description": "Achtergrondinstellingen",
        "percent_brightness": "{opacity}% helderheid",
        "fix_misalignment": "Repareer de verkeerde ligging",
        "reset": "Ongedaan maken"
    },
    "restore": {
        "heading": "Je hebt niet-opgeslagen aanpassingen",
        "description": "Er zijn niet-opgeslagen aanpassingen uit een vorige sessie. Wil je deze aanpassingen behouden?",
        "restore": "Behouden",
        "reset": "Ongedaan maken"
    },
    "save": {
        "title": "Opslaan",
        "help": "Sla de aanpassingen bij OpenStreetMap op om deze voor andere gebruikers zichtbaar te maken",
        "no_changes": "Geen aanpassingen om op te slaan.",
        "error": "Bij het opslaan is een fout opgetreden",
        "uploading": "De aanpassingen worden naar OpenStreetMap geüpload.",
        "unsaved_changes": "Je hebt niet-opgeslagen aanpassingen"
    },
    "splash": {
        "welcome": "Welkom bij de iD OpenStreetMap editor",
        "text": " Dit is een ontwikkelversie {version}. Voor meer informatie bezoek {website} of meld problemen op {github}.",
        "walkthrough": "Start de rondleiding",
        "start": "Pas nu aan"
    },
    "source_switch": {
        "live": "live",
        "lose_changes": "Je hebt niet-opgeslagen aanpassingen. Door te wisselen van kaartserver worden deze ongedaan gemaakt. Weet je het zeker, dat je van kaartserver wilt wisselen?",
        "dev": "dev"
    },
    "tag_reference": {
        "description": "Omschrijving",
        "on_wiki": "{tag} op wiki.osm.org",
        "used_with": "gebruikt met {type}"
    },
    "validations": {
        "untagged_point": "Punt zonder tags, dat geen onderdeel is van een lijn of vlak",
        "untagged_line": "Lijn zonder tags",
        "untagged_area": "Vlak zonder tags",
        "many_deletions": "You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        "tag_suggests_area": "De tag {tag} suggereert dat de lijn een vlak is, maar het is geen vlak",
        "deprecated_tags": "Afgeschafte tags: {tags}"
    },
    "zoom": {
        "in": "Inzoomen",
        "out": "Uitzoomen"
    },
    "gpx": {
        "local_layer": "Lokaal GPX-bestand",
        "drag_drop": "Sleep een .gpx bestand op de pagina"
    },
    "help": {
        "title": "Help",
        "help": "# Help⏎ ⏎ Dit is een editor voor [OpenStreetMap](http://www.openstreetmap.org/), de⏎ vrije en aanpasbare wereldkaart. Je kan het gebruiken om gegevens in je omgeving toe te voegen of bij te werken⏎, waarmee je een open source en open data wereldkaart⏎ voor iedereen beter maakt.⏎ ⏎ Aanpassingen die je op deze kaart maakt zullen voor iedereen te zien zijn die gebruik maken van⏎ OpenStreetMap. Om een aanpassing te maken, heb je een ⏎ [gratis OpenStreetMap account](https://www.openstreetmap.org/user/new) nodig.⏎ ⏎ De [iD editor](http://ideditor.com/) is een samenwerkingsproject waarvan de [broncode ⏎ beschikbaar is op GitHub](https://github.com/systemed/iD).⏎\n",
        "editing_saving": "# Aanpassen & Opslaan⏎ ⏎ Deze editor is in de eerste plaats gemaakt om online te functioneren, en je benadert ⏎ het op dit moment via een website.⏎ ⏎ ### Objecten Selecteren⏎ ⏎ Om een kaartobject te selecteren, zoals een weg of een restaurant, klik⏎ erop op de kaart. Het geselecteerde object zal oplichten, een schermpje opent zich met⏎ informatie en een menu wordt getoond met dingen die je met het object kan doen.⏎ ⏎ Meerdere objecten kunnen worden geselecteerd door de 'Shift' knop ingedrukt te houden, en tegelijk op de kaart⏎ te klikken en te slepen. Hierdoor worden alle objecten binnen het vak⏎ dat wordt getekend, zodat je aanpassingen kan doen op meerdere objecten tegelijk.⏎ ⏎ ### Aanpassingen opslaan⏎ ⏎ Wanneer je veranderingen maakt zoals aanpassingen aan wegen, gebouwen, en locaties, worden deze⏎ lokaal opgeslagen tot je ze naar de server verstuurt. Het geeft niet als je een fout⏎ maakt: je kan aanpassingen ongedaan maken door op de knop 'Ongedaan maken' te klikken en aanpassingen⏎ opnieuw te doen door op de knop 'Opnieuw toepassen' te klikken.⏎ ⏎ Klik 'Opslaan' om een groep aanpassingen te voltooien - bijvoorbeeld als je een gebied⏎ van een woonplaats hebt afgerond en je in een nieuw gebied wilt beginnen. Je krijgt de mogelijkheid⏎ om je aanpassingen te bekijken en de editor biedt handige suggesties⏎ en waarschuwingen als er iets niet lijkt te kloppen aan de aanpassingen.⏎ ⏎ Als alles er goed uitziet, kan je een korte notitie invoeren om je aanpassingen toe te lichten⏎ en klik opnieuw op 'Bewaar' om de aanpassingen te verzenden⏎ naar [OpenStreetMap.org](http://www.openstreetmap.org/), waar ze zichtbaar zijn⏎ voor alle andere gebruikers en beschikbaar voor anderen om op voort te bouwen.⏎ ⏎ Als je je aanpassingen niet in één sessie kan afronden, dan kan je de het scherm van de⏎ editor verlaten en terugkeren (met dezelfde browser en computer), en de⏎ editor zal je vragen of je je aanpassingen weer wilt gebruiken.⏎\n",
        "roads": "# Wegen⏎ ⏎ Je kan met deze editor wegen maken, verbeteren en verwijderen. Wegen zijn er in allerlei soorten en ⏎ maten: landweggetjes, snelwegen, paadjes, fietspaden en veel meer - ieder stukje dat ⏎ vaak wordt gebruikt kan in kaart worden gebracht.⏎⏎ ### Selecteren⏎⏎ Klik op een weg om deze te selecteren. De omtrek verschijnt samen⏎ met een klein menu op de kaart en een schermpje met informatie⏎ over de weg.⏎⏎ ### Aanpassen⏎⏎ Vaak kom je wegen tegen, die niet precies over het beeldmateriaal of de GPS-route⏎ erachter lopen. Je kan deze wegen aanpassen, zodat ze op de juiste plek komen te liggen.⏎⏎ Klik eerst op de weg die je wilt aanpassen. Deze zal dan oplichten en er verschijnen⏎ puntjes langs de lijn die je kan verslepen naar een betere plek.⏎ Als je nieuwe puntjes wilt toevoegen voor meer detaillering, dubbelklik op een weggedeelte⏎ zonder een puntje en een nieuwe wordt toegevoegd.⏎⏎ Als een weg is verbonden met een andere weg, maar niet in de kaart ⏎ dan versleep je een van de puntjes op de andere weg om⏎ ze te verbinden. Dat wegen met elkaar zijn verbonden is belangrijk voor de kaart⏎ en essentieel om een routebeschrijving te kunnen maken.⏎⏎ Je kan bovendien het 'Verplaats' gereedschap aanklikken of de 'V' snelkoppeling om de gehele weg in een keer⏎ te verplaatsen en opnieuw aanklikken om deze verplaatsing op te slaan.⏎ ⏎ ### Verwijderen⏎ ⏎ Als een weg helemaal verkeerd is - je ziet dat het niet op het satellietbeeld te⏎ zien is en je hebt idealiter ter plaatse gecontroleerd, dat de weg er niet is - dan kan je het⏎ verwijderen, zodat het van de kaart verdwijnt. Wees voorzichtig met het verwijderen van objecten ⏎ - zoals bij iedere aanpassing is het resultaat voor iedereen zichtbaar en satellietbeelden⏎ zijn vaak verouderd, dus de weg zou gewoon nieuw zijn aangelegd.⏎⏎ Je kan een weg verwijderen door er op te klikken om het te selecteren, waarna je op het⏎ prullebakicoontje drukt of de 'Delete' toets.⏎⏎ ### Maken⏎ ⏎ Heb je ergens een weg gevonden die nog niet op de kaart staat? Klik op het 'Lijn' gereedschap in de linker bovenhoek van de editor of druk op de snelkoppeling '2' om een lijn te tekenen.⏎ ⏎ Klik op het begin van de weg op de kaart en begin te tekenen. Als de weg zich vertakt van de bestaande weg, begin dan op de plek waar ze elkaar kruisen.⏎⏎ Klik dan de punten langs de weg, zodat deze het juiste tracé volgt, volgens⏎ het satellietbeeld of de GPS-route. Als de weg die je aan het tekenen bent een andere weg kruist, verbindt deze⏎ door op het kruispunt te klikken. Als je klaar met tekenen bent, dubbelklik⏎ of druk op 'Return' of 'Enter' op je toetsenbord.⏎\n",
        "gps": "# GPS ⏎⏎ GPS gegevens vormen voor OpenStreetMap de meest betrouwbare bron voor gegevens. Deze editor⏎ ondersteunt lokale routes - '.gpx' bestanden op je lokale computer. Je kan dit soort⏎ GPS routes vastleggen met allerlei smartphone applicaties of ⏎ met je eigen GPS apparatuur. ⏎⏎ Voor meer informatie over het doen van een GPS-veldwerk, lees⏎ [Surveying with a GPS](http://learnosm.org/en/beginner/using-gps/).⏎ ⏎ Om een GPS route te gebruiken om te karteren, sleep een '.gpx.' bestand in je editor. ⏎ Als het wordt herkend, wordt het aan de kaart toegevoegd als een heldergroene⏎ lijn. Klik op het menu 'Achtergondinstellingen' aan de linkerkant om deze nieuwe kaartlaag⏎ aan te zetten, uit te zetten of ernaar toe te zoomen.⏎⏎ De GPS-route wordt niet meteen naar OpenStreetMap verstuurd - de beste manier om ⏎ het te gebruiken is als een sjabloon voor het nieuwe object dat⏎ je toevoegt.⏎\n",
        "imagery": "# Beeldmateriaal⏎⏎ Luchtfoto's vormen een belangrijke bron voor het karteren. Een combinatie van⏎ luchtfoto's, satellietbeelden en vrij-beschikbare bronnen is beschikaar⏎ in de editor onder het menu 'Achtergrondinstellingen' aan de linkerkant.⏎⏎  Standaard wordt een [Bing Maps](http://www.bing.com/maps/) satellietbeeld in⏎ de editor getoond, maar als je de kaart verschaalt of verplaatst naar andere gebieden⏎, worden nieuwe bronnen getoond. Sommige landen, zoals de⏎ Verenigde Staten, Frankrijk en Denemakren hebben beeldmateriaal van zeer hoge kwaliteit in sommige gebieden.⏎⏎ Soms is het beeldmateriaal ten opzichte van de kaart verschoven door een fout⏎ van de leverancier van het beeldmateriaal. Als je ziet, dat een heleboel wegen zijn verschoven ten opzichte van de achtergrond,⏎ ga deze dan niet meteen allemaal verplaatsen zodat de ligging overeenkomt met de achtergrond. In plaats daarvan kan je⏎ het beeldmateriaal aanpassen, zodat de ligging overeenkomt met de bestaande gegevens door op de knop 'Verbeter de ligging' te klikken⏎ onderaan de 'Achtergrondinstellingen'.\n",
        "addresses": "# Adressen ⏎⏎ Adresgegevens vormen een van de meest praktische informatie voor de kaart.⏎⏎ Hoewel adressen op OpenStreetMap meestal als deel van de straten worden afgebeeld⏎ worden ze vastgelegd als eigenschappen van gebouwen of plaatsen langs de straat.⏎⏎ Je kan adresinformatie niet alleen toevoegen aan plaatsen die als gebouwenomtrek zijn ingetekend⏎ maar ook als enkelvoudige puntobjecen. De beste bron voor adresgegevens⏎ is een veldwerk of eigen kennis - zoals met alle ⏎ andere objecten is het overnemen van gegevens uit commerciële bronnen zoals Google Maps⏎ ten strengste verboden.⏎\n",
        "inspector": "# Het inspectiegereedschap⏎ ⏎ Het inspectiegereedschap is het schermelement rechts op de pagina dat verschijnt als een object wordt geselecteerd en maakt het je mogelijk om zijn eigenschappen aan te passen.⏎⏎ ### Een objecttype selecteren⏎⏎ Nadat je een punt, lijn of vlak hebt toegevoegd, kan je kiezen wat voor type object het is,⏎ bijvoorbeeld of het een snelweg of woonerf is, een supermarkt of een café.⏎ Het inspectiegereedschap toont knoppen voor veelvoorkomende objecttypen en je kan⏎ andere vinden door een term in het zoekscherm in te vullen.⏎ ⏎ Klik op de 'i' in de rechter onderhoek van een objecttypeknop om⏎ meer te weten te komen. Klik op een knop om het type te selecteren.⏎⏎ Formulieren en tags gebruiken⏎⏎ Nadat je een objecttype hebt gekozen, of wanneer je een object selecteert, dat al een type toegekend heeft gekregen, dan toont het inspectiegereedschap allerlei eigenschappen van het object, zoals zijn naam en adres.⏎⏎ Onder de getoonde eigenschappen, kan je op icoontjes klikken om meer eigenschappen toe te voegen,⏎ zoals informatie uit  [Wikipedia](http://www.wikipedia.org/), toegankelijkheid, etc.⏎ ⏎ Onderaan het inspectiegereedschap klik je op 'Extra tags' om willekeurig andere tags toe te voegen. [Taginfo](http://taginfo.openstreetmap.org/) biedt een prachtig overzicht om meer te weten te komen over veelgebruikte combinaties van tags.⏎ ⏎ Aanpasingen die je in het inspectiegereedschap maakt zijn meteen zichtbaar in de kaart.⏎ Je kan ze op ieder moment ongedaan maken, door op de knop 'Ongedaan maken' te klikken.⏎ ⏎ ### Het inspectiegereedschap suiten⏎ ⏎ Je kan het inspectiegereedschap sluiten door op de sluitknop in de rechter bovenhoek te klikken, ⏎ door op de 'Escape' toets te klikken, of op de kaart.⏎ \n",
        "buildings": "# Gebouwen⏎ ⏎ OpenStreetMap is 's werelds grootste gebouwendatabase. Jij kan deze⏎  database maken en verbeteren.⏎ ⏎ ### Selecteren ⏎ ⏎  Je kan een gebouw selecteren door op de omtrek te klikken. Dit doet het gebouw⏎ oplichten en opent een klein menu en een ⏎ scherm met meer informatie⏎  over het gebouw.⏎ ⏎ ### Aanpassen ⏎ ⏎ Soms staan gebouwen niet op de juiste plaats of hebben ze onjuiste tags.⏎ ⏎ Om een heel gebouw te verplaatsen, selecteer het en klik dan op het knop 'Verplaats'. Beweeg je muis⏎ om het gebouw te verplaatsen en klik als het op de goede plek staat.⏎ ⏎ Om de vorm van een gebouw te verbeteren klik en versleep je de punten die samen de omtrek vormen naar de juiste plek.⏎ ⏎ ### Toevoegen⏎ ⏎ Een van de onduidelijkheden over het toevoegen van gebouwen is dat⏎  in OpenStreetMap de gebouwen als vlakken en als punten kunnen worden vastgelegd. De vuistregel is ⏎ dat _gebouwen zoveel mogelijk als een vlak worden ingetekend_ en dat bedrijven, woningen en voorzieningen die in die gebouwen zijn gevestigd als punt worden ingetekend⏎  binnen de omtrek.⏎ ⏎ Begin om een gebouw als een vlak in te tekenen door op de knop 'Vlak' te kliken in de linker⏎  bovenhoek van het scherm en beëindig het tekenen door de 'Return' toets in te drukken of door op het eerste, getekende punt te klikken om de omtrek te sluiten.⏎ ⏎  ### Verwijderen⏎ ⏎  Als een gebouw helemaal verkeerd is - je kan zien, dat het niet in het satellietbeeld zichtbaar is⏎  en idealiter heb je ter plekke geconstateerd dat het niet bestaat - dan kan je het verwijderen. Wees voorzichtig bij het verwijderen van objecten⏎  - zoals alle andere aanpassigen, is het resultaat voor iedereen zichtbaar en satellietbeelden⏎  zijn vaak verouderd, dus het gebouw kan simpelweg onlangs zijn opgetrokken.⏎ ⏎ Je kan een gebouw verwijderen door erop te klikken om het te selecteren en dan op het prullebakicoon te klikken of op de 'Delete' toets te drukken.⏎ \n"
    },
    "intro": {
        "navigation": {
            "drag": "De grote kaart toont de OpenStreetMap gegevens bovenop een achtergrond. Je kan navigeren door te slepen en te schuiven, net zoals iedere online kaart. **Versleep de kaart!**",
            "select": "Kaartobjecten worden op drie manier weergegeven: door punten, lijnen of vlakken. Alle objecten kunnen worden geselecteerd door erop te klikken. **Klik op de punt om 'm te selecteren.**",
            "header": "De titel toont ons het objecttype.",
            "pane": "Als een object wordt geselecteerd, wordt de objecteneditor getoond. De titel toont ons het objecttype en het hoofdscherm toont eigenschappen van het object, zoals de naam en het adres. **Sluit de objecteneditor met de sluitknop rechtsboven.**"
        },
        "points": {
            "add": "Punten kunnen worden gebruikt om objecten zoals winkels, restaurants en monumenten weer te geven. Ze geven een specifieke locatie aan en beschrijven wat daar is. **Klik op de Punt knop om een nieuw punt toe te voegen.**",
            "place": "Het punt kan worden geplaatst door op de kaart te klikken. **Plaats het punt bovenop het gebouw.**",
            "search": "Er zijn verschillende objecten die door een punt kunnen worden weergegeven. Het punt dat je zojuist hebt toegevoegd is een café. **Zoek naar 'Cafe' **",
            "choose": "**Selecteer Cafe uit het overzicht.**",
            "describe": "Het punt wordt nu aangeduid als een café. Door de objecteditor te gebruiken kunnen we meer informatie over een object toevoegen. **Voeg een naam toe**",
            "close": "De objecteditor kan worden gesloten door op de sluitknop te klikken. **Sluit de objecteditor**",
            "reselect": "Vaak zullen er al wel punten staan, maar bevatten ze fouten of zijn ze onvolledig. We kunnen bestaande punten aanpassen. **Selecteer het punt, dat je zojuist hebt aangemaakt.**",
            "fixname": "**Wijzig de naam en sluit de objecteditor.**",
            "reselect_delete": "Allen objecten in de kaart kunnen worden verwijderd. **Klik op het punt dat je hebt aangemaakt.**",
            "delete": "Het menu rond het punt bevat handelingen die erop kunt uitvoeren, waaronder verwijderen. **Verwijder het punt.**"
        },
        "areas": {
            "add": "Vlakken bieden een gedetailleerdere manier om objecten weer te geven. Zij geven informatie over de grenzen van het object. Vlakken kunnen voor de meeste objecttypen worden toegepast waar punten voor worden gebruikt, maar hebben meestal de voorkeur. **Klik op de Vlak knop om een nieuw vlak toe te voegen.**",
            "corner": "Vlakken worden getekend door punten te plaatsen die de grens van een vlak markeren. **Plaats het startpunt op een van de hoeken van de speelplaats.**",
            "place": "Teken het vlak door punten te plaatsen. Beëindig het vlak door op het startpunt te klikken. **Teken een vlak voor een speelplaats.**",
            "search": "**Zoek naar 'Playground'.**",
            "choose": "**Selecteer 'Speelplaats' uit het overzicht.**",
            "describe": "**Voeg een naam toe en sluit de objecteditor**"
        },
        "lines": {
            "add": "Lijnen worden gebruikt om objecten zoals wegen, spoorlijnen en rivieren weer te geven. **Klik op de Lijn knop om een nieuwe lijn toe te voegen.**",
            "start": "**Begin de lijn door te klikken op het eindpunt van de weg.**",
            "intersect": "Klik om meer punten aan de lijn toe te voegen. Je kan de kaart verslepen tijdens het tekenen als dat nodig mocht zijn. Wegen en veel andere lijnen zijn onderdeel van een groter netwerk. Het is belangrijk, dat deze lijnen juist aan elkaar zijn verbonden, zodat je een route kan laten berekenen. **Klik op 'Flower Street' om een kruising te maken waar de twee lijnen worden verbonden.**",
            "finish": "Lijnen kunnen worden beëindigd door nogmaals op het laatste punt te klikken. **Beëndig het tekenen van de weg.**",
            "road": "**Selecteer 'Weg' van het overzicht**",
            "residential": "Er zijn verschillende wegtypen, het meest voorkomende type is 'Residential'. **Kies het wegtype 'Residential'**",
            "describe": "**Geef de weg een naam en sluit de objecteditor.**",
            "restart": "De weg moet 'Flower Street' kruisen."
        },
        "startediting": {
            "help": "Meer documentatie en deze rondleiding zijn hier beschikbaar.",
            "save": "Vergeet niet om je aanpassingen regelmatig op te slaan!",
            "start": "Begin met karteren!"
        }
    },
    "presets": {
        "fields": {
            "access": {
                "label": "Toegang"
            },
            "address": {
                "label": "Adres",
                "placeholders": {
                    "housename": "Huisnaam",
                    "number": "123",
                    "street": "Straat",
                    "city": "Stad"
                }
            },
            "aeroway": {
                "label": "Type"
            },
            "amenity": {
                "label": "Type"
            },
            "atm": {
                "label": "Pinautomaat"
            },
            "barrier": {
                "label": "Type"
            },
            "bicycle_parking": {
                "label": "Type"
            },
            "building": {
                "label": "Gebouw"
            },
            "building_area": {
                "label": "Gebouw"
            },
            "building_yes": {
                "label": "Gebouw"
            },
            "capacity": {
                "label": "Inhoud"
            },
            "collection_times": {
                "label": "Lichtingstijden"
            },
            "construction": {
                "label": "Type"
            },
            "country": {
                "label": "Land"
            },
            "crossing": {
                "label": "Type"
            },
            "cuisine": {
                "label": "Keuken"
            },
            "denomination": {
                "label": "Geloofsrichting"
            },
            "denotation": {
                "label": "Aanduiding"
            },
            "elevation": {
                "label": "Hoogte"
            },
            "emergency": {
                "label": "Noodgeval"
            },
            "entrance": {
                "label": "Type"
            },
            "fax": {
                "label": "Fax"
            },
            "fee": {
                "label": "Tarief"
            },
            "highway": {
                "label": "Type"
            },
            "historic": {
                "label": "Type"
            },
            "internet_access": {
                "label": "Internettoegang",
                "options": {
                    "wlan": "Wifi",
                    "wired": "Vast netwerk",
                    "terminal": "Computer"
                }
            },
            "landuse": {
                "label": "Type"
            },
            "layer": {
                "label": "Relatieve hoogteligging"
            },
            "leisure": {
                "label": "Type"
            },
            "levels": {
                "label": "Niveaus"
            },
            "man_made": {
                "label": "Type"
            },
            "maxspeed": {
                "label": "Maximum snelheid"
            },
            "name": {
                "label": "Naam"
            },
            "natural": {
                "label": "Natuurlijk"
            },
            "network": {
                "label": "Netwerk"
            },
            "note": {
                "label": "Aantekening"
            },
            "office": {
                "label": "Type"
            },
            "oneway": {
                "label": "Eenrichtingsverkeer"
            },
            "oneway_yes": {
                "label": "Eenrichtingsverkeer"
            },
            "opening_hours": {
                "label": "Openingstijden"
            },
            "operator": {
                "label": "Keten"
            },
            "phone": {
                "label": "Telefoonnummer"
            },
            "place": {
                "label": "Type"
            },
            "power": {
                "label": "Type"
            },
            "railway": {
                "label": "Type"
            },
            "ref": {
                "label": "Nummering"
            },
            "religion": {
                "label": "Religie",
                "options": {
                    "christian": "Christelijk",
                    "muslim": "Moslim",
                    "buddhist": "Boeddist",
                    "jewish": "Joods",
                    "hindu": "Hindoestaans",
                    "shinto": "Shinto",
                    "taoist": "Taoisme"
                }
            },
            "service": {
                "label": "Type"
            },
            "shelter": {
                "label": "Beschutting"
            },
            "shop": {
                "label": "Type"
            },
            "source": {
                "label": "Bron"
            },
            "sport": {
                "label": "Sport"
            },
            "structure": {
                "label": "Bouwwerk",
                "options": {
                    "bridge": "Brug",
                    "tunnel": "Tunnel",
                    "embankment": "Dijk, talud",
                    "cutting": "Landuitsnijding"
                }
            },
            "surface": {
                "label": "Oppervlak"
            },
            "tourism": {
                "label": "Type"
            },
            "water": {
                "label": "Type"
            },
            "waterway": {
                "label": "Type"
            },
            "website": {
                "label": "Website"
            },
            "wetland": {
                "label": "Type"
            },
            "wheelchair": {
                "label": "Rolstoeltoegankelijkheid"
            },
            "wikipedia": {
                "label": "Wikipedia"
            },
            "wood": {
                "label": "Type"
            }
        },
        "presets": {
            "aeroway": {
                "name": "Vliegveld"
            },
            "aeroway/aerodrome": {
                "name": "Luchthaven",
                "terms": "vliegtuig,vliegveld,luchthaven"
            },
            "aeroway/helipad": {
                "name": "Helikopterhaven",
                "terms": "helikopter,helidek,helihaven"
            },
            "amenity": {
                "name": "Voorziening"
            },
            "amenity/bank": {
                "name": "Bank",
                "terms": "geldkist,geldwisselkantoor,kredietverstrekker,investeringskantoor,kluis,schatkist,aandelen,fonds,reserve"
            },
            "amenity/bar": {
                "name": "Café"
            },
            "amenity/bench": {
                "name": "Bank"
            },
            "amenity/bicycle_parking": {
                "name": "Fietsenstalling"
            },
            "amenity/bicycle_rental": {
                "name": "Fietsverhuur"
            },
            "amenity/cafe": {
                "name": "Café",
                "terms": "Koffie,thee,koffiehuis"
            },
            "amenity/cinema": {
                "name": "Bioscoop",
                "terms": "bioscoop,filmtheater,cinema"
            },
            "amenity/courthouse": {
                "name": "Rechtbank"
            },
            "amenity/embassy": {
                "name": "Ambassade"
            },
            "amenity/fast_food": {
                "name": "Fastfoodrestaurant"
            },
            "amenity/fire_station": {
                "name": "Brandweerkazerne"
            },
            "amenity/fuel": {
                "name": "Tankstation"
            },
            "amenity/grave_yard": {
                "name": "Begraafplaats"
            },
            "amenity/hospital": {
                "name": "Ziekenhuis",
                "terms": "kliniek,eerstehulppost,gezondheidscentrum,hospice,gasthuis,verzorgingstehuis,verpleeghuis,herstellingsoord,sanatorium,ziekenboeg,huisartenpraktijk,ziekenzaal"
            },
            "amenity/library": {
                "name": "Bibliotheek"
            },
            "amenity/marketplace": {
                "name": "Markt"
            },
            "amenity/parking": {
                "name": "Parkeren"
            },
            "amenity/pharmacy": {
                "name": "Apotheek"
            },
            "amenity/place_of_worship": {
                "name": "Gebedshuis",
                "terms": "abdij,godshuis,kathedraal,kapel,kerk,huis van God,gebedshuis,missiepost,moskee,heiligdom,synagoge,tabernakel,tempel"
            },
            "amenity/place_of_worship/christian": {
                "name": "Kerk",
                "terms": "christelijk,abdij,godshuis,kapel,kerk,godshuis,pastorie,heiligdom,tabernakel,tempel"
            },
            "amenity/place_of_worship/jewish": {
                "name": "Synagoge",
                "terms": "joods, synagoge"
            },
            "amenity/place_of_worship/muslim": {
                "name": "Moskee",
                "terms": "Moslim, moskee"
            },
            "amenity/police": {
                "name": "Politie",
                "terms": "politieagent,rechercheur,arm der wet,agent,diender,korps,politie,veldwachter"
            },
            "amenity/post_box": {
                "name": "Brievenbus",
                "terms": "brievenbus,postbus"
            },
            "amenity/post_office": {
                "name": "Postkantoor"
            },
            "amenity/pub": {
                "name": "Café"
            },
            "amenity/restaurant": {
                "name": "Restaurant",
                "terms": "bar,cafetaria,café,kantine,koffiehuis,snackbar,herberg,lunchroom,nachtclub,pizzeria,broodjeszaak,kroeg"
            },
            "amenity/school": {
                "name": "School",
                "terms": "academie,alma mater,campus,college,collegezaal,faculteit,instituut,schoolgebouw,seminarie,universiteit,vakgroep"
            },
            "amenity/swimming_pool": {
                "name": "Zwembad"
            },
            "amenity/telephone": {
                "name": "Telefoon"
            },
            "amenity/theatre": {
                "name": "Theater",
                "terms": "theater,optreden,toneelstuk,musical"
            },
            "amenity/toilets": {
                "name": "Toiletten"
            },
            "amenity/townhall": {
                "name": "Gemeentehuis",
                "terms": "gemeentehuis,stadsbestuur,rechtbank,gemeentekantoor,gemeentecentrum"
            },
            "amenity/university": {
                "name": "Universiteit"
            },
            "barrier": {
                "name": "Barrière"
            },
            "barrier/block": {
                "name": "Blokkade"
            },
            "barrier/bollard": {
                "name": "Poller"
            },
            "barrier/cattle_grid": {
                "name": "Wildrooster"
            },
            "barrier/city_wall": {
                "name": "Stadsmuur"
            },
            "barrier/cycle_barrier": {
                "name": "Slingerhek"
            },
            "barrier/ditch": {
                "name": "Gracht"
            },
            "barrier/entrance": {
                "name": "Ingang"
            },
            "barrier/fence": {
                "name": "Afrastering"
            },
            "barrier/gate": {
                "name": "Hek"
            },
            "barrier/hedge": {
                "name": "Haag of heg"
            },
            "barrier/kissing_gate": {
                "name": "Voetgangershek"
            },
            "barrier/lift_gate": {
                "name": "Slagboom"
            },
            "barrier/retaining_wall": {
                "name": "Keermuur"
            },
            "barrier/stile": {
                "name": "Overstaphek"
            },
            "barrier/toll_booth": {
                "name": "Tolhuisje"
            },
            "barrier/wall": {
                "name": "Muur"
            },
            "building": {
                "name": "Gebouw"
            },
            "building/apartments": {
                "name": "Apartementen"
            },
            "building/entrance": {
                "name": "Ingang"
            },
            "entrance": {
                "name": "Ingang"
            },
            "highway": {
                "name": "Autosnelweg"
            },
            "highway/bridleway": {
                "name": "Ruiterpad",
                "terms": "ruiterpad,paardenspoor"
            },
            "highway/bus_stop": {
                "name": "Bushalte"
            },
            "highway/crossing": {
                "name": "Oversteekplaats",
                "terms": "oversteekplaats,zebrapad"
            },
            "highway/cycleway": {
                "name": "Fietspad"
            },
            "highway/footway": {
                "name": "Voetpad",
                "terms": "boulevard,doorgaande weg,gebaande weg,laan,pad,passage,route,autosnelweg,spoor,straat,voetpad,weg"
            },
            "highway/motorway": {
                "name": "Snelweg"
            },
            "highway/motorway_link": {
                "name": "Invoegstrook",
                "terms": "invoegstrook,oprit,afrit"
            },
            "highway/path": {
                "name": "Pad"
            },
            "highway/primary": {
                "name": "Provinciale weg"
            },
            "highway/primary_link": {
                "name": "Afrit provinciale weg",
                "terms": "invoegstrook,oprit,afrit"
            },
            "highway/residential": {
                "name": "Straat"
            },
            "highway/road": {
                "name": "Onbekende weg"
            },
            "highway/secondary": {
                "name": "Secundaire weg"
            },
            "highway/secondary_link": {
                "name": "Afslag secundaire weg",
                "terms": "invoegstrook,oprit,afrit"
            },
            "highway/service": {
                "name": "Toegangsweg"
            },
            "highway/steps": {
                "name": "Trap",
                "terms": "trap,trappenhuis"
            },
            "highway/tertiary": {
                "name": "Tertiare weg"
            },
            "highway/tertiary_link": {
                "name": "Afrit tertiaire weg",
                "terms": "invoegstrook,oprit,afrit"
            },
            "highway/track": {
                "name": "Veldweg"
            },
            "highway/traffic_signals": {
                "name": "Verkeerslichten",
                "terms": "verkeerslicht,stoplicht"
            },
            "highway/trunk": {
                "name": "Autoweg"
            },
            "highway/trunk_link": {
                "name": "Afrit autoweg",
                "terms": "invoegstrook,oprit,afrit"
            },
            "highway/turning_circle": {
                "name": "Keerplein"
            },
            "highway/unclassified": {
                "name": "Ongeclassificeerde weg"
            },
            "historic": {
                "name": "Geschiedskundige plaats"
            },
            "historic/archaeological_site": {
                "name": "Archeologische opgraving"
            },
            "historic/boundary_stone": {
                "name": "Historische grenspaal"
            },
            "historic/castle": {
                "name": "Kasteel"
            },
            "historic/memorial": {
                "name": "Gedenkplaats"
            },
            "historic/monument": {
                "name": "Monument"
            },
            "historic/ruins": {
                "name": "Ruïne"
            },
            "historic/wayside_cross": {
                "name": "Wegkruis"
            },
            "historic/wayside_shrine": {
                "name": "Kruisbeeld"
            },
            "landuse": {
                "name": "Landgebruik"
            },
            "landuse/allotments": {
                "name": "Volkstuinen"
            },
            "landuse/basin": {
                "name": "Waterbekken"
            },
            "landuse/cemetery": {
                "name": "Begraafplaats"
            },
            "landuse/commercial": {
                "name": "Kantoren"
            },
            "landuse/construction": {
                "name": "Bouwterrein"
            },
            "landuse/farm": {
                "name": "Boerderij"
            },
            "landuse/farmyard": {
                "name": "Boerenerf"
            },
            "landuse/forest": {
                "name": "Bosbouw"
            },
            "landuse/grass": {
                "name": "Grasland"
            },
            "landuse/industrial": {
                "name": "Industriegebied"
            },
            "landuse/meadow": {
                "name": "Hooiland"
            },
            "landuse/orchard": {
                "name": "Boomgaard"
            },
            "landuse/quarry": {
                "name": "Mijnbouw"
            },
            "landuse/residential": {
                "name": "Woningen"
            },
            "landuse/vineyard": {
                "name": "Wijngaard"
            },
            "leisure": {
                "name": "Vrijetijd"
            },
            "leisure/garden": {
                "name": "Tuin"
            },
            "leisure/golf_course": {
                "name": "Golfbaan"
            },
            "leisure/marina": {
                "name": "Jachthaven"
            },
            "leisure/park": {
                "name": "Park",
                "terms": "bos,bossage,gazon,grasveld,landgoed,park,speeltuin,speelweide,recreatiegebied,sportveldje,tuin,veldje,weide"
            },
            "leisure/pitch": {
                "name": "Sportveld"
            },
            "leisure/pitch/american_football": {
                "name": "Amerikaans voetbalveld"
            },
            "leisure/pitch/baseball": {
                "name": "Honkbalveld"
            },
            "leisure/pitch/basketball": {
                "name": "Basketbalveld"
            },
            "leisure/pitch/soccer": {
                "name": "Voetbalveld"
            },
            "leisure/pitch/tennis": {
                "name": "Tennisbaan"
            },
            "leisure/playground": {
                "name": "Speelplaats"
            },
            "leisure/slipway": {
                "name": "Botenhelling"
            },
            "leisure/stadium": {
                "name": "Stadion"
            },
            "leisure/swimming_pool": {
                "name": "Zwembad"
            },
            "man_made": {
                "name": "Aangelegd"
            },
            "man_made/lighthouse": {
                "name": "Vuurtoren"
            },
            "man_made/pier": {
                "name": "Pier"
            },
            "man_made/survey_point": {
                "name": "Landmeetkundig referentiepunt"
            },
            "man_made/water_tower": {
                "name": "Watertoren"
            },
            "natural": {
                "name": "Natuurlijk"
            },
            "natural/bay": {
                "name": "Baai"
            },
            "natural/beach": {
                "name": "Strand"
            },
            "natural/cliff": {
                "name": "Klif"
            },
            "natural/coastline": {
                "name": "Kustlijn",
                "terms": "kustlijn"
            },
            "natural/glacier": {
                "name": "Ijsgletsjer"
            },
            "natural/grassland": {
                "name": "Grassen en kruidachtige planten"
            },
            "natural/heath": {
                "name": "Heideveld"
            },
            "natural/peak": {
                "name": "Top",
                "terms": "berg,heuvel,top"
            },
            "natural/scrub": {
                "name": "Ruigte"
            },
            "natural/spring": {
                "name": "Bron"
            },
            "natural/tree": {
                "name": "Boom"
            },
            "natural/water": {
                "name": "Water"
            },
            "natural/water/lake": {
                "name": "Meer",
                "terms": "meer,ven"
            },
            "natural/water/pond": {
                "name": "Vijver",
                "terms": "meer,ven,poel"
            },
            "natural/water/reservoir": {
                "name": "Reservoir"
            },
            "natural/wetland": {
                "name": "Moerassen en waterrijke gebieden"
            },
            "natural/wood": {
                "name": "Oerbos"
            },
            "office": {
                "name": "Kantoor"
            },
            "other": {
                "name": "Overig"
            },
            "other_area": {
                "name": "Overig"
            },
            "place": {
                "name": "Plaats"
            },
            "place/hamlet": {
                "name": "Dorp/gehucht/buurtschap"
            },
            "place/island": {
                "name": "Eiland",
                "terms": "archipel,atol,eiland,rif"
            },
            "place/locality": {
                "name": "Veldnaam"
            },
            "place/village": {
                "name": "Dorp"
            },
            "power": {
                "name": "Stroomvoorziening"
            },
            "power/generator": {
                "name": "Electriciteitscentrale"
            },
            "power/line": {
                "name": "Electriciteitsdraad"
            },
            "power/pole": {
                "name": "Electriciteitspaal"
            },
            "power/sub_station": {
                "name": "Klein onderstation"
            },
            "power/tower": {
                "name": "Hoogspanningsmast"
            },
            "power/transformer": {
                "name": "Transformator"
            },
            "railway": {
                "name": "Spoorwegemplacement"
            },
            "railway/abandoned": {
                "name": "In onbruik geraakte spoorbaan"
            },
            "railway/disused": {
                "name": "In onbruik geraakte spoorbaan"
            },
            "railway/level_crossing": {
                "name": "Gelijkvloerse spoorwegovergang",
                "terms": "overgang,spoorwegovergang"
            },
            "railway/monorail": {
                "name": "Monorail, magneetzweefbaan"
            },
            "railway/rail": {
                "name": "Via een derde spoorrails"
            },
            "railway/subway": {
                "name": "Metro"
            },
            "railway/subway_entrance": {
                "name": "Metrostation"
            },
            "railway/tram": {
                "name": "Tram",
                "terms": "Tram"
            },
            "shop": {
                "name": "Winkel"
            },
            "shop/alcohol": {
                "name": "Slijterij"
            },
            "shop/bakery": {
                "name": "Bakkerij"
            },
            "shop/beauty": {
                "name": "Schoonheidssalon"
            },
            "shop/beverages": {
                "name": "Drankenwinkel"
            },
            "shop/bicycle": {
                "name": "Fietswinkel"
            },
            "shop/books": {
                "name": "Boekwinkel"
            },
            "shop/boutique": {
                "name": "Boutique"
            },
            "shop/butcher": {
                "name": "Slagerij"
            },
            "shop/car": {
                "name": "Autoshowroom"
            },
            "shop/car_parts": {
                "name": "Auto-onderdelenwinkel"
            },
            "shop/car_repair": {
                "name": "Autogarage"
            },
            "shop/chemist": {
                "name": "Drogist"
            },
            "shop/clothes": {
                "name": "Kledingwinkel"
            },
            "shop/computer": {
                "name": "Computerwinkel"
            },
            "shop/confectionery": {
                "name": "Banketbakkerij"
            },
            "shop/convenience": {
                "name": "Buurtsuper"
            },
            "shop/deli": {
                "name": "Delicatessenwinkel"
            },
            "shop/department_store": {
                "name": "Warenhuis"
            },
            "shop/doityourself": {
                "name": "Bouwmarkt, doe-het-zelfwinkel"
            },
            "shop/dry_cleaning": {
                "name": "Stomerij"
            },
            "shop/electronics": {
                "name": "Bruingoedwinkel"
            },
            "shop/fishmonger": {
                "name": "Visboer"
            },
            "shop/florist": {
                "name": "Bloemenwinkel"
            },
            "shop/furniture": {
                "name": "Woonwarenhuis"
            },
            "shop/garden_centre": {
                "name": "Tuincentrum"
            },
            "shop/gift": {
                "name": "Cadeauwinkel"
            },
            "shop/greengrocer": {
                "name": "Groenteboer"
            },
            "shop/hairdresser": {
                "name": "Kapper"
            },
            "shop/hardware": {
                "name": "Bouwmarkt"
            },
            "shop/hifi": {
                "name": "Bruingoedwinkel"
            },
            "shop/jewelry": {
                "name": "Juwelier"
            },
            "shop/kiosk": {
                "name": "Kiosk"
            },
            "shop/laundry": {
                "name": "Wasserette"
            },
            "shop/mall": {
                "name": "Winkelcentrum"
            },
            "shop/mobile_phone": {
                "name": "Telefoonwinkel"
            },
            "shop/motorcycle": {
                "name": "Motorwinkel"
            },
            "shop/music": {
                "name": "Muziekwinkel"
            },
            "shop/newsagent": {
                "name": "Krantenkiosk"
            },
            "shop/optician": {
                "name": "Opticien"
            },
            "shop/outdoor": {
                "name": "Buitensportzaak"
            },
            "shop/pet": {
                "name": "Dierenwinkel"
            },
            "shop/shoes": {
                "name": "Schoenenwinkel"
            },
            "shop/sports": {
                "name": "Sportzaak"
            },
            "shop/stationery": {
                "name": "Kantoorboekhandel"
            },
            "shop/supermarket": {
                "name": "Supermarkt",
                "terms": "bazar,boutique,keten,coöperatie,vlooienmarkt,galerie,supermarkt,winkelcentrum,winkel,markt"
            },
            "shop/toys": {
                "name": "Speelgoedwinkel"
            },
            "shop/travel_agency": {
                "name": "Reisbureau"
            },
            "shop/tyres": {
                "name": "Bandenwinkel"
            },
            "shop/vacant": {
                "name": "Leegstaande winkel"
            },
            "shop/variety_store": {
                "name": "Euroshop"
            },
            "shop/video": {
                "name": "Videotheek"
            },
            "tourism": {
                "name": "Toerisme"
            },
            "tourism/alpine_hut": {
                "name": "Berghut"
            },
            "tourism/artwork": {
                "name": "Kunstwerk"
            },
            "tourism/attraction": {
                "name": "Toeristische attractie"
            },
            "tourism/camp_site": {
                "name": "Camping"
            },
            "tourism/caravan_site": {
                "name": "Terrein voor kampeerwagens"
            },
            "tourism/chalet": {
                "name": "Chalet"
            },
            "tourism/guest_house": {
                "name": "Pension",
                "terms": "B&B,Bed & Breakfast,Bed and Breakfast"
            },
            "tourism/hostel": {
                "name": "Jeugdherberg"
            },
            "tourism/hotel": {
                "name": "Hotel"
            },
            "tourism/information": {
                "name": "Informatie"
            },
            "tourism/motel": {
                "name": "Motel"
            },
            "tourism/museum": {
                "name": "Museum",
                "terms": "archief,tentoonstelling,galerie,instituut,bibliotheek,schatkamer"
            },
            "tourism/picnic_site": {
                "name": "Picknickplek"
            },
            "tourism/theme_park": {
                "name": "Themapark"
            },
            "tourism/viewpoint": {
                "name": "Uitzichtpunt"
            },
            "tourism/zoo": {
                "name": "Dierentuin"
            },
            "waterway": {
                "name": "Waterweg"
            },
            "waterway/canal": {
                "name": "Kanaal"
            },
            "waterway/dam": {
                "name": "Dam"
            },
            "waterway/ditch": {
                "name": "Sloot, greppel of gracht"
            },
            "waterway/drain": {
                "name": "Sloot, greppel of gracht"
            },
            "waterway/river": {
                "name": "Rivier",
                "terms": "beek,estuarium,kreek,stroom,waterloop"
            },
            "waterway/riverbank": {
                "name": "Rivieroever"
            },
            "waterway/stream": {
                "name": "Beek",
                "terms": "beek,kreek,stroom,waterloop"
            },
            "waterway/weir": {
                "name": "Stuw"
            }
        }
    }
};
locale.fr = {
    "modes": {
        "add_area": {
            "title": "Polygone",
            "description": "Les polygones peuvent être des parcs, des batîments, des lacs ou tout autre objet surfacique.",
            "tail": "Cliquez sur la carte pour ajouter un polygone tel qu'un parc, un lac ou un bâtiment."
        },
        "add_line": {
            "title": "Ligne",
            "description": "Les lignes peuvent être des autoroutes, des routes, des chemins ou encore des caneaux.",
            "tail": "Cliquez sur la carte pour ajouter une nouvelle ligne telle qu'une route ou un nouveau chemin."
        },
        "add_point": {
            "title": "Point",
            "description": "Les points peuvent être des restaurants, des monuments, ou encore des boites aux lettres.",
            "tail": "Cliquez sur la carte pour ajouter un point tel qu'un restaurant ou un monument."
        },
        "browse": {
            "title": "Navigation",
            "description": "Naviguer ou zoomer sur la carte."
        },
        "draw_area": {
            "tail": "Cliquez pour ajouter un point à la zone. Cliquez sur le dernier point pour fermer la zone."
        },
        "draw_line": {
            "tail": "Cliquez pour ajouter un point à la ligne. Cliquez sur une autre ligne pour les connecter, puis faîtes un double-clique pour terminer la ligne."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Ajouter un point.",
                "vertex": "Ajouter un noeud à une ligne."
            }
        },
        "start": {
            "annotation": {
                "line": "Commencer une nouvelle ligne.",
                "area": "Commencer un polygone."
            }
        },
        "continue": {
            "annotation": {
                "line": "Continuer une ligne.",
                "area": "Continuer un polygone."
            }
        },
        "cancel_draw": {
            "annotation": "Annuler un ajout."
        },
        "change_tags": {
            "annotation": "Modifier les tags."
        },
        "circularize": {
            "title": "Arrondir",
            "key": "O",
            "annotation": {
                "line": "Créer un cercle linéaire.",
                "area": "Créer un cercle surfacique (disque)."
            }
        },
        "orthogonalize": {
            "title": "Orthogonaliser",
            "description": "Rendre une forme orthogonale.",
            "key": "Q",
            "annotation": {
                "line": "Orthogonaliser une ligne orthogonale.",
                "area": "Orthogonaliser un polygone orthogonale."
            }
        },
        "delete": {
            "title": "Supprimer",
            "description": "Supprime l'élément de la carte.",
            "annotation": {
                "point": "Supprime un point.",
                "vertex": "Supprime le noeud d'une ligne.",
                "line": "Supprime une ligne.",
                "area": "Supprime un polygone.",
                "relation": "Supprime une relation.",
                "multiple": "Supprime {n} objets."
            }
        },
        "connect": {
            "annotation": {
                "point": "Joindre une ligne à un point.",
                "vertex": "Joindre les noeuds à une ligne.",
                "line": "Joindre les chemins ensemble.",
                "area": "Joindre une ligne à un polygone."
            }
        },
        "disconnect": {
            "title": "Séparer",
            "description": "Sépare les lignes l'une de l'autre.",
            "key": "D",
            "annotation": "Sépare les lignes."
        },
        "merge": {
            "title": "Fusionner",
            "description": "Fusionne les lignes.",
            "key": "C",
            "annotation": "Fusionne les {n} ligne."
        },
        "move": {
            "title": "Déplacer",
            "description": "Déplace l'élément à un autre endroit.",
            "key": "M",
            "annotation": {
                "point": "Déplace un point.",
                "vertex": "Déplace le noeud d'une ligne.",
                "line": "Déplace une ligne.",
                "area": "Déplace un polygone.",
                "multiple": "Déplace un groupe d'objets."
            }
        },
        "rotate": {
            "title": "Rotation",
            "description": "Fait pivoter cet objet en fonction de son centroïde.",
            "key": "R",
            "annotation": {
                "line": "Pivoter la ligne.",
                "area": "Pivoter un polyone."
            }
        },
        "reverse": {
            "title": "Inverser",
            "description": "Inverse le sens d'une ligne.",
            "key": "V",
            "annotation": "Inverse le sens d'une ligne."
        },
        "split": {
            "title": "Couper",
            "key": "X"
        }
    },
    "nothing_to_undo": "Rien à annuler.",
    "nothing_to_redo": "Rien à refaire.",
    "just_edited": "Vous venez de participer à OpenStreetMap!",
    "browser_notice": "Les navigateurs supportés par cet éditeur sont : Firefox, Chrome, Safari, Opera et Internet Explorer (version 9 et supérieures). Pour éditer la carte, veuillez mettre à jour votre navigateur ou utiliser Potlatch 2.",
    "view_on_osm": "Consulter dans OSM",
    "zoom_in_edit": "Zoomer pour modifier la carte",
    "logout": "Déconnexion",
    "report_a_bug": "Signaler un bug",
    "commit": {
        "title": "Sauvegarder vos modifications",
        "description_placeholder": "Description succinte de vos contributions",
        "upload_explanation": "{user} : les modifications apportées seront visibles par l'ensemble des services utilisant les données d'OpenStreetMap.",
        "save": "Sauvegarder",
        "cancel": "Annuler",
        "warnings": "Attention",
        "modified": "Modifié",
        "deleted": "Supprimé",
        "created": "Créé"
    },
    "contributors": {
        "list": "Contributions réalisées par {users}",
        "truncated_list": "Contributions réalisées par {users} et {count} autres personnes"
    },
    "geocoder": {
        "title": "Trouver un emplacement",
        "placeholder": "Trouver un endroit",
        "no_results": "Impossible de localiser l'endroit nommé '{name}'"
    },
    "geolocate": {
        "title": "Me localiser"
    },
    "inspector": {
        "no_documentation_combination": "Aucune documentation n'est disponible pour cette combinaison de tag",
        "no_documentation_key": "Aucune documentation n'est disponible pour cette clé",
        "show_more": "Plus d'infornations",
        "new_tag": "Nouveau tag",
        "view_on_osm": "Visualiser sur OSM",
        "editing_feature": "Édition de {feature}",
        "additional": "Tags complémentaires",
        "choose": "Que souhaitez vous ajouter?",
        "results": "{n} résultats pour {search}",
        "reference": "Consulter sur le Wiki d'OpenStreetMap",
        "back_tooltip": "Changer le type de l'objet "
    },
    "background": {
        "title": "Fond de carte",
        "description": "Paramètres du fond de carte",
        "percent_brightness": "{opacity}% luminosité",
        "fix_misalignment": "Corriger le décalage",
        "reset": "réinitialiser"
    },
    "restore": {
        "heading": "Vous avez des changements non sauvés.",
        "description": "Vous avez des changements non sauvegardés d'une précédente édition. Souhaitez-vous restaurer ces changements?",
        "restore": "Restaurer",
        "reset": "Annuler"
    },
    "save": {
        "title": "Sauvegarder",
        "help": "Envoie des modifications au serveyr OpenStreetMap afin qu'elles soient visibles par les autres contributeurs.",
        "no_changes": "Aucune modification à sauvegarder",
        "error": "Une erreur est survenue lors de l'enregistrement des données",
        "uploading": "Envoie des modifications vers OpenStreetMap.",
        "unsaved_changes": "Vous avez des modifications non enregistrées"
    },
    "splash": {
        "welcome": "Bienvenue sur ID l'editeur en ligne d'OpenStreetMap",
        "text": "Cette version {version}, est une version de développement. Si vous souhaitez plus d'informations, veuillez consulter {website} ou pour signaler un bug   {github}.",
        "start": "Editer"
    },
    "source_switch": {
        "live": "live",
        "dev": "dev"
    },
    "tag_reference": {
        "description": "Description",
        "on_wiki": "{tag} sur le wiki.osm.org",
        "used_with": "Utilisé avec {type}"
    },
    "validations": {
        "untagged_point": "Point sans aucun tag ne faisant partie ni d'une ligne, ni d'un polygone",
        "untagged_line": "Ligne sans aucun tag",
        "untagged_area": "Polygone sans aucun tag",
        "many_deletions": "You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        "tag_suggests_area": "Ce tag {tag} suppose que cette ligne devrait être un polygone, or ce n'est pas le cas",
        "deprecated_tags": "Tags obsolètes : {tags}"
    },
    "zoom": {
        "in": "Zoomer",
        "out": "Dézoomer"
    },
    "gpx": {
        "local_layer": "Fichier GPX personnel",
        "drag_drop": "Glisser et déposer un fichier .gpx sur la page"
    },
    "help": {
        "title": "Aide"
    },
    "presets": {
        "fields": {
            "address": {
                "label": "Adresse",
                "placeholders": {
                    "number": "123",
                    "street": "Rue",
                    "city": "Ville"
                }
            },
            "aeroway": {
                "label": "Type"
            },
            "amenity": {
                "label": "Type"
            },
            "bicycle_parking": {
                "label": "Type"
            },
            "building": {
                "label": "Bâtiment "
            },
            "building_area": {
                "label": "Bâtiment"
            },
            "building_yes": {
                "label": "Bâtiment"
            },
            "capacity": {
                "label": "Capacité"
            },
            "construction": {
                "label": "Type"
            },
            "crossing": {
                "label": "Type"
            },
            "cuisine": {
                "label": "Cuisine"
            },
            "denomination": {
                "label": "Denomination "
            },
            "elevation": {
                "label": "Elevation "
            },
            "entrance": {
                "label": "Type"
            },
            "fax": {
                "label": "Fax"
            },
            "highway": {
                "label": "Type"
            },
            "historic": {
                "label": "Type"
            },
            "internet_access": {
                "label": "Accès Internet",
                "options": {
                    "wlan": "Wifi"
                }
            },
            "landuse": {
                "label": "Type"
            },
            "layer": {
                "label": "Couche"
            },
            "leisure": {
                "label": "Type"
            },
            "levels": {
                "label": "Niveaux"
            },
            "man_made": {
                "label": "Type"
            },
            "maxspeed": {
                "label": "Limite de vitesse"
            },
            "note": {
                "label": "Note"
            },
            "office": {
                "label": "Type"
            },
            "oneway": {
                "label": "Sens unique"
            },
            "opening_hours": {
                "label": "Heures"
            },
            "operator": {
                "label": "Operateur "
            },
            "phone": {
                "label": "Telephone "
            },
            "place": {
                "label": "Type"
            },
            "railway": {
                "label": "Type"
            },
            "religion": {
                "label": "Religion",
                "options": {
                    "christian": "Christianisme",
                    "muslim": "Musulmane",
                    "buddhist": "Budhiste ",
                    "jewish": "Juive",
                    "hindu": "Indouiste ",
                    "taoist": "Taoiste "
                }
            },
            "service": {
                "label": "Type"
            },
            "shop": {
                "label": "Type"
            },
            "source": {
                "label": "Source"
            },
            "sport": {
                "label": "Sport"
            },
            "surface": {
                "label": "Surface"
            },
            "tourism": {
                "label": "Type"
            },
            "water": {
                "label": "Type"
            },
            "waterway": {
                "label": "Type"
            },
            "website": {
                "label": "Site Internet"
            },
            "wetland": {
                "label": "Type"
            },
            "wikipedia": {
                "label": "Wikipedia"
            },
            "wood": {
                "label": "Type"
            }
        },
        "presets": {
            "aeroway/aerodrome": {
                "name": "Aeroport "
            },
            "amenity/bank": {
                "name": "Banque"
            },
            "amenity/bar": {
                "name": "Bar"
            },
            "amenity/bicycle_parking": {
                "name": "Parc à velos "
            },
            "amenity/bicycle_rental": {
                "name": "Location de velos "
            },
            "amenity/cafe": {
                "name": "Cafe "
            },
            "amenity/cinema": {
                "name": "Cinema "
            },
            "amenity/fast_food": {
                "name": "Fast Food"
            },
            "amenity/fire_station": {
                "name": "Caserne de pompier"
            },
            "amenity/grave_yard": {
                "name": "Cimetière"
            },
            "amenity/hospital": {
                "name": "Hopital "
            },
            "amenity/library": {
                "name": "Bibliotheque "
            },
            "amenity/parking": {
                "name": "Parking "
            },
            "amenity/pharmacy": {
                "name": "Pharmacie"
            },
            "amenity/place_of_worship": {
                "name": "Lieu de culte"
            },
            "amenity/place_of_worship/christian": {
                "name": "Eglise "
            },
            "amenity/place_of_worship/jewish": {
                "name": "Cynagogue "
            },
            "amenity/place_of_worship/muslim": {
                "name": "Mosque "
            },
            "amenity/police": {
                "name": "Poste de police"
            },
            "amenity/post_box": {
                "name": "Boite aux lettres"
            },
            "amenity/pub": {
                "name": "Pub"
            },
            "amenity/restaurant": {
                "name": "Restaurant"
            },
            "amenity/school": {
                "name": "Ecole "
            },
            "amenity/toilets": {
                "name": "Toiletes "
            },
            "amenity/university": {
                "name": "Universite "
            },
            "building": {
                "name": "Batiment "
            },
            "entrance": {
                "name": "Entree "
            },
            "highway/bus_stop": {
                "name": "Arret de bus "
            },
            "highway/crossing": {
                "name": "Passage pieton "
            },
            "highway/primary": {
                "name": "Route principale"
            },
            "highway/residential": {
                "name": "Route residentielle "
            },
            "highway/secondary": {
                "name": "Route secondaire"
            },
            "highway/steps": {
                "name": "Escaliers"
            },
            "highway/tertiary": {
                "name": "Route tertiaire"
            },
            "highway/traffic_signals": {
                "name": "Feux tricolores"
            },
            "highway/turning_circle": {
                "name": "Rond point"
            },
            "historic": {
                "name": "Site historique"
            },
            "historic/monument": {
                "name": "Monument"
            },
            "landuse/cemetery": {
                "name": "Cimetiere "
            },
            "landuse/commercial": {
                "name": "Commerciale"
            },
            "landuse/construction": {
                "name": "Construction"
            },
            "landuse/farm": {
                "name": "Ferme"
            },
            "landuse/forest": {
                "name": "Forêt"
            },
            "landuse/grass": {
                "name": "Herbe"
            },
            "landuse/industrial": {
                "name": "Industrielle"
            },
            "landuse/residential": {
                "name": "Residentielle "
            },
            "leisure/golf_course": {
                "name": "Parcours de golf"
            },
            "leisure/park": {
                "name": "Parc"
            },
            "leisure/pitch/tennis": {
                "name": "Court de tennis"
            },
            "man_made/lighthouse": {
                "name": "Phare"
            },
            "natural/bay": {
                "name": "Baie"
            },
            "natural/beach": {
                "name": "Plage"
            },
            "natural/tree": {
                "name": "Arbre"
            },
            "natural/water/lake": {
                "name": "Lac"
            },
            "place/island": {
                "name": "Ile "
            },
            "place/village": {
                "name": "Village"
            },
            "shop": {
                "name": "Magasin"
            },
            "shop/butcher": {
                "name": "Boucher "
            },
            "shop/supermarket": {
                "name": "Supermarche "
            },
            "tourism": {
                "name": "Tourisme"
            },
            "tourism/museum": {
                "name": "Musee "
            }
        }
    }
};
locale.de = {
    "modes": {
        "add_area": {
            "title": "Fläche.",
            "description": "Füge Parks, Gebäude, Seen oder andere Flächen zur Karte hinzu.",
            "tail": "Klicke in die Karte, um das Zeichnen einer Fläche wie einen Park, einen See oder Gebäude zu starten."
        },
        "add_line": {
            "title": "Linie",
            "description": "Füge Autobahnen, Straßen, Fußwege, Kanäle oder andere Linien zur Karte hinzu.",
            "tail": "Klicke in die Karte, um das Zeichnen einer Straße, eines Pfades oder einer Route zu starten."
        },
        "add_point": {
            "title": "Punkt",
            "description": "Restaurants, Denkmäler und Briefkästen sind Punkte",
            "tail": "Klicke in die Karte, um einen Punkt hinzuzufügen."
        },
        "browse": {
            "title": "Navigation",
            "description": "Verschieben und Vergrößern/Verkleinern des Kartenausschnitts."
        },
        "draw_area": {
            "tail": "Klicke, um Punkte zur Fläche hinzuzufügen. Klicke auf den ersten Punkt, um die Fläche abzuschließen."
        },
        "draw_line": {
            "tail": "Klicke, um mehr Punkte zur Linie hizuzufügen. Klicke auf eine andere Linie, um die Linien zu verbinden und klicke doppelt, um die Linie zu beenden."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Punkt hinzugefügt.",
                "vertex": "Stützpunkt einem Weg hinzugefügt."
            }
        },
        "start": {
            "annotation": {
                "line": "Linie begonnen.",
                "area": "Fläche begonnen."
            }
        },
        "continue": {
            "annotation": {
                "line": "Linie fortgesetzt.",
                "area": "Fläche fortgesetzt."
            }
        },
        "cancel_draw": {
            "annotation": "Zeichnen abgebrochen."
        },
        "change_tags": {
            "annotation": "Tags verändert."
        },
        "circularize": {
            "title": "Abrunden",
            "description": {
                "line": "Diese Linie kreisförmig machen.",
                "area": "Dieses Gebiet kreisförmig machen."
            },
            "key": "O",
            "annotation": {
                "line": "Runde eine Linie ab.",
                "area": "Runde eine Fläche ab."
            },
            "not_closed": "Dieses Objekt kann nicht kreisförmig gemacht werden, da es keine geschlossene Linie ist."
        },
        "orthogonalize": {
            "title": "Rechtwinkligkeit herstellen",
            "description": "Diese Ecken rechtwinklig ausrichten.",
            "key": "Q",
            "annotation": {
                "line": "Die Ecken einer Linie rechtwinklig ausgerichtet.",
                "area": "Die Ecken einer Fläche rechtwinklig ausgerichtet."
            },
            "not_closed": "Dieses Objekt kann nicht rechtwinklig gemacht werden, da es keine geschlossene Linie ist."
        },
        "delete": {
            "title": "Löschen",
            "description": "Lösche dies aus der Karte.",
            "annotation": {
                "point": "Punkt gelöscht.",
                "vertex": "Stützpunkt aus einem Weg gelöscht.",
                "line": "Linie gelöscht.",
                "area": "Fläche gelöscht.",
                "relation": "Verbindung gelöscht.",
                "multiple": "{n} Objekte gelöscht."
            }
        },
        "connect": {
            "annotation": {
                "point": "Weg mit einem Punkt verbunden.",
                "vertex": "Weg mit einem anderem Weg verbunden.",
                "line": "Weg mit einer Linie verbunden.",
                "area": "Weg mit einer Fläche verbunden."
            }
        },
        "disconnect": {
            "title": "Trennen",
            "description": "Trenne diese Wege voneinander.",
            "key": "D",
            "annotation": "Wege getrennt.",
            "not_connected": "Es gibt nicht hier nicht genug Linien/Gebiete, um diese zu trennen."
        },
        "merge": {
            "title": "Vereinigen",
            "description": "Vereinige diese Linien.",
            "key": "C",
            "annotation": "{n} Linien vereinigt.",
            "not_eligible": "Diese Objekte können nicht vereint werden.",
            "not_adjacent": "Diese Linien können nicht vereint werden, da sie nicht verbunden sind."
        },
        "move": {
            "title": "Verschieben",
            "description": "Verschiebe dieses Objekt an einen anderen Ort.",
            "key": "M",
            "annotation": {
                "point": "Punkt verschoben.",
                "vertex": "Stützpunkt in einen Weg veschoben.",
                "line": "Linie verschoben.",
                "area": "Fläche verschoben.",
                "multiple": "Mehrere Objekte verschoben."
            },
            "incomplete_relation": "Dieses Objekt kann nicht verschoben werden, da es nicht vollständig heruntergeladen wurde."
        },
        "rotate": {
            "title": "Drehen",
            "description": "Dieses Objekt um seinen Mittelpunkt drehen.",
            "key": "R",
            "annotation": {
                "line": "Linie gedreht.",
                "area": "Fläche gedreht."
            }
        },
        "reverse": {
            "title": "Umkehren",
            "description": "Ändere die Richtung dieser Linie.",
            "key": "V",
            "annotation": "Linienrichtung umgekehrt."
        },
        "split": {
            "title": "Teilen",
            "description": {
                "line": "Die Linie an diesem Punkt teilen.",
                "area": "Die Gebietsgrenze teilen.",
                "multiple": "Die Linie/Gebietsgrenze an diesem Punkt teilen."
            },
            "key": "X",
            "annotation": {
                "line": "Linie teilen.",
                "area": "Gebietsgrenze teilen.",
                "multiple": "{n} Linien/Gebietsgrenzen teilen."
            },
            "not_eligible": "Linien können nicht am Anfang oder Ende geteilt werden.",
            "multiple_ways": "Es gibt hier zu viele Linien, um diese teilen zu können."
        }
    },
    "nothing_to_undo": "Nichts zum Rückgängigmachen.",
    "nothing_to_redo": "Nichts zum Wiederherstellen.",
    "just_edited": "Sie haben gerade OpenStreetMap editiert!",
    "browser_notice": "Dieser Editor wird von Firefox, Chrome, Safari, Opera, und Internet Explorer (Version 9 und höher) unterstützt. Bitte aktualisieren Sie Ihren Browser oder nutzen Sie Potlatch 2, um die Karte zu modifizieren.",
    "view_on_osm": "Auf OpenStreetMap anschauen",
    "zoom_in_edit": "Hineinzoomen, um die Karte zu bearbeiten",
    "logout": "Abmelden",
    "loading_auth": "Verbinde mit OpenStreetMap....",
    "report_a_bug": "Programmfehler melden",
    "commit": {
        "title": "Änderungen speichern",
        "description_placeholder": "Eine kurze Beschreibung deiner Beiträge",
        "upload_explanation": "Änderungen, die du als {user} hochlädst werden sichtbar auf allen Karte, die OpenStreetMap nutzen.",
        "save": "Speichern",
        "cancel": "Abbrechen",
        "warnings": "Warnungen",
        "modified": "Verändert",
        "deleted": "Gelöscht",
        "created": "Erstellt"
    },
    "contributors": {
        "list": "Diese Kartenansicht enthält Beiträge von:",
        "truncated_list": "Diese Kartenansicht enthält Beiträge von: {users} und {count} anderen"
    },
    "geocoder": {
        "title": "Suche einen Ort",
        "placeholder": "suche einen Ort",
        "no_results": "Der Ort '{name}' konnte nicht gefunden werden"
    },
    "geolocate": {
        "title": "Zeige meine Position"
    },
    "inspector": {
        "no_documentation_combination": "Für dieses Attribut ist keine Dokumentation verfügbar.",
        "no_documentation_key": "Für dises Schlüsselwort ist keine Dokumentation verfügbar",
        "show_more": "Zeige mehr",
        "new_tag": "Neues Attribut",
        "view_on_osm": "auf OpenStreetMap ansehen",
        "editing_feature": "In Bearbeitung {feature}",
        "additional": "Weitere Merkmale",
        "choose": "Eigenschafts-Typ auswählen",
        "results": "{n} Resultate für {search}",
        "reference": "In der OpenSteetMap Wiki anschauen →",
        "back_tooltip": "Eigenschafts-Typ ändern"
    },
    "background": {
        "title": "Hintergrund",
        "description": "Hintergrundeinstellungen",
        "percent_brightness": "{opacity}% Helligkeit",
        "fix_misalignment": "Fehlerhafte Ausrichtung reparieren",
        "reset": "Zurücksetzen"
    },
    "restore": {
        "heading": "Ungespeicherte Änderungen vorhanden",
        "description": "Es gibt ungespeicherte Änderungen aus einer vorherigen Sitzung. Möchtest du diese Änderungen wiederherstellen?",
        "restore": "Wiederherstellen",
        "reset": "Zurücksetzen"
    },
    "save": {
        "title": "Speichern",
        "help": "Speichere Änderungen auf OpenStreetMap, um diese für andere Nutzer sichtbar zu machen.",
        "no_changes": "Keine zu speichernden Änderungen.",
        "error": "Beim Speichern ist ein Fehler aufgetreten",
        "uploading": "Änderungen werden zu OpenStreetMap hochgeladen.",
        "unsaved_changes": "Ungespeicherte Änderungen vorhanden"
    },
    "splash": {
        "welcome": "Willkommen beim iD OpenStreetMap-Editor",
        "text": "Dies ist eine Entwicklungsversion {version}. Für weitere Informationen besuche {website} und melde Fehler unter {github}.",
        "walkthrough": "Starte das Walkthrough",
        "start": "Jetzt bearbeiten"
    },
    "source_switch": {
        "live": "live",
        "lose_changes": "Es gibt ungespeicherte Änderungen. Durch Wechsel des Karten-Servers, gehen diese verloren. Sind Sie sicher, dass Sie die Server wechseln wollen?",
        "dev": "dev"
    },
    "tag_reference": {
        "description": "Beschreibung",
        "on_wiki": "{tag} auf wiki.osm.org",
        "used_with": "benutzt mit {type}"
    },
    "validations": {
        "untagged_point": "Punkt ohne Attribute, der kein Teil einer Linie oder Fläche ist",
        "untagged_line": "Linie ohne Attribute",
        "untagged_area": "Fläche ohne Attribute",
        "many_deletions": "You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        "tag_suggests_area": "Das Attribut {tag} suggeriert eine Fläche, ist aber keine Fläche",
        "deprecated_tags": "Veraltete Attribute: {tags}"
    },
    "zoom": {
        "in": "Hineinzoomen",
        "out": "Herauszoomen"
    },
    "gpx": {
        "local_layer": "Lokale GPX-Datei",
        "drag_drop": "Eine GPX-Datei per Drag & Drop auf die Seite ziehen"
    },
    "help": {
        "title": "Hilfe"
    },
    "intro": {
        "navigation": {
            "drag": "Die Karte zeigt OpenStreetMap Daten auf einem Hintergrund. Du kannst sie wie jede andere Karte im Internet durch zeihen bewegen. **Verschiebe die Karte**",
            "select": "Kartenobjekte werden in drei verschiedenen Weisen dargestellt: als Punkte, als Linie oder als Flächen. Alle Objekte können durch Klicken ausgewählt werden. **Klicke auf einen Punkt, um ihn auszuwählen**",
            "header": "Die Kopfzeile zeigt den Typ des Objektes.",
            "pane": "Wird ein Objekt ausgewählt, wird der Eigenschaftseditor angezeigt. Die Kopfzeile zeigt den Typ des Objektes an. Im Hauptfenster werden die Eigenschaften des Objektes angezeigt, wie etwa sein Name und seine Adresse.\n**Schließe den Eigenschaftseditor mit dem Schließen-Button rechts oben.**"
        },
        "points": {
            "add": "Punkte können verwendet werden, um Objekte wie Läden, Restaurants oder Denkmäler darzustellen. Sie markieren eine bestimmte Stelle und beschreiben, was sich dort befindet. **Klicke den Punkt-Knopf an, um einen neuen Punkt hinzuzufügen**",
            "place": "Punkte können durch Klicken auf die Karte platziert werden. **Platziere einen Punkt auf dem Gebäude**",
            "search": "Es gibt viele verschiedene Objekte, die ein Punkt repräsentieren kann. Der Punkt, den du gerade hinzugefügt hast, ist ein Café. **Suche nach \"Café\"**",
            "choose": "**Wähle Café aus dem Raster**",
            "describe": "Der Knoten wurde nun als Café markiert. Mit dem Eigenschaftseditor können wir mehr Informationen über das Objekt angeben. **Füge einen Namen hinzu.**",
            "close": "Der Eigenschaftseditor kann mithilfe des Schließen-Buttons beendet werden. **Schließe den Eigenschaftseditor.**",
            "reselect": "Oftmals existieren Knoten bereits, haben aber falsche oder unvollständige Eigenschaften. Wir können vorhandene Knoten bearbeiten. **Wähle den Punkt aus, den du gerade erstellt hast.**",
            "fixname": "**Ändere den Namen und schließe den Eigenschaftseditor.**",
            "reselect_delete": "Alle Sachen auf der Karte können gelöscht werden. **Klicke auf den von dir erzeugten Punkt**",
            "delete": "Das Menü um den Knoten herum beinhaltet Werkzeuge, um diesen zu bearbeiten. So kann man ihn unter anderem auch löschen. **Lösche den Knoten.**"
        },
        "areas": {
            "add": "Gebiete sind eine Möglichkeit, Objekte detailliert wiederzugeben. Diese bieten Information über die Grenzen des Objektes. Gebiete können fast immer da verwendet werden, wo auch Knoten Verwendung finden, werden aber oft bevorzugt. **Benutze den Gebiets-Button, um ein neues Gebiet hinzuzufügen.**",
            "corner": "Flächen werden gezeichnet, indem man Punkte platziert, die den Umriss der Fläche repräsentieren. **Setze den Startpunkt auf eine Ecke des Spielplatzes**",
            "place": "Zeichne eine Fläche indem du mehr Punkte hinzufügst. Beende die Fläche, indem du auf den Startpunkt klickst. **Zeichne eine Fläche für den Spielplatz.**",
            "search": "**Suche nach Spieplatz**",
            "choose": "**Wähle \"Spielplatz\" aus der Liste aus.**",
            "describe": "**Füge einen Namen hinzu und schließe den Eigenschaftseditor**"
        },
        "lines": {
            "add": "Linien werden verwendet um Sachen wie Straßen, Bahngleise und Flüsse zu erzeugen. **Klicke auf den Linien-Knopf um eine neue Linie zu zeichnen**",
            "start": "**Beginne die Linie, indem du auf das Ende der Straße klickst.**",
            "intersect": "Klicke um mehr Punkte zu einer Linie hinzuzufügen. Du kannst während des Zeichnens die Karte verschieben. Straßen und andere Wege sind teil eines großen Netzwerk und müssen ordnungsgemäß mit einander verbunden sein, um sie für Routenführung nutzen zu können. **Klicke auf die Flower Street um eine Kreuzung zu erzeugen und beide Linien zu verbinden.**",
            "finish": "Linien können vollendet werden, indem man den letzten Punkt erneut anklickt **Zeichnen der Straße beenden**",
            "road": "**Wähle eine Straße aus dem Raster**",
            "residential": "Es gibt verschiedene Straßenarten. Die Häufigste davon ist die Wohngebietsstraße. **Wähle die Wohngebietsstraße**",
            "describe": "**Benenne die Straße und schließe den Eigenschaftseditor**",
            "restart": "Die Straße muss die Flower Street schneiden."
        },
        "startediting": {
            "help": "Mehr Informationen und Anleitungen findest du hier.",
            "save": "Vergiss nicht regelmäßig zu speichern!",
            "start": "Fange an zu mappen!"
        }
    },
    "presets": {
        "fields": {
            "access": {
                "label": "Zugang"
            },
            "address": {
                "label": "Adresse",
                "placeholders": {
                    "housename": "Hausname",
                    "number": "123",
                    "street": "Straße",
                    "city": "Stadt"
                }
            },
            "aeroway": {
                "label": "Typ"
            },
            "amenity": {
                "label": "Typ"
            },
            "atm": {
                "label": "Geldautomat"
            },
            "barrier": {
                "label": "Typ"
            },
            "bicycle_parking": {
                "label": "Typ"
            },
            "building": {
                "label": "Gebäude"
            },
            "building_area": {
                "label": "Gebäude"
            },
            "building_yes": {
                "label": "Gebäude"
            },
            "capacity": {
                "label": "Kapazität"
            },
            "collection_times": {
                "label": "Leerungszeiten"
            },
            "construction": {
                "label": "Typ"
            },
            "country": {
                "label": "Land"
            },
            "crossing": {
                "label": "Typ"
            },
            "cuisine": {
                "label": "Küche"
            },
            "denomination": {
                "label": "Glaubensrichtung"
            },
            "denotation": {
                "label": "Vorgesehene Verwendung"
            },
            "elevation": {
                "label": "Erhöhung"
            },
            "emergency": {
                "label": "Notfall"
            },
            "entrance": {
                "label": "Art"
            },
            "fax": {
                "label": "Fax"
            },
            "fee": {
                "label": "Gebühr"
            },
            "highway": {
                "label": "Art"
            },
            "historic": {
                "label": "Art"
            },
            "internet_access": {
                "label": "Internetzugang",
                "options": {
                    "wlan": "Wifi",
                    "wired": "Kabelgebunden"
                }
            },
            "landuse": {
                "label": "Art"
            },
            "layer": {
                "label": "Ebene"
            },
            "leisure": {
                "label": "Art"
            },
            "levels": {
                "label": "Etagen"
            },
            "man_made": {
                "label": "Art"
            },
            "maxspeed": {
                "label": "Höchstgeschwindigkeit"
            },
            "name": {
                "label": "Name"
            },
            "natural": {
                "label": "Natur"
            },
            "network": {
                "label": "Netzwerk"
            },
            "note": {
                "label": "Notiz"
            },
            "office": {
                "label": "Typ"
            },
            "oneway": {
                "label": "Einbahnstraße"
            },
            "oneway_yes": {
                "label": "Einbahnstraße"
            },
            "opening_hours": {
                "label": "Öffnungszeiten"
            },
            "operator": {
                "label": "Betreiber"
            },
            "phone": {
                "label": "Telefon"
            },
            "place": {
                "label": "Art"
            },
            "power": {
                "label": "Typ"
            },
            "railway": {
                "label": "Art"
            },
            "ref": {
                "label": "Bezug"
            },
            "religion": {
                "label": "Religion",
                "options": {
                    "christian": "Christlich",
                    "muslim": "Muslimisch",
                    "buddhist": "Buddhistisch",
                    "jewish": "Jüdisch",
                    "hindu": "Hindu",
                    "shinto": "Shinto",
                    "taoist": "Tao"
                }
            },
            "service": {
                "label": "Art"
            },
            "shelter": {
                "label": "Unterstand"
            },
            "shop": {
                "label": "Art"
            },
            "source": {
                "label": "Quelle"
            },
            "sport": {
                "label": "Sport"
            },
            "structure": {
                "label": "Struktur",
                "options": {
                    "bridge": "Brücke",
                    "tunnel": "Tunnel",
                    "embankment": "Fahrdamm",
                    "cutting": "Senke"
                }
            },
            "surface": {
                "label": "Oberfläche"
            },
            "tourism": {
                "label": "Art"
            },
            "water": {
                "label": "Art"
            },
            "waterway": {
                "label": "Art"
            },
            "website": {
                "label": "Webseite"
            },
            "wetland": {
                "label": "Art"
            },
            "wheelchair": {
                "label": "Rollstuhlzugang"
            },
            "wikipedia": {
                "label": "Wikipedia"
            },
            "wood": {
                "label": "Art"
            }
        },
        "presets": {
            "aeroway": {
                "name": "Luftfahrt"
            },
            "aeroway/aerodrome": {
                "name": "Flughafen",
                "terms": "Flughafen"
            },
            "aeroway/helipad": {
                "name": "Hubschrauberlandeplatz",
                "terms": "Heliport"
            },
            "amenity": {
                "name": "Einrichtungen"
            },
            "amenity/bank": {
                "name": "Bank"
            },
            "amenity/bar": {
                "name": "Bar"
            },
            "amenity/bench": {
                "name": "Bank"
            },
            "amenity/bicycle_parking": {
                "name": "Fahrradparkplatz"
            },
            "amenity/bicycle_rental": {
                "name": "Fahrradverleih"
            },
            "amenity/cafe": {
                "name": "Café",
                "terms": "Kaffee,Tee,Kaffeehandlung"
            },
            "amenity/cinema": {
                "name": "Kino"
            },
            "amenity/courthouse": {
                "name": "Gericht"
            },
            "amenity/embassy": {
                "name": "Botschaft"
            },
            "amenity/fast_food": {
                "name": "Fast Food"
            },
            "amenity/fire_station": {
                "name": "Feuerwehrhaus"
            },
            "amenity/fuel": {
                "name": "Tankstelle"
            },
            "amenity/grave_yard": {
                "name": "Friedhof"
            },
            "amenity/hospital": {
                "name": "Krankenhaus"
            },
            "amenity/library": {
                "name": "Bibliothek"
            },
            "amenity/marketplace": {
                "name": "Marktplatz"
            },
            "amenity/parking": {
                "name": "Parkplatz"
            },
            "amenity/pharmacy": {
                "name": "Apotheke"
            },
            "amenity/place_of_worship": {
                "name": "Gebetsort"
            },
            "amenity/place_of_worship/christian": {
                "name": "Kirche"
            },
            "amenity/place_of_worship/jewish": {
                "name": "Sy­n­a­go­ge",
                "terms": "jüdisch,Synagoge"
            },
            "amenity/place_of_worship/muslim": {
                "name": "Moschee",
                "terms": "muslimisch,Moschee"
            },
            "amenity/police": {
                "name": "Polizei"
            },
            "amenity/post_box": {
                "name": "Briefkasten"
            },
            "amenity/post_office": {
                "name": "Poststelle"
            },
            "amenity/pub": {
                "name": "Pub"
            },
            "amenity/restaurant": {
                "name": "Restaurant"
            },
            "amenity/school": {
                "name": "Schule"
            },
            "amenity/swimming_pool": {
                "name": "Schwimmbecken"
            },
            "amenity/telephone": {
                "name": "Telefon"
            },
            "amenity/theatre": {
                "name": "The­a­ter",
                "terms": "Theater,Aufführung,Schauspiel,Musical"
            },
            "amenity/toilets": {
                "name": "Toilette"
            },
            "amenity/townhall": {
                "name": "Rathaus"
            },
            "amenity/university": {
                "name": "Universität"
            },
            "barrier": {
                "name": "Barrieren"
            },
            "barrier/block": {
                "name": "Steinblock"
            },
            "barrier/bollard": {
                "name": "Poller"
            },
            "barrier/cattle_grid": {
                "name": "Weiderost"
            },
            "barrier/city_wall": {
                "name": "Stadtmauer"
            },
            "barrier/cycle_barrier": {
                "name": "Umlaufgitter"
            },
            "barrier/ditch": {
                "name": "Graben"
            },
            "barrier/entrance": {
                "name": "Eingang"
            },
            "barrier/fence": {
                "name": "Zaun"
            },
            "barrier/gate": {
                "name": "Tor"
            },
            "barrier/hedge": {
                "name": "Hecke"
            },
            "barrier/kissing_gate": {
                "name": "Schwinggatter"
            },
            "barrier/lift_gate": {
                "name": "Schlagbaum"
            },
            "barrier/retaining_wall": {
                "name": "Stützmauer"
            },
            "barrier/stile": {
                "name": "Zaunübertritt"
            },
            "barrier/toll_booth": {
                "name": "Mautstation"
            },
            "barrier/wall": {
                "name": "Mauer"
            },
            "building": {
                "name": "Gebäude"
            },
            "building/apartments": {
                "name": "Wohnungen"
            },
            "building/entrance": {
                "name": "Eingang"
            },
            "entrance": {
                "name": "Eingang"
            },
            "highway": {
                "name": "Straße/Weg"
            },
            "highway/bridleway": {
                "name": "Reitweg",
                "terms": "Reitweg"
            },
            "highway/bus_stop": {
                "name": "Bushaltestelle"
            },
            "highway/crossing": {
                "name": "Fußgängerüberweg",
                "terms": "Zebrastreifen"
            },
            "highway/cycleway": {
                "name": "Radweg"
            },
            "highway/footway": {
                "name": "Fußweg"
            },
            "highway/motorway": {
                "name": "Autobahn"
            },
            "highway/motorway_link": {
                "name": "Autobahnanschluss",
                "terms": "Auffahrt"
            },
            "highway/path": {
                "name": "Pfad"
            },
            "highway/primary": {
                "name": "Hauptverbindungsstraße"
            },
            "highway/primary_link": {
                "name": "Bundesstraßenanschluss",
                "terms": "Auffahrt"
            },
            "highway/residential": {
                "name": "Wohngebietsstraße"
            },
            "highway/road": {
                "name": "Unbekannter Straßentyp"
            },
            "highway/secondary": {
                "name": "Landstraße"
            },
            "highway/secondary_link": {
                "name": "Landesstraßenanschluss",
                "terms": "Auffahrt"
            },
            "highway/service": {
                "name": "Erschließungsweg"
            },
            "highway/steps": {
                "name": "Treppen",
                "terms": "Treppe"
            },
            "highway/tertiary": {
                "name": "Kreisstraße"
            },
            "highway/tertiary_link": {
                "name": "Kreisstraßenanschluss",
                "terms": "Auffahrt"
            },
            "highway/track": {
                "name": "Feld-/Waldweg"
            },
            "highway/traffic_signals": {
                "name": "Ampeln",
                "terms": "Ampel"
            },
            "highway/trunk": {
                "name": "Kraftfahrstraße"
            },
            "highway/trunk_link": {
                "name": "Schnellstraßenanschluss",
                "terms": "Auffahrt"
            },
            "highway/turning_circle": {
                "name": "Wendestelle"
            },
            "historic": {
                "name": "Historische Stätte"
            },
            "historic/archaeological_site": {
                "name": "Archeologische Stätte"
            },
            "historic/boundary_stone": {
                "name": "Grenzstein"
            },
            "historic/castle": {
                "name": "Burg"
            },
            "historic/memorial": {
                "name": "Denkmal"
            },
            "historic/monument": {
                "name": "Monument"
            },
            "historic/ruins": {
                "name": "Ruine"
            },
            "historic/wayside_cross": {
                "name": "Wegkreuz"
            },
            "historic/wayside_shrine": {
                "name": "Bildstock"
            },
            "landuse": {
                "name": "Landnutzung"
            },
            "landuse/allotments": {
                "name": "Kleigartenanlage"
            },
            "landuse/basin": {
                "name": "Becken"
            },
            "landuse/cemetery": {
                "name": "Friedhof"
            },
            "landuse/commercial": {
                "name": "Geschäfte"
            },
            "landuse/construction": {
                "name": "Baustelle"
            },
            "landuse/farm": {
                "name": "Bauernhof"
            },
            "landuse/farmyard": {
                "name": "Bauernhof"
            },
            "landuse/forest": {
                "name": "Wald"
            },
            "landuse/grass": {
                "name": "Gras"
            },
            "landuse/industrial": {
                "name": "Industrie"
            },
            "landuse/meadow": {
                "name": "Weide"
            },
            "landuse/orchard": {
                "name": "Obstplantage"
            },
            "landuse/quarry": {
                "name": "Steinbruch"
            },
            "landuse/residential": {
                "name": "Wohngebiet"
            },
            "landuse/vineyard": {
                "name": "Weinberg"
            },
            "leisure": {
                "name": "Erholung"
            },
            "leisure/garden": {
                "name": "Garten"
            },
            "leisure/golf_course": {
                "name": "Golfplatz"
            },
            "leisure/marina": {
                "name": "Yachthafen"
            },
            "leisure/park": {
                "name": "Park"
            },
            "leisure/pitch": {
                "name": "Sportplatz"
            },
            "leisure/pitch/american_football": {
                "name": "American Football Feld"
            },
            "leisure/pitch/baseball": {
                "name": "Baseballfeld"
            },
            "leisure/pitch/basketball": {
                "name": "Basketballfeld"
            },
            "leisure/pitch/soccer": {
                "name": "Fußballplatz"
            },
            "leisure/pitch/tennis": {
                "name": "Tennisplatz"
            },
            "leisure/playground": {
                "name": "Spieplatz"
            },
            "leisure/slipway": {
                "name": "Gleitbahn"
            },
            "leisure/stadium": {
                "name": "Stadium"
            },
            "leisure/swimming_pool": {
                "name": "Schwimmbecken"
            },
            "man_made": {
                "name": "Zivilbauten"
            },
            "man_made/lighthouse": {
                "name": "Leuchtturm"
            },
            "man_made/pier": {
                "name": "Steg"
            },
            "man_made/survey_point": {
                "name": "Vermessungspunkt"
            },
            "man_made/water_tower": {
                "name": "Wasserturm"
            },
            "natural": {
                "name": "Natur"
            },
            "natural/bay": {
                "name": "Bucht"
            },
            "natural/beach": {
                "name": "Strand"
            },
            "natural/cliff": {
                "name": "Klippe"
            },
            "natural/coastline": {
                "name": "Küstenlinie",
                "terms": "Ufer"
            },
            "natural/glacier": {
                "name": "Gletscher"
            },
            "natural/grassland": {
                "name": "Grasland"
            },
            "natural/heath": {
                "name": "Heide"
            },
            "natural/peak": {
                "name": "Gipfel"
            },
            "natural/scrub": {
                "name": "Gestrübb"
            },
            "natural/spring": {
                "name": "Quelle"
            },
            "natural/tree": {
                "name": "Baum"
            },
            "natural/water": {
                "name": "Wasser"
            },
            "natural/water/lake": {
                "name": "See"
            },
            "natural/water/pond": {
                "name": "Teich"
            },
            "natural/water/reservoir": {
                "name": "Speicherbecken"
            },
            "natural/wetland": {
                "name": "Feuchtgebiet"
            },
            "natural/wood": {
                "name": "Wald"
            },
            "office": {
                "name": "Büro"
            },
            "other": {
                "name": "Andere"
            },
            "other_area": {
                "name": "Andere"
            },
            "place": {
                "name": "Ort"
            },
            "place/hamlet": {
                "name": "Siedlung"
            },
            "place/island": {
                "name": "Insel"
            },
            "place/locality": {
                "name": "Ortschaft"
            },
            "place/village": {
                "name": "Dorf"
            },
            "power": {
                "name": "Energieversorgung"
            },
            "power/generator": {
                "name": "Kraftwerk"
            },
            "power/line": {
                "name": "Stromleitung"
            },
            "power/pole": {
                "name": "Strommast"
            },
            "power/sub_station": {
                "name": "Umspannwerk"
            },
            "power/tower": {
                "name": "Hochspannungsmast"
            },
            "power/transformer": {
                "name": "Transformator"
            },
            "railway": {
                "name": "Eisenbahn"
            },
            "railway/abandoned": {
                "name": "Stillgelegte Eisenbahnstrecke"
            },
            "railway/disused": {
                "name": "ungenutzte Eisenbahnstrecke"
            },
            "railway/level_crossing": {
                "name": "Bahnübergang",
                "terms": "Bahnübergang"
            },
            "railway/monorail": {
                "name": "Einschienenbahn"
            },
            "railway/rail": {
                "name": "Eisenbahn"
            },
            "railway/subway": {
                "name": "U-Bahn"
            },
            "railway/subway_entrance": {
                "name": "U-Bahn-Eingang"
            },
            "railway/tram": {
                "name": "Straßenbahn",
                "terms": "Straßenbahn"
            },
            "shop": {
                "name": "Laden"
            },
            "shop/alcohol": {
                "name": "Spirituosenladen"
            },
            "shop/bakery": {
                "name": "Bäcker"
            },
            "shop/beauty": {
                "name": "Kosmetikladen"
            },
            "shop/beverages": {
                "name": "Getränkeladen"
            },
            "shop/bicycle": {
                "name": "Fahrradladen"
            },
            "shop/books": {
                "name": "Buchhandlung"
            },
            "shop/boutique": {
                "name": "Boutique"
            },
            "shop/butcher": {
                "name": "Fleischer"
            },
            "shop/car": {
                "name": "Autohändler"
            },
            "shop/car_parts": {
                "name": "Autoteilehandel"
            },
            "shop/car_repair": {
                "name": "Autowerkstatt"
            },
            "shop/chemist": {
                "name": "Apotheke"
            },
            "shop/clothes": {
                "name": "Bekleidungsgeschäft"
            },
            "shop/computer": {
                "name": "Computerfachhandel"
            },
            "shop/confectionery": {
                "name": "Konditor"
            },
            "shop/convenience": {
                "name": "Gemischtwarenhandel"
            },
            "shop/deli": {
                "name": "Feinkostladen"
            },
            "shop/department_store": {
                "name": "Kaufhaus"
            },
            "shop/doityourself": {
                "name": "Heimwerkerladen"
            },
            "shop/dry_cleaning": {
                "name": "Chemische Reinigung"
            },
            "shop/electronics": {
                "name": "Elektronikfachgeschäft"
            },
            "shop/fishmonger": {
                "name": "Fischhändler"
            },
            "shop/florist": {
                "name": "Blumenhändler"
            },
            "shop/furniture": {
                "name": "Möbelhaus"
            },
            "shop/garden_centre": {
                "name": "Gartenzentrum"
            },
            "shop/gift": {
                "name": "Geschenkladen"
            },
            "shop/greengrocer": {
                "name": "Obst- u. Gemüsehändler"
            },
            "shop/hairdresser": {
                "name": "Friseur"
            },
            "shop/hardware": {
                "name": "Eisenwarenhandel"
            },
            "shop/hifi": {
                "name": "Hifi-Laden"
            },
            "shop/jewelry": {
                "name": "Juwelier"
            },
            "shop/kiosk": {
                "name": "Kiosk"
            },
            "shop/laundry": {
                "name": "Wächerei"
            },
            "shop/mall": {
                "name": "Einkaufzentrum"
            },
            "shop/mobile_phone": {
                "name": "Handy- Laden"
            },
            "shop/motorcycle": {
                "name": "Motorradhändler"
            },
            "shop/music": {
                "name": "Musikgeschäft"
            },
            "shop/newsagent": {
                "name": "Zeitschriftenladen"
            },
            "shop/optician": {
                "name": "Optiker"
            },
            "shop/outdoor": {
                "name": "Outdoor-Geschäft"
            },
            "shop/pet": {
                "name": "Tierhandlung"
            },
            "shop/shoes": {
                "name": "Schuhgeschäft"
            },
            "shop/sports": {
                "name": "Sportgeschäft"
            },
            "shop/stationery": {
                "name": "Schreibwarengeschäft"
            },
            "shop/supermarket": {
                "name": "Supermarkt"
            },
            "shop/toys": {
                "name": "Spielwarengeschäft"
            },
            "shop/travel_agency": {
                "name": "Reisebüro"
            },
            "shop/tyres": {
                "name": "Reifenhandel"
            },
            "shop/video": {
                "name": "Videothek"
            },
            "tourism": {
                "name": "Tourismus"
            },
            "tourism/alpine_hut": {
                "name": "Alpenhütte"
            },
            "tourism/artwork": {
                "name": "Kunst"
            },
            "tourism/attraction": {
                "name": "Touristenattracktion"
            },
            "tourism/camp_site": {
                "name": "Campingplatz"
            },
            "tourism/caravan_site": {
                "name": "Wohnmobilstellplatz"
            },
            "tourism/chalet": {
                "name": "Ferienhaus"
            },
            "tourism/guest_house": {
                "name": "Gästehaus",
                "terms": "Frühstückspension,Frühstückspension,Frühstückspension"
            },
            "tourism/hostel": {
                "name": "Hostel"
            },
            "tourism/hotel": {
                "name": "Hotel"
            },
            "tourism/information": {
                "name": "Information"
            },
            "tourism/motel": {
                "name": "Motel"
            },
            "tourism/museum": {
                "name": "Museum"
            },
            "tourism/picnic_site": {
                "name": "Picknickplatz"
            },
            "tourism/theme_park": {
                "name": "Themenpark"
            },
            "tourism/viewpoint": {
                "name": "Aussichtspunkt"
            },
            "tourism/zoo": {
                "name": "Zoo"
            },
            "waterway": {
                "name": "Wasserweg"
            },
            "waterway/canal": {
                "name": "Kanal"
            },
            "waterway/dam": {
                "name": "Damm"
            },
            "waterway/ditch": {
                "name": "Graben"
            },
            "waterway/drain": {
                "name": "Ablauf"
            },
            "waterway/river": {
                "name": "Fluss"
            },
            "waterway/riverbank": {
                "name": "Flussufer"
            },
            "waterway/stream": {
                "name": "Bach"
            },
            "waterway/weir": {
                "name": "Wehr"
            }
        }
    }
};
locale.it = {
    "modes": {
        "add_area": {
            "title": "Area",
            "description": "Aggiungi parchi, edifici, laghi, o altre aree alla mappa.",
            "tail": "Clicca sulla mappa per iniziare a disegnare un'area, come un parco, un lago, o un edificio."
        },
        "add_line": {
            "title": "Linea",
            "description": "Aggiungi strade, vie, percorsi pedonali, canali od altre linee alla mappa.",
            "tail": "Clicca sulla mappa per iniziare a disegnare una strada, un percorso, o un itinerario."
        },
        "add_point": {
            "title": "Punto",
            "description": "Ristoranti, monumenti, e cassette postali sono punti.",
            "tail": "Clicca sulla mappa per inserire un punto."
        },
        "browse": {
            "title": "Naviga",
            "description": "Muovi ed ingrandisci la mappa."
        },
        "draw_area": {
            "tail": "Clicca per aggiungere punti all'area. Clicca sul primo punto per completarla."
        },
        "draw_line": {
            "tail": "Clicca per aggiungere più punti alla linea. Clicca su altre linee per connetterle, e clicca due volte per terminare la linea."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Aggiunto un punto.",
                "vertex": "Aggiunto un punto ad una linea."
            }
        },
        "start": {
            "annotation": {
                "line": "Iniziata una linea.",
                "area": "Iniziata un'area."
            }
        },
        "continue": {
            "annotation": {
                "line": "Continuata una linea.",
                "area": "Continuata un'area."
            }
        },
        "cancel_draw": {
            "annotation": "Cancellato il disegno."
        },
        "change_tags": {
            "annotation": "Cambiati i tag."
        },
        "circularize": {
            "title": "Rendi rotondo",
            "description": {
                "line": "Rendi questa linea circolare.",
                "area": "Rendi quest'area circolare."
            },
            "key": "O",
            "annotation": {
                "line": "Linea resa rotonda.",
                "area": "Area resa rotonda."
            },
            "not_closed": "Questo non può essere reso circolare perché non è un anello."
        },
        "orthogonalize": {
            "title": "Ortogonalizza",
            "description": "Ortogonalizza questi angoli.",
            "key": "Q",
            "annotation": {
                "line": "Gli angoli della linea sono stati resi ortogonali.",
                "area": "Gli angoli dell'area sono stati resi ortogonali."
            },
            "not_closed": "Questo non può essere reso squadrato perché non è un anello."
        },
        "delete": {
            "title": "Cancella",
            "description": "Cancella questo dalla mappa.",
            "annotation": {
                "point": "Cancellato un punto.",
                "vertex": "Cancellato un punto da una linea.",
                "line": "Cancellata una linea.",
                "area": "Cancellata un'area.",
                "relation": "Cancellata una relazione.",
                "multiple": "Cancellati {n} oggetti."
            }
        },
        "connect": {
            "annotation": {
                "point": "Connessa una linea ad un punto.",
                "vertex": "Connessa una linea ad un'altra.",
                "line": "Connessa una strada ad una linea.",
                "area": "Connessa una linea ad un'area."
            }
        },
        "disconnect": {
            "title": "Disconnetti",
            "description": "Disconnetti queste linee tra loro.",
            "key": "D",
            "annotation": "Linee disconnesse.",
            "not_connected": "Non ci sono sufficienti linee/aree da disconnettere."
        },
        "merge": {
            "title": "Unisci",
            "description": "Unisci queste linee.",
            "key": "C",
            "annotation": "Unite {n} linee.",
            "not_eligible": "Questi elementi non possono essere uniti.",
            "not_adjacent": "Queste linee non possono essere unite perché non sono connesse."
        },
        "move": {
            "title": "Muovi",
            "description": "Muovi questo in una posizione differente.",
            "key": "M",
            "annotation": {
                "point": "Mosso un punto.",
                "vertex": "Mosso un nodo su una linea.",
                "line": "Mossa una linea.",
                "area": "Mossa un'area.",
                "multiple": "Spostati diversi oggetti."
            },
            "incomplete_relation": "Questo elemento non può essere spostato perché non è ancora stato scaricato completamente."
        },
        "rotate": {
            "title": "Ruota",
            "description": "Ruota questo oggetto intorno al suo centro.",
            "key": "R",
            "annotation": {
                "line": "Ruotata una linea.",
                "area": "Ruotata un'area."
            }
        },
        "reverse": {
            "title": "Cambia direzione",
            "description": "Fai andare questa linea nella direzione opposta.",
            "key": "V",
            "annotation": "Cambiata direzione ad una linea."
        },
        "split": {
            "title": "Dividi",
            "description": {
                "line": "Dividi questa linea in due in questo punto.",
                "area": "Dividi il bordo di quest'area in due."
            },
            "key": "X",
            "annotation": {
                "line": "Dividi una linea.",
                "area": "Dividi il bordo di un area."
            },
            "not_eligible": "Le linee non possono essere divise al loro inizio o alla loro fine.",
            "multiple_ways": "Ci sono troppe linee da dividere."
        }
    },
    "nothing_to_undo": "Niente da ripristinare.",
    "nothing_to_redo": "Niente da rifare.",
    "just_edited": "Hai appena modificato OpenStreetMap!",
    "browser_notice": "Questo editor è supportato in Firefox, Chrome, Safari, Opera, e Internet Explorer 9 e superiori. Aggiorna il tuo browser o usa Potlatch 2 per modificare la mappa.",
    "view_on_osm": "Guarda su OSM",
    "zoom_in_edit": "ingrandisci per modificare la mappa",
    "logout": "logout",
    "loading_auth": "Connettendomi ad OpenStreetMap...",
    "report_a_bug": "segnala un bug",
    "commit": {
        "title": "Salva le modifiche",
        "description_placeholder": "Una breve descrizione delle tue modifiche",
        "message_label": "Messaggio di invio",
        "upload_explanation": "I cambiamenti che carichi come {user} saranno visibili su tutte le mappe che usano i dati di OpenStreetMap.",
        "save": "Salva",
        "cancel": "Annulla",
        "warnings": "Avvertimenti",
        "modified": "Modificati",
        "deleted": "Cancellati",
        "created": "Creati"
    },
    "contributors": {
        "list": "Stai vedendo i contributi di {users}",
        "truncated_list": "Stai vedendo i contributi di {users} ed altri {count}"
    },
    "geocoder": {
        "title": "Trova un luogo",
        "placeholder": "Trova un luogo",
        "no_results": "Non trovo un luogo chiamato '{name}'"
    },
    "geolocate": {
        "title": "Mostra la mia posizione"
    },
    "inspector": {
        "no_documentation_combination": "Non c'è documentazione per questa combinazione di tag",
        "no_documentation_key": "Non c'è documentazione per questa chiave",
        "show_more": "Mostra di più",
        "new_tag": "Nuovo Tag",
        "view_on_osm": "Mostra su OSM",
        "editing_feature": "Modificando {feature}",
        "additional": "Tag aggiuntivi",
        "choose": "Seleziona il tipo di caratteristica",
        "results": "{n} risultati per {search}",
        "reference": "Vedi sulla Wiki di OpenStreetMap →",
        "back_tooltip": "Cambia il tipo di caratteristica"
    },
    "background": {
        "title": "Sfondo",
        "description": "Impostazioni dello sfondo",
        "percent_brightness": "{opacity}% luminosità",
        "fix_misalignment": "Allinea",
        "reset": "reset"
    },
    "restore": {
        "heading": "Hai modifiche non salvate",
        "description": "Hai modifiche non salvate da una sessione precedente. Vuoi ripristinare questi cambiamenti?",
        "restore": "Ripristina",
        "reset": "Reset"
    },
    "save": {
        "title": "Salva",
        "help": "Salva i cambiamenti su OpenStreetMap, rendendoli visibili ad altri utenti.",
        "no_changes": "Nessuna modifica da salvare.",
        "error": "E' accaduto un errore mentre veniva tentato il salvataggio",
        "uploading": "Caricamento delle modifiche su OpenStreetMap.",
        "unsaved_changes": "Hai modifiche non salvate"
    },
    "splash": {
        "welcome": "Benvenuti nell'editor OpenStreetMap iD",
        "text": "Questa è la versione di sviluppo {version}. Per maggiori informazioni vedi {website} e segnala i bug su {github}.",
        "walkthrough": "Inizia il Tutorial",
        "start": "Modifica adesso"
    },
    "source_switch": {
        "live": "live",
        "lose_changes": "Hai modifiche non salvate. Cambiare il server le farà scartare. Sei sicuro?",
        "dev": "dev"
    },
    "tag_reference": {
        "description": "Descrizione",
        "on_wiki": "{tag} su wiki.osm.org",
        "used_with": "usato con {type}"
    },
    "validations": {
        "untagged_point": "Punto senza tag che non è parte di una linea o di un'area",
        "untagged_line": "Linea senza tag",
        "untagged_area": "Area senza tag",
        "many_deletions": "You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        "tag_suggests_area": "Il tag {tag} fa pensare che la linea sia un'area, ma non rappresenta un'area",
        "deprecated_tags": "Tag deprecati: {tags}"
    },
    "zoom": {
        "in": "Ingrandisci",
        "out": "Riduci"
    },
    "gpx": {
        "local_layer": "File GPX locale",
        "drag_drop": "Trascina e rilascia un file gpx sulla pagina"
    },
    "help": {
        "title": "Aiuto"
    },
    "intro": {
        "navigation": {
            "drag": "L'area della mappa principale mostra i dati OpenStreetMap su di uno sfondo. Puoi navigare trascinanndo e scorrendo, proprio come in ogni mappa web. **Trascina la mappa!**",
            "select": "Gli elementi della mappa sono rappresentai in tre modi: usando punti, linee o aree. Tutti gli elementi possono essere selezionati cliccando su di essi. **Clicca sul punto per selezionarlo.**",
            "header": "L'intestazione mostra il tipo di elemento.",
            "pane": "Quando un elemento è selezionato viene mostrato l'editor dell'elemento. L'intestazione mostra il tipo di elemento a il pannello principale mostra gli attributi dell'elemento, come il nome e l'indirizzo. **Chiudi l'editor dell'elemento con il pulsante chiudi in alto a destra.**"
        },
        "points": {
            "add": "I punti possono essere usati per rappresentare elementi come negozi, ristoranti e monumenti. Indicano un luogo specifico e descrivono cos'è. **Clicca il bottone Punto per aggiungere un nuovo punto.**",
            "place": "Il punto può essere piazzato cliccando sulla mappa. **Piazza il punto sull'edificio.**",
            "search": "Ci sono diversi elementi che possono essere rappresentati da punti. Il punto che hai appena aggiunto è un Caffè. **Cerca 'Caffè'**",
            "choose": "**Scegli Caffè dalla griglia.**",
            "describe": "Ora il punto è marcato come Caffè. Usando l'editor dell'elemento possiamo aggiungere più informazioni sull'elemento stesso. **Aggiungi un nome**",
            "close": "L'editor dell'elemento può essere chiuso cliccando sul pulsante chiudi. **Chiudi l'editor dell'elemento**",
            "reselect": "Spesso esistono già dei punti, ma contengono errori o sono incompleti. I punti esistenti si pososno modificare. **Seleziona il punto che hai appena creato.**",
            "fixname": "**Cambia il nome e chiudi l'editor dell'elemento.**",
            "reselect_delete": "Tutti gli elementi sulla mappa possono essere cancellati. **Clicca sul punto che hai creato.**",
            "delete": "Il menu attorno al punto contiene le operazioni che possono essere fatte su di esso, inclusa la cancellazione. **Cancella il punto.**"
        },
        "areas": {
            "add": "Le aree sono un modo più dettagliato per rappresentare degli elementi. Forniscono informazioni sui confini dell'elemento. Molto spesso è preferibile usare le aree al posto dei punti. **Clicca il pulsante Area per aggiungere una nuova area.**"
        },
        "lines": {
            "finish": "Le linee possono essere finite cliccando nuovamente sull'ultimo punto. **Finisci di disegnare la strada.**",
            "road": "**Seleziona Strada dalla griglia**",
            "residential": "Ci sono diversi tipi di strade, il più comune dei quali è Residenziale. **Scegli il tipo di strada Residenziale**",
            "describe": "**Dai un nome alla strada e chiudi l'editor dell'elemento.**",
            "restart": "La strada deve intersecare Flower Street"
        },
        "startediting": {
            "help": "Più informazioni su questa guida sono disponibili qui.",
            "save": "Non dimenticare di salvare periodicamente le tue modifiche!",
            "start": "Inizia a mappare!"
        }
    },
    "presets": {
        "fields": {
            "access": {
                "label": "Accesso"
            },
            "address": {
                "label": "Indirizzo",
                "placeholders": {
                    "housename": "Nome della casa",
                    "number": "123",
                    "street": "Strada",
                    "city": "Città"
                }
            },
            "aeroway": {
                "label": "Tipo"
            },
            "amenity": {
                "label": "Tipo"
            },
            "atm": {
                "label": "Bancomat"
            },
            "barrier": {
                "label": "Tipo"
            },
            "bicycle_parking": {
                "label": "Tipo"
            },
            "building": {
                "label": "Edificio"
            },
            "building_area": {
                "label": "Edificio"
            },
            "building_yes": {
                "label": "Edificio"
            },
            "capacity": {
                "label": "Capienza"
            },
            "collection_times": {
                "label": "Orari di raccolta"
            },
            "construction": {
                "label": "Tipo"
            },
            "country": {
                "label": "Stato"
            },
            "crossing": {
                "label": "Tipo"
            },
            "cuisine": {
                "label": "Cucina"
            },
            "denomination": {
                "label": "Confessione"
            },
            "denotation": {
                "label": "Denotazione"
            },
            "elevation": {
                "label": "Altitudine"
            },
            "emergency": {
                "label": "Emergenza"
            },
            "entrance": {
                "label": "Tipo"
            },
            "fax": {
                "label": "Fax"
            },
            "fee": {
                "label": "Tariffa"
            },
            "highway": {
                "label": "Tipo"
            },
            "historic": {
                "label": "Tipo"
            },
            "internet_access": {
                "label": "Accesso ad Internet",
                "options": {
                    "wlan": "Wifi",
                    "wired": "Via cavo",
                    "terminal": "Terminale"
                }
            },
            "landuse": {
                "label": "Tipo"
            },
            "layer": {
                "label": "Livello"
            },
            "leisure": {
                "label": "Tipo"
            },
            "levels": {
                "label": "Piani"
            },
            "man_made": {
                "label": "Tipo"
            },
            "maxspeed": {
                "label": "Limite di velocità"
            },
            "name": {
                "label": "Nome"
            },
            "natural": {
                "label": "Naturale"
            },
            "network": {
                "label": "Rete"
            },
            "note": {
                "label": "Nota"
            },
            "office": {
                "label": "Tipo"
            },
            "oneway": {
                "label": "Senso unico"
            },
            "oneway_yes": {
                "label": "Senso unico"
            },
            "opening_hours": {
                "label": "Ore"
            },
            "operator": {
                "label": "Operatore"
            },
            "phone": {
                "label": "Telefono"
            },
            "place": {
                "label": "Tipo"
            },
            "power": {
                "label": "Tipo"
            },
            "railway": {
                "label": "Tipo"
            },
            "ref": {
                "label": "Riferimento"
            },
            "religion": {
                "label": "Religione",
                "options": {
                    "christian": "Cristiana",
                    "muslim": "Musulmana",
                    "buddhist": "Buddista",
                    "jewish": "Ebraica",
                    "hindu": "Indù",
                    "shinto": "Shintoista",
                    "taoist": "Taoista"
                }
            },
            "service": {
                "label": "Tipo"
            },
            "shelter": {
                "label": "Riparo"
            },
            "shop": {
                "label": "Tipo"
            },
            "source": {
                "label": "Fonte"
            },
            "sport": {
                "label": "Sport"
            },
            "structure": {
                "label": "Struttura",
                "options": {
                    "bridge": "Ponte",
                    "tunnel": "Tunnel",
                    "embankment": "Argine"
                }
            },
            "surface": {
                "label": "Superficie"
            },
            "tourism": {
                "label": "Tipo"
            },
            "water": {
                "label": "Tipo"
            },
            "waterway": {
                "label": "Tipo"
            },
            "website": {
                "label": "Sito web"
            },
            "wetland": {
                "label": "Tipo"
            },
            "wheelchair": {
                "label": "Accesso in carrozzina"
            },
            "wikipedia": {
                "label": "Wikipedia"
            },
            "wood": {
                "label": "Tipo"
            }
        },
        "presets": {
            "aeroway": {
                "name": "Pista aeroportuale"
            },
            "aeroway/aerodrome": {
                "name": "Aeroporto",
                "terms": "aeroplano,aeroporto,aerodromo"
            },
            "aeroway/helipad": {
                "name": "Elisuperficie",
                "terms": "elicottero,elisuperficie,eliporto"
            },
            "amenity": {
                "name": "Servizi"
            },
            "amenity/bank": {
                "name": "Banca"
            },
            "amenity/bar": {
                "name": "Bar"
            },
            "amenity/bench": {
                "name": "Panchina"
            },
            "amenity/bicycle_parking": {
                "name": "Parcheggio biciclette"
            },
            "amenity/bicycle_rental": {
                "name": "Noleggio biciclette"
            },
            "amenity/cafe": {
                "name": "Caffè"
            },
            "amenity/cinema": {
                "name": "Cinema"
            },
            "amenity/courthouse": {
                "name": "Tribunale"
            },
            "amenity/embassy": {
                "name": "Ambasciata"
            },
            "amenity/fast_food": {
                "name": "Fast Food"
            },
            "amenity/fire_station": {
                "name": "Caserma dei pompieri"
            },
            "amenity/fuel": {
                "name": "Stazione di servizio"
            },
            "amenity/grave_yard": {
                "name": "Cimitero"
            },
            "amenity/hospital": {
                "name": "Ospedale"
            },
            "amenity/library": {
                "name": "Biblioteca"
            },
            "amenity/marketplace": {
                "name": "Mercato"
            },
            "amenity/parking": {
                "name": "Parcheggio"
            },
            "amenity/pharmacy": {
                "name": "Farmacia"
            },
            "amenity/place_of_worship": {
                "name": "Luogo di culto"
            },
            "amenity/place_of_worship/christian": {
                "name": "Chiesa"
            },
            "amenity/place_of_worship/jewish": {
                "name": "Sinagoga",
                "terms": "ebrea,sinagoga"
            },
            "amenity/place_of_worship/muslim": {
                "name": "Moschea",
                "terms": "musulmana,moschea"
            },
            "amenity/police": {
                "name": "Forze di polizia"
            },
            "amenity/post_box": {
                "name": "Buca delle lettere"
            },
            "amenity/post_office": {
                "name": "Ufficio Postale"
            },
            "amenity/pub": {
                "name": "Pub"
            },
            "amenity/restaurant": {
                "name": "Ristorante"
            },
            "amenity/school": {
                "name": "Scuola"
            },
            "amenity/swimming_pool": {
                "name": "Piscina"
            },
            "amenity/telephone": {
                "name": "Telefono"
            },
            "amenity/theatre": {
                "name": "Teatro"
            },
            "amenity/toilets": {
                "name": "Bagni"
            },
            "amenity/townhall": {
                "name": "Municipio"
            },
            "amenity/university": {
                "name": "Università"
            },
            "barrier": {
                "name": "Barriera"
            },
            "barrier/block": {
                "name": "Blocco"
            },
            "barrier/city_wall": {
                "name": "Mura cittadine"
            },
            "barrier/ditch": {
                "name": "Fossato"
            },
            "barrier/entrance": {
                "name": "Entrata"
            },
            "barrier/fence": {
                "name": "Recinto"
            },
            "barrier/gate": {
                "name": "Cancello"
            },
            "barrier/hedge": {
                "name": "Siepe"
            },
            "barrier/stile": {
                "name": "Scaletta"
            },
            "barrier/wall": {
                "name": "Muro"
            },
            "building": {
                "name": "Edificio"
            },
            "building/entrance": {
                "name": "Entrata"
            },
            "entrance": {
                "name": "Entrata"
            },
            "highway": {
                "name": "Strada"
            },
            "highway/bridleway": {
                "name": "Ippovia"
            },
            "highway/bus_stop": {
                "name": "Fermata dell'autobus"
            },
            "highway/crossing": {
                "name": "Attraversamento",
                "terms": "attraversamento pedonale,strisce pedonali"
            },
            "highway/cycleway": {
                "name": "Percorso ciclabile"
            },
            "highway/footway": {
                "name": "Percorso pedonale"
            },
            "highway/motorway": {
                "name": "Autostrada"
            },
            "highway/motorway_link": {
                "name": "Raccordo autostradale"
            },
            "highway/path": {
                "name": "Sentiero"
            },
            "highway/primary": {
                "name": "Strada di importanza nazionale"
            },
            "highway/residential": {
                "name": "Strada residenziale"
            },
            "highway/road": {
                "name": "Strada non conosciuta"
            },
            "highway/secondary": {
                "name": "Strada di importanza regionale"
            },
            "highway/service": {
                "name": "Strada di servizio"
            },
            "highway/steps": {
                "name": "Scale",
                "terms": "scale,scalinata"
            },
            "highway/tertiary": {
                "name": "Strada di importanza locale"
            },
            "highway/track": {
                "name": "Strada ad uso agricolo / forestale"
            },
            "highway/traffic_signals": {
                "name": "Semaforo",
                "terms": "semaforo,luce semaforica,lanterna semaforica"
            },
            "highway/trunk": {
                "name": "Superstrada"
            },
            "highway/turning_circle": {
                "name": "Slargo per inversione"
            },
            "highway/unclassified": {
                "name": "Viabilità ordinaria"
            },
            "historic": {
                "name": "Sito storico"
            },
            "historic/archaeological_site": {
                "name": "Sito archeologico"
            },
            "historic/boundary_stone": {
                "name": "Pietra di confine"
            },
            "historic/castle": {
                "name": "Castello"
            },
            "historic/memorial": {
                "name": "Memoriale"
            },
            "historic/monument": {
                "name": "Monumento"
            },
            "historic/ruins": {
                "name": "Rovine"
            },
            "landuse": {
                "name": "Uso del suolo"
            },
            "landuse/allotments": {
                "name": "Orti in concessione"
            },
            "landuse/basin": {
                "name": "Bacino"
            },
            "landuse/cemetery": {
                "name": "Cimitero"
            },
            "landuse/commercial": {
                "name": "Commerciale"
            },
            "landuse/construction": {
                "name": "Costruzione"
            },
            "landuse/farm": {
                "name": "Agricolo"
            },
            "landuse/farmyard": {
                "name": "Fattoria"
            },
            "landuse/forest": {
                "name": "Foresta"
            },
            "landuse/grass": {
                "name": "Erba"
            },
            "landuse/industrial": {
                "name": "Industriale"
            },
            "landuse/meadow": {
                "name": "Coltivazione erbacea"
            },
            "landuse/orchard": {
                "name": "Frutteto"
            },
            "landuse/quarry": {
                "name": "Cava"
            },
            "landuse/residential": {
                "name": "Residenziale"
            },
            "landuse/vineyard": {
                "name": "Vigneto"
            },
            "leisure": {
                "name": "Svago"
            },
            "leisure/garden": {
                "name": "Giardino"
            },
            "leisure/golf_course": {
                "name": "Campo da Golf"
            },
            "leisure/park": {
                "name": "Parco"
            },
            "leisure/pitch": {
                "name": "Campo da gioco"
            },
            "leisure/pitch/american_football": {
                "name": "Campo da Football Americano"
            },
            "leisure/pitch/baseball": {
                "name": "Diamante da Baseball"
            },
            "leisure/pitch/basketball": {
                "name": "Campo da basket"
            },
            "leisure/pitch/soccer": {
                "name": "Campo di calcio"
            },
            "leisure/pitch/tennis": {
                "name": "Campo da tennis"
            },
            "leisure/playground": {
                "name": "Campetto"
            },
            "leisure/slipway": {
                "name": "Scivolo per barche"
            },
            "leisure/stadium": {
                "name": "Stadio"
            },
            "leisure/swimming_pool": {
                "name": "Piscina"
            },
            "man_made": {
                "name": "Costruzioni civili"
            },
            "man_made/lighthouse": {
                "name": "Faro"
            },
            "man_made/pier": {
                "name": "Molo"
            },
            "man_made/survey_point": {
                "name": "Punto geodetico"
            },
            "man_made/water_tower": {
                "name": "Torre Idrica"
            },
            "natural": {
                "name": "Naturale"
            },
            "natural/bay": {
                "name": "Baia"
            },
            "natural/beach": {
                "name": "Spiaggia"
            },
            "natural/cliff": {
                "name": "Scogliera"
            },
            "natural/coastline": {
                "name": "Linea di costa",
                "terms": "riva"
            },
            "natural/glacier": {
                "name": "Ghiacciaio"
            },
            "natural/grassland": {
                "name": "Prateria"
            },
            "natural/heath": {
                "name": "Brughiera"
            },
            "natural/peak": {
                "name": "Picco"
            },
            "natural/scrub": {
                "name": "Macchia mediterranea"
            },
            "natural/spring": {
                "name": "Sorgente"
            },
            "natural/tree": {
                "name": "Albero"
            },
            "natural/water": {
                "name": "Specchio d'acqua"
            },
            "natural/water/lake": {
                "name": "Lago"
            },
            "natural/water/pond": {
                "name": "Stagno"
            },
            "natural/water/reservoir": {
                "name": "Bacino idrico"
            },
            "natural/wetland": {
                "name": "Zona umida"
            },
            "natural/wood": {
                "name": "Foresta"
            },
            "office": {
                "name": "Uffici"
            },
            "other": {
                "name": "Altro"
            },
            "other_area": {
                "name": "Altro"
            },
            "place": {
                "name": "Luogo"
            },
            "place/hamlet": {
                "name": "Paese"
            },
            "place/island": {
                "name": "Isola"
            },
            "place/locality": {
                "name": "Località"
            },
            "place/village": {
                "name": "Villaggio"
            },
            "power": {
                "name": "Energia"
            },
            "power/generator": {
                "name": "Centrale elettrica"
            },
            "power/line": {
                "name": "Linea elettrica"
            },
            "power/sub_station": {
                "name": "Sottostazione"
            },
            "power/transformer": {
                "name": "Trasformatore"
            },
            "railway": {
                "name": "Ferrovia"
            },
            "railway/abandoned": {
                "name": "Ferrovia abbandonata"
            },
            "railway/disused": {
                "name": "Ferrovia in disuso"
            },
            "railway/level_crossing": {
                "name": "Passaggio a livello"
            },
            "railway/monorail": {
                "name": "Monorotaia"
            },
            "railway/rail": {
                "name": "Binario"
            },
            "railway/subway": {
                "name": "Metropolitana"
            },
            "railway/subway_entrance": {
                "name": "Entrata di metropolitana"
            },
            "railway/tram": {
                "name": "Tram"
            },
            "shop": {
                "name": "Negozio"
            },
            "shop/alcohol": {
                "name": "Negozio di liquori"
            },
            "shop/bakery": {
                "name": "Panificio"
            },
            "shop/beauty": {
                "name": "Negozio di articoli di bellezza"
            },
            "shop/beverages": {
                "name": "Negozio di bevande"
            },
            "shop/bicycle": {
                "name": "Negozio di biciclette"
            },
            "shop/books": {
                "name": "Libreria"
            },
            "shop/boutique": {
                "name": "Boutique"
            },
            "shop/butcher": {
                "name": "Macellaio"
            },
            "shop/car": {
                "name": "Concessionario"
            },
            "shop/car_parts": {
                "name": "Negozio di autoricambi"
            },
            "shop/car_repair": {
                "name": "Autofficina"
            },
            "shop/chemist": {
                "name": "Farm"
            },
            "shop/clothes": {
                "name": "Negozio di abbigliamento"
            },
            "shop/computer": {
                "name": "Negozio di informatica"
            },
            "shop/confectionery": {
                "name": "Pasticceria"
            },
            "shop/convenience": {
                "name": "Minimarket"
            },
            "shop/deli": {
                "name": "Gastronomia"
            },
            "shop/department_store": {
                "name": "Supermercato"
            },
            "shop/doityourself": {
                "name": "Negozio di fai-da-te"
            },
            "shop/dry_cleaning": {
                "name": "Lavanderia"
            },
            "shop/electronics": {
                "name": "Negozio di elettronica"
            },
            "shop/fishmonger": {
                "name": "Pescivendolo"
            },
            "shop/florist": {
                "name": "Fioraio"
            },
            "shop/greengrocer": {
                "name": "Fruttivendolo"
            },
            "shop/hairdresser": {
                "name": "Parrucchiere"
            },
            "shop/jewelry": {
                "name": "Gioielliere"
            },
            "shop/kiosk": {
                "name": "Edicola"
            },
            "shop/laundry": {
                "name": "Lavanderia"
            },
            "shop/mall": {
                "name": "Centro commerciale"
            },
            "shop/mobile_phone": {
                "name": "Negozio di telefonia mobile"
            },
            "shop/music": {
                "name": "Negozio di musica"
            },
            "shop/newsagent": {
                "name": "Edicola"
            },
            "shop/optician": {
                "name": "Ottico"
            },
            "shop/pet": {
                "name": "Negozio di animali"
            },
            "shop/shoes": {
                "name": "Negozio di scarpe"
            },
            "shop/stationery": {
                "name": "Negozio di cancelleria"
            },
            "shop/supermarket": {
                "name": "Supermercato"
            },
            "shop/toys": {
                "name": "Negozio di giocattoli"
            },
            "shop/travel_agency": {
                "name": "Agenzia di viaggi"
            },
            "shop/tyres": {
                "name": "Gommista"
            },
            "shop/vacant": {
                "name": "Negozio vuoto"
            },
            "shop/video": {
                "name": "Videoteca"
            },
            "tourism": {
                "name": "Turismo"
            },
            "tourism/alpine_hut": {
                "name": "Rifugio"
            },
            "tourism/artwork": {
                "name": "Opera d'arte"
            },
            "tourism/attraction": {
                "name": "Attrazione turistica"
            },
            "tourism/camp_site": {
                "name": "Campeggio"
            },
            "tourism/caravan_site": {
                "name": "Sosta per camper"
            },
            "tourism/chalet": {
                "name": "Chalet"
            },
            "tourism/guest_house": {
                "name": "Affittacamere",
                "terms": "B&B,Bed & Breakfast,Bed and Breakfast"
            },
            "tourism/hostel": {
                "name": "Ostello"
            },
            "tourism/hotel": {
                "name": "Albergo"
            },
            "tourism/information": {
                "name": "Informazioni"
            },
            "tourism/motel": {
                "name": "Motel"
            },
            "tourism/museum": {
                "name": "Museo"
            },
            "tourism/picnic_site": {
                "name": "Area picnic"
            },
            "tourism/theme_park": {
                "name": "Parco a tema"
            },
            "tourism/viewpoint": {
                "name": "Punto panoramico"
            },
            "tourism/zoo": {
                "name": "Zoo"
            },
            "waterway": {
                "name": "Corso d'acqua"
            },
            "waterway/canal": {
                "name": "Canale"
            },
            "waterway/dam": {
                "name": "Diga"
            },
            "waterway/ditch": {
                "name": "Fossato"
            },
            "waterway/drain": {
                "name": "Canale di scolo"
            },
            "waterway/river": {
                "name": "Fiume"
            },
            "waterway/riverbank": {
                "name": "Argine"
            },
            "waterway/stream": {
                "name": "Torrente"
            },
            "waterway/weir": {
                "name": "Sbarramento"
            }
        }
    }
};
locale.ja = {
    "modes": {
        "add_area": {
            "title": "エリア",
            "description": "公園や建物、湖沼等をマップに追加",
            "tail": "クリックした地点から公園や湖沼、建物など、エリアの描画を行います"
        },
        "add_line": {
            "title": "ライン",
            "description": "道路や歩道、用水路などのラインを描画",
            "tail": "クリックした地点から道路や歩道、流水経路など、ラインの描画を開始します"
        },
        "add_point": {
            "title": "ポイント",
            "description": "レストランや記念碑、郵便ボックス等、ポイント情報を追加",
            "tail": "クリックした地点にポイントを追加します"
        },
        "browse": {
            "title": "ブラウズ",
            "description": "マップの拡大縮小"
        },
        "draw_area": {
            "tail": "クリックするとエリア上にポイントを追加できます。ラインの起点となっているポイントをクリックするとエリアが作成されます"
        },
        "draw_line": {
            "tail": "クリックするとライン上にポイントを追加できます。ラインを描画中に他のラインをクリックすることで、2つのラインを接続することが可能です。描画を終了するにはダブルクリックしてください"
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "ポイントの追加",
                "vertex": "ウェイへのノード追加"
            }
        },
        "start": {
            "annotation": {
                "line": "ラインの描画開始",
                "area": "エリアの描画開始"
            }
        },
        "continue": {
            "annotation": {
                "line": "ライン描画の継続",
                "area": "エリア描画の継続"
            }
        },
        "cancel_draw": {
            "annotation": "描画のキャンセル"
        },
        "change_tags": {
            "annotation": "タグの変更"
        },
        "circularize": {
            "title": "円状に並べる",
            "key": "O",
            "annotation": {
                "line": "ラインを円状に整形",
                "area": "エリアを円状に整形"
            }
        },
        "orthogonalize": {
            "title": "角の直交化",
            "description": "角を90度に整形",
            "key": "Q",
            "annotation": {
                "line": "ラインの角を90度に整形",
                "area": "エリアの角を90度に整形"
            }
        },
        "delete": {
            "title": "削除",
            "description": "この地物をマップから削除",
            "annotation": {
                "point": "ポイントを削除",
                "vertex": "ウェイ上のノードを削除",
                "line": "ライン削除",
                "area": "エリア削除",
                "relation": "リレーション削除",
                "multiple": "{n} 個のオブジェクトを削除"
            }
        },
        "connect": {
            "annotation": {
                "point": "ウェイをポイントに接続",
                "vertex": "ウェイを他のウェイト接続",
                "line": "ウェイとラインを接続",
                "area": "ウェイとエリアを接続"
            }
        },
        "disconnect": {
            "title": "接続解除",
            "description": "ウェイの接続を解除して切り離す",
            "key": "D",
            "annotation": "ウェイの接続を解除"
        },
        "merge": {
            "title": "結合",
            "description": "複数のラインを結合",
            "key": "C",
            "annotation": "{n} 本のラインを結合"
        },
        "move": {
            "title": "移動",
            "description": "この地物を別の位置へ移動",
            "key": "M",
            "annotation": {
                "point": "ポイントを移動",
                "vertex": "ウェイ上のノードを移動",
                "line": "ラインの移動",
                "area": "エリアの移動",
                "multiple": "Moved multiple objects."
            }
        },
        "rotate": {
            "title": "Rotate",
            "description": "Rotate this object around its centre point.",
            "key": "R",
            "annotation": {
                "line": "Rotated a line.",
                "area": "Rotated an area."
            }
        },
        "reverse": {
            "title": "方向反転",
            "description": "ラインの向きを反転",
            "key": "V",
            "annotation": "ラインの方向反転"
        },
        "split": {
            "title": "分割",
            "key": "X"
        }
    },
    "nothing_to_undo": "やり直す変更点がありません",
    "nothing_to_redo": "やり直した変更点がありません",
    "just_edited": "OpenStreetMap編集完了！",
    "browser_notice": "このエディタは Firefox, Chrome, Safari, Opera, および Internet Explorer 9 以上をサポートしています。ブラウザのバージョンを更新するか、Potlatch 2を使用して編集してください",
    "view_on_osm": "OSMで確認",
    "zoom_in_edit": "編集するにはさらに地図を拡大してください",
    "logout": "ログアウト",
    "loading_auth": "OpenStreetMapへ接続中...",
    "report_a_bug": "バグ報告",
    "commit": {
        "title": "編集結果を保存",
        "message_label": "コミットメッセージ",
        "upload_explanation": "編集した内容を {user} アカウントでアップロードし、OpenStreetMapを利用しているすべてのユーザが閲覧できるようにします",
        "save": "Save",
        "cancel": "キャンセル",
        "warnings": "注意",
        "modified": "変更した地物",
        "deleted": "削除した地物",
        "created": "作成した地物"
    },
    "contributors": {
        "list": "{users} による編集履歴を確認",
        "truncated_list": "{users} とその他 {count} 人による編集履歴を表示"
    },
    "geocoder": {
        "title": "特定地点を検索",
        "placeholder": "対象地点の名称",
        "no_results": "'{name}' という名称の地点が見つかりません"
    },
    "geolocate": {
        "title": "編集画面を現在地へ移動"
    },
    "inspector": {
        "no_documentation_combination": "このタグの組み合わせに関する説明文はありません",
        "no_documentation_key": "このキーに対する説明文はありません",
        "show_more": "次を表示",
        "new_tag": "新規タグ",
        "view_on_osm": "詳細情報確認",
        "editing_feature": "{feature}を編集",
        "additional": "タグ項目を追加",
        "choose": "地物の種類を選択",
        "results": "検索結果{n}件: {search}",
        "reference": "OpenStreetMap Wikiで表示 →",
        "back_tooltip": "地物の種別を変更"
    },
    "background": {
        "title": "背景画像",
        "description": "背景画像設定",
        "percent_brightness": "{opacity}% 輝度",
        "fix_misalignment": "背景画像をずらす",
        "reset": "設定リセット"
    },
    "restore": {
        "heading": "保存されていない編集内容があります",
        "description": "前回作業した編集内容がアップロードされていません。編集内容を復元しますか？",
        "restore": "復元",
        "reset": "破棄"
    },
    "save": {
        "title": "保存",
        "help": "編集内容をOpenStreetMapへ保存し、他ユーザへ公開",
        "no_changes": "保存する変更はありません。",
        "error": "データ保存中にエラーが発生しました",
        "uploading": "編集内容をOpenStreetMapへアップロードしています",
        "unsaved_changes": "編集内容が保存されていません"
    },
    "splash": {
        "welcome": "iD 起動中",
        "text": "開発版 {version} を起動します。詳細は {website} を参照してください。バグ報告は {github} で受付中です",
        "walkthrough": "少々お待ちください",
        "start": "編集開始"
    },
    "source_switch": {
        "live": "本番サーバ",
        "lose_changes": "保存されていない編集があります。投稿先サーバを切り替えることで、編集内容は破棄されます。投稿先を切り替えてよろしいですか？",
        "dev": "開発サーバ"
    },
    "tag_reference": {
        "description": "説明",
        "on_wiki": "{tag}: wiki.osm.org ",
        "used_with": "さらに詳しく:  {type}"
    },
    "validations": {
        "untagged_point": "ポイントにタグが付与されておらず、ラインやエリアの一部でもありません",
        "untagged_line": "ラインにタグが付与されていません",
        "untagged_area": "エリアにタグが付与されていません",
        "many_deletions": "{n} オブジェクトを削除しています。本当に削除してよろしいですか？ 削除した結果はopenstreetmap.orgに反映されます。",
        "tag_suggests_area": "ラインに {tag} タグが付与されています。エリアで描かれるべきです",
        "deprecated_tags": "タグの重複: {tags}"
    },
    "zoom": {
        "in": "ズームイン",
        "out": "ズームアウト"
    },
    "gpx": {
        "local_layer": "ローカルマシン上のGPXファイル",
        "drag_drop": "この場所に .gpxファイルをドラッグ＆ドロップ"
    },
    "help": {
        "title": "ヘルプ"
    },
    "intro": {
        "navigation": {
            "drag": "地図が表示されている領域には、背景としてOpenStreetMapが表示されます。他の地図と同様、クリックした状態でカーソルを移動させることで、画面の表示位置を移動させることができます。**地図をクリックして移動させてみてください！**",
            "select": "地図上の情報は、ポイント、ライン、エリアの3つの方法のどれかで表現されています。対象の地物をクリックすると、その地物を選択することができます。**画面上のポイントを選択してみましょう。**",
            "header": "地物についての詳しい情報が画面上部に表示されます。",
            "pane": "地物が選択されると、その地物の詳細情報が表示されます。詳細情報には、地物の種類をあらわす大項目と、その他詳細情報(名称や住所等)が表示されます。**画面右上のボタンを押して、詳細情報編集ウィンドウを閉じてください。**"
        },
        "points": {
            "add": "ポイントは、店舗やレストラン、記念碑など、特定の一点を表現します。これにより、特定の場所や地点に対して、情報を追加してゆくことが可能となります。**ポイントボタンをクリックして、ポイントを追加してみましょう。**",
            "place": "地図の上のどこかをクリックすることで、ポイントを追加することができます。**建物の上にポイントを追加してみましょう。**",
            "search": "ポイントは、様々な地物を表現する際に便利です。今回追加したポイントは、喫茶店を表しています。**'喫茶店'を選んでみましょう**",
            "choose": "**喫茶店を選択してください**",
            "describe": "ポイントが喫茶店としてタグ付けされました。更に詳細な情報を追加することもできます。**喫茶店の名称を追加してみましょう。**",
            "close": "ボタンを押すことで、タグ情報の編集ウィンドウを閉じることができます。**タグ情報の編集ウィンドウを閉じてみましょう。**",
            "reselect": "あなたが投稿したかったポイントは、既に誰かが投稿しているかもしれません。しかし、既存のポイントは情報が不足していたり、間違っている可能性があります。その場合は、既存のポイントのタグ情報を編集してみましょう。**あなたが作成したポイントをもう一度選択してみましょう。**",
            "fixname": "**地物の名称を変更して、詳細情報編集ウィンドウを閉じてください。**",
            "reselect_delete": "画面上の地物は、削除することも可能です。**あなたが作成したポイントをクリックしてください。**",
            "delete": "ポイントを囲む形で、その地物に対して行うことができる操作が表示されます。**ポイントを削除してみましょう。**"
        },
        "areas": {
            "add": "エリアで描くことで、その地物をより詳細に描いてみましょう。ポイントと違い、エリアではその地物の境界線を表現することが可能です。ポイントで表現している地物のほとんどは、エリアとしても描くことが可能です。**エリアボタンをクリックすることで、新しいエリアを描くことができます。**",
            "place": "ポイントを描くことで、エリアを表現することができます。エリアの描画を完了するには、描き始めた場所をもう一度クリックしてください。**エリアを作成して、児童公園を描いてみましょう。**",
            "search": "**児童公園を検索**",
            "choose": "**画面から児童公園を選択**",
            "describe": "**児童公園に名称を追加して、タグ情報編集ウィンドウを閉じましょう。**"
        },
        "lines": {
            "add": "ラインは道路や線路、河川など、線として表現される情報を示すことができます。**ライン ボタンをクリックして、新しくラインを描いてみましょう。**"
        }
    },
    "presets": {
        "fields": {
            "access": {
                "label": "通行制限"
            },
            "address": {
                "label": "住所",
                "placeholders": {
                    "number": "123",
                    "city": "市町村名"
                }
            },
            "aeroway": {
                "label": "タイプ"
            },
            "amenity": {
                "label": "種別"
            },
            "atm": {
                "label": "ATM"
            },
            "barrier": {
                "label": "タイプ"
            },
            "bicycle_parking": {
                "label": "タイプ"
            },
            "building": {
                "label": "建物"
            },
            "building_area": {
                "label": "建物"
            },
            "building_yes": {
                "label": "建物"
            },
            "capacity": {
                "label": "収容可能な数量"
            },
            "construction": {
                "label": "タイプ"
            },
            "crossing": {
                "label": "タイプ"
            },
            "cuisine": {
                "label": "メニュー種別"
            },
            "denomination": {
                "label": "宗派"
            },
            "elevation": {
                "label": "標高"
            },
            "emergency": {
                "label": "緊急通知, 施設"
            },
            "entrance": {
                "label": "タイプ"
            },
            "fax": {
                "label": "Fax"
            },
            "fee": {
                "label": "利用料金"
            },
            "highway": {
                "label": "道路区分"
            },
            "historic": {
                "label": "タイプ"
            },
            "internet_access": {
                "label": "インターネット利用",
                "options": {
                    "wlan": "Wifi",
                    "wired": "有線LAN",
                    "terminal": "情報端末"
                }
            },
            "landuse": {
                "label": "土地区分"
            },
            "layer": {
                "label": "レイヤ"
            },
            "leisure": {
                "label": "タイプ"
            },
            "levels": {
                "label": "階数"
            },
            "man_made": {
                "label": "タイプ"
            },
            "maxspeed": {
                "label": "最高速度"
            },
            "name": {
                "label": "名称"
            },
            "natural": {
                "label": "自然"
            },
            "network": {
                "label": "ネットワーク"
            },
            "note": {
                "label": "メモ"
            },
            "office": {
                "label": "タイプ"
            },
            "oneway": {
                "label": "一方通行"
            },
            "oneway_yes": {
                "label": "一方通行"
            },
            "opening_hours": {
                "label": "利用可能な時間帯"
            },
            "operator": {
                "label": "管理者"
            },
            "phone": {
                "label": "電話番号"
            },
            "place": {
                "label": "タイプ"
            },
            "power": {
                "label": "区分"
            },
            "railway": {
                "label": "路線種別"
            },
            "ref": {
                "label": "管理番号"
            },
            "religion": {
                "label": "宗教",
                "options": {
                    "christian": "キリスト教",
                    "muslim": "イスラム教",
                    "buddhist": "仏教",
                    "jewish": "ユダヤ教",
                    "hindu": "ヒンズー教",
                    "shinto": "神道",
                    "taoist": "道教"
                }
            },
            "service": {
                "label": "タイプ"
            },
            "shelter": {
                "label": "避難所"
            },
            "shop": {
                "label": "店舗種別"
            },
            "source": {
                "label": "参照した情報"
            },
            "sport": {
                "label": "スポーツ"
            },
            "structure": {
                "label": "構造",
                "options": {
                    "bridge": "橋梁",
                    "tunnel": "トンネル",
                    "embankment": "土手, 堤防",
                    "cutting": "切土, 掘割"
                }
            },
            "surface": {
                "label": "路面種別"
            },
            "tourism": {
                "label": "タイプ"
            },
            "water": {
                "label": "タイプ"
            },
            "waterway": {
                "label": "水路区分"
            },
            "website": {
                "label": "ウェブサイト"
            },
            "wetland": {
                "label": "タイプ"
            },
            "wheelchair": {
                "label": "車椅子の利用可否"
            },
            "wikipedia": {
                "label": "Wikipedia"
            },
            "wood": {
                "label": "タイプ"
            }
        },
        "presets": {
            "aeroway": {
                "name": "航空施設"
            },
            "aeroway/aerodrome": {
                "name": "空港",
                "terms": "航空機, 空港, 飛行場"
            },
            "aeroway/helipad": {
                "name": "ヘリポート",
                "terms": "ヘリコプター, ヘリポート, ヘリ発着場"
            },
            "amenity": {
                "name": "施設, amenity"
            },
            "amenity/bank": {
                "name": "銀行"
            },
            "amenity/bar": {
                "name": "バー"
            },
            "amenity/bench": {
                "name": "ベンチ"
            },
            "amenity/bicycle_parking": {
                "name": "駐輪場, バイク置き場"
            },
            "amenity/bicycle_rental": {
                "name": "レンタル自転車店"
            },
            "amenity/cafe": {
                "name": "カフェ",
                "terms": "コーヒー, 紅茶, 喫茶店"
            },
            "amenity/cinema": {
                "name": "映画館"
            },
            "amenity/embassy": {
                "name": "大使館"
            },
            "amenity/fast_food": {
                "name": "ファストフード"
            },
            "amenity/fire_station": {
                "name": "消防署"
            },
            "amenity/fuel": {
                "name": "ガソリンスタンド"
            },
            "amenity/grave_yard": {
                "name": "墓地"
            },
            "amenity/hospital": {
                "name": "病院"
            },
            "amenity/library": {
                "name": "図書館"
            },
            "amenity/marketplace": {
                "name": "市場"
            },
            "amenity/parking": {
                "name": "駐車場"
            },
            "amenity/pharmacy": {
                "name": "薬局, ドラッグストア"
            },
            "amenity/place_of_worship": {
                "name": "宗教施設"
            },
            "amenity/place_of_worship/christian": {
                "name": "教会"
            },
            "amenity/place_of_worship/jewish": {
                "name": "シナゴーグ",
                "terms": "ユダヤ教, シナゴーグ"
            },
            "amenity/place_of_worship/muslim": {
                "name": "モスク",
                "terms": "イスラム教, モスク"
            },
            "amenity/police": {
                "name": "警察"
            },
            "amenity/post_box": {
                "name": "郵便ポスト"
            },
            "amenity/post_office": {
                "name": "郵便局"
            },
            "amenity/pub": {
                "name": "居酒屋, パブ"
            },
            "amenity/restaurant": {
                "name": "レストラン"
            },
            "amenity/school": {
                "name": "学校"
            },
            "amenity/swimming_pool": {
                "name": "プール"
            },
            "amenity/telephone": {
                "name": "公衆電話"
            },
            "amenity/theatre": {
                "name": "劇場",
                "terms": "劇場, パフォーマンス, ミュージカル, 大道芸"
            },
            "amenity/toilets": {
                "name": "お手洗い, トイレ"
            },
            "amenity/townhall": {
                "name": "市町村役場"
            },
            "amenity/university": {
                "name": "大学"
            },
            "barrier": {
                "name": "障害物"
            },
            "barrier/block": {
                "name": "車止め"
            },
            "barrier/bollard": {
                "name": "杭"
            },
            "barrier/city_wall": {
                "name": "市壁"
            },
            "barrier/cycle_barrier": {
                "name": "自転車止め"
            },
            "barrier/ditch": {
                "name": "溝"
            },
            "barrier/entrance": {
                "name": "出入り口"
            },
            "barrier/fence": {
                "name": "フェンス, 柵"
            },
            "barrier/gate": {
                "name": "門, ゲート"
            },
            "barrier/kissing_gate": {
                "name": "牧場用ゲート"
            },
            "barrier/toll_booth": {
                "name": "料金所"
            },
            "barrier/wall": {
                "name": "壁"
            },
            "building": {
                "name": "建物"
            },
            "building/apartments": {
                "name": "アパート"
            },
            "building/entrance": {
                "name": "エントランス"
            },
            "entrance": {
                "name": "エントランス"
            },
            "highway": {
                "name": "道路"
            },
            "highway/bridleway": {
                "name": "乗馬道"
            },
            "highway/bus_stop": {
                "name": "バス停"
            },
            "highway/crossing": {
                "name": "横断歩道"
            },
            "highway/cycleway": {
                "name": "自転車道"
            },
            "highway/footway": {
                "name": "歩道"
            },
            "highway/motorway": {
                "name": "高速道路"
            },
            "highway/motorway_link": {
                "name": "高速道路 - 接続道",
                "terms": "スロープ有無"
            },
            "highway/path": {
                "name": "小道"
            },
            "highway/primary": {
                "name": "主要地方道"
            },
            "highway/primary_link": {
                "name": "都道府県道 - 接続路",
                "terms": "スロープ有無"
            },
            "highway/residential": {
                "name": "住宅道路"
            },
            "highway/road": {
                "name": "道路区分不明"
            },
            "highway/secondary": {
                "name": "一般地方道"
            },
            "highway/secondary_link": {
                "name": "一般地方道 - 接続路",
                "terms": "スロープ有無"
            },
            "highway/service": {
                "name": "私道"
            },
            "highway/steps": {
                "name": "階段",
                "terms": "階段"
            },
            "highway/tertiary": {
                "name": "主要な一般道"
            },
            "highway/tertiary_link": {
                "name": "主要な一般道 - 接続路",
                "terms": "スロープ有無"
            },
            "highway/track": {
                "name": "農道"
            },
            "highway/traffic_signals": {
                "name": "信号機",
                "terms": "街灯, スポットライト, 交通照明"
            },
            "highway/trunk": {
                "name": "国道"
            },
            "highway/trunk_link": {
                "name": "国道 - 接続路",
                "terms": "スロープ有無"
            },
            "highway/turning_circle": {
                "name": "車回し"
            },
            "highway/unclassified": {
                "name": "一般道"
            },
            "historic": {
                "name": "歴史的な場所"
            },
            "historic/castle": {
                "name": "城郭"
            },
            "historic/memorial": {
                "name": "記念碑, プレート"
            },
            "historic/monument": {
                "name": "記念碑, モニュメント"
            },
            "historic/ruins": {
                "name": "廃墟"
            },
            "historic/wayside_cross": {
                "name": "十字架"
            },
            "historic/wayside_shrine": {
                "name": "地蔵, 道祖碑"
            },
            "landuse": {
                "name": "土地利用"
            },
            "landuse/allotments": {
                "name": "市民菜園"
            },
            "landuse/commercial": {
                "name": "商業区"
            },
            "landuse/construction": {
                "name": "施設建築中"
            },
            "landuse/farm": {
                "name": "田畑"
            },
            "landuse/farmyard": {
                "name": "田畑"
            },
            "landuse/forest": {
                "name": "森林"
            },
            "landuse/grass": {
                "name": "草地"
            },
            "landuse/industrial": {
                "name": "工業区"
            },
            "landuse/meadow": {
                "name": "牧草地"
            },
            "landuse/orchard": {
                "name": "果樹園"
            },
            "landuse/quarry": {
                "name": "採掘場"
            },
            "landuse/residential": {
                "name": "住宅区"
            },
            "landuse/vineyard": {
                "name": "ワイン畑"
            },
            "leisure": {
                "name": "レジャー"
            },
            "leisure/garden": {
                "name": "庭園"
            },
            "leisure/golf_course": {
                "name": "ゴルフ場"
            },
            "leisure/marina": {
                "name": "停泊所"
            },
            "leisure/park": {
                "name": "公園"
            },
            "leisure/pitch": {
                "name": "運動場"
            },
            "leisure/pitch/american_football": {
                "name": "アメフト競技場"
            },
            "leisure/pitch/baseball": {
                "name": "野球場"
            },
            "leisure/pitch/basketball": {
                "name": "バスケットボール・コート"
            },
            "leisure/pitch/soccer": {
                "name": "サッカー場"
            },
            "leisure/pitch/tennis": {
                "name": "テニスコート"
            },
            "leisure/slipway": {
                "name": "進水所"
            },
            "leisure/swimming_pool": {
                "name": "プール"
            },
            "man_made": {
                "name": "人工物"
            },
            "man_made/lighthouse": {
                "name": "灯台"
            },
            "man_made/pier": {
                "name": "桟橋"
            },
            "man_made/survey_point": {
                "name": "調査・観測地点"
            },
            "man_made/water_tower": {
                "name": "給水塔"
            },
            "natural": {
                "name": "自然物"
            },
            "natural/bay": {
                "name": "港湾"
            },
            "natural/beach": {
                "name": "浜辺, ビーチ"
            },
            "natural/cliff": {
                "name": "崖"
            },
            "natural/coastline": {
                "name": "海岸線"
            },
            "natural/glacier": {
                "name": "氷河, 凍土"
            },
            "natural/grassland": {
                "name": "草地"
            },
            "natural/heath": {
                "name": "低木地"
            },
            "natural/peak": {
                "name": "山頂"
            },
            "natural/scrub": {
                "name": "茂み"
            },
            "natural/spring": {
                "name": "湧水"
            },
            "natural/tree": {
                "name": "樹木"
            },
            "natural/water": {
                "name": "水面"
            },
            "natural/water/lake": {
                "name": "湖"
            },
            "natural/water/pond": {
                "name": "池"
            },
            "natural/water/reservoir": {
                "name": "貯水池"
            },
            "natural/wetland": {
                "name": "湿地"
            },
            "natural/wood": {
                "name": "自然林"
            },
            "office": {
                "name": "オフィス"
            },
            "other": {
                "name": "その他"
            },
            "other_area": {
                "name": "その他"
            },
            "place/island": {
                "name": "島"
            },
            "place/village": {
                "name": "村"
            },
            "power/generator": {
                "name": "発電所"
            },
            "power/line": {
                "name": "送電線"
            },
            "power/pole": {
                "name": "電柱"
            },
            "power/sub_station": {
                "name": "変電所"
            },
            "power/tower": {
                "name": "送電塔"
            },
            "railway": {
                "name": "線路"
            },
            "railway/abandoned": {
                "name": "廃路線"
            },
            "railway/disused": {
                "name": "廃棄済み路線"
            },
            "railway/level_crossing": {
                "name": "踏切"
            },
            "railway/rail": {
                "name": "線路"
            },
            "railway/subway": {
                "name": "地下鉄"
            },
            "railway/subway_entrance": {
                "name": "地下鉄入り口"
            },
            "shop": {
                "name": "店舗"
            },
            "shop/alcohol": {
                "name": "酒屋"
            },
            "shop/bakery": {
                "name": "パン屋"
            },
            "shop/beauty": {
                "name": "美容品店"
            },
            "shop/beverages": {
                "name": "飲料品店"
            },
            "shop/bicycle": {
                "name": "自転車屋"
            },
            "shop/books": {
                "name": "本屋"
            },
            "shop/boutique": {
                "name": "ブティック"
            },
            "shop/butcher": {
                "name": "肉屋"
            },
            "shop/car": {
                "name": "乗用車販売"
            },
            "shop/car_parts": {
                "name": "車輌部品, グッズ販売"
            },
            "shop/car_repair": {
                "name": "車輌修理"
            },
            "shop/chemist": {
                "name": "化粧品店"
            },
            "shop/clothes": {
                "name": "衣料品店"
            },
            "shop/computer": {
                "name": "コンピュータ店"
            },
            "shop/confectionery": {
                "name": "菓子屋"
            },
            "shop/convenience": {
                "name": "コンビニ"
            },
            "shop/deli": {
                "name": "惣菜屋"
            },
            "shop/department_store": {
                "name": "百貨店"
            },
            "shop/doityourself": {
                "name": "日曜大工用品"
            },
            "shop/dry_cleaning": {
                "name": "クリーニング"
            },
            "shop/electronics": {
                "name": "電子部品"
            },
            "shop/fishmonger": {
                "name": "魚屋"
            },
            "shop/florist": {
                "name": "花屋"
            },
            "shop/furniture": {
                "name": "家具用品"
            },
            "shop/garden_centre": {
                "name": "ガーデンセンター"
            },
            "shop/gift": {
                "name": "ギフト用品"
            },
            "shop/greengrocer": {
                "name": "八百屋"
            },
            "shop/hairdresser": {
                "name": "床屋, 美容室"
            },
            "shop/hardware": {
                "name": "金物屋"
            },
            "shop/hifi": {
                "name": "音響設備"
            },
            "shop/jewelry": {
                "name": "宝石店"
            },
            "shop/kiosk": {
                "name": "キオスク"
            },
            "shop/mall": {
                "name": "ショッピングセンター"
            },
            "shop/mobile_phone": {
                "name": "携帯電話"
            },
            "shop/motorcycle": {
                "name": "バイク販売"
            },
            "shop/optician": {
                "name": "メガネ"
            },
            "shop/outdoor": {
                "name": "アウトドア"
            },
            "shop/pet": {
                "name": "ペットショップ"
            },
            "shop/shoes": {
                "name": "靴屋"
            },
            "shop/sports": {
                "name": "スポーツ用品"
            },
            "shop/stationery": {
                "name": "文具店"
            },
            "shop/supermarket": {
                "name": "スーパーマーケット"
            },
            "shop/toys": {
                "name": "おもちゃ屋"
            },
            "shop/travel_agency": {
                "name": "旅行代理店"
            },
            "shop/tyres": {
                "name": "タイヤ販売"
            },
            "shop/vacant": {
                "name": "未入居店舗"
            },
            "shop/variety_store": {
                "name": "雑貨屋"
            },
            "shop/video": {
                "name": "ビデオ屋"
            },
            "tourism": {
                "name": "観光"
            },
            "tourism/alpine_hut": {
                "name": "山小屋"
            },
            "tourism/artwork": {
                "name": "芸術品展示"
            },
            "tourism/attraction": {
                "name": "観光施設"
            },
            "tourism/camp_site": {
                "name": "キャンプ場"
            },
            "tourism/caravan_site": {
                "name": "公園(キャンプカー用)"
            },
            "tourism/chalet": {
                "name": "コテージ"
            },
            "tourism/guest_house": {
                "name": "民宿"
            },
            "tourism/hotel": {
                "name": "ホテル"
            },
            "tourism/motel": {
                "name": "モーテル"
            },
            "tourism/museum": {
                "name": "博物館, 美術館"
            },
            "tourism/picnic_site": {
                "name": "ピクニック場"
            },
            "tourism/theme_park": {
                "name": "テーマパーク"
            },
            "tourism/viewpoint": {
                "name": "展望台"
            },
            "tourism/zoo": {
                "name": "遊園地"
            },
            "waterway": {
                "name": "水路, 河川"
            },
            "waterway/canal": {
                "name": "運河"
            },
            "waterway/dam": {
                "name": "ダム"
            },
            "waterway/ditch": {
                "name": "堀, 用水路"
            },
            "waterway/drain": {
                "name": "排水路"
            },
            "waterway/river": {
                "name": "河川"
            },
            "waterway/riverbank": {
                "name": "河川流域"
            },
            "waterway/stream": {
                "name": "小川"
            },
            "waterway/weir": {
                "name": "堰"
            }
        }
    }
};
locale.lv = {
    "modes": {
        "add_area": {
            "title": "Apgabals",
            "description": "Pievieno parkus, ēkas, ezerus un citus apgabalus.",
            "tail": "Klikšķiniet uz kartes, lai sāktu zīmēt apgabalu, piemēram, parku, ezeru, vai ēku."
        },
        "add_line": {
            "title": "Līnija",
            "description": "Pievieno ceļus, ielas, takas kanālus un citas līnijas.",
            "tail": "Klikšķiniet uz kartes, lai sāktu zīmēt līniju, piemēram, ceļu vai taku."
        },
        "add_point": {
            "title": "Punkts",
            "description": "Pievieno restorānus, pieminekļus, veikalus un citus punktus.",
            "tail": "Klikšķiniet uz kartes, lai pievienotu interešu punktu."
        },
        "browse": {
            "title": "Pārlūkot",
            "description": "Pārlūko karti."
        },
        "draw_area": {
            "tail": "Klikšķiniet, lai pievienotu mezglus apgabalam. Lai beigtu zīmēt apgabalu, klikšķiniet uz sākuma mezgla."
        },
        "draw_line": {
            "tail": "Klikšķiniet, lai pievienotu mezglus līnijai. Lai savienotu ar citām linijām, klikšķiniet uz tām. Dubultklikšķis nobeidz līniju."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Punkts pievienots.",
                "vertex": "Mezgls pievienots līnijai."
            }
        },
        "start": {
            "annotation": {
                "line": "Līnija iesākta.",
                "area": "Apgabals iesākts."
            }
        },
        "continue": {
            "annotation": {
                "line": "Līnija turpināta.",
                "area": "Apgabals turpināts."
            }
        },
        "cancel_draw": {
            "annotation": "Zīmēšana atcelta."
        },
        "change_tags": {
            "annotation": "Apzīmējumi mainīti."
        },
        "circularize": {
            "title": "Pārveidot par apļveida",
            "description": {
                "line": "Pārveidot šo līniju par apļveida.",
                "area": "Pārveidot šo apgabalu par apļveida"
            },
            "key": "O",
            "annotation": {
                "line": "Līnija pārveidota par apļveida.",
                "area": "Apgabals pārveidots par apļveida."
            },
            "not_closed": "Šo objektu nevar pārveidot par apļveida, jo tas nav pabeigts."
        },
        "orthogonalize": {
            "title": "Ortogonalizēt",
            "description": "Pārveidot, lai visi leņķi būtu taisnleņķi.",
            "key": "Q",
            "annotation": {
                "line": "Līnijas leņķi pārvedoti par taisnleņķiem.",
                "area": "Apgabala leņķi pārvedoti par taisnleņķiem."
            },
            "not_closed": "Šim objektam nevar pārveidot visus leņķus par taisnleņķa, jo tas nav pabeigts."
        },
        "delete": {
            "title": "Dzēst",
            "description": "Izdzēst no kartes.",
            "annotation": {
                "point": "Punkts dzēsts.",
                "vertex": "Mezgls dzests.",
                "line": "Līnija dzēsta.",
                "area": "Apgabals dzēsts.",
                "relation": "Relācija dzēsta.",
                "multiple": "{n} objekti dzēsti."
            }
        },
        "connect": {
            "annotation": {
                "point": "Līnija savienota ar punktu.",
                "vertex": "Līnija savienota ar citu.",
                "line": "Līnija savienota ar līniju.",
                "area": "Līnija savienota ar apgabalu."
            }
        },
        "disconnect": {
            "title": "Atvienot",
            "description": "Atvieno līnijas.",
            "key": "D",
            "annotation": "Līnijas atvienotas."
        },
        "merge": {
            "title": "Sapludināt",
            "description": "Sapludināt līnijas.",
            "key": "C",
            "annotation": "{n} līnijas sapludinātas.",
            "not_eligible": "Šos objektus nevar apvienot.",
            "not_adjacent": "Šīs līnijas nevar apvienot, jo tās nav savienotas."
        },
        "move": {
            "title": "Pārvietot",
            "description": "Pārvieto objektu.",
            "key": "M",
            "annotation": {
                "point": "Punkts pārvietots.",
                "vertex": "Mezgls pārvietots.",
                "line": "Līnija pārvietota.",
                "area": "Apgabals pārvietots.",
                "multiple": "Vairāki objekti pārvietoti."
            },
            "incomplete_relation": "Šo objektu nevar pārvietot, jo tas nav pilnībā lejuplādēts."
        },
        "rotate": {
            "title": "Pagriezt",
            "description": "Pagriezt šo objektu ap tā centru.",
            "key": "R",
            "annotation": {
                "line": "Līnija pagriezta.",
                "area": "Apgabals pagriezts."
            }
        },
        "reverse": {
            "title": "Mainīt virzienu",
            "description": "Mainīt līnijas virzienu.",
            "key": "V",
            "annotation": "Līnijas virziens mainīts."
        },
        "split": {
            "title": "Sadalīt",
            "description": {
                "line": "Sadalīt šo līniju divās daļās šajā punktā.",
                "area": "Sadalīt šī apgabala robežu divās daļās.",
                "multiple": "Sadalīt līnijas/apgabala robežas divās daļās šajā punktā."
            },
            "key": "X",
            "annotation": {
                "line": "Sadalīt līniju.",
                "area": "Sadalīt apgabala robežu.",
                "multiple": "Sadalīt {n} līnijas/apgabala robežas."
            },
            "not_eligible": "Līnijas nevar sadalīt to sākumā vai beigās."
        }
    },
    "nothing_to_undo": "Nav nekā, ko atcelt",
    "nothing_to_redo": "Nav nekā, ko atsaukt",
    "just_edited": "Jūs nupat rediģējāt OpenStreetMap",
    "browser_notice": "Šis redaktors tiek atbalstīts ar Firefox, Chrome, Safari, Opera, un Internet Explorer 9 un jaunāku. Lūdzu, atjauniniet savu pārlūkprogrammu vai izmantojiet Potlatch 2 kartes rediģēšanai",
    "view_on_osm": "Aplūkot OSM kartē",
    "zoom_in_edit": "pietuviniet, lai labotu karti",
    "logout": "atslēgties",
    "loading_auth": "Savienojas ar OpenStreetMap...",
    "report_a_bug": "ziņot par kļūdu",
    "commit": {
        "title": "Saglabāt izmaiņas",
        "description_placeholder": "Īss apraksts par jūsu ieguldījumu",
        "message_label": "Izmaiņu apraksts",
        "upload_explanation": "Izmaiņas, kuras jūs augšupielādējat kā {user}, būs pieejamas visās kartēs, kuras izmanto OpenStreetMap datus.",
        "save": "Saglabāt",
        "cancel": "Atcelt",
        "warnings": "Brīdinājumi",
        "modified": "Mainīts",
        "deleted": "Dzēsts",
        "created": "Izveidots"
    },
    "contributors": {
        "list": "{users} papildinājumi redzami",
        "truncated_list": "{users} un {count} citu papildinājumi redzami"
    },
    "geocoder": {
        "title": "Atrast vietu",
        "placeholder": "meklēt vietu",
        "no_results": "Nevar atrast vietu '{name}'"
    },
    "geolocate": {
        "title": "Parādīt manu atrašanās vietu"
    },
    "inspector": {
        "no_documentation_combination": "Šai apzīmējumu kombinācijai nav piejama dokumentācija",
        "no_documentation_key": "Šai vērtībai nav piejama dokumentācija",
        "show_more": "Rādīt vairāk",
        "new_tag": "Jauns apzīmējums",
        "view_on_osm": "Apskatīt OSM",
        "editing_feature": "Rediģē {feature}",
        "additional": "Papildus apzīmējumi",
        "choose": "Izvēlieties objekta tipu",
        "results": "Atrasti {n} rezultāti meklējot {search}",
        "reference": "Skatīt OpenStreetMap wiki →",
        "back_tooltip": "Mainīt objekta tipu"
    },
    "background": {
        "title": "Fons",
        "description": "Fona iestatījumi",
        "percent_brightness": "{opacity}% caurspīdīgums",
        "fix_misalignment": "Labot fona nobīdi",
        "reset": "Atiestatīt"
    },
    "restore": {
        "heading": "Jums ir nesaglabātas izmaiņas",
        "description": "Jums ir nesaglabātas izmaiņas no iepriekšējās labošanas sesijas. Vai vēlaties ielādēt šīs izmaiņas?",
        "restore": "Ielādēt",
        "reset": "Atmest"
    },
    "save": {
        "title": "Saglabāt",
        "help": "Saglabā izmaiņas, padarot tās redzamas citiem.",
        "no_changes": "Nav izmaiņu, ko saglabāt.",
        "error": "Kļūda. Nevarēja saglabāt izmaiņas",
        "uploading": "Augšupielādē izmaiņas",
        "unsaved_changes": "Jums ir nesaglabātas izmaiņas"
    },
    "splash": {
        "welcome": "Laipni lūgti iD OpenStreetMap redaktorā",
        "text": "Šī ir izstrādes versija {version}. Papildus informācijai skatīt {website} un ziņot par kļūdām {github}.",
        "start": "Labot tagad"
    },
    "source_switch": {
        "live": "live",
        "lose_changes": "Jums ir nesaglabātas izmaiņas. Tās tiks zaudētas mainot karšu serveri. Vai tiešām vēlaties mainīt karšu serveri?",
        "dev": "dev"
    },
    "tag_reference": {
        "description": "Apraksts",
        "on_wiki": "{tag} wiki.osm.org",
        "used_with": "izmantots kopā ar {type}"
    },
    "validations": {
        "untagged_point": "Neapzīmēts punkts",
        "untagged_line": "Neapzīmēta līnija",
        "untagged_area": "Neapzīmēts apgabals",
        "many_deletions": "Jūs dzēšat {n} objektus. Vai tiešām vēlaties to darīt? Tie tiks izdzēsti no kartes, ko visi var aplūkt openstreetmap.org.",
        "tag_suggests_area": "Apzīmējums {tag} parasti tiek lietots apgabaliem, bet objekts nav apgabals",
        "deprecated_tags": "Novecojuši apzīmējumi: {tags}"
    },
    "zoom": {
        "in": "Pietuvināt",
        "out": "Attālināt"
    },
    "gpx": {
        "local_layer": "Vietējais GPX fails"
    },
    "help": {
        "title": "Palīdzība"
    },
    "intro": {
        "lines": {
            "start": "**Uzsāciet līniju, klikšķinot ceļa beigu punktā.**",
            "restart": "Ceļam jākrusto Flower Street."
        },
        "startediting": {
            "save": "Neizmirstiet regulāri saglabāt izmaiņas!"
        }
    },
    "presets": {
        "fields": {
            "access": {
                "label": "Piekļuve"
            },
            "address": {
                "label": "Adrese",
                "placeholders": {
                    "number": "123",
                    "street": "Iela",
                    "city": "Pilsēta"
                }
            },
            "aeroway": {
                "label": "Tips"
            },
            "amenity": {
                "label": "Tips"
            },
            "atm": {
                "label": "Bankomāts"
            },
            "barrier": {
                "label": "Tips"
            },
            "bicycle_parking": {
                "label": "Tips"
            },
            "building": {
                "label": "Ēka"
            },
            "building_area": {
                "label": "Ēka"
            },
            "building_yes": {
                "label": "Ēka"
            },
            "capacity": {
                "label": "Ietilpība"
            },
            "construction": {
                "label": "Tips"
            },
            "crossing": {
                "label": "Tips"
            },
            "fax": {
                "label": "Fakss"
            },
            "fee": {
                "label": "Maksa"
            },
            "highway": {
                "label": "Tips"
            },
            "historic": {
                "label": "Tips"
            },
            "internet_access": {
                "label": "Interneta piekļuve",
                "options": {
                    "wlan": "Bezvadu internets",
                    "wired": "Kabeļinternets"
                }
            },
            "landuse": {
                "label": "Tips"
            },
            "layer": {
                "label": "Līmenis"
            },
            "leisure": {
                "label": "Tips"
            },
            "levels": {
                "label": "Stāvu skaits"
            },
            "man_made": {
                "label": "Tips"
            },
            "maxspeed": {
                "label": "Ātruma ierobežojums"
            },
            "note": {
                "label": "Piezīme"
            },
            "oneway": {
                "label": "Vienvirziena"
            },
            "opening_hours": {
                "label": "Darba laiks"
            },
            "place": {
                "label": "Tips"
            },
            "power": {
                "label": "Tips"
            },
            "railway": {
                "label": "Tips"
            },
            "religion": {
                "label": "Reliģija",
                "options": {
                    "christian": "Kristietiešu",
                    "muslim": "Musulmaņu",
                    "buddhist": "Budistu",
                    "hindu": "Hinduistu",
                    "shinto": "Sintoistu",
                    "taoist": "Taoistu"
                }
            },
            "service": {
                "label": "Tips"
            },
            "shelter": {
                "label": "Pajumte"
            },
            "shop": {
                "label": "Tips"
            },
            "source": {
                "label": "Avots"
            },
            "sport": {
                "label": "Sports"
            },
            "structure": {
                "options": {
                    "tunnel": "Tunelis"
                }
            },
            "surface": {
                "label": "Segums"
            },
            "tourism": {
                "label": "Tips"
            },
            "water": {
                "label": "Tips"
            },
            "waterway": {
                "label": "Tips"
            },
            "wetland": {
                "label": "Tips"
            },
            "wikipedia": {
                "label": "Vikipēdija"
            },
            "wood": {
                "label": "Tips"
            }
        },
        "presets": {
            "aeroway/aerodrome": {
                "name": "Lidosta"
            },
            "amenity/bicycle_parking": {
                "name": "Velo stāvvieta"
            },
            "amenity/bicycle_rental": {
                "name": "Velonoma"
            },
            "amenity/cafe": {
                "name": "Kafejnīca"
            },
            "amenity/embassy": {
                "name": "Vēstniecība"
            },
            "amenity/hospital": {
                "name": "Slimnīca"
            },
            "amenity/library": {
                "name": "Bibliotēka"
            },
            "amenity/marketplace": {
                "name": "Tirgus"
            },
            "amenity/place_of_worship/christian": {
                "name": "Baznīca"
            },
            "amenity/place_of_worship/jewish": {
                "name": "Sinagoga"
            },
            "amenity/place_of_worship/muslim": {
                "name": "Mošeja"
            },
            "amenity/post_office": {
                "name": "Pasta nodaļa"
            },
            "amenity/pub": {
                "name": "Krogs"
            },
            "amenity/restaurant": {
                "name": "Restorāns"
            },
            "amenity/school": {
                "name": "Skola"
            },
            "amenity/swimming_pool": {
                "name": "Peldbaseins"
            },
            "amenity/theatre": {
                "name": "Teātris"
            },
            "amenity/university": {
                "name": "Universitāte"
            },
            "building": {
                "name": "Ēka"
            },
            "building/entrance": {
                "name": "Ieeja"
            },
            "entrance": {
                "name": "Ieeja"
            },
            "highway/steps": {
                "name": "Kāpnes"
            },
            "historic/memorial": {
                "name": "Memoriāls"
            },
            "historic/monument": {
                "name": "Piemineklis"
            },
            "landuse/cemetery": {
                "name": "Kapsēta"
            },
            "leisure/garden": {
                "name": "Dārzs"
            },
            "leisure/park": {
                "name": "Parks"
            },
            "leisure/pitch": {
                "name": "Sporta laukums"
            },
            "leisure/pitch/american_football": {
                "name": "Amerikāņu futbola laukums"
            },
            "leisure/pitch/baseball": {
                "name": "Beisbola laukums"
            },
            "leisure/pitch/basketball": {
                "name": "Basketbola laukums"
            },
            "leisure/pitch/soccer": {
                "name": "Futbola laukums"
            },
            "leisure/pitch/tennis": {
                "name": "Tenisa korti"
            },
            "leisure/stadium": {
                "name": "Stadions"
            },
            "man_made/lighthouse": {
                "name": "Bāka"
            },
            "man_made/water_tower": {
                "name": "Ūdenstornis"
            },
            "natural/bay": {
                "name": "Līcis"
            },
            "natural/beach": {
                "name": "Pludmale"
            },
            "natural/cliff": {
                "name": "Klints"
            },
            "natural/coastline": {
                "name": "Krasta līnija"
            },
            "natural/water": {
                "name": "Ūdens"
            },
            "natural/water/pond": {
                "name": "Dīķis"
            },
            "shop/bicycle": {
                "name": "Velo veikals"
            },
            "shop/books": {
                "name": "Grāmatu veikals"
            },
            "shop/butcher": {
                "name": "Miesnieks"
            },
            "shop/clothes": {
                "name": "Apģērba veikals"
            },
            "shop/dry_cleaning": {
                "name": "Ķīmiskā tīrītava"
            },
            "shop/gift": {
                "name": "Dāvanu veikals"
            },
            "shop/jewelry": {
                "name": "Juvelieris"
            },
            "shop/kiosk": {
                "name": "Kiosks"
            },
            "shop/laundry": {
                "name": "Veļas mazgātuve"
            },
            "shop/music": {
                "name": "Mūzikas veikals"
            },
            "shop/toys": {
                "name": "Rotaļlietu veikals"
            },
            "shop/travel_agency": {
                "name": "Ceļojumu aģentūra"
            },
            "tourism/guest_house": {
                "name": "Viesu nams"
            },
            "tourism/hostel": {
                "name": "Hostelis"
            },
            "tourism/hotel": {
                "name": "Viesnīca"
            },
            "tourism/motel": {
                "name": "Motelis"
            },
            "tourism/museum": {
                "name": "Muzejs"
            },
            "waterway/canal": {
                "name": "Kanāls"
            }
        }
    }
};
locale.pl = {
    "modes": {
        "add_area": {
            "title": "Obszar",
            "description": "Dodaj parki, budynki, jeziora i inne obszary do mapy.",
            "tail": "Kliknij na mapę aby zacząć rysować obszar, na przykład park, jezioro lub budynek."
        },
        "add_line": {
            "title": "Linia",
            "description": "Dodaj autorstrady, ulice ścieżki dla pieszych, kanały i inne linie do mapy.",
            "tail": "Kliknij na mapę aby zacząć rysować linię, na przykład drogę, ścieżkę lub trasę."
        },
        "add_point": {
            "title": "Punkt",
            "description": "Dodaj restauracje, pominki, skrzynki pocztowe i inne punkty do mapy.",
            "tail": "Kliknij na mapę aby dodać punkt, na przykład restaurację, pomnik lub skrzynkę pocztową."
        },
        "browse": {
            "title": "Przeglądaj",
            "description": "Przesuwaj i zmieniaj skalę mapy."
        },
        "draw_area": {
            "tail": "Kliknij aby dodać punkty do obszaru. Kliknij na pierwszy punkt aby skończyć rysowanie obszaru."
        },
        "draw_line": {
            "tail": "Kliknij aby dodać punkty do linii. Kliknij na inne linie aby je połączyć, a dwa razy kliknij na linię aby skończyć ją rysować."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Dodano punkt.",
                "vertex": "Dodano węzeł do drogi."
            }
        },
        "start": {
            "annotation": {
                "line": "Zaczęto linię.",
                "area": "Zaczęto obszar."
            }
        },
        "continue": {
            "annotation": {
                "line": "Kontynuacja linii.",
                "area": "Kontynuacja obszaru."
            }
        },
        "cancel_draw": {
            "annotation": "Przestano rysować."
        },
        "change_tags": {
            "annotation": "Zmieniono tagi."
        },
        "circularize": {
            "title": "Zaokrąglij",
            "description": {
                "line": "Stwórz okrąg z tej linii.",
                "area": "Stwórz koło z tego obszaru."
            },
            "key": "O",
            "annotation": {
                "line": "Stworzoną okrąg z linii.",
                "area": "Stworzono koło z obszaru."
            },
            "not_closed": "Z tego nie można zrobić okręgu, bo nie jest pętlą."
        },
        "orthogonalize": {
            "title": "Ortogonalizuj",
            "description": "Spraw, aby te kąty były proste.",
            "key": "Q",
            "annotation": {
                "line": "Zortogonalizowano kąty linii.",
                "area": "Zortogonalizowano kąty obszaru."
            },
            "not_closed": "Nie można zrobić z tego prostokąta, bo nie jest pętlą."
        },
        "delete": {
            "title": "Usuń",
            "description": "Usuń to z mapy.",
            "annotation": {
                "point": "Usunięto punkt.",
                "vertex": "Usunięto węzeł z drogi.",
                "line": "Usunięto linię.",
                "area": "Usunięto obszar.",
                "relation": "Usunięto relację.",
                "multiple": "Usunięto {n} obietów/obiekty."
            }
        },
        "connect": {
            "annotation": {
                "point": "Połączono drogę z punktem.",
                "vertex": "Połączono dwie drogi.",
                "line": "Połączono drogę z linią.",
                "area": "Połączono drogę z obszarem."
            }
        },
        "disconnect": {
            "title": "Rozłącz",
            "description": "Rozłącz te dwie drogi.",
            "key": "D",
            "annotation": "Rozłączono drogi.",
            "not_connected": "Nie ma tu wystarczająco wielu linii/obszarów do rozłączenia."
        },
        "merge": {
            "title": "Scal",
            "description": "Scal te linie.",
            "key": "C",
            "annotation": "Scalono {n} linii.",
            "not_eligible": "Te obiekty nie mogą zostać scalone.",
            "not_adjacent": "Tych linii nie da się scalić, gdyż nie są połączone."
        },
        "move": {
            "title": "Przesuń",
            "description": "Przesuń to w inne miejsce.",
            "key": "M",
            "annotation": {
                "point": "Przesunięto punkt.",
                "vertex": "Przesunięto węzeł drogi.",
                "line": "Przesunięto linię.",
                "area": "Przesunięto obszar.",
                "multiple": "Przesunięto wiele obiektów."
            },
            "incomplete_relation": "Tego obiektu nie można przesunąć, gdyż nie jest całkiem pobrany."
        },
        "rotate": {
            "title": "Obróć",
            "description": "Obróć ten obiekt względem jego środka.",
            "key": "R",
            "annotation": {
                "line": "Obrócono linię.",
                "area": "Obrócono obszar."
            }
        },
        "reverse": {
            "title": "Odwróć",
            "description": "Spraw by ta linia biegła w przeciwnym kierunku.",
            "key": "V",
            "annotation": "Odwrócono linię."
        },
        "split": {
            "title": "Rozdziel",
            "description": {
                "line": "Rozdziel linię na dwie w tym punkcie.",
                "area": "Rozdziel granicę tego obszary na pół.",
                "multiple": "Rozdziel linie/granice obszaru na dwie w tym punkcie."
            },
            "key": "X",
            "annotation": {
                "line": "Rozdziel linię.",
                "area": "Rozdziel granicę obszaru.",
                "multiple": "Rozdziel {n} linii/granic obszarów"
            },
            "not_eligible": "Linie nie mogą zostać rozdzielone na ich początku lub końcu.",
            "multiple_ways": "Jest tu zbyt wiele linii do rozdzielenia."
        }
    },
    "nothing_to_undo": "Nie ma nic do cofnięcia.",
    "nothing_to_redo": "Nie ma nic do powtórzenia.",
    "just_edited": "Właśnie wprowadziłeś zmiany w OpenStreetMap!!",
    "browser_notice": "Ten edytor działa w Firefox, Chrome, Safari, Opera, and Internet Explorer 9 i wyższych. Zaktualizuj swoją przeglądarkę lub użyj Potlatch 2 aby edytować mapę.",
    "view_on_osm": "Pokaż w OSM",
    "zoom_in_edit": "zwiększ skalę aby edytować mapę",
    "logout": "wyloguj",
    "loading_auth": "Łączenie z OpenStreetMap...",
    "report_a_bug": "zgłoś błąd",
    "commit": {
        "title": "Zapisz zmiany",
        "description_placeholder": "Krótki opis twoich zmian",
        "message_label": "Opis zmian",
        "upload_explanation": "Zmiany które wyślesz jako {user} będą widoczne na wszystkich mapach używających danych OpenStreetMap.",
        "save": "Zapisz",
        "cancel": "Anuluj",
        "warnings": "Ostrzeżenia",
        "modified": "Zmodyfikowano",
        "deleted": "Usunięto",
        "created": "Utworzono"
    },
    "contributors": {
        "list": "Przeglądanie wkładu użytkowników {users}",
        "truncated_list": "Przeglądanie wkładu użytkownikówy {users} {count} innych"
    },
    "geocoder": {
        "title": "Znajdź miejsce",
        "placeholder": "znajdź miejsce",
        "no_results": "Nie można znaleźć miejsca o nazwie '{name}'"
    },
    "geolocate": {
        "title": "Pokaż moją pozycję."
    },
    "inspector": {
        "no_documentation_combination": "Nie ma dokumentacji dla tej kombinacji tagu.",
        "no_documentation_key": "Nie ma dokumentacji dla tego klucza",
        "show_more": "Pokaż więcej",
        "new_tag": "Nowy tag",
        "view_on_osm": "Zobacz w OSM",
        "editing_feature": "Edytujesz {feature}",
        "additional": "Dodatkowe tagi",
        "choose": "Wybierz rodzaj obiektu",
        "results": "{n} wyników dla {search}",
        "reference": "Zobacz na OpenStreetMap Wiki →",
        "back_tooltip": "Zmień rodzaj cechy"
    },
    "background": {
        "title": "Tło",
        "description": "Ustawienia tła",
        "percent_brightness": "jasność {opacity}%",
        "fix_misalignment": "Wyrównaj podkład",
        "reset": "resetuj"
    },
    "restore": {
        "heading": "Masz niezapisane zmiany",
        "description": "Masz niezapisane zmiany z poprzedniej sesji. Chcesz je przywrócić?",
        "restore": "Przywróć",
        "reset": "Resetuj"
    },
    "save": {
        "title": "Zapisz",
        "help": "Zapisz zmiany na OpenStreetMap, aby były one widoczne dla innych",
        "no_changes": "Brak zmian do zapisania.",
        "error": "Wystąpił błąd podczas próby zapisu.",
        "uploading": "Wysyłanie zmian do OpenStreetMap.",
        "unsaved_changes": "Masz niezapisane zmiany."
    },
    "splash": {
        "welcome": "Witaj w edytorze iD map OpenStreetMap",
        "text": "To jest wersja rozwojowa {version}. Informacji szukaj na {website} i zgłaszaj błędy na {github}.",
        "walkthrough": "Uruchom samouczek",
        "start": "Edytuj teraz"
    },
    "source_switch": {
        "live": "live",
        "lose_changes": "Masz nie zapisane modyfikacje. Zmiana serwera spowoduje ich odrzucenie. Na pewno chcesz zmienić serwer?",
        "dev": "dev"
    },
    "tag_reference": {
        "description": "Opis",
        "on_wiki": "{tag} na wiki.osm.org",
        "used_with": "używany z {type}"
    },
    "validations": {
        "untagged_point": "Nieopisany punkt, który nie jest częścią linii lub obszaru.",
        "untagged_line": "Nieopisana linia.",
        "untagged_area": "Nieopisany obszar.",
        "many_deletions": "You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        "tag_suggests_area": "Tag {tag} sugeruje, że linia powinna być obszarem, ale nim nie jest.",
        "deprecated_tags": "Przestarzałe tagi: {tags}"
    },
    "zoom": {
        "in": "Powiększ",
        "out": "Zmniejsz"
    },
    "gpx": {
        "local_layer": "Lokalny plik GPX",
        "drag_drop": "Przeciągnij i upuść plik .gpx na stronę"
    },
    "help": {
        "title": "Pomoc",
        "help": "# Pomoc\n\nTo jest edytor [OpenStreetMap](http://www.openstreetmap.org/),\nwolnej i edytowalnej mapy świata. Możesz  go używać do dodawania i\nakutalizacji danych w twoim rejonie, czyniąc otwartą mapę świata lepszą\ndla każdego.\n\nModyfikacje wprowadzone na tej mapie będą widoczne dla wszystkich\nużywających OpenStreetMap. Aby wprowadzić modyfikacje, potrzebujesz\n[darmowe konto OpenStreetMap](https://www.openstreetmap.org/user/new).\n\n[Edytor iD](http://ideditor.com/) jest projektem społecznościowym z\n[kodem dostępnym na GitHub](https://github.com/systemed/iD).\n",
        "editing_saving": "# Edycja i zapis\n\nTen edytor został zaprojektowany do pracy w trybie online i już go używasz poprzez stronę\ninternetową.\n\n### Wybieranie obiektów\n\nAby wybrać obiekt na mapie, taki jak na przykład droga, czy jakiś POI, kliknij na niego na mapie.\nSpowodouje to podświetlenie wybranego obiektu, otworzenie panelu zawierającego szczegóły\no nim i wyświetlenie menu z poleceniami, które możesz wykonać na obiekcie.\n\nWiele obiektów może zostać wybranych przez trzymania wciśniętego klawisza 'Shift', klikanie na\ni przeciąganie mapy. Spowoduje to wybór wszystkich obiektów zawartych w narysowanym\nprostokącie, umożliwiając Tobie wykonywanie działań na kilku obiektach naraz.\n\n### Zapisywanie modyfikacji\n\nGdy wprowadzisz zmiany, na przykład przez modyfikacje dróg, budynków i miejsc, są one\nprzechowywane lokalnie aż zapiszesz je na serwerze. Nie martw się, gdy popełnisz błąd - możesz\ncofnąć zmiany przez kliknięcie na przycisk cofnij, i powtórzyć je poprzez kliknięcie na przycisk powtórz.\n\nKliknij 'Zapisz' aby skończyć grupę modyfikacji - na przykład, gdy skończyłeś pewien obszar miasta i\nchcesz zacząć następny. Będziesz miał wtedy szansę przejrzeć, co zrobiłeś, a edytor dostarczy pomocne\nsugestie i ostrzeżenia w razie, gdyby coś było nie tak z twoimi zmianami.\n\nJeśli wszystko dobrze wygląda, możesz podać krótki komentarz opisujący zmianę, którą wprowadziłeś\ni kliknąć 'Zapisz' ponownie, aby wysłać zmiany do [OpenStreetMap.org](http://www.openstreetmap.org/),\ngdzie będą one widoczne dla wszystkich użytkowników i dostępne dla innych do bazowania na nich i\ndalszego ulepszania.\n\nJeżeli nie możesz skończyć swoich modyfikacji w czasie jednej sesji, możesz opuścić okno edytora i\nwrócić później (na tym samym komputerze i tą samą przeglądarką), a edytor zaoferuje Ci przywrócenie\ntwojej pracy.\n",
        "roads": "# Drogi\n\nMożesz tworzyć, poprawiać i usuwać drogi używając tego edytora. Drogi mogą być wszelkiego rodzaju:\nścieżki, ulice, szlaki, ścieżki rowerowe i tak dalej - każdy często uczęszczany odcinek powinien dać się\nprzedstawić\n\n### Zaznaczanie\n\nKliknij na drogę, aby ją zaznaczyć. Obwiednia powinna stać się widoczna, wraz z małym menu\nnarzędziowym na mapie oraz panelem bocznym pokazującym więcej informacji na temat drogi.\n\n### Modyfikowanie\n\nCzęsto będziesz widział drogi, które nie są wyrównane ze zdjęciami satelitarnymi lub śladami GPS.\nMożesz dopasować te drogi tak, aby były we właściwym miejscu.\n\nNajpierw kliknij na drogę, którą chcesz zmienić. Podświetli to ją oraz pokaże punkty kontrolne wdłuż\njej, które możesz przesunąć w lepsze miejsce. Jeżeli chcesz dodać nowe punkty kontrolne, aby droga\nbyła bardziej szczegółowa, dwukrotnie kliknij na części drogi bez punktu, a w tym miejscu nowy się\npojawi.\n\nJeżeli droga łączy się z inną drogą, ale nie jest prawidłowo połączona z nią na mapie, możesz\nprzeciągnąć jeden z puntów kontrolnych na drugą drogę w celu ich połączenia. Prawidłowe połączenia\ndróg są ważne dla mapy i kluczowe dla wyznaczania tras.\n\nMożesz też kliknąć na narzędziu 'Przesuń' lub nacisnąć klawisz `M` aby przesunąć jednocześnie całą\ndrogę, a następnie kliknąć ponownie, aby zachować to przesunięcie.\n\n### Usuwanie\n\nGdy droga jest całkiem błędna - widzisz, że nie istnieje na zdjęciach satelitarnych (a najlepiej sam\nsprawdziłeś w terenie, że jej nie ma) - możesz usunąć ją. Uważaj usuwając obiekty - wyniki usunięcia,\ntak jak każdej modyfikacji, są widoczne dla wszystkich, a zdjęcie satelitarne często nie są aktualne,\nwięc droga może być po prostu nowo wybudowana.\n\nMożesz usunąć drogę przez zaznaczenie jej, a następnie kliknięcie na ikonę kosza lub wciśnięcie\nklawisza 'Delete'.\n\n### Tworzenie\n\nGdzieś tam powinna być droga, ale jej nie ma? Kliknij na przycisk 'Linia' w górnym lewym rogu edytora\nlub naciśnij klawisz `2` na klawiaturze, aby zacząć rysować linię.\n\nKliknij na początku drogi na mapie, aby zacząć rysować. Jeżeli droga odchodzi od już istniejącej, zacznij\nprzez kliknięcie w miejscu, w któreym się łączą.\n\nNastępnie klikaj na punktach wzdłuż drogi tak, aby biegła ona odpowiednio według zdjęć satelitarnych\nlub GPS. Jeżeli droga, którą rysujesz krzyżuje się z inną, połącz je klikając na punkcie przecięcia. Gdy\nskończysz rysować, dwukrotnie kliknij na ostatnim punkcie, lub naciśnij klawisz 'Enter' na klawiaturze.\n",
        "gps": "# GPS\n\nDane GPS są najbardziej zaufanym źródłem dla OpenStreetMap. Ten edytor obsługuje lokalne ślady -\npliki `.gpx` na twoim komputerze. Możesz zbierać tego rodzaju ślady GPS używając aplikacji na\nsmartfony lub sprzętu GPS.\n\nInformacje jak używać GPS do zbierania informacji o okolicy możesz znaleźć pod\n[Zbieranie informacji z GPS](http://learnosm.org/en/beginner/using-gps/).\n\nAby użyć śladu GPX do rysowania mapy, przeciągnij i upuść plik GPX na edytor. Jeżeli zostanie\nrozpoznany, zostanie dodany na mapę w postaci jasnozielonej linii. Kliknij na menu 'Ustawienia tła'\npo lewej stronie aby włączyć, wyłączyć lub powiększyć do nowej warstwy GPX.\n\nŚlad GPX nie jest bezpośrednio wysyłany do OpenStreetMap - najlepiej użyć go do rysowania mapy,\nużywając go jako wzoru dla nowych obiektów, które dodasz.\n\n",
        "imagery": "# Zdjęcia\n\nZdjęcia lotnicze/satelitarne są ważnym zasobem w rysowaniu map. Kolekcja zdjęć lotniczych,\nsatelitarnych i innych wolnodostępnych źródeł jest dostępna w edytorze w menu 'Ustawienia tła' po\nlewej stronie.\n\nDomyślnie wyświetlana jest warstwa zdjęć satelitarnych z [Bing Maps](http://www.bing.com/maps/),\nale w miarę przybliżania i pojawiają się nowe źródła. Niektóre kraje, takie jak Stany Zjednoczone, Francja\nczy Dania mają w pewnych miejscach dostępne zdjęcia bardzo wysokiej jakości.\n\nZdjęca są czasem przesunięte względem danych na mapie z powodu błędu dostawcy zdjęć. Jeżeli\nwidzisz dużo dróg przesuniętych względem tła, zastanów się zanim jest wszystkie wyrównasz względem\ntła. Zamiast tego może dostosować przesunięcie zdjęć tak, aby zgadzały się z istniejącymi danymi przez\nnaciśnięcie przycisku 'Wyrównaj podkład' na dole Ustawień tła.\n",
        "addresses": "# Adresy\n\nAdresy są jedną z najbardziej użytecznych informacji na mapie.\n\nMimo, że adresy są często reprezentowane jako części ulic, w OpenStreetMap są one zapisywane jako\natrybuty budynków i miejsc wzdłuż ulicy.\n\nMożesz dodać nową informację adresową do miejsc narysowanych w postaci obwiedni budynków jak\nrównież do tych narysowanych w postaci pojedynczych punkt. Najlepszym źródłem danych adresowych\njest jak zwykle zwiedzanie okolicy  lub własna wiedza - tak jak z każdym innym obiektem, kopiowanie\ndanych z komercyjnych źródeł takich jak Google Maps jest zabronione.\n",
        "inspector": "# Używanie Inspektora\n\nInspektor jest elementem interfejsu po prawej stronie strony, który pojawia się po zaznaczeniu obiektu\ni który pozwala tobie modyfikować jego szczegóły.\n\n### Zaznaczanie typu obiektu\n\nPo dodaniu punktu, linii lub obszaru, możesz wybrać jakiego rodzaju to jest obiekt, na przykład czy jest\nto autostrada czy droga lokalna, kawiarnia czy supermarket. Inspektor wyświetli przyciski dla\npopularnych typów obiektów, a ty możesz znaleźć inne przez wpisanie tego, czego szukasz do pola\nszukania.\n\nKliknij na 'i' w prawym dolnym rogu przycisku typu obiektu, aby dowiedzieć się o nim więcej.\nKliknij na przycisku, aby wybrać ten typ.\n\n### Używanie Formularzy i Edycja tagów\n\nPo wybraniu typu obiektu lub gdy wybierzesz obiekt, który ma już nadany typ, inspektor wyświetli pola\nzawierające szczegóły na temat obiektu, takie jak nazwa i adres.\n\nPoniżej pól, które widzisz, możesz kliknąć na ikony w celu dodania innych szczegółów, jak na przykład\ninformacja z [Wikipedii](http://www.wikipedia.org/), dostęp dla wózków inwalidzkich i innych.\n\nNa dole inspektora kliknij na 'Dodatkowe tagi', aby dodać dowolne inne tagi do elementu.\n[Taginfo](http://taginfo.openstreetmap.org/) jest świetnym źródłem informacji o popularnych\nkombinacjach tagów.\n\nZmiany, które wprowadzisz w inspektorze są automatycznie nanoszone na mapę. Możesz je cofnąć w\nkażdym momencie przez wciśnięcie przycisku 'Cofnij'.\n\n### Zamykanie Inspektora\n\nMożesz zamknąć inspektora przez kliknięcie na przycisk zamknij w górnym prawym rogu, wciśnięcie\nklawisza 'Escape' lub kliknięcie na mapie.\n",
        "buildings": "# Budynki\n\nOpenStreetMap jest największą na świecie bazą danych budynków. Możesz tworzyć i poprawiać tą\nbazę danych\n\n### Zaznaczanie\n\nMożesz zaznaczyć budynek przez kliknięcie na jego obwódce. Podświetli to budynek i otworzy małe\nmenu narzędziowe oraz boczny panel pokazujący więcej informacji o budynku.\n\n### Modyfikowanie\n\nCzasami budynki są błędnie umieszczone lub mają błędne tagi.\n\nAby przesunąć cały budynek, zaznacz go, a potem kliknij na narzędzie 'Przesuń'. Rusz myszą, aby\nprzesunąć budynek i kliknij, gdy będzie we właściwym miejscu.\n\nAby poprawić kształt budynku, kliknij i przeciągnij punkty formujące obwódkę w lepsze miejsce.\n\n### Tworzenie\n\nJednym z głównych problemów podczas tworzenia budynków jest to, że OpenStreetMap  przechowuje\nbudynki zarówno w postaci punktów i obszarów. Przyjęło się rysowanie budynków w postaci obszarów,\na rysowanie firm, domów czy innej infrastruktury w postaci punktów w obszarze budynku.\n\nZacznij rysować budynek w postaci obszaru przez kliknięcie na przycisku 'Obszar' w górnym lewym\nrogu edytora i zakończ go przez naciśnięcie klawisza 'Enter' na klawiaturze lub przez kliknięcie na\npierwszym rysowanym punkcie w celu zamknięcia obszaru.\n\n### Usuwanie\n\nJeżeli budynek jest całkiem błędny - widzisz, że nie ma go na zdjęciach satelitarnych (a najlepiej\nsprawdziłeś w terenie, że go nie ma) - możesz go usunąć. Bądź ostrożny usuwając obiekty - tak jak po\nkażdej innej modyfikacji, rezultaty są widoczne dla wszystkich, a zdjęcia satelitarne często nie są\naktualne, więc budynek może być po prostu nowo wybudowany.\n\nMożesz usunąć budynek przez kliknięcie na nim, a następnie na ikonie śmietnika lub wciśnięcie\nklawisza 'Delete'.\n"
    },
    "intro": {
        "navigation": {
            "drag": "Główny obszar mapy pokazuje dane OpenStreetMap na tle podkładu. Możesz poruszać się po niej przeciągając i przewijając, tak jak po każdej mapie internetowej. **Przeciągnij mapę!**",
            "select": "Obiekty na mapie są reprezentowane na trzy sposoby: używają punktów, linii i obszarów. Wszystkie obiekty mogą zostać zaznaczone przez kliknięcie na nich. **Kliknij na punkcie, żeby go zaznaczyć.**",
            "header": "Nagłówek pokazuje nam rodzaj obiektu",
            "pane": "Gdy wybierze się obiekt, zostaje wyświetlony edytor obiektów. Nagłówek pokazuje nam typ obiektu, a główna część pokazuje atrybuty obiektu takie jak nazwa czy adres. **Zamknij edytor obiektów używając przycisku zamknij w prawym górnym rogu.**"
        },
        "points": {
            "add": "Punkty mogą być używane do reprezentowania obiektów takich jak sklepy, restauracje czy pomniki.\nZaznaczają one konkretną lokalizację i opisują co się tam znajduje. **Kliknij na przycisk Punkt aby dodać nowy punkt.**",
            "place": "Punkty może zostać umieszczony przez kliknięcie na mapę. **Umieść punkt na budynku.**",
            "search": "Wiele różnych obiektów może być reprezentowanych przez punkty. Punkt, który właśnie dodałeś jest kawiarnią. **Szukaj 'kawiarnia' **",
            "choose": "**Wybierz kawiarnię z siatki.**",
            "describe": "Punkt jest teraz oznaczony jako kawiarnia. Używając edytora obiektów, możemy dodać więcej informacji o obiekcie, **Dodaj nazwę**",
            "close": "Edytor obiektów może zostać zamknięty przez kliknięcie na przycisk zamknij. **Zamknij edytor obiektów**",
            "reselect": "Często punkty już istnieją, ale zawierają błędy lub są niekompletne. Możemy modyfikować istniejące punkty. **Wybierz punkt, który właśnie utworzyłeś.**",
            "fixname": "**Zmień nazwę i zamknij edytor obiektów.**",
            "reselect_delete": "Wszystkie obiekty na mapie mogą zostać usunięte. **Kliknij na punkt, który utworzyłeś.**",
            "delete": "Menu wokół punktu zawiera operacje, które można na nim wykonać, włącznie z usunięciem go. **Usuń punkt.**"
        },
        "areas": {
            "add": "Obszary pozwalają na bardziej szczegółowe przedstawienie obiektu. Dostarczają one informacji o granicach boektu. Obszary mogą być używane do przedstawienia większości obiektów, które mogą być przedstawione w postaci punktów i często są one preferowane. **Kliknij na przycisk Obszar aby dodać nowy obszar.**",
            "corner": "Obszary są rysowane przez stawianie węzłów oznaczających granicę obszaru. **Umieść węzeł początkowy w jednym z rogów placu zabaw.**",
            "place": "Rysuj obszar przez umieszczanie kolejny węzłów. Zakończ obszar klikając na punkt początkowy. **Narysuj obszar placu zabaw.**",
            "search": "**Szukaj placu zabaw.**",
            "choose": "**Wybierz Plac zabaw z siatki.**",
            "describe": "**Dodaj nazwę i zamknij edytor obietków**"
        },
        "lines": {
            "add": "Linie są używane do reprezentowania obiektów takich jak drogi, tory czy rzeki. **Naciśnij na przycisk Linia aby dodać nową linię.**",
            "start": "**Zacznij linię klikając na koniec drogi.**",
            "intersect": "Kliknij aby dodać więcej punktów do linii. Możesz w razie potrzeby przeciągać mapę podczas rysowania. Drogi i wiele innych typów linii są częścią większej sieci. Ważne jest prawidłowe połączenie tych linii,\nby programy do wyznaczania tras poprawnie działały. **Kliknij na Flower Street, aby dodać skrzyżowanie łączące dwie linie.**",
            "finish": "Linie możesz zakończyć przez ponowne kliknięcie na ostatni punkt. **Skończ rysować drogę.**",
            "road": "**Wybierz drogę z siatki.**",
            "residential": "Jest wiele rodzajów dróg, z których najpopularniejsze są drogi lokalne. **Wybierz typ drogi Lokalna**",
            "describe": "**Nazwij drogę i zamknij edytor obiektów.**",
            "restart": "Droga musi się skrzyżować z Flower Street."
        },
        "startediting": {
            "help": "Więcej dokumentacji oraz ten samouczek są dostępne tutaj.",
            "save": "Nie zapomnij o regularnym zapisywaniu swoich zmian!",
            "start": "Zacznij mapować!"
        }
    },
    "presets": {
        "fields": {
            "access": {
                "label": "Dostęp"
            },
            "address": {
                "label": "Adres",
                "placeholders": {
                    "housename": "Nazwa budynku",
                    "number": "123",
                    "street": "Ulica",
                    "city": "Miasto"
                }
            },
            "aeroway": {
                "label": "Typ"
            },
            "amenity": {
                "label": "Typ"
            },
            "atm": {
                "label": "Bankomat"
            },
            "barrier": {
                "label": "Typ"
            },
            "bicycle_parking": {
                "label": "Typ"
            },
            "building": {
                "label": "Budynek"
            },
            "building_area": {
                "label": "Budynek"
            },
            "building_yes": {
                "label": "Budynek"
            },
            "capacity": {
                "label": "Pojemność"
            },
            "collection_times": {
                "label": "Czas zbierania"
            },
            "construction": {
                "label": "Typ"
            },
            "country": {
                "label": "Kraj"
            },
            "crossing": {
                "label": "Typ"
            },
            "cuisine": {
                "label": "Kuchnia"
            },
            "denomination": {
                "label": "Wyznanie"
            },
            "denotation": {
                "label": "Znaczenie"
            },
            "elevation": {
                "label": "Wysokość"
            },
            "emergency": {
                "label": "Pogotowie"
            },
            "entrance": {
                "label": "Typ"
            },
            "fax": {
                "label": "Faks"
            },
            "fee": {
                "label": "Opłata"
            },
            "highway": {
                "label": "Typ"
            },
            "historic": {
                "label": "Typ"
            },
            "internet_access": {
                "label": "Dostęp do internetu",
                "options": {
                    "wlan": "Bezprzewodowy",
                    "wired": "Przewodowy",
                    "terminal": "Terminal"
                }
            },
            "landuse": {
                "label": "Typ"
            },
            "layer": {
                "label": "Warstwa"
            },
            "leisure": {
                "label": "Typ"
            },
            "levels": {
                "label": "Poziomy"
            },
            "man_made": {
                "label": "Typ"
            },
            "maxspeed": {
                "label": "Ograniczenie prędkości"
            },
            "name": {
                "label": "Nazwa"
            },
            "natural": {
                "label": "Natura"
            },
            "network": {
                "label": "Sieć"
            },
            "note": {
                "label": "Notatka"
            },
            "office": {
                "label": "Typ"
            },
            "oneway": {
                "label": "Jednokierunkowa"
            },
            "oneway_yes": {
                "label": "Jednokierunkowa"
            },
            "opening_hours": {
                "label": "Godziny"
            },
            "operator": {
                "label": "Operator"
            },
            "phone": {
                "label": "Telefon"
            },
            "place": {
                "label": "Typ"
            },
            "power": {
                "label": "Typ"
            },
            "railway": {
                "label": "Typ"
            },
            "ref": {
                "label": "Identyfikacja"
            },
            "religion": {
                "label": "Religia",
                "options": {
                    "christian": "Chrześcijaństwo",
                    "muslim": "Islam",
                    "buddhist": "Buddyzm",
                    "jewish": "Judaizm",
                    "hindu": "Hinduizm",
                    "shinto": "Szintoizm",
                    "taoist": "Taoizm"
                }
            },
            "service": {
                "label": "Typ"
            },
            "shelter": {
                "label": "Schronienie"
            },
            "shop": {
                "label": "Typ"
            },
            "source": {
                "label": "Źródło"
            },
            "sport": {
                "label": "Sport"
            },
            "structure": {
                "label": "Struktura",
                "options": {
                    "bridge": "Most",
                    "tunnel": "Tunel",
                    "embankment": "Nasyp",
                    "cutting": "Szlak wcinający się w okolicę"
                }
            },
            "surface": {
                "label": "Nawierzchnia"
            },
            "tourism": {
                "label": "Typ"
            },
            "water": {
                "label": "Typ"
            },
            "waterway": {
                "label": "Typ"
            },
            "website": {
                "label": "Strona WWW"
            },
            "wetland": {
                "label": "Typ"
            },
            "wheelchair": {
                "label": "Dostęp dla wózków inwalidzkich"
            },
            "wikipedia": {
                "label": "Wikipedia"
            },
            "wood": {
                "label": "Typ"
            }
        },
        "presets": {
            "aeroway": {
                "name": "Szlak powietrzny"
            },
            "aeroway/aerodrome": {
                "name": "Lotnisko"
            },
            "aeroway/helipad": {
                "name": "Lądowisko dla helikopterów"
            },
            "amenity": {
                "name": "Udogodnienie"
            },
            "amenity/bank": {
                "name": "Bank"
            },
            "amenity/bar": {
                "name": "Bar"
            },
            "amenity/bench": {
                "name": "Ławka"
            },
            "amenity/bicycle_parking": {
                "name": "Parking dla rowerów"
            },
            "amenity/bicycle_rental": {
                "name": "Wypożyczalnia rowerów"
            },
            "amenity/cafe": {
                "name": "Kawiarnia"
            },
            "amenity/cinema": {
                "name": "Kino"
            },
            "amenity/courthouse": {
                "name": "Sąd"
            },
            "amenity/embassy": {
                "name": "Ambasada"
            },
            "amenity/fast_food": {
                "name": "Fast food"
            },
            "amenity/fire_station": {
                "name": "Straż pożarna"
            },
            "amenity/fuel": {
                "name": "Stacja benzynowa"
            },
            "amenity/grave_yard": {
                "name": "Cmentarz"
            },
            "amenity/hospital": {
                "name": "Szpital"
            },
            "amenity/library": {
                "name": "Biblioteka"
            },
            "amenity/marketplace": {
                "name": "Targowisko"
            },
            "amenity/parking": {
                "name": "Parking"
            },
            "amenity/pharmacy": {
                "name": "Apteka"
            },
            "amenity/place_of_worship": {
                "name": "Miejsce kultu religijnego"
            },
            "amenity/place_of_worship/christian": {
                "name": "Kościół"
            },
            "amenity/place_of_worship/jewish": {
                "name": "Synagoga",
                "terms": "Synagoga"
            },
            "amenity/place_of_worship/muslim": {
                "name": "Meczet",
                "terms": "Meczet"
            },
            "amenity/police": {
                "name": "Policja"
            },
            "amenity/post_box": {
                "name": "Skrzynka pocztowa",
                "terms": "Skrzykna pocztowa"
            },
            "amenity/post_office": {
                "name": "Poczta"
            },
            "amenity/pub": {
                "name": "Pub"
            },
            "amenity/restaurant": {
                "name": "Restauracja"
            },
            "amenity/school": {
                "name": "Szkoła",
                "terms": "Uczelnia"
            },
            "amenity/swimming_pool": {
                "name": "Basen"
            },
            "amenity/telephone": {
                "name": "Telefon"
            },
            "amenity/theatre": {
                "name": "Teatr",
                "terms": "teatr,sztuka,musical"
            },
            "amenity/toilets": {
                "name": "Toalety"
            },
            "amenity/townhall": {
                "name": "Ratusz"
            },
            "amenity/university": {
                "name": "Uniwersytet"
            },
            "barrier": {
                "name": "Bariera"
            },
            "barrier/block": {
                "name": "Blok"
            },
            "barrier/bollard": {
                "name": "Słupek"
            },
            "barrier/city_wall": {
                "name": "Mur miejski"
            },
            "barrier/ditch": {
                "name": "Rów"
            },
            "barrier/entrance": {
                "name": "Wejście"
            },
            "barrier/fence": {
                "name": "Płot"
            },
            "barrier/gate": {
                "name": "Brama"
            },
            "barrier/hedge": {
                "name": "Żywopłot"
            },
            "barrier/stile": {
                "name": "Przełaz"
            },
            "barrier/wall": {
                "name": "Mur"
            },
            "building": {
                "name": "Budynek"
            },
            "building/apartments": {
                "name": "Apartamenty"
            },
            "building/entrance": {
                "name": "Wejście"
            },
            "entrance": {
                "name": "Wejście"
            },
            "highway": {
                "name": "Droga"
            },
            "highway/bus_stop": {
                "name": "Przystanek autobusowy"
            },
            "highway/crossing": {
                "name": "Przejście dla pieszych",
                "terms": "Przejście dla pieszych"
            },
            "highway/cycleway": {
                "name": "Ścieżka rowerowa"
            },
            "highway/footway": {
                "name": "Ścieżka dla pieszych"
            },
            "highway/motorway": {
                "name": "Autostrada"
            },
            "highway/path": {
                "name": "Ścieżka"
            },
            "highway/primary": {
                "name": "Droga krajowa"
            },
            "highway/residential": {
                "name": "Droga lokalna"
            },
            "highway/road": {
                "name": "Nieznana droga"
            },
            "highway/secondary": {
                "name": "Droga wojewódzka"
            },
            "highway/service": {
                "name": "Droga serwisowa"
            },
            "highway/steps": {
                "name": "Schody",
                "terms": "Schody, klatka schodowa"
            },
            "highway/tertiary": {
                "name": "Droga powiatowa"
            },
            "highway/track": {
                "name": "Droga gruntowa"
            },
            "highway/traffic_signals": {
                "name": "Sygnalizacja świetlna"
            },
            "highway/trunk": {
                "name": "Droga ekspresowa"
            },
            "highway/turning_circle": {
                "name": "Miejsce do zawracania"
            },
            "highway/unclassified": {
                "name": "Droga niesklasyfikowana"
            },
            "historic": {
                "name": "Miejsce historyczne"
            },
            "historic/castle": {
                "name": "Zamek"
            },
            "historic/monument": {
                "name": "Pomnik"
            },
            "historic/ruins": {
                "name": "Ruiny"
            },
            "landuse": {
                "name": "Użytkowanie gruntów"
            },
            "landuse/allotments": {
                "name": "Działki"
            },
            "landuse/basin": {
                "name": "Zbiornik wodny"
            },
            "landuse/cemetery": {
                "name": "Cmentarz"
            },
            "landuse/commercial": {
                "name": "Biura i usługi"
            },
            "landuse/construction": {
                "name": "Budowa"
            },
            "landuse/farm": {
                "name": "Teren rolny"
            },
            "landuse/farmyard": {
                "name": "Podwórze gospodarskie"
            },
            "landuse/forest": {
                "name": "Las"
            },
            "landuse/grass": {
                "name": "Trawa"
            },
            "landuse/industrial": {
                "name": "Obszar przemysłowy"
            },
            "landuse/meadow": {
                "name": "Łąka"
            },
            "landuse/orchard": {
                "name": "Sad"
            },
            "landuse/quarry": {
                "name": "Kamieniołom"
            },
            "landuse/residential": {
                "name": "Zabudowa mieszkaniowa"
            },
            "landuse/vineyard": {
                "name": "Winnica"
            },
            "leisure": {
                "name": "Rozrywka i wypoczynek"
            },
            "leisure/garden": {
                "name": "Ogród"
            },
            "leisure/golf_course": {
                "name": "Pole golfowe"
            },
            "leisure/park": {
                "name": "Park"
            },
            "leisure/pitch": {
                "name": "Boisko"
            },
            "leisure/pitch/american_football": {
                "name": "Boisko do futbolu amerykańskiego"
            },
            "leisure/pitch/baseball": {
                "name": "Boisko do baseballu"
            },
            "leisure/pitch/basketball": {
                "name": "Boisko do koszykówki"
            },
            "leisure/pitch/soccer": {
                "name": "Boisko do piłki nożnej"
            },
            "leisure/pitch/tennis": {
                "name": "Kort tenisowy"
            },
            "leisure/playground": {
                "name": "Plac zabaw"
            },
            "leisure/stadium": {
                "name": "Stadion"
            },
            "leisure/swimming_pool": {
                "name": "Basen"
            },
            "man_made": {
                "name": "Obiekty sztuczne"
            },
            "man_made/lighthouse": {
                "name": "Latarnia morska"
            },
            "man_made/pier": {
                "name": "Molo"
            },
            "man_made/survey_point": {
                "name": "Punkt geodezyjny"
            },
            "man_made/water_tower": {
                "name": "Wieża ciśnień"
            },
            "natural": {
                "name": "Natura"
            },
            "natural/bay": {
                "name": "Zatoka"
            },
            "natural/beach": {
                "name": "Plaża"
            },
            "natural/cliff": {
                "name": "Klif"
            },
            "natural/coastline": {
                "name": "Wybrzeże",
                "terms": "Brzeg"
            },
            "natural/glacier": {
                "name": "Lodowiec"
            },
            "natural/grassland": {
                "name": "Łąka"
            },
            "natural/heath": {
                "name": "Wrzosowisko"
            },
            "natural/peak": {
                "name": "Szczyt"
            },
            "natural/scrub": {
                "name": "Zarośla"
            },
            "natural/spring": {
                "name": "Strumień"
            },
            "natural/tree": {
                "name": "Drzewo"
            },
            "natural/water": {
                "name": "Woda"
            },
            "natural/water/lake": {
                "name": "Jezioro"
            },
            "natural/water/pond": {
                "name": "Staw"
            },
            "natural/water/reservoir": {
                "name": "Rezerwuar"
            },
            "natural/wetland": {
                "name": "Bagno"
            },
            "natural/wood": {
                "name": "Drewno"
            },
            "office": {
                "name": "Biuro"
            },
            "other": {
                "name": "Inne"
            },
            "other_area": {
                "name": "Inne"
            },
            "place": {
                "name": "Miejsce"
            },
            "place/hamlet": {
                "name": "Wioska"
            },
            "place/island": {
                "name": "Wyspa"
            },
            "place/locality": {
                "name": "Miejsce"
            },
            "place/village": {
                "name": "Wioska"
            },
            "power/generator": {
                "name": "Elektrownia"
            },
            "power/sub_station": {
                "name": "Podstacja"
            },
            "power/transformer": {
                "name": "Transformator"
            },
            "railway": {
                "name": "Koej"
            },
            "railway/abandoned": {
                "name": "Nieużywany tor"
            },
            "railway/level_crossing": {
                "name": "Rogatka"
            },
            "railway/rail": {
                "name": "Tor"
            },
            "railway/subway": {
                "name": "Metro"
            },
            "railway/subway_entrance": {
                "name": "Wejście do metra"
            },
            "railway/tram": {
                "name": "Tramwaj"
            },
            "shop": {
                "name": "Sklep"
            },
            "shop/alcohol": {
                "name": "Sklep monopolowy"
            },
            "shop/bakery": {
                "name": "Piekarnia"
            },
            "shop/books": {
                "name": "Księgarnia"
            },
            "shop/boutique": {
                "name": "Butik"
            },
            "shop/butcher": {
                "name": "Rzeźnik"
            },
            "shop/computer": {
                "name": "Sklep komputerowy"
            },
            "shop/confectionery": {
                "name": "Konfekcja"
            },
            "shop/electronics": {
                "name": "Sklep elektroniczny"
            },
            "shop/fishmonger": {
                "name": "Sklep rybny"
            },
            "shop/florist": {
                "name": "Kwiaciarnia"
            },
            "shop/furniture": {
                "name": "Sklep meblowy"
            },
            "shop/greengrocer": {
                "name": "Warzywniak"
            },
            "shop/hairdresser": {
                "name": "Fryzjer"
            },
            "shop/jewelry": {
                "name": "Jubiler"
            },
            "shop/kiosk": {
                "name": "Kiosk"
            },
            "shop/laundry": {
                "name": "Pralnia"
            },
            "shop/mall": {
                "name": "Centrum handlowe"
            },
            "shop/music": {
                "name": "Sklep muzyczny"
            },
            "shop/newsagent": {
                "name": "Kiosk"
            },
            "shop/optician": {
                "name": "Optyk"
            },
            "shop/pet": {
                "name": "Sklep zoologiczny"
            },
            "shop/shoes": {
                "name": "Sklep obuwniczy"
            },
            "shop/supermarket": {
                "name": "Supermarket"
            },
            "shop/toys": {
                "name": "Sklep z zabawkami"
            },
            "shop/travel_agency": {
                "name": "Biuro podróży"
            },
            "shop/tyres": {
                "name": "Sklep z oponami"
            },
            "tourism": {
                "name": "Turystyka"
            },
            "tourism/alpine_hut": {
                "name": "Chata górska"
            },
            "tourism/artwork": {
                "name": "Sztuka"
            },
            "tourism/attraction": {
                "name": "Atrakcja turystyczna"
            },
            "tourism/camp_site": {
                "name": "Kamping"
            },
            "tourism/caravan_site": {
                "name": "Parka karawaningowy"
            },
            "tourism/chalet": {
                "name": "Drewniana chata"
            },
            "tourism/guest_house": {
                "name": "Domek gościnny"
            },
            "tourism/hostel": {
                "name": "Schronisko"
            },
            "tourism/hotel": {
                "name": "Hotel"
            },
            "tourism/information": {
                "name": "Informacja"
            },
            "tourism/motel": {
                "name": "Motel"
            },
            "tourism/museum": {
                "name": "Muzeum"
            },
            "tourism/picnic_site": {
                "name": "Miejsce na piknik"
            },
            "tourism/theme_park": {
                "name": "Wesołe miasteczko"
            },
            "tourism/viewpoint": {
                "name": "Punkt widokowy"
            },
            "tourism/zoo": {
                "name": "Zoo"
            },
            "waterway": {
                "name": "Szlak wodny"
            },
            "waterway/canal": {
                "name": "Kanał"
            },
            "waterway/dam": {
                "name": "Tama"
            },
            "waterway/ditch": {
                "name": "Rów"
            },
            "waterway/drain": {
                "name": "Odpływ"
            },
            "waterway/river": {
                "name": "Rzeka"
            },
            "waterway/riverbank": {
                "name": "Brzeg rzeki"
            },
            "waterway/stream": {
                "name": "Strumień"
            },
            "waterway/weir": {
                "name": "Jaz"
            }
        }
    }
};
locale.pt = {
    "modes": {
        "add_area": {
            "title": "Área",
            "description": "Adicione parques, edifícios, lagos, ou outras áreas ao mapa.",
            "tail": "Clique no mapa para começar a desenhar uma área, como um parque, lago ou edifício."
        },
        "add_line": {
            "title": "Linha",
            "description": "Linhas podem ser auto-estradas, ruas, caminhos pedestres e inclusive canais.",
            "tail": "Clique no mapa para começar a desenhar uma estrada, caminho ou rota."
        },
        "add_point": {
            "title": "Ponto",
            "description": "Restaurantes, monumentos e caixas postais podem ser pontos.",
            "tail": "Clique no mapa para adicionar um ponto."
        },
        "browse": {
            "title": "Navegar",
            "description": "Faça zoom e mova o mapa"
        },
        "draw_area": {
            "tail": "Clique para adicionar pontos à sua área. Carregue no primeiro ponto para terminar a área."
        },
        "draw_line": {
            "tail": "Clique para adicionar mais pontos à linha. Clique em outras linhas para ligar, e duplo-clique para terminar a linha."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Adicione um Ponto.",
                "vertex": "Adicione um vértice a um caminho"
            }
        },
        "start": {
            "annotation": {
                "line": "Linha iniciada.",
                "area": "Área iniciada."
            }
        },
        "continue": {
            "annotation": {
                "line": "Linha continuada.",
                "area": "Área continuada."
            }
        },
        "cancel_draw": {
            "annotation": "Desenho cancelado."
        },
        "change_tags": {
            "annotation": "Tags alteradas."
        },
        "circularize": {
            "title": "Circularizar",
            "key": "O",
            "annotation": {
                "line": "Fazer uma linha circular.",
                "area": "Fazer uma área circular."
            }
        },
        "orthogonalize": {
            "title": "Esquadrar",
            "description": "Esquadrar estes cantos.",
            "key": "E",
            "annotation": {
                "line": "Cantos da linha esquadrados.",
                "area": "Cantos da área esquadrados."
            }
        },
        "delete": {
            "title": "Remover",
            "description": "Remover isto do mapa.",
            "annotation": {
                "point": "Ponto eliminado.",
                "vertex": "Vértice elimnado de la ruta.",
                "line": "Linha eliminada.",
                "area": "Área eliminada.",
                "relation": "Relacão eliminada.",
                "multiple": "{n} objetos eliminados."
            }
        },
        "connect": {
            "annotation": {
                "point": "Rota ligada a um ponto.",
                "vertex": "Rota ligada a outra.",
                "line": "Rota ligada a uma linha.",
                "area": "Rota ligada a uma área."
            }
        },
        "disconnect": {
            "title": "Desligar",
            "description": "Desligar rotas umas das outras.",
            "key": "D",
            "annotation": "Rotas desligadas."
        },
        "merge": {
            "title": "Combinar",
            "description": "Combinar linhas.",
            "key": "C",
            "annotation": "{n} linhas combinadas."
        },
        "move": {
            "title": "Mover",
            "description": "Mover para outra localização.",
            "key": "M",
            "annotation": {
                "point": "Ponto movido,",
                "vertex": "Vértice movido.",
                "line": "Linha movida.",
                "area": "Área movida,",
                "multiple": "Múltiplos objectos movidos."
            }
        },
        "rotate": {
            "title": "Rodar",
            "description": "Rodar este objecto sobre o seu ponto central.",
            "key": "R",
            "annotation": {
                "line": "Linha rodada.",
                "area": "Área rodade."
            }
        },
        "reverse": {
            "title": "Inverter",
            "description": "Inverter direcção da linha.",
            "key": "I",
            "annotation": "Direcção da linha revertida."
        },
        "split": {
            "title": "Dividir",
            "key": "D"
        }
    },
    "nothing_to_undo": "Nada a desfazer.",
    "nothing_to_redo": "Nada a refazer.",
    "just_edited": "Acaba de editar o OpenStreetMap!",
    "browser_notice": "Este editor suporta Firefox, Chrome, Safari, Opera e Internet Explorer 9 ou superior. Por favor actualize o seu browser ou utilize Potlatch 2 para editar o mapa.",
    "view_on_osm": "Ver em OSM",
    "zoom_in_edit": "Aproxime-se para editar o mapa",
    "logout": "Encerrar sessão",
    "report_a_bug": "Reportar un erro",
    "commit": {
        "title": "Guardar Alterações",
        "description_placeholder": "Breve descrição das suas contribuições",
        "upload_explanation": "As alterações que envia como {user} serão visíveis em todos os mapas que utilizem dados do OpenStreetMap.",
        "save": "Guardar",
        "cancel": "Cancelar",
        "warnings": "Avisos",
        "modified": "Modificado",
        "deleted": "Removido",
        "created": "Criado"
    },
    "contributors": {
        "list": "A ver contribuições de {users}",
        "truncated_list": "A ver contribuições de {users} e mais {count} outros"
    },
    "geocoder": {
        "title": "Encontrar Um Local",
        "placeholder": "encontrar um local",
        "no_results": "Não foi possível encontrar o local chamado '{name}'"
    },
    "geolocate": {
        "title": "Mostrar a minha localização"
    },
    "inspector": {
        "no_documentation_combination": "Não há documentação disponível para esta combinação de tags",
        "no_documentation_key": "Não há documentação disponível para esta tecla",
        "show_more": "Mostrar Mais",
        "new_tag": "Nova tag",
        "view_on_osm": "Ver em OSM",
        "editing_feature": "Editando {feature}",
        "additional": "Tags adicionais",
        "choose": "O que está a adicionar?",
        "results": "{n} resultados para {search}",
        "reference": "Ver na Wiki do OpenStreetMap"
    },
    "background": {
        "title": "Fundo",
        "description": "Configuração de fundo",
        "percent_brightness": "{opacity}% brilho",
        "fix_misalignment": "Arranjar desalinhamento",
        "reset": "reiniciar"
    },
    "restore": {
        "heading": "Tem alterações por guardar",
        "description": "Tem alterações por guardar de uma prévia sessão de edição. Deseja restaurar estas alterações?",
        "restore": "Restaurar",
        "reset": "Descartar"
    },
    "save": {
        "title": "Guardar",
        "help": "Guardar alterações no OpenStreetMap, tornando-as visíveis a outros utilizadores.",
        "no_changes": "Não há alterações para guardar.",
        "error": "Um erro ocorreu ao tentar guardar",
        "uploading": "Enviando alterações para OpenStreetMap.",
        "unsaved_changes": "Tem alterações por guardar"
    },
    "splash": {
        "welcome": "Bemvindo ao editor OpenStreetMap iD",
        "text": "Esta é a versão de desenvolvimento {version}. Para mais informação visite {website} e reporte erros em {github}."
    },
    "source_switch": {
        "live": "ao vivo",
        "lose_changes": "Tem alterações por guardar. Mudando o servidor de mapas irá perdê-las. Tem a certeza que deseja mudar de servidores?",
        "dev": "dev"
    },
    "tag_reference": {
        "description": "Descrição",
        "on_wiki": "{tag} em wiki.osm.org",
        "used_with": "usado com {type}"
    },
    "validations": {
        "untagged_point": "Punto sin etiquetar que no es parte de una línea ni de un área.",
        "untagged_line": "Linha sem tag",
        "untagged_area": "Área sem tags",
        "many_deletions": "Está a eliminar {n} objectos. Tem a certeza que deseja continuar? Esta operação eliminará os objectos do mapa que outros vêem em openstreetmap.org.",
        "tag_suggests_area": "A tag {tag} sugere que esta linha devia ser uma área, mas não é uma área.",
        "deprecated_tags": "Tags obsoletas: {tags}"
    },
    "zoom": {
        "in": "Aproximar",
        "out": "Afastar"
    },
    "gpx": {
        "local_layer": "Ficheiro GPX local",
        "drag_drop": "Arraste um ficheiro .gpx para a página"
    },
    "help": {
        "title": "Ajuda"
    },
    "presets": {
        "fields": {
            "access": {
                "label": "Acesso"
            },
            "address": {
                "label": "Morada",
                "placeholders": {
                    "housename": "Nome de casa",
                    "number": "123",
                    "street": "Rua",
                    "city": "Cidade"
                }
            },
            "aeroway": {
                "label": "Tipo"
            },
            "amenity": {
                "label": "Tipo"
            },
            "atm": {
                "label": "MB"
            },
            "bicycle_parking": {
                "label": "Tipo"
            },
            "building": {
                "label": "Edifício"
            },
            "building_area": {
                "label": "Edifício"
            },
            "building_yes": {
                "label": "Edifício"
            },
            "capacity": {
                "label": "Capacidade"
            },
            "construction": {
                "label": "Tipo"
            },
            "crossing": {
                "label": "Tipo"
            },
            "cuisine": {
                "label": "Cozinha"
            },
            "denomination": {
                "label": "Denominação"
            },
            "denotation": {
                "label": "Denotação"
            },
            "elevation": {
                "label": "Elevação"
            },
            "emergency": {
                "label": "Emergência"
            },
            "entrance": {
                "label": "Tipo"
            },
            "fax": {
                "label": "Fax"
            },
            "fee": {
                "label": "Tarifa"
            },
            "highway": {
                "label": "Tipo"
            },
            "historic": {
                "label": "Tipo"
            },
            "internet_access": {
                "label": "Acesso à Internet",
                "options": {
                    "wlan": "Wifi"
                }
            },
            "maxspeed": {
                "label": "Limite de Velocidade"
            },
            "natural": {
                "label": "Natural"
            },
            "network": {
                "label": "Rede"
            },
            "note": {
                "label": "Nota"
            },
            "office": {
                "label": "Tipo"
            },
            "oneway": {
                "label": "Sentido Único"
            },
            "opening_hours": {
                "label": "Horas"
            },
            "operator": {
                "label": "Operador"
            },
            "phone": {
                "label": "Telefone"
            },
            "place": {
                "label": "Tipo"
            },
            "railway": {
                "label": "Tipo"
            },
            "religion": {
                "label": "Religião",
                "options": {
                    "christian": "Cristão",
                    "muslim": "Muçulmano",
                    "buddhist": "Budista",
                    "jewish": "Judeu"
                }
            },
            "shelter": {
                "label": "Abrigo"
            },
            "shop": {
                "label": "Tipo"
            },
            "source": {
                "label": "Fonte"
            },
            "sport": {
                "label": "Desporto"
            },
            "surface": {
                "label": "Superfície"
            },
            "tourism": {
                "label": "Tipo"
            },
            "water": {
                "label": "Tipo"
            },
            "waterway": {
                "label": "Tipo"
            },
            "website": {
                "label": "Website"
            },
            "wetland": {
                "label": "Tipo"
            },
            "wikipedia": {
                "label": "Wikipedia"
            },
            "wood": {
                "label": "Tipo"
            }
        },
        "presets": {
            "aeroway/aerodrome": {
                "name": "Aeroporto"
            },
            "amenity": {
                "name": "Amenidade"
            },
            "amenity/bank": {
                "name": "Banco"
            },
            "amenity/bar": {
                "name": "Bar"
            },
            "amenity/bench": {
                "name": "Banco"
            },
            "amenity/bicycle_parking": {
                "name": "Parque de Bicicletas"
            },
            "amenity/bicycle_rental": {
                "name": "Aluguer de Bicicletas"
            },
            "amenity/cafe": {
                "name": "Café"
            },
            "amenity/cinema": {
                "name": "Cinema"
            },
            "amenity/fire_station": {
                "name": "Quartel de Bombeiros"
            },
            "amenity/grave_yard": {
                "name": "Cemitério"
            },
            "amenity/hospital": {
                "name": "Hospital"
            },
            "amenity/library": {
                "name": "Biblioteca"
            },
            "amenity/parking": {
                "name": "Estacionamento"
            },
            "amenity/pharmacy": {
                "name": "Farmácia"
            },
            "amenity/place_of_worship": {
                "name": "Local de Oração"
            },
            "amenity/place_of_worship/christian": {
                "name": "Igreja"
            },
            "amenity/place_of_worship/jewish": {
                "name": "Sinagoga"
            },
            "amenity/place_of_worship/muslim": {
                "name": "Mesquita"
            },
            "amenity/police": {
                "name": "Polícia"
            },
            "amenity/post_box": {
                "name": "Caixa de Correio"
            },
            "amenity/post_office": {
                "name": "Estação de Correios"
            },
            "amenity/pub": {
                "name": "Bar"
            },
            "amenity/restaurant": {
                "name": "Restaurante"
            },
            "amenity/school": {
                "name": "Escola"
            },
            "amenity/telephone": {
                "name": "Telefone"
            },
            "amenity/toilets": {
                "name": "Casas de Banho"
            },
            "amenity/townhall": {
                "name": "Câmara Municipal"
            },
            "amenity/university": {
                "name": "Universidade"
            },
            "building": {
                "name": "Edifício"
            },
            "entrance": {
                "name": "Entrada"
            },
            "highway": {
                "name": "Autoestrada"
            },
            "highway/bus_stop": {
                "name": "Paragem de Autocarro"
            },
            "highway/crossing": {
                "name": "Passadeira"
            },
            "highway/cycleway": {
                "name": "Ciclovia"
            },
            "highway/primary": {
                "name": "Estrada Principal"
            },
            "highway/residential": {
                "name": "Estrada Residencial"
            },
            "highway/secondary": {
                "name": "Estrada Secundária"
            },
            "highway/service": {
                "name": "Estrada de Serviço"
            },
            "highway/steps": {
                "name": "Passos"
            },
            "highway/track": {
                "name": "Pista"
            },
            "landuse/cemetery": {
                "name": "Cemitério"
            },
            "landuse/commercial": {
                "name": "Comercial"
            },
            "landuse/construction": {
                "name": "Construção"
            },
            "landuse/farm": {
                "name": "Quinta"
            },
            "landuse/farmyard": {
                "name": "Quintal"
            },
            "landuse/forest": {
                "name": "Floresta"
            },
            "landuse/grass": {
                "name": "Relva"
            },
            "landuse/industrial": {
                "name": "Industrial"
            },
            "leisure/golf_course": {
                "name": "Campo de Golf"
            },
            "leisure/park": {
                "name": "Parque"
            },
            "leisure/pitch": {
                "name": "Campo de Desporto"
            },
            "leisure/pitch/tennis": {
                "name": "Campo de Ténis"
            },
            "man_made/water_tower": {
                "name": "Torre de Água"
            },
            "natural": {
                "name": "Natural"
            },
            "natural/bay": {
                "name": "Baía"
            },
            "natural/beach": {
                "name": "Praia"
            },
            "natural/cliff": {
                "name": "Penhasco"
            },
            "natural/coastline": {
                "name": "Linha Costeira"
            },
            "natural/water": {
                "name": "Água"
            },
            "natural/water/lake": {
                "name": "Lago"
            },
            "place/island": {
                "name": "Ilha"
            },
            "place/locality": {
                "name": "Localidade"
            },
            "place/village": {
                "name": "Aldeia"
            },
            "railway/subway": {
                "name": "Metro"
            },
            "railway/subway_entrance": {
                "name": "Entrada de Metro"
            },
            "shop": {
                "name": "Loja"
            },
            "shop/butcher": {
                "name": "Talho"
            },
            "shop/supermarket": {
                "name": "Supermercado"
            },
            "tourism": {
                "name": "Turismo"
            },
            "tourism/camp_site": {
                "name": "Parque de Campismo"
            },
            "tourism/hotel": {
                "name": "Hotal"
            },
            "tourism/museum": {
                "name": "Musei"
            },
            "waterway/canal": {
                "name": "Canal"
            },
            "waterway/river": {
                "name": "Rio"
            }
        }
    }
};
locale.ru = {
    "modes": {
        "add_area": {
            "title": "Контур",
            "description": "Добавить парки, здания, озёра или иные объекты на карту.",
            "tail": "Щёлкните на карту, чтобы начать рисование области — например, парка, озера или здания."
        },
        "add_line": {
            "title": "Линия",
            "description": "Линиями можно обозначить дороги, тропинки, заборы или, к примеру, ручьи.",
            "tail": "Щёлкните на карту, чтобы начать рисование дороги, тропинки или ручья."
        },
        "add_point": {
            "title": "Точка",
            "description": "Точки — это рестораны, памятники, почтовые ящики.",
            "tail": "Щёлкните на карту, чтобы поставить точку."
        },
        "browse": {
            "title": "Просмотр",
            "description": "Двигать и масштабировать карту."
        },
        "draw_area": {
            "tail": "Щёлкайте, чтобы добавить точки в контур. Щёлкните начальную точку для завершения."
        },
        "draw_line": {
            "tail": "Щёлкайте, чтобы добавить точки в линию. Щёлкните на другую линию, чтобы соединить их, двойной щелчок завершит линию."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Добавлена точка.",
                "vertex": "В линию добавлена точка."
            }
        },
        "start": {
            "annotation": {
                "line": "Начато рисование линии.",
                "area": "Начато рисование области."
            }
        },
        "continue": {
            "annotation": {
                "line": "Продлена линия.",
                "area": "Дополнен контур."
            }
        },
        "cancel_draw": {
            "annotation": "Рисование отменено."
        },
        "change_tags": {
            "annotation": "Изменены теги."
        },
        "circularize": {
            "title": "Округлить",
            "description": {
                "line": "Превратить линию в окружность.",
                "area": "Превратить контур в окружность."
            },
            "key": "O",
            "annotation": {
                "line": "Линия превращена в окружность.",
                "area": "Контур превращён в окружность."
            },
            "not_closed": "Объект нельзя превратить в окружность: он незамкнут."
        },
        "orthogonalize": {
            "title": "Ортогонализировать",
            "description": "Выпрямить все углы.",
            "key": "Q",
            "annotation": {
                "line": "Выпрямлены углы в линии.",
                "area": "Выпрямлены углы контура."
            },
            "not_closed": "Объект нельзя превратить в квадрат: он незамкнут."
        },
        "delete": {
            "title": "Удалить",
            "description": "Убрать объект с карты.",
            "annotation": {
                "point": "Удалена точка.",
                "vertex": "Удалёна точка из линии.",
                "line": "Удалена линия.",
                "area": "Удалён контур.",
                "relation": "Удалено отношение.",
                "multiple": "Удалены {n} объектов."
            }
        },
        "connect": {
            "annotation": {
                "point": "Линия присоединена к точке.",
                "vertex": "Одна линия присоединена к другой.",
                "line": "Линия соединена с другой линией.",
                "area": "Линия присоединена к контуру."
            }
        },
        "disconnect": {
            "title": "Разъединить",
            "description": "Разъединить эти линии.",
            "key": "D",
            "annotation": "Разъединены линии.",
            "not_connected": "Нет линий или контуров для разъединения."
        },
        "merge": {
            "title": "Объединить",
            "description": "Объединить две линии.",
            "key": "C",
            "annotation": "Объединены {n} линий.",
            "not_eligible": "Эти объекты нельзя склеить.",
            "not_adjacent": "Эти линии не склеить, потому что они не соединены."
        },
        "move": {
            "title": "Сместить",
            "description": "Сместить объект в другое место.",
            "key": "M",
            "annotation": {
                "point": "Смещена точка.",
                "vertex": "Смещена точка линии.",
                "line": "Смещена линия.",
                "area": "Смещён контур.",
                "multiple": "Передвинуты несколько объектов."
            },
            "incomplete_relation": "Этот объект нельзя двигать, потому что он загружен не целиком."
        },
        "rotate": {
            "title": "Повернуть",
            "description": "Повернуть объект относительно центра.",
            "key": "R",
            "annotation": {
                "line": "Повернута линия.",
                "area": "Повёрнут контур."
            }
        },
        "reverse": {
            "title": "Развернуть",
            "description": "Сменить направление этой линии на противоположное.",
            "key": "V",
            "annotation": "Линия развёрнута."
        },
        "split": {
            "title": "Разрезать",
            "description": {
                "line": "Разрезать линию на две в этой точке.",
                "area": "Разбить этот контур надвое.",
                "multiple": "Разрезать линии / контуре в этой точке надвое."
            },
            "key": "X",
            "annotation": {
                "line": "Разрезана линия.",
                "area": "Разрезан контур.",
                "multiple": "Разрезаны {n} линий/контуров."
            },
            "not_eligible": "Линии нельзя резать на концах.",
            "multiple_ways": "Слишком много линий для разрезания."
        }
    },
    "nothing_to_undo": "Отменять нечего.",
    "nothing_to_redo": "Повторять нечего.",
    "just_edited": "Вы только что отредактировали карту OpenStreetMap!",
    "browser_notice": "Этот редактор работает в браузерах Firefox, Chrome, Safari, Opera и Internet Explorer версии 9 и выше. Пожалуйста, обновите свой браузер или воспользуйтесь редактором Potlatch 2.",
    "view_on_osm": "Посмотреть на OSM",
    "zoom_in_edit": "приблизьте для редактирования",
    "logout": "выйти",
    "loading_auth": "Подключаюсь к OpenStreetMap...",
    "report_a_bug": "сообщить об ошибке",
    "commit": {
        "title": "Сохранить изменения",
        "description_placeholder": "Краткое описание ваших правок",
        "message_label": "Описание изменений",
        "upload_explanation": "Изменения, сделанные вами под именем {user}, появятся на всех картах, основанных на данных OpenStreetMap.",
        "save": "Сохранить",
        "cancel": "Отменить",
        "warnings": "Предупреждения",
        "modified": "Изменено",
        "deleted": "Удалено",
        "created": "Создано"
    },
    "contributors": {
        "list": "Здесь карту редактировали {users}",
        "truncated_list": "Здесь карту редактировали {users} и ещё {count} человек"
    },
    "geocoder": {
        "title": "Найти место",
        "placeholder": "найти место",
        "no_results": "Не могу найти место с названием «{name}»"
    },
    "geolocate": {
        "title": "К моим координатам"
    },
    "inspector": {
        "no_documentation_combination": "Для этой комбинации ключа и значения нет описания",
        "no_documentation_key": "Для этого ключа описания нет",
        "show_more": "Ещё",
        "new_tag": "Новый тег",
        "view_on_osm": "Посмотреть в OSM",
        "editing_feature": "Правка {feature}",
        "additional": "Дополнительные теги",
        "choose": "Что это за объект?",
        "results": "{n} результатов для {search}",
        "reference": "Найти в вики OpenStreetMap →",
        "back_tooltip": "Изменить тип объекта"
    },
    "background": {
        "title": "Подложка",
        "description": "Настройка подложки",
        "percent_brightness": "яркость {opacity}%",
        "fix_misalignment": "Поправить смещение",
        "reset": "сброс"
    },
    "restore": {
        "heading": "У вас есть несохранённые правки",
        "description": "У вас обнаружились несохранённые правки с прошлого раза. Восстановить их?",
        "restore": "Восстановить",
        "reset": "Забыть"
    },
    "save": {
        "title": "Сохранить",
        "help": "Отправить сделанные изменения на сервер OpenStreetMap, сделав их доступными всему миру",
        "no_changes": "Сохранять нечего.",
        "error": "Во время сохранения произошла ошибка",
        "uploading": "Отправляем данные на сервер OpenStreetMap.",
        "unsaved_changes": "У вас есть несохранённые правки"
    },
    "splash": {
        "welcome": "Здравствуйте! Это iD, редактор карты OpenStreetMap",
        "text": "Вы пользуетесь неокончательной версией {version}. Подробнее на сайте {website}, об ошибках сообщайте в {github}.",
        "walkthrough": "Запустить обучение",
        "start": "В редактор"
    },
    "source_switch": {
        "live": "основной",
        "lose_changes": "Вы правили данные. Смена сервера карт удалит ваши изменения. Уверены, что хотите сменить сервер?",
        "dev": "тест"
    },
    "tag_reference": {
        "description": "Описание",
        "on_wiki": "{tag} в вики OSM",
        "used_with": "ставится на {type}"
    },
    "validations": {
        "untagged_point": "Точка без тегов и не в составе линии или контура",
        "untagged_line": "Линия без тегов",
        "untagged_area": "Контур без тегов",
        "many_deletions": "Вы удаляете {n} объектов. Уверены в своём решении? В результате они пропадут с карты, которую весь мир может видеть на openstreetmap.org.",
        "tag_suggests_area": "Тег {tag} обычно ставится на замкнутые контуры, но это не контур",
        "deprecated_tags": "Теги устарели: {tags}"
    },
    "zoom": {
        "in": "Приблизить",
        "out": "Отдалить"
    },
    "gpx": {
        "local_layer": "Свой файл GPX",
        "drag_drop": "Перетащите файл .gpx на страницу"
    },
    "help": {
        "title": "Справка",
        "help": "# Справка\n\nЭто редактор [OpenStreetMap](http://www.openstreetmap.org/): бесплатной,\nсвободно редактируемой карты мира. Пользуйтесь им для добавления\nи изменения данных в вашем районе, делая общую карту с открытыми\nданными лучше для каждого.\n\nВаши правки увидит каждый пользователь карты OpenStreetMap. Для\nредактирования вам потребуется [зарегистрироваться в OpenStreetMap](https://www.openstreetmap.org/user/new).\n\n[Редактор iD](http://ideditor.com/) — открытый совместный проект\nс [исходным кодом на GitHub](https://github.com/systemed/iD).\n"
    },
    "intro": {
        "startediting": {
            "start": "Рисовать карту"
        }
    },
    "presets": {
        "fields": {
            "access": {
                "label": "Ограничения"
            },
            "address": {
                "label": "Адрес",
                "placeholders": {
                    "housename": "Номер дома",
                    "number": "123",
                    "street": "Улица",
                    "city": "Город"
                }
            },
            "aeroway": {
                "label": "Тип"
            },
            "amenity": {
                "label": "Тип"
            },
            "atm": {
                "label": "Банкомат"
            },
            "barrier": {
                "label": "Тип"
            },
            "bicycle_parking": {
                "label": "Тип"
            },
            "building": {
                "label": "Здание"
            },
            "building_area": {
                "label": "Здание"
            },
            "building_yes": {
                "label": "Здание"
            },
            "capacity": {
                "label": "Вместимость"
            },
            "collection_times": {
                "label": "Расписание проверки"
            },
            "construction": {
                "label": "Тип"
            },
            "country": {
                "label": "Страна"
            },
            "crossing": {
                "label": "Тип"
            },
            "cuisine": {
                "label": "Кухня"
            },
            "denomination": {
                "label": "Конфессия"
            },
            "denotation": {
                "label": "Знак"
            },
            "elevation": {
                "label": "Высота"
            },
            "emergency": {
                "label": "Экстренные службы"
            },
            "entrance": {
                "label": "Тип"
            },
            "fax": {
                "label": "Факс"
            },
            "fee": {
                "label": "Стоимость"
            },
            "highway": {
                "label": "Тип"
            },
            "historic": {
                "label": "Тип"
            },
            "internet_access": {
                "label": "Доступ в интернет",
                "options": {
                    "wlan": "Wifi",
                    "wired": "Проводной",
                    "terminal": "Терминал"
                }
            },
            "landuse": {
                "label": "Тип"
            },
            "layer": {
                "label": "Слой"
            },
            "leisure": {
                "label": "Тип"
            },
            "levels": {
                "label": "Этажи"
            },
            "man_made": {
                "label": "Тип"
            },
            "maxspeed": {
                "label": "Ограничение скорости"
            },
            "name": {
                "label": "Название"
            },
            "natural": {
                "label": "Природа"
            },
            "network": {
                "label": "Сеть"
            },
            "note": {
                "label": "Заметка для картографов"
            },
            "office": {
                "label": "Тип"
            },
            "oneway": {
                "label": "Одностороннее движение"
            },
            "oneway_yes": {
                "label": "Одностороннее движение"
            },
            "opening_hours": {
                "label": "Часы работы"
            },
            "operator": {
                "label": "Владелец"
            },
            "phone": {
                "label": "Телефон"
            },
            "place": {
                "label": "Тип"
            },
            "power": {
                "label": "Тип"
            },
            "railway": {
                "label": "Тип"
            },
            "ref": {
                "label": "Номер"
            },
            "religion": {
                "label": "Религия",
                "options": {
                    "christian": "Христианство",
                    "muslim": "Мусульманство",
                    "buddhist": "Буддизм",
                    "jewish": "Иудаизм",
                    "hindu": "Индуизм",
                    "shinto": "Синтоизм",
                    "taoist": "Таоизм"
                }
            },
            "service": {
                "label": "Тип"
            },
            "shelter": {
                "label": "Укрытие"
            },
            "shop": {
                "label": "Тип"
            },
            "source": {
                "label": "Источник"
            },
            "sport": {
                "label": "Спорт"
            },
            "structure": {
                "label": "Сооружение",
                "options": {
                    "bridge": "Мост",
                    "tunnel": "Тоннель",
                    "embankment": "Насыпь",
                    "cutting": "Выемка"
                }
            },
            "surface": {
                "label": "Покрытие"
            },
            "tourism": {
                "label": "Тип"
            },
            "water": {
                "label": "Тип"
            },
            "waterway": {
                "label": "Тип"
            },
            "website": {
                "label": "Веб-сайт"
            },
            "wetland": {
                "label": "Тип"
            },
            "wheelchair": {
                "label": "Доступность для инвалидных колясок"
            },
            "wikipedia": {
                "label": "Википедия"
            },
            "wood": {
                "label": "Тип"
            }
        },
        "presets": {
            "aeroway": {
                "name": "Взлётная полоса"
            },
            "aeroway/aerodrome": {
                "name": "Аэропорт"
            },
            "aeroway/helipad": {
                "name": "Вертолётная площадка"
            },
            "amenity": {
                "name": "Инфраструктура"
            },
            "amenity/bank": {
                "name": "Банк"
            },
            "amenity/bar": {
                "name": "Бар"
            },
            "amenity/bench": {
                "name": "Скамейка"
            },
            "amenity/bicycle_parking": {
                "name": "Велопарковка"
            },
            "amenity/bicycle_rental": {
                "name": "Велопрокат"
            },
            "amenity/cafe": {
                "name": "Кафе"
            },
            "amenity/cinema": {
                "name": "Кинотеатр"
            },
            "amenity/courthouse": {
                "name": "Суд"
            },
            "amenity/embassy": {
                "name": "Посольство"
            },
            "amenity/fast_food": {
                "name": "Фаст-фуд"
            },
            "amenity/fire_station": {
                "name": "Пожарная часть"
            },
            "amenity/fuel": {
                "name": "АЗС"
            },
            "amenity/grave_yard": {
                "name": "Кладбище"
            },
            "amenity/hospital": {
                "name": "Больница"
            },
            "amenity/library": {
                "name": "Библиотека"
            },
            "amenity/marketplace": {
                "name": "Рынок"
            },
            "amenity/parking": {
                "name": "Стоянка"
            },
            "amenity/pharmacy": {
                "name": "Аптека"
            },
            "amenity/place_of_worship": {
                "name": "Храм"
            },
            "amenity/place_of_worship/christian": {
                "name": "Церковь"
            },
            "amenity/place_of_worship/jewish": {
                "name": "Синагога"
            },
            "amenity/place_of_worship/muslim": {
                "name": "Мечеть"
            },
            "amenity/police": {
                "name": "Полиция"
            },
            "amenity/post_box": {
                "name": "Почтовый ящик"
            },
            "amenity/post_office": {
                "name": "Почта"
            },
            "amenity/pub": {
                "name": "Паб"
            },
            "amenity/restaurant": {
                "name": "Ресторан"
            },
            "amenity/school": {
                "name": "Школа"
            },
            "amenity/swimming_pool": {
                "name": "Бассейн"
            },
            "amenity/telephone": {
                "name": "Телефон"
            },
            "amenity/theatre": {
                "name": "Театр"
            },
            "amenity/toilets": {
                "name": "Туалет"
            },
            "amenity/townhall": {
                "name": "Муниципалитет"
            },
            "amenity/university": {
                "name": "Университет"
            },
            "barrier": {
                "name": "Преграда"
            },
            "barrier/block": {
                "name": "Бетонный блок"
            },
            "barrier/bollard": {
                "name": "Столбики"
            },
            "barrier/cattle_grid": {
                "name": "Сетка для животных"
            },
            "barrier/city_wall": {
                "name": "Городская стена"
            },
            "barrier/cycle_barrier": {
                "name": "Барьер для велосипедистов"
            },
            "barrier/ditch": {
                "name": "Траншея"
            },
            "barrier/entrance": {
                "name": "Проход"
            },
            "barrier/fence": {
                "name": "Забор"
            },
            "barrier/gate": {
                "name": "Ворота"
            },
            "barrier/hedge": {
                "name": "Живая изгородь"
            },
            "barrier/kissing_gate": {
                "name": "Преграда для животных"
            },
            "barrier/lift_gate": {
                "name": "Шлагбаум"
            },
            "barrier/retaining_wall": {
                "name": "Укрепляющая стена"
            },
            "barrier/stile": {
                "name": "Турникет"
            },
            "barrier/toll_booth": {
                "name": "Пункт оплаты проезда"
            },
            "barrier/wall": {
                "name": "Стена"
            },
            "building": {
                "name": "Здание"
            },
            "building/apartments": {
                "name": "Многоквартирный дом"
            },
            "building/entrance": {
                "name": "Вход"
            },
            "entrance": {
                "name": "Вход"
            },
            "highway": {
                "name": "Дорога"
            },
            "highway/bridleway": {
                "name": "Конная тропа"
            },
            "highway/bus_stop": {
                "name": "Автобусная остановка"
            },
            "highway/crossing": {
                "name": "Пешеходный переход"
            },
            "highway/cycleway": {
                "name": "Велодорожка"
            },
            "highway/footway": {
                "name": "Пешеходная дорожка"
            },
            "highway/motorway": {
                "name": "Автомагистраль"
            },
            "highway/motorway_link": {
                "name": "Съезд с автомагистрали"
            },
            "highway/path": {
                "name": "Тропа"
            },
            "highway/primary": {
                "name": "Дорога регионального значения"
            },
            "highway/primary_link": {
                "name": "Съезд с дороги регионального значения"
            },
            "highway/residential": {
                "name": "Улица"
            },
            "highway/road": {
                "name": "Дорога неизвестного класса"
            },
            "highway/secondary": {
                "name": "Важная дорога"
            },
            "highway/secondary_link": {
                "name": "Съезд с важной дороги"
            },
            "highway/service": {
                "name": "Проезд"
            },
            "highway/steps": {
                "name": "Лестница"
            },
            "highway/tertiary": {
                "name": "Местная дорога"
            },
            "highway/tertiary_link": {
                "name": "Съезд"
            },
            "highway/track": {
                "name": "Полевая / лесная дорога"
            },
            "highway/traffic_signals": {
                "name": "Светофор"
            },
            "highway/trunk": {
                "name": "Дорога федерального значения"
            },
            "highway/trunk_link": {
                "name": "Съезд с дороги федерального значения"
            },
            "highway/turning_circle": {
                "name": "Разворот"
            },
            "highway/unclassified": {
                "name": "Обычная дорога"
            },
            "historic": {
                "name": "Историческое место"
            },
            "historic/archaeological_site": {
                "name": "Археологические раскопки"
            },
            "historic/boundary_stone": {
                "name": "Пограничный камень"
            },
            "historic/castle": {
                "name": "Замок"
            },
            "historic/memorial": {
                "name": "Мемориал"
            },
            "historic/monument": {
                "name": "Памятник"
            },
            "historic/ruins": {
                "name": "Развалины"
            },
            "historic/wayside_cross": {
                "name": "Придорожный крест"
            },
            "historic/wayside_shrine": {
                "name": "Придорожная часовня"
            },
            "landuse": {
                "name": "Землепользование"
            },
            "landuse/allotments": {
                "name": "Садовые участки"
            },
            "landuse/basin": {
                "name": "Хранилище сточных вод"
            },
            "landuse/cemetery": {
                "name": "Кладбище"
            },
            "landuse/commercial": {
                "name": "Коммерческая застройка"
            },
            "landuse/construction": {
                "name": "Стройплощадка"
            },
            "landuse/farm": {
                "name": "Земельные угодья"
            },
            "landuse/farmyard": {
                "name": "Ферма"
            },
            "landuse/forest": {
                "name": "Лес"
            },
            "landuse/grass": {
                "name": "Трава"
            },
            "landuse/industrial": {
                "name": "Промышленная застройка"
            },
            "landuse/meadow": {
                "name": "Луг"
            },
            "landuse/orchard": {
                "name": "Кустарник"
            },
            "landuse/quarry": {
                "name": "Карьер"
            },
            "landuse/residential": {
                "name": "Жилой квартал"
            },
            "landuse/vineyard": {
                "name": "Виноградник"
            },
            "leisure": {
                "name": "Отдых"
            },
            "leisure/garden": {
                "name": "Сад"
            },
            "leisure/golf_course": {
                "name": "Площадка для гольфа"
            },
            "leisure/marina": {
                "name": "Яхтклуб"
            },
            "leisure/park": {
                "name": "Парк"
            },
            "leisure/pitch": {
                "name": "Спортплощадка"
            },
            "leisure/pitch/american_football": {
                "name": "Регбийное поле"
            },
            "leisure/pitch/baseball": {
                "name": "Бейсбольная площадка"
            },
            "leisure/pitch/basketball": {
                "name": "Баскетбольная площадка"
            },
            "leisure/pitch/soccer": {
                "name": "Футбольное поле"
            },
            "leisure/pitch/tennis": {
                "name": "Теннисный корт"
            },
            "leisure/playground": {
                "name": "Детская площадка"
            },
            "leisure/slipway": {
                "name": "Стапель"
            },
            "leisure/stadium": {
                "name": "Стадион"
            },
            "leisure/swimming_pool": {
                "name": "Бассейн"
            },
            "man_made": {
                "name": "Сооружения"
            },
            "man_made/lighthouse": {
                "name": "Маяк"
            },
            "man_made/pier": {
                "name": "Пирс"
            },
            "man_made/survey_point": {
                "name": "Тригонометрический пункт"
            },
            "man_made/water_tower": {
                "name": "Водонапорная башня"
            },
            "natural": {
                "name": "Природа"
            },
            "natural/bay": {
                "name": "Бухта"
            },
            "natural/beach": {
                "name": "Пляж"
            },
            "natural/cliff": {
                "name": "Скала"
            },
            "natural/coastline": {
                "name": "Береговая линия"
            },
            "natural/glacier": {
                "name": "Ледник"
            },
            "natural/grassland": {
                "name": "Травяной луг"
            },
            "natural/heath": {
                "name": "Поросший луг"
            },
            "natural/peak": {
                "name": "Вершина"
            },
            "natural/scrub": {
                "name": "Кустарник"
            },
            "natural/spring": {
                "name": "Родник"
            },
            "natural/tree": {
                "name": "Дерево"
            },
            "natural/water": {
                "name": "Водоём"
            },
            "natural/water/lake": {
                "name": "Озеро"
            },
            "natural/water/pond": {
                "name": "Пруд"
            },
            "natural/water/reservoir": {
                "name": "Водохранилище"
            },
            "natural/wetland": {
                "name": "Болото"
            },
            "natural/wood": {
                "name": "Лес"
            },
            "office": {
                "name": "Офисы"
            },
            "other": {
                "name": "Другое"
            },
            "other_area": {
                "name": "Другое"
            },
            "place": {
                "name": "Населённый пункт"
            },
            "place/hamlet": {
                "name": "Малое село"
            },
            "place/island": {
                "name": "Остров"
            },
            "place/locality": {
                "name": "Местность"
            },
            "place/village": {
                "name": "Деревня"
            },
            "power": {
                "name": "Электричество"
            },
            "power/generator": {
                "name": "Электростанция"
            },
            "power/line": {
                "name": "ЛЭП"
            },
            "power/pole": {
                "name": "Столб ЛЭП"
            },
            "power/sub_station": {
                "name": "Подстанция"
            },
            "power/tower": {
                "name": "Опора ЛЭП"
            },
            "power/transformer": {
                "name": "Трансформатор"
            },
            "railway": {
                "name": "Железная дорога"
            },
            "railway/abandoned": {
                "name": "Разобранная железная дорога"
            },
            "railway/disused": {
                "name": "Заброшенная железная дорога"
            },
            "railway/level_crossing": {
                "name": "Переезд"
            },
            "railway/monorail": {
                "name": "Монорельс"
            },
            "railway/rail": {
                "name": "Рельсовый путь"
            },
            "railway/subway": {
                "name": "Метро"
            },
            "railway/subway_entrance": {
                "name": "Вход в метро"
            },
            "railway/tram": {
                "name": "Трамвайные пути"
            },
            "shop": {
                "name": "Магазин"
            },
            "shop/alcohol": {
                "name": "Винный магазин"
            },
            "shop/bakery": {
                "name": "Хлебный"
            },
            "shop/beauty": {
                "name": "Салон красоты"
            },
            "shop/beverages": {
                "name": "Магазин напитков"
            },
            "shop/bicycle": {
                "name": "Веломагазин"
            },
            "shop/books": {
                "name": "Книжный"
            },
            "shop/boutique": {
                "name": "Бутик"
            },
            "shop/butcher": {
                "name": "Мясной"
            },
            "shop/car": {
                "name": "Автодилер"
            },
            "shop/car_parts": {
                "name": "Автозапчасти"
            },
            "shop/car_repair": {
                "name": "Автомастерская"
            },
            "shop/chemist": {
                "name": "Бытовая химия"
            },
            "shop/clothes": {
                "name": "Одежда"
            },
            "shop/computer": {
                "name": "Компьютерный магазин"
            },
            "shop/confectionery": {
                "name": "Кондитерская"
            },
            "shop/convenience": {
                "name": "Продуктовый"
            },
            "shop/deli": {
                "name": "Кулинария"
            },
            "shop/department_store": {
                "name": "Универсам"
            },
            "shop/fishmonger": {
                "name": "Рыбный магазин"
            },
            "shop/florist": {
                "name": "Цветочный"
            },
            "shop/furniture": {
                "name": "Мебельный"
            },
            "shop/garden_centre": {
                "name": "Садовые принадлежности"
            },
            "shop/gift": {
                "name": "Подарки"
            },
            "shop/greengrocer": {
                "name": "Овощи, фрукты"
            },
            "shop/hairdresser": {
                "name": "Парикмахерская"
            },
            "shop/hardware": {
                "name": "Хозяйственный магазин"
            },
            "shop/hifi": {
                "name": "Техника Hi-fi"
            },
            "shop/jewelry": {
                "name": "Ювелирный"
            },
            "shop/kiosk": {
                "name": "Киоск"
            },
            "shop/laundry": {
                "name": "Прачечная"
            },
            "shop/mall": {
                "name": "Торговый центр"
            },
            "shop/mobile_phone": {
                "name": "Мобильные телефоны"
            },
            "shop/motorcycle": {
                "name": "Магазин мотоциклов"
            },
            "shop/music": {
                "name": "Музыкальный магазин"
            },
            "shop/newsagent": {
                "name": "Газеты-журналы"
            },
            "shop/optician": {
                "name": "Оптика"
            },
            "shop/outdoor": {
                "name": "Товары для отдыха и туризма"
            },
            "shop/pet": {
                "name": "Зоомагазин"
            },
            "shop/shoes": {
                "name": "Обувной"
            },
            "shop/sports": {
                "name": "Спорттовары"
            },
            "shop/stationery": {
                "name": "Канцелярский магазин"
            },
            "shop/supermarket": {
                "name": "Гипермаркет"
            },
            "shop/toys": {
                "name": "Игрушки"
            },
            "shop/travel_agency": {
                "name": "Бюро путешествий"
            },
            "shop/tyres": {
                "name": "Шины, покрышки"
            },
            "shop/vacant": {
                "name": "Закрытый магазин"
            },
            "shop/variety_store": {
                "name": "Товары по одной цене"
            },
            "shop/video": {
                "name": "Видеомагазин"
            },
            "tourism": {
                "name": "Туризм"
            },
            "tourism/alpine_hut": {
                "name": "Альпийский домик"
            },
            "tourism/artwork": {
                "name": "Произведение искусства"
            },
            "tourism/attraction": {
                "name": "Достопримечательность"
            },
            "tourism/camp_site": {
                "name": "Кемпинг"
            },
            "tourism/caravan_site": {
                "name": "Стоянка автодомов"
            },
            "tourism/chalet": {
                "name": "Сельский домик, шале"
            },
            "tourism/guest_house": {
                "name": "Гостевой дом"
            },
            "tourism/hostel": {
                "name": "Хостел"
            },
            "tourism/hotel": {
                "name": "Гостиница"
            },
            "tourism/information": {
                "name": "Инфопункт"
            },
            "tourism/motel": {
                "name": "Мотель"
            },
            "tourism/museum": {
                "name": "Музей"
            },
            "tourism/picnic_site": {
                "name": "Место для пикника"
            },
            "tourism/theme_park": {
                "name": "Парк развлечений"
            },
            "tourism/viewpoint": {
                "name": "Обзорная точка"
            },
            "tourism/zoo": {
                "name": "Зоопарк"
            },
            "waterway": {
                "name": "Водный путь"
            },
            "waterway/canal": {
                "name": "Канал"
            },
            "waterway/dam": {
                "name": "Дамба"
            },
            "waterway/ditch": {
                "name": "Оросительная канава"
            },
            "waterway/drain": {
                "name": "Дренажный канал"
            },
            "waterway/river": {
                "name": "Река"
            },
            "waterway/riverbank": {
                "name": "Поверхность реки"
            },
            "waterway/stream": {
                "name": "Ручей"
            },
            "waterway/weir": {
                "name": "Плотина"
            }
        }
    }
};
locale.es = {
    "modes": {
        "add_area": {
            "title": "Área",
            "description": "Agregar parques, edificios, lagos u otras zonas en el mapa",
            "tail": "Haz clic en el mapa para empezar a dibujar un área, como un parque, lago o edificio"
        },
        "add_line": {
            "title": "Línea",
            "description": "Agregar autopistas, calles, pasos peatonales o canales en el mapa.",
            "tail": "Haz clic para empezar a dibujar en el mapa, una calle, camino o ruta."
        },
        "add_point": {
            "title": "Punto",
            "description": "Agregar restaurantes, monumentos, buzones u otros puntos en el mapa.",
            "tail": "Haz clic para agregar un punto en el mapa."
        },
        "browse": {
            "title": "Navegar",
            "description": "Acercar y mover el mapa."
        },
        "draw_area": {
            "tail": "Haz clic para agregar vértices en tu área. Haz clic de nuevo en el primer vértice para cerrar el área."
        },
        "draw_line": {
            "tail": "Hacer clic para agregar más vértices a la línea. Hacer clic en otras líneas para conectarlas, y doble clic para terminar."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Punto agregado",
                "vertex": "Vértice añadido a la ruta"
            }
        },
        "start": {
            "annotation": {
                "line": "Línea iniciada",
                "area": "Área iniciada"
            }
        },
        "continue": {
            "annotation": {
                "line": "Línea continuada.",
                "area": "Área continuada."
            }
        },
        "cancel_draw": {
            "annotation": "Dibujo cancelado."
        },
        "change_tags": {
            "annotation": "Etiquetas cambiadas."
        },
        "circularize": {
            "title": "Redondear",
            "key": "O",
            "annotation": {
                "line": "Redondear línea.",
                "area": "Redondear área."
            }
        },
        "orthogonalize": {
            "title": "Escuadrar",
            "description": "Escuadrar esquinas.",
            "key": "E",
            "annotation": {
                "line": "Esquinas de la línea escuadrados.",
                "area": "Esquinas del área escuadrados."
            }
        },
        "delete": {
            "title": "Eliminar",
            "description": "Eliminar del mapa.",
            "annotation": {
                "point": "Punto eliminado.",
                "vertex": "Vértice elimnado de la ruta.",
                "line": "Línea eliminada.",
                "area": "Área eliminada.",
                "relation": "Relación eliminada.",
                "multiple": "{n} objetos eliminados."
            }
        },
        "connect": {
            "annotation": {
                "point": "Punto conectado a la línea.",
                "vertex": "Ruta conectada a otra línea.",
                "line": "Línea conectada a la línea.",
                "area": "Línea conectada al área."
            }
        },
        "disconnect": {
            "title": "Desconectar",
            "description": "Desconectar líneas.",
            "key": "D",
            "annotation": "Líneas desconectadas."
        },
        "merge": {
            "title": "Combinar",
            "description": "Combinar líneas.",
            "key": "C",
            "annotation": "{n} líneas combinadas."
        },
        "move": {
            "title": "Mover",
            "description": "Mover a otra ubicación.",
            "key": "M",
            "annotation": {
                "point": "Punto movido",
                "vertex": "Vertice movido",
                "line": "Línea movida",
                "area": "Área movida"
            }
        },
        "reverse": {
            "title": "Invertir",
            "description": "Invertir sentido de la linea.",
            "key": "I",
            "annotation": "Sentido de la línea invertido."
        },
        "split": {
            "title": "Dividir",
            "key": "D"
        }
    },
    "nothing_to_undo": "Nada que deshacer",
    "nothing_to_redo": "Nada que rehacer",
    "just_edited": "Acabas de editar OpenStreetMap!",
    "browser_notice": "Este editor soporta Firefox, Chrome, Safari, Opera e Internet Explorer 9 o superior. Por favor actualiza tu navegador o utiliza Potlatch 2 para editar el mapa.",
    "view_on_osm": "Ver en OSM",
    "zoom_in_edit": "Acerca para editar el mapa",
    "logout": "Cerrar sesión",
    "report_a_bug": "Reportar un error",
    "commit": {
        "title": "Guardar Cambios",
        "description_placeholder": "Breve descripción de tus contribuciones",
        "upload_explanation": "Los cambios que subes como {user} serán visibles en todos los mapas que usen datos de OpenStreetMap.",
        "save": "Guardar",
        "cancel": "Cancelar",
        "warnings": "Avisos",
        "modified": "Modificado",
        "deleted": "Borrado",
        "created": "Creado"
    },
    "contributors": {
        "list": "Viendo las contribuciones de {users}",
        "truncated_list": "Viendo las contribuciones de {users} y {count} más"
    },
    "geocoder": {
        "title": "Buscar un lugar",
        "placeholder": "buscar un lugar",
        "no_results": "No se pudo encontrar el lugar llamado '{name}'"
    },
    "geolocate": {
        "title": "Mostrar mi Localización"
    },
    "inspector": {
        "no_documentation_combination": "No hay documentación disponible para esta combinación de etiquetas",
        "no_documentation_key": "No hay documentación disponible para esta tecla",
        "new_tag": "Nueva etiqueta",
        "view_on_osm": "Ver en OSM"
    },
    "background": {
        "title": "Fondo",
        "description": "Configuración de fondo",
        "percent_brightness": "{opacity}% brillo",
        "fix_misalignment": "Alinear",
        "reset": "reiniciar"
    },
    "restore": {
        "description": "Tienes cambios no guardados de una sesión de edición previa. ¿Quieres recuperar tus cambios?",
        "restore": "Restaurar",
        "reset": "Descartar"
    },
    "save": {
        "title": "Guardar",
        "help": "Guardar los cambios en OpenStreetMap haciéndolos visibles a otros usuarios.",
        "error": "Ha ocurrido un error tratando de guardar",
        "uploading": "Subiendo cambios a OpenStreetMap",
        "unsaved_changes": "Tienes cambios sin guardar"
    },
    "splash": {
        "welcome": "Bienvenido al editor de OpenStreetMap iD",
        "text": "Esto es una versión {version} de desarrollo. Para más información visita {website} y reporta cualquier error en {github}."
    },
    "source_switch": {
        "live": "en vivo",
        "dev": "dev"
    },
    "tag_reference": {
        "description": "Descripción",
        "on_wiki": "{tag} en wiki.osm.org",
        "used_with": "usado con {type}"
    },
    "validations": {
        "untagged_point": "Punto sin etiquetar que no es parte de una línea ni de un área.",
        "untagged_line": "Línea sin etiquetar",
        "untagged_area": "Área sin etiquetar",
        "many_deletions": "You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        "tag_suggests_area": "La etiqueta {tag} sugiere que esta línea debería ser una área, pero no lo es.",
        "deprecated_tags": "Etiquetas obsoletas: {tags}"
    },
    "zoom": {
        "in": "Acercar",
        "out": "Alejar"
    }
};
locale.sv = {
    "modes": {
        "add_area": {
            "title": "Område",
            "description": "Lägg till parker, byggnader, sjöar, eller andra områden till kartan.",
            "tail": "Klicka på kartan för att börja rita ett område, typ en park, sjö eller byggnad."
        },
        "add_line": {
            "title": "Linje",
            "description": "Linjer kan vara vägar, gator, stigar, kanaler etc.",
            "tail": "Klicka på kartan för att rita en väg, stig eller vattendrag."
        },
        "add_point": {
            "title": "Punkt",
            "description": "Restauranter, minnesmärken och postkontor kan vara punkter.",
            "tail": "Klicka på kartan för att lägga till en punkt."
        },
        "browse": {
            "title": "Bläddra",
            "description": "Panera runt och zooma kartan."
        },
        "draw_area": {
            "tail": "Klicka här för att lägga till punkter till ditt område. Klicka på förste punkten igen for att avsluta området."
        },
        "draw_line": {
            "tail": "Klicka här för att lägga till fler punkter till linjen. Klicka på andra linjer for att knyta ihop dem och dubbelklicka för att slutföra linjen."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Lagt till en punkt.",
                "vertex": "Lagt till en nod till en linje."
            }
        },
        "start": {
            "annotation": {
                "line": "Startat en linje.",
                "area": "Startat ett område."
            }
        },
        "continue": {
            "annotation": {
                "line": "Fortsatt en linje.",
                "area": "Fortsatt ett område."
            }
        },
        "cancel_draw": {
            "annotation": "Avbröt ritning."
        },
        "change_tags": {
            "annotation": "Ändrat tagg."
        },
        "circularize": {
            "title": "Cirkularisera",
            "key": "O",
            "annotation": {
                "line": "Gjorde en linje rund.",
                "area": "Gjorde ett område runt."
            }
        },
        "orthogonalize": {
            "title": "Ortogonalisering",
            "description": "Gör kvadrat-hörn.",
            "key": "Q",
            "annotation": {
                "line": "Gjort hörnen på en linje fyrkantiga.",
                "area": "Gjort hörnen på ett område fyrkantiga."
            }
        },
        "delete": {
            "title": "Ta bort",
            "description": "Tag bort detta från kartan.",
            "annotation": {
                "point": "Tagit bort en punkt.",
                "vertex": "Tagit bort en nod från en väg.",
                "line": "Tagit bort en linje.",
                "area": "Tagit bort ett område.",
                "relation": "Tagit bort en relation.",
                "multiple": "Tagit bort {n} objekt."
            }
        },
        "connect": {
            "annotation": {
                "point": "Forbandt en vej til et punkt.",
                "vertex": "Forbandt en vej til en anden vej.",
                "line": "Forbandt en vej til en linje.",
                "area": "Forbandt en vej til et område."
            }
        },
        "disconnect": {
            "title": "Bryt av",
            "description": "Bryt av dessa vägar från varandra.",
            "key": "D",
            "annotation": "Bryt av linjen."
        },
        "merge": {
            "title": "Sammanfoga",
            "description": "Sammanfoga dessa linjer.",
            "key": "C",
            "annotation": "Sammanfogade {n} linjer."
        },
        "move": {
            "title": "Flytta",
            "description": "Flytta detta till ett annan ställe.",
            "key": "M",
            "annotation": {
                "point": "Flyttade en punkt.",
                "vertex": "Flyttade en nod i en väg.",
                "line": "Flyttade en linje.",
                "area": "Flyttade ett område.",
                "multiple": "Flyttade flera objekt."
            }
        },
        "rotate": {
            "title": "Rotera",
            "description": "Rotera detta objekt runt dess centerpunkt.",
            "key": "R",
            "annotation": {
                "line": "Roterade en linje.",
                "area": "Roterade ett område."
            }
        },
        "reverse": {
            "title": "Byt riktning",
            "description": "Byt riktning på linjen.",
            "key": "V",
            "annotation": "Bytte riktning på en linje."
        },
        "split": {
            "title": "Dela upp",
            "key": "X"
        }
    },
    "nothing_to_undo": "Inget att ångra.",
    "nothing_to_redo": "Inget att upprepa.",
    "just_edited": "Du har nu redigerat OpenStreetMap!",
    "browser_notice": "Denna redigerare funkar i Firefox, Chrome, Safari, Opera och Internet Explorer 9 och högre. Uppgradera din webbläsare eller använd Potlatch 2 för att redigera på kartan.",
    "view_on_osm": "Visa på OSM",
    "zoom_in_edit": "Zooma in för att fixa på kartan",
    "logout": "logga ut",
    "report_a_bug": "rapportera ett fel",
    "commit": {
        "title": "Spara ändringar",
        "description_placeholder": "Kort beskrivning av dina ändringar",
        "upload_explanation": "Ändringar du uppladdar som {user} kommer att kunna ses på alla kartor som användar OpenStreetMap data.",
        "save": "Spara",
        "cancel": "Avbryt",
        "warnings": "Varningar",
        "modified": "Ändrat",
        "deleted": "Borttaget",
        "created": "Skapat"
    },
    "contributors": {
        "list": "Visa bidrag från {users}",
        "truncated_list": "Visa bidrag från {users} och {count} andra"
    },
    "geocoder": {
        "title": "Hitta ett ställe",
        "placeholder": "Hitta ett ställe",
        "no_results": "Kunde inte hitta '{name}'"
    },
    "geolocate": {
        "title": "Visa var jag är"
    },
    "inspector": {
        "no_documentation_combination": "Der er ingen dokumentation for denne tag kombination",
        "no_documentation_key": "Det finns inget dokumentation för denna nyckel.",
        "new_tag": "Ny tagg",
        "view_on_osm": "Visa på OSM",
        "additional": "Fler taggar",
        "choose": "Vad lägger du till?",
        "results": "{n} sökresult för {search}",
        "reference": "Visa OpenStreetMap Wiki →"
    },
    "background": {
        "title": "Bakgrund",
        "description": "Bakgrundsinställningar",
        "percent_brightness": "{opacity}% ljusstyrka",
        "fix_misalignment": "Fixa feljustering",
        "reset": "återställ"
    },
    "restore": {
        "description": "Du har ändringar från förra sessiones som inte har sparats. Vill du spara dessa ändringar?",
        "restore": "Återställ",
        "reset": "Återställ"
    },
    "save": {
        "title": "Spara",
        "help": "Spara ändringer till OpenStreetMap så att andra användare kan se dem.",
        "no_changes": "Inget att spara.",
        "error": "Något gick fel vid sparandet",
        "uploading": "Dina ändringer sparas nu till OpenStreetMap.",
        "unsaved_changes": "Du har icke-sparade ändringer."
    },
    "splash": {
        "welcome": "Välkommen till iD OpenStreetMap redigerare",
        "text": "Detta är utvecklingsversion {version}. Mer information besök {website} och rapportera fel på {github}."
    },
    "source_switch": {
        "live": "live",
        "dev": "dev"
    },
    "tag_reference": {
        "description": "Beskrivning",
        "on_wiki": "{tag} på wiki.osm.org",
        "used_with": "används med {type}"
    },
    "validations": {
        "untagged_point": "Otaggad punkt som inte är del av linje eller område",
        "untagged_line": "Otaggad linje",
        "untagged_area": "Otaggat område",
        "many_deletions": "Du håller på att ta bort {n} objekt. Är du helt säker? Detta tar bort dem för alla som använder openstreetmap.org.",
        "tag_suggests_area": "Denna tagg {tag} indikerar att denna linje borde vara ett område, men detta är inte ett område",
        "deprecated_tags": "Uönskade taggar: {tags}"
    },
    "zoom": {
        "in": "Zooma in",
        "out": "Zooma ut"
    }
};
locale.tr = {
    "modes": {
        "add_area": {
            "title": "Alan",
            "description": "Park, bina, göl ve benzeri alanları haritaya ekle.",
            "tail": "Park, göl ya da bina gibi alanları çizmek için haritaya tıklayın."
        },
        "add_line": {
            "title": "Çizgi",
            "description": "Yollar, sokaklar, patikalar ya da kanallar çizgi ile çizilebilir.",
            "tail": "Yol, patika yada rota çizmek için haritaya tıklayın."
        },
        "add_point": {
            "title": "Nokta",
            "description": "Restoranlar, anıtlar ya da posta kutuları nokta ile gösterilebilir.",
            "tail": "Nokta eklemek için haritaya tıklayın."
        },
        "browse": {
            "title": "Dolaş",
            "description": "Harita üzerinde dolan ve yaklaş."
        },
        "draw_area": {
            "tail": "Alanınıza nokta eklemek için tıklayınız. İlk noktaya tıklayarak alan çizimini bitirebilirsiniz."
        },
        "draw_line": {
            "tail": "Çizgiye daha fazla nokta eklemek için tıklayınız. Diğer çizgilerle bağlamak için üstlerine tıklyınız ve bitirmek için de son noktada çift tıklayınız."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Nokta eklendi.",
                "vertex": "Çizgiye bir nod eklendi."
            }
        },
        "start": {
            "annotation": {
                "line": "Çizgi çizimi başlatıldı.",
                "area": "Alan çizimi başlatıldı."
            }
        },
        "continue": {
            "annotation": {
                "line": "Çizgiye devam edildi.",
                "area": "Alana devam edildi."
            }
        },
        "cancel_draw": {
            "annotation": "Çizim iptal edildi."
        },
        "change_tags": {
            "annotation": "Etiketler değiştirildi."
        },
        "circularize": {
            "title": "Daireleştir",
            "description": {
                "line": "Bu çizgiyi daireleştir.",
                "area": "Bu alanı daireleştir."
            },
            "key": "O",
            "annotation": {
                "line": "Çizgiyi daireleştirin.",
                "area": "Alanı daireleştirin."
            },
            "not_closed": "Bu daireleştirilemez çünkü döngü içerisinde değil."
        },
        "orthogonalize": {
            "title": "Doğrultmak",
            "description": "Köşeleri doğrultun.",
            "key": "Q",
            "annotation": {
                "line": "Çizginin köşeleri doğrultuldu.",
                "area": "Alanın köşeleri doğrultuldu."
            },
            "not_closed": "Bu kareye çevrilemez çünkü bir döngü içerisinde değil."
        },
        "delete": {
            "title": "Sil",
            "description": "Haritan bunu sil.",
            "annotation": {
                "point": "Bir nokta silindi.",
                "vertex": "Yoldan bir nod silindi.",
                "line": "Bir çizgi silindi.",
                "area": "Bir alan silindi.",
                "relation": "Bir ilişki silindi.",
                "multiple": "{n} adet obje silindi."
            }
        },
        "connect": {
            "annotation": {
                "point": "Taraf bir noktaya bağlandı.",
                "vertex": "Bir taraf diğerine bağlandı.",
                "line": "Taraf bir çizgiye bağlandı.",
                "area": "Taraf bir alana bağlandı."
            }
        },
        "disconnect": {
            "title": "Birbirinden Ayır",
            "description": "Her iki çizgi/alanı da birbirinden ayır.",
            "key": "D",
            "annotation": "Çizgier/alanlar birbirinden ayrıldı.",
            "not_connected": "Burada bağlantıyı kesmek için yeteri kadar çizgi/alan yok."
        },
        "merge": {
            "title": "Birleştir",
            "description": "Bu çizgileri birleştir.",
            "key": "C",
            "annotation": "{n} adet çizgi birleştirildi.",
            "not_eligible": "Bu kısımlar birleştirilemez.",
            "not_adjacent": "Bu çizgiler birleştirilemez çünkü bağlı değiller."
        },
        "move": {
            "title": "Taşı",
            "description": "Bunu farklı bir konuma taşı.",
            "key": "M",
            "annotation": {
                "point": "Bir nokta taşındı.",
                "vertex": "Yoldan bir nokta taşındı.",
                "line": "Bir çizgi taşındı.",
                "area": "Bir alan taşındı.",
                "multiple": "Birden fazla obje taşındı."
            },
            "incomplete_relation": "Bu kısım taşınamaz çünkü tamamı indirilmedi."
        },
        "rotate": {
            "title": "Çevir",
            "description": "Bu objeyi merkezi etrafında çevir.",
            "key": "R",
            "annotation": {
                "line": "Çizgi çevrildi.",
                "area": "Alan çevirildi."
            }
        },
        "reverse": {
            "title": "Ters çevir",
            "description": "Bu çizgiyi ters yönde çevir.",
            "key": "V",
            "annotation": "Çizgi ters çevrildi."
        },
        "split": {
            "title": "Ayır",
            "description": {
                "line": "Bu çizgiyi bu noktadan ikiye ayır.",
                "area": "Bu alanın sınırını ikiye ayır.",
                "multiple": "Çizgi/Alan sınırlarını bu noktadan ikiye ayır."
            },
            "key": "X",
            "annotation": {
                "line": "Çizgiyi ayır.",
                "area": "Alan sınırını ayır.",
                "multiple": "{n} adet çizgi/alan sınırı ayrıldı."
            },
            "not_eligible": "Çizgiler başlagıç ya da bitişlerinden ayrılamazlar",
            "multiple_ways": "Burada ayrılacak çok fazla çizgi var"
        }
    },
    "nothing_to_undo": "Geri alınacak birşey yok.",
    "nothing_to_redo": "Tekrar yapılacak birşey yok.",
    "just_edited": "Şu an OpenStreetMap'de bir değişiklik yaptınız!",
    "browser_notice": "Bu editör sadece Firefox, Chrome, Safari, Opera ile Internet Explorer 9 ve üstü tarayıcılarda çalışmaktadır. Lütfen tarayınıcı güncelleyin ya da Potlatch 2'yi kullanarak haritada güncelleme yapınız.",
    "view_on_osm": "OSM üstünde Gör",
    "zoom_in_edit": "Güncelleme yapmak için haritada yakınlaşmalısınız",
    "logout": "Çıkış",
    "loading_auth": "OpenStreetMap'e bağlanıyor...",
    "report_a_bug": "Hata rapor et",
    "commit": {
        "title": "Değişiklikleri kaydet",
        "description_placeholder": "Katkı sağlayanlar hakkında kısa açıklama",
        "message_label": "Mesajı işle",
        "upload_explanation": "{user} kullanıcısı olarak yaptığınız değişiklikler tüm OpenStreetMap kullanan haritalarda görünür olacaktır.",
        "save": "Kaydet",
        "cancel": "İptal",
        "warnings": "Uyarılar",
        "modified": "Değiştirildi",
        "deleted": "Silindi",
        "created": "Oluşturuldu"
    },
    "contributors": {
        "list": "{users} tarafından yapılan katkılar",
        "truncated_list": "{users} ve diğer {count} tarafından yapılan katkılar"
    },
    "geocoder": {
        "title": "Bir Yer Bul",
        "placeholder": "Bir yer bul",
        "no_results": "'{name}' ismindeki yer bulunamadı"
    },
    "geolocate": {
        "title": "Konumumu göster"
    },
    "inspector": {
        "no_documentation_combination": "Bu etiket kombinasyonu için dökümantasyon bulunmamaktadır.",
        "no_documentation_key": "Bu anahtar için dökümantasyon bulunmamaktadır.",
        "show_more": "Daha fazla göster",
        "new_tag": "Yeni Etiket",
        "view_on_osm": "OSM üzerinde gör →",
        "editing_feature": "{feature} düzenleniyor",
        "additional": "Ekstra etiketler",
        "choose": "Kısım tipini seçiniz",
        "results": "{search} kelimesi için {n} adet sonuç ",
        "reference": "OpenStreetMap Wiki'de gör →",
        "back_tooltip": "Kısım tipini değiştir"
    },
    "background": {
        "title": "Arkaplan",
        "description": "Arkaplan Ayarları",
        "percent_brightness": "{opacity}% parlaklık",
        "fix_misalignment": "Yanlış hizalamayı düzelt",
        "reset": "Sıfırla"
    },
    "restore": {
        "heading": "Kaydedilmemiş bir değişikliğiniz var",
        "description": "Daha önceki oturumunuzdan kaydedilmemiş değişiklikler var. Bu değişiklikleri geri getirmek ister misiniz?",
        "restore": "Geri Getir",
        "reset": "Sıfırla"
    },
    "save": {
        "title": "Kaydet",
        "help": "Diğer kullanıcıların yaptığınız değişiklikleri görmesi için OpenStreetMap'e kaydediniz.",
        "no_changes": "Kaydedilecek bir değişiklik yok",
        "error": "Kaydederken bir hata oluştu",
        "uploading": "Değişiklikleriniz OpenStreetMap'e gönderiliyor.",
        "unsaved_changes": "Kaydedilmemiş değişiklikleriniz var"
    },
    "splash": {
        "welcome": "OpenStreetMap Editörü iD'ye hoşgeldiniz",
        "text": "Bu {version} versiyonu geliştirme versiyonudur. Daha fazla bilgi için {website} sitesine bakabilirsiniz ve hataları {github} sitesine raporlayabilirsiniz.",
        "walkthrough": "Örnek çalışmaya başla",
        "start": "Şimdi Düzenle"
    },
    "source_switch": {
        "live": "canlı",
        "lose_changes": "Kaydedilmemiş değişikliğiniz var. Harita sunucusunu değiştirmek bunları kaybetmenize sebep olur. Sunucuyu değiştirmeye emin misiniz?",
        "dev": "geliştirme"
    },
    "tag_reference": {
        "description": "Açıklama",
        "on_wiki": "wiki.osm.org sitesindeki {tag} ",
        "used_with": "{type} ile birlikte"
    },
    "validations": {
        "untagged_point": "Herhangi bir çizgi ya da alana bağlantısı olmayan ve etiketlenmemiş bir nokta.",
        "untagged_line": "Etiketlenmemiş çizgi",
        "untagged_area": "Etiketlenmemiş alan",
        "many_deletions": "Şu an {n} adet objeyi siliyorsunuz. Bunu yapmak istediğinize emin misiniz? Bu işlem ile ilgili objelerin tamamı herkesin ziyaret ettiği openstreetmap.org üzerinden de silinmiş olacaktır.",
        "tag_suggests_area": "{tag} etiketi buranın alan olmasını tavsiye ediyor ama alan değil.",
        "deprecated_tags": "Kullanımdan kaldırılmış etiket : {tags}"
    },
    "zoom": {
        "in": "Yaklaş",
        "out": "Uzaklaş"
    },
    "gpx": {
        "local_layer": "Lokal GPX dosyası",
        "drag_drop": ".gpx dosyasını sayfa üzerine sürükleyip bırakınız"
    },
    "help": {
        "title": "Yardım"
    },
    "intro": {
        "navigation": {
            "drag": "Ana harita alanı OpenStreetMap verisini arka plan olarak size sunmaktadır. Diğer harita uygulamalarında olduğu gibi sürekleyip yaklaş/uzaklaş ile haritada dolaşabilirsiniz. **Haritayı sürükleyin!** ",
            "select": "Harita nesneleri üç farklı şekilde gösterilir : noktalar, çizgiler ve alanlar. Tüm nesneler üzerine tıklanarak seçilebilir. **Bir nokta üzerine tıklayarak seçiniz.**",
            "header": "Başlık bize nesne tipini göstermektedir.",
            "pane": "Bir nesne seçildiği zaman, nesne editörü görünür hale gelir. Başlık kısmı bize nesnenin tipini, ana panel ise nesnenin adı ya da adresi gibi özelliklerini gösterir. **Nesne editörünü sağ üst köşesindeki kapat butonu yardımıyla kapatınız.**"
        },
        "points": {
            "add": "Noktalar dükkanları, restoranları ya da anıtları göstermek için kullanılabilir. Bunlar bir lokasyonu işaretler ve orada ne olduğunu tarif eder. **Nokta butonuna tıklayarak yeni bir nokta ekleyiniz.**",
            "place": "Bir noktayı haritaya tıklayarak yerleştirebilirsiniz. **Bir binanın üstüne noktayı yerleştiriniz.**",
            "search": "Birçok farklı nesne nokta ile gösterilebilir. Az önce eklediğiniz nokta bir kafe olarak işaretlendi. **'Cafe' için arama yapınız**",
            "choose": "**Sistemden kafe seçimi yapınız.**",
            "describe": "Nokta artık kafe olarak işaretlendi. Nesne editörü ile nesneye daha fazla bilgi ekleyebiliriz. **Bir ad ekleyiniz**",
            "close": "Nesne editörü kapat butonuna tıklayarak kapanabilir. **Nesne editörünü kapatınız**",
            "reselect": "Bazen noktalar bulunmaktadır fakat hataları ya da eksiklikleri bulunmaktadır. Bunları düzenleyebiliriz. **Oluşturduğunuz noktayı seçiniz.**",
            "fixname": "**Adı değiştirin ve editörü kapatınız.**",
            "reselect_delete": "Harita üstündeki tüm nesneler silinebilir. **Oluşturduğunuz noktaya tıklayınız.**",
            "delete": "Nokta çevresindeki menü ile farklı operasyonlar gerçekleştirilebilir, silme de bunlardan birisidir. **Noktayı siliniz.**"
        },
        "areas": {
            "add": "Alanlar nesnelerin detaylı gösterimi olarak nitelendirilebilir. Bunlar nesnenin sınırları hakkında bilgi verirler. Alanlar birçok yerde noktaların gösterimi yerine kullanılabilir, hatta onların tercih edilirler. ** Alan butonuna tıklayarak yeni alan ekleyiniz.**",
            "corner": "Alanlar alan sınırlarını belirleyen noktaların konulması ile çizilirler. **Test alanında bir alanın köşe noktasına tıklayarak çizime başlayın.**",
            "place": "Alanı daha fazla nokta ekleyerek çiziniz. Başladığınız noktaya tıklayarak alan çizimini bitiriniz. **Test alanı için bir alan çiziniz.**",
            "search": "**Bir test alanı arayınız.**",
            "choose": "**Sistem üzerinden bir test alanı seçiniz.**",
            "describe": "**Bir ad ekleyerek editörü kapatınız**"
        },
        "lines": {
            "add": "Çizgiler yollar, tren yolları ve akarsu gibi nesneleri göstermek amacıyla kullanılır. **Çizgi butonuna tıklyarak yeni bir çizgi ekleyiniz.**",
            "start": "**Çizimi başlatmak için yolun sonuna tıklayınız.**",
            "intersect": "Tıklayarak çizgiye daha fazla nokta ekleyebilirsiniz. Çizim sırasında gerekli ise haritayı sürükleyebilirsiniz. Yollar ve diğer çizgiler büyük bir ağın parçasıdır. Bu çizgilerin birbirleri ile düzgün bağlantısı sayesinde rotalama uygulamaları çalışabilir. **Flowet Street'e -sokağına- tıklayıp 2 çizgiyi birbirine bağlayan bir kesişim oluşturun.**",
            "finish": "Çizgilerin çizimi son noktalarına tıklanarak bitirilir. **Yolu çizmeyi bitirin**",
            "road": "**Sistemden bir yol seçiniz**",
            "residential": "Çok farklı tiplerde yollar bulunmaktadır, en yaygın olanı Şehir İçi olanlardır. **Şehir için yol tipini şeçiniz**",
            "describe": "**Yola adını verin ve editörü kapatın.**",
            "restart": "Bu yolun \"Flower Street\" -sokağı- ile kesişmesi gerekiyor."
        },
        "startediting": {
            "help": "Daha fazla dökümantasyon ve örnek burada mevcut.",
            "save": "Belli aralıklarla değişikliklerinizi kaydetmeyi unutmayınız!",
            "start": "Haritalamaya başla!"
        }
    },
    "presets": {
        "fields": {
            "access": {
                "label": "Ulaşım"
            },
            "address": {
                "label": "Adres",
                "placeholders": {
                    "housename": "Bina Adı",
                    "number": "123",
                    "street": "Sokak",
                    "city": "Şehir"
                }
            },
            "aeroway": {
                "label": "Tip"
            },
            "amenity": {
                "label": "Tip"
            },
            "atm": {
                "label": "ATM"
            },
            "barrier": {
                "label": "Tip"
            },
            "bicycle_parking": {
                "label": "Tip"
            },
            "building": {
                "label": "Bina"
            },
            "building_area": {
                "label": "Bina"
            },
            "building_yes": {
                "label": "Bina"
            },
            "capacity": {
                "label": "Kapasite"
            },
            "collection_times": {
                "label": "Toplanma Zamanları"
            },
            "construction": {
                "label": "Tip"
            },
            "crossing": {
                "label": "Tip"
            },
            "cuisine": {
                "label": "Mutfak"
            },
            "denomination": {
                "label": "Sınıf"
            },
            "denotation": {
                "label": "Ünvan"
            },
            "elevation": {
                "label": "Yükseklik"
            },
            "emergency": {
                "label": "Acil"
            },
            "entrance": {
                "label": "Tip"
            },
            "fax": {
                "label": "Faks"
            },
            "fee": {
                "label": "Ücret"
            },
            "highway": {
                "label": "Tip"
            },
            "historic": {
                "label": "Tip"
            },
            "internet_access": {
                "label": "İnternet Bağlantısı",
                "options": {
                    "wlan": "Wifi",
                    "wired": "Kablolu",
                    "terminal": "Terminal"
                }
            },
            "landuse": {
                "label": "Tip"
            },
            "layer": {
                "label": "Katman"
            },
            "leisure": {
                "label": "Tip"
            },
            "levels": {
                "label": "Bölümler"
            },
            "man_made": {
                "label": "Tip"
            },
            "maxspeed": {
                "label": "Hız Limiti"
            },
            "natural": {
                "label": "Doğal"
            },
            "network": {
                "label": "Ağ"
            },
            "note": {
                "label": "Not"
            },
            "office": {
                "label": "Tip"
            },
            "oneway": {
                "label": "Tek Yön"
            },
            "oneway_yes": {
                "label": "Tek Yön"
            },
            "opening_hours": {
                "label": "Saatler"
            },
            "operator": {
                "label": "Operatör"
            },
            "phone": {
                "label": "Telefon"
            },
            "place": {
                "label": "Tip"
            },
            "power": {
                "label": "Tip"
            },
            "railway": {
                "label": "Tip"
            },
            "religion": {
                "label": "Dini",
                "options": {
                    "christian": "Hristiyan",
                    "muslim": "Müslüman",
                    "buddhist": "Budist",
                    "jewish": "Yahudi",
                    "hindu": "Hindu",
                    "shinto": "Şinto",
                    "taoist": "Taoist"
                }
            },
            "service": {
                "label": "Tip"
            },
            "shelter": {
                "label": "Barınak"
            },
            "shop": {
                "label": "Tip"
            },
            "source": {
                "label": "Kaynak"
            },
            "sport": {
                "label": "Spor"
            },
            "structure": {
                "label": "Yapı",
                "options": {
                    "bridge": "Köprü",
                    "tunnel": "Tünel"
                }
            },
            "surface": {
                "label": "Yüzey"
            },
            "tourism": {
                "label": "Tip"
            },
            "water": {
                "label": "Tip"
            },
            "waterway": {
                "label": "Tip"
            },
            "website": {
                "label": "Web Sitesi"
            },
            "wetland": {
                "label": "Tip"
            },
            "wikipedia": {
                "label": "Vikipedi"
            },
            "wood": {
                "label": "Tip"
            }
        },
        "presets": {
            "aeroway/aerodrome": {
                "name": "Havaalanı"
            },
            "aeroway/helipad": {
                "name": "Helikopter Pisti"
            },
            "amenity/bank": {
                "name": "Banka"
            },
            "amenity/bar": {
                "name": "Bar"
            },
            "amenity/bicycle_parking": {
                "name": "Bisiklet Parkı"
            },
            "amenity/bicycle_rental": {
                "name": "Bisiklet Kiralama"
            },
            "amenity/cafe": {
                "name": "Kafe",
                "terms": "kahve,çay,kahveci"
            },
            "amenity/cinema": {
                "name": "Sinema"
            },
            "amenity/courthouse": {
                "name": "Mahkeme"
            },
            "amenity/embassy": {
                "name": "Büyükelçilik"
            },
            "amenity/fast_food": {
                "name": "Fast Food"
            },
            "amenity/fire_station": {
                "name": "İtfaiye"
            },
            "amenity/fuel": {
                "name": "Benzinci"
            },
            "amenity/grave_yard": {
                "name": "Mezarlık"
            },
            "amenity/hospital": {
                "name": "Hastane"
            },
            "amenity/library": {
                "name": "Kütüphane"
            },
            "amenity/marketplace": {
                "name": "Pazar Yeri"
            },
            "amenity/parking": {
                "name": "Park Alanı"
            },
            "amenity/pharmacy": {
                "name": "Eczane"
            },
            "amenity/place_of_worship": {
                "name": "İbadethane"
            },
            "amenity/place_of_worship/christian": {
                "name": "Kilise"
            },
            "amenity/place_of_worship/jewish": {
                "name": "Sinagog",
                "terms": "yahudi,sinagog"
            },
            "amenity/place_of_worship/muslim": {
                "name": "Cami",
                "terms": "müslüman,cami"
            },
            "amenity/police": {
                "name": "Polis"
            },
            "amenity/post_office": {
                "name": "Postane"
            },
            "amenity/pub": {
                "name": "Bar"
            },
            "amenity/restaurant": {
                "name": "Restoran"
            },
            "amenity/school": {
                "name": "Okul"
            },
            "amenity/swimming_pool": {
                "name": "Yüzme Havuzu"
            },
            "amenity/telephone": {
                "name": "Telefon"
            },
            "amenity/theatre": {
                "name": "Tiyatro"
            },
            "amenity/toilets": {
                "name": "Tuvalet"
            },
            "amenity/townhall": {
                "name": "Belediye Binası"
            },
            "amenity/university": {
                "name": "Üniversite"
            },
            "barrier": {
                "name": "Bariyer"
            },
            "barrier/block": {
                "name": "Blok"
            },
            "barrier/entrance": {
                "name": "Giriş"
            },
            "barrier/gate": {
                "name": "Kapı"
            },
            "barrier/wall": {
                "name": "Duvar"
            },
            "building": {
                "name": "Bina"
            },
            "building/apartments": {
                "name": "Apartmanlar"
            },
            "building/entrance": {
                "name": "Giriş"
            },
            "entrance": {
                "name": "Giriş"
            },
            "highway/bus_stop": {
                "name": "Otobüs Durağı"
            },
            "highway/crossing": {
                "name": "Geçit"
            },
            "highway/cycleway": {
                "name": "Bisiklet Yolu"
            },
            "highway/footway": {
                "name": "Yaya Yolu"
            },
            "highway/path": {
                "name": "Patika"
            },
            "highway/road": {
                "name": "Bilinmeyen Yol"
            },
            "highway/traffic_signals": {
                "name": "Trafik Sinyali"
            },
            "historic": {
                "name": "Tarihi Site"
            },
            "historic/castle": {
                "name": "Kale"
            },
            "historic/memorial": {
                "name": "Tarihi Anıt"
            },
            "historic/monument": {
                "name": "Anıt"
            },
            "landuse/basin": {
                "name": "Havza"
            },
            "landuse/cemetery": {
                "name": "Mezarlık"
            },
            "landuse/commercial": {
                "name": "Ticari"
            },
            "landuse/construction": {
                "name": "İnşaat"
            },
            "landuse/farm": {
                "name": "Tarla"
            },
            "landuse/forest": {
                "name": "Orman"
            },
            "landuse/grass": {
                "name": "Yeşil Alan"
            },
            "landuse/industrial": {
                "name": "Endüstri"
            },
            "landuse/residential": {
                "name": "Yerleşim"
            },
            "leisure/garden": {
                "name": "Bahçe"
            },
            "leisure/golf_course": {
                "name": "Golf Alanı"
            },
            "leisure/park": {
                "name": "Park"
            },
            "leisure/pitch/american_football": {
                "name": "Amerikan Futbol Sahası"
            },
            "leisure/pitch/baseball": {
                "name": "Beyzbol Sahası"
            },
            "leisure/pitch/basketball": {
                "name": "Basketbol Sahası"
            },
            "leisure/pitch/soccer": {
                "name": "Futbol Sahası"
            },
            "leisure/pitch/tennis": {
                "name": "Tenis Kortu"
            },
            "leisure/playground": {
                "name": "Oyun Alanı"
            },
            "leisure/stadium": {
                "name": "Stadyum"
            },
            "leisure/swimming_pool": {
                "name": "Yüzme Havuzu"
            },
            "man_made/pier": {
                "name": "Rıhtım"
            },
            "natural": {
                "name": "Doğal"
            },
            "natural/beach": {
                "name": "Plaj"
            },
            "natural/spring": {
                "name": "Kaynak"
            },
            "natural/tree": {
                "name": "Ağaç"
            },
            "natural/water": {
                "name": "Su"
            },
            "natural/water/lake": {
                "name": "Göl"
            },
            "natural/water/pond": {
                "name": "Gölet"
            },
            "natural/water/reservoir": {
                "name": "Reservuar"
            },
            "office": {
                "name": "Ofis"
            },
            "other": {
                "name": "Diğer"
            },
            "other_area": {
                "name": "Diğer"
            },
            "place": {
                "name": "Yer"
            },
            "place/island": {
                "name": "Ada"
            },
            "place/village": {
                "name": "Köy"
            },
            "railway/subway": {
                "name": "Metro"
            },
            "railway/subway_entrance": {
                "name": "Metro Girişi"
            },
            "shop": {
                "name": "Dükkan"
            },
            "shop/bakery": {
                "name": "Fırın"
            },
            "shop/beauty": {
                "name": "Güzellik Salonu"
            },
            "shop/books": {
                "name": "Kitapçı"
            },
            "shop/boutique": {
                "name": "Butik"
            },
            "shop/butcher": {
                "name": "Kasap"
            },
            "shop/car_repair": {
                "name": "Tamirci"
            },
            "shop/jewelry": {
                "name": "Kuyumcu"
            },
            "shop/mall": {
                "name": "Alışveriş Merkezi"
            },
            "shop/optician": {
                "name": "Optik"
            },
            "shop/supermarket": {
                "name": "Süpermarket"
            },
            "shop/toys": {
                "name": "Oyuncakçı"
            },
            "shop/travel_agency": {
                "name": "Turizm Acentası"
            },
            "tourism": {
                "name": "Turizm"
            },
            "tourism/camp_site": {
                "name": "Kamp Alanı"
            },
            "tourism/hostel": {
                "name": "Hostel"
            },
            "tourism/hotel": {
                "name": "Otel"
            },
            "tourism/information": {
                "name": "Bilgi"
            },
            "tourism/motel": {
                "name": "Motel"
            },
            "tourism/museum": {
                "name": "Müze"
            },
            "tourism/picnic_site": {
                "name": "Piknik Alanı"
            },
            "tourism/zoo": {
                "name": "Hayvanat Bahçesi"
            },
            "waterway": {
                "name": "Su Yolu"
            },
            "waterway/canal": {
                "name": "Kanal"
            },
            "waterway/dam": {
                "name": "Baraj"
            },
            "waterway/river": {
                "name": "Akarsu"
            }
        }
    }
};
locale.uk = {
    "modes": {
        "add_area": {
            "title": "Полігон",
            "description": "Додати парки, будівлі, озера та інше на мапу.",
            "tail": "Клацніть на мапу, щоб розпочати креслити — наприклад, парк, озеро чи будинок."
        },
        "add_line": {
            "title": "Лінія",
            "description": "Лініями позначаються дороги, вулиці, стежки, чи навіть, канали.",
            "tail": "Клацніть на мапу, щоб розпочати креслити дорогу, стежку чи канал."
        },
        "add_point": {
            "title": "Точка",
            "description": "Ресторани, пам’ятники, поштові скрині.",
            "tail": "Клацніть на мапу, щоб постаивти точку."
        },
        "browse": {
            "title": "Перегляд",
            "description": "Пересування та масштабування мапи."
        },
        "draw_area": {
            "tail": "Клацніть, щоб додати точку до полігону. Клацніть на початкову точку, щоб замкнути полігон."
        },
        "draw_line": {
            "tail": "Клацніть, щоб додати ще точку до лінії. Клацніть на іншу лінію, щоб з’єднатись з нею, подвійне клачання — завершення креслення лінії."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Додано точку.",
                "vertex": "Точку додано до лінії."
            }
        },
        "start": {
            "annotation": {
                "line": "Розпочато креслення лінії.",
                "area": "Розпочато креслення полігону."
            }
        },
        "continue": {
            "annotation": {
                "line": "Лінію подовженно.",
                "area": "Полігон змінено."
            }
        },
        "cancel_draw": {
            "annotation": "Креслення відмінене."
        },
        "change_tags": {
            "annotation": "Теґи змінені."
        },
        "circularize": {
            "title": "Закруглити",
            "key": "O",
            "annotation": {
                "line": "Лінія перетворена на коло.",
                "area": "Полігон перетворено на коло."
            }
        },
        "orthogonalize": {
            "title": "Ортогоналізувати",
            "description": "Зробити кути прямими.",
            "key": "Q",
            "annotation": {
                "line": "Випрямлено кути лінії.",
                "area": "Випрямлено кути полігону."
            }
        },
        "delete": {
            "title": "Вилучити",
            "description": "Вилучити об’єкт з мапи.",
            "annotation": {
                "point": "Вилучено точку.",
                "vertex": "Вилучено точку з лінії.",
                "line": "Вилучено лінію.",
                "area": "Вилучено полігон.",
                "relation": "Вилучено зв’язок.",
                "multiple": "Вилучено {n} обґктів."
            }
        },
        "connect": {
            "annotation": {
                "point": "Лінію приєднано до точки.",
                "vertex": "Лінію приєднано до іншої лінії.",
                "line": "Ліняя з’єднана з іншою лінією.",
                "area": "Лінія з’єднана з полігоном."
            }
        },
        "disconnect": {
            "title": "Роз’єднати",
            "description": "Роз’єднати лінії одна від одної.",
            "key": "D",
            "annotation": "Роз’єднано лінії."
        },
        "merge": {
            "title": "Поєднати",
            "description": "Поєднати лінії.",
            "key": "C",
            "annotation": "З’єднати {n} ліній."
        },
        "move": {
            "title": "Посунтуи",
            "description": "Посунути об’єкт на інше місце.",
            "key": "M",
            "annotation": {
                "point": "Точку посунуто.",
                "vertex": "Точку лінії посунуто.",
                "line": "Лінію посунуто.",
                "area": "Полігон посунуто.",
                "multiple": "Посунуто кілька об’єктів."
            }
        },
        "rotate": {
            "title": "Обернути",
            "description": "Обернути об’єкт навколо його центру.",
            "key": "R",
            "annotation": {
                "line": "Напрямок лінії змінено.",
                "area": "Полігон обернуто."
            }
        },
        "reverse": {
            "title": "Розвернути",
            "description": "Змінити напрямок лінії на протилежний.",
            "key": "V",
            "annotation": "Напрямок лінії змінено."
        },
        "split": {
            "title": "Розділити",
            "key": "X"
        }
    },
    "nothing_to_undo": "Скасовувати нічого.",
    "nothing_to_redo": "Повертати нічого.",
    "just_edited": "Ви тільки що відредагували мапу OpenStreetMap!",
    "browser_notice": "Цей редактор працює в оглядачах Firefox, Chrome, Safari, Opera і Internet Explorer версії 9 і вище.  Будь ласка, оновіть свій оглядач або скористайтеся редактором Potlatch 2.",
    "view_on_osm": "Подивитись в ОСМ",
    "zoom_in_edit": "наблизтесь, щоб редагувати",
    "logout": "вийти",
    "loading_auth": "З’єднання з OpenStreetMap…",
    "report_a_bug": "повідомити про помилку",
    "commit": {
        "title": "Зберегти зміни",
        "description_placeholder": "Короткий опис ваших правок",
        "message_label": "Надіслати повідомлення",
        "upload_explanation": "Зміни, зроблені вами під іменем {user}, з’являться на всіх мапах, що використовують дані OpenStreetMap.",
        "save": "Зберегти",
        "cancel": "Відмінити",
        "warnings": "Попередження",
        "modified": "Змінено",
        "deleted": "Вилучено",
        "created": "Створено"
    },
    "contributors": {
        "list": "Тут мапу редагували: {users}",
        "truncated_list": "Тут мапу редагували {users} та ще {count} інших"
    },
    "geocoder": {
        "title": "Знайти місце",
        "placeholder": "знайти місце",
        "no_results": "Неможливо знайти '{name}'"
    },
    "geolocate": {
        "title": "Моє місцезнаходження"
    },
    "inspector": {
        "no_documentation_combination": "Для цієї комбінації теґів немає документації",
        "no_documentation_key": "Для цього теґа немає документації",
        "show_more": "Ще",
        "new_tag": "Новий теґ",
        "view_on_osm": "Подивтись в ОСМ",
        "editing_feature": "Властивості {feature}",
        "additional": "Додаткові теґи",
        "choose": "Виберіть тип об’єкту",
        "results": "знайдено {n} об’єктів на запит {search}",
        "reference": "Подивитись на OpenStreetMap Wiki →",
        "back_tooltip": "Змінити тип об’єкта"
    },
    "background": {
        "title": "Фон",
        "description": "Налаштування фону",
        "percent_brightness": "прозорість {opacity}%",
        "fix_misalignment": "Виправити зсув",
        "reset": "скинути"
    },
    "restore": {
        "heading": "Ви маєте незбережені правки",
        "description": "У вас виявилися незбережені правки з минулого разу. Відновити їх?",
        "restore": "Відновити",
        "reset": "Відкинути"
    },
    "save": {
        "title": "Зберегти",
        "help": "Зберегти зміни надіславши їх на OpenStreetMap, та зробивши їх доступними всім іншим.",
        "no_changes": "Зміни для збереження відсутні.",
        "error": "Під час збереження виникла помилка",
        "uploading": "Надсилання змін до OpenStreetMap.",
        "unsaved_changes": "Ви маєте незбережені правки"
    },
    "splash": {
        "welcome": "Ласкаво просимо до редактора OpenStreetMap — iD",
        "text": "Це експериментальна версія {version}. Докладніше на {website}, сповіщайте про помилки на {github}.",
        "walkthrough": "Подивитись Покрокове керівництво",
        "start": "Розпочати редагування"
    },
    "source_switch": {
        "live": "основна",
        "lose_changes": "Ви маєте незбережені правки. Перемикання на інший сервер мап призведе до їх втрати. Ви дійсно бажаєте підключитись до іншого серверу?",
        "dev": "тест"
    },
    "tag_reference": {
        "description": "Опис",
        "on_wiki": "{tag} на wiki.osm.org",
        "used_with": "використовується з {type}"
    },
    "validations": {
        "untagged_point": "Точка без теґів, що не є частиною лінію чи полігону",
        "untagged_line": "Лінія без теґів",
        "untagged_area": "Полігон без  теґів",
        "tag_suggests_area": "Теґ {tag} зазвичай ставться на полігони, але об’єкт ним не є",
        "deprecated_tags": "Застарілі теґи: {tags}"
    },
    "zoom": {
        "in": "Наблизитись",
        "out": "Віддалитись"
    },
    "gpx": {
        "local_layer": "Локальний файл GPX",
        "drag_drop": "Перетягніть файл .gpx на сторінку"
    },
    "help": {
        "title": "Довідка",
        "help": "# Довідка\n\nЦе редактор для [OpenStreetMap](http://www.openstreetmap.org/),\nвільної мапи світу, яку може редагувати кожний. Ви можете використовувати \nредактор для додавання та уточнення даних у вашій місцевості, роблячи \nмапу вільних та відкритих даних світу ще кращою.\n\nВаші правки будуть доступні кожному, хто користується мапою OpenStreetMap. \nДля того, щоб їх вносити вам потрібно [зареєструватись в OpenStreetMap](https://www.openstreetmap.org/user/new).\n\n[Редактор iD](http://ideditor.com/) —  є спільним проектом [сирці якого \nдоступні на GitHub](https://github.com/systemed/iD).\n",
        "editing_saving": "# Редагування та збереження\n\nЦей редактор створений переважно для роботи онлайн, і ви зараз\nпрацюєте з ним на веб-сайті.\n\n### Виділення об’єктів\n\nДля виділення об’єктів на мапі, таких як дороги чи пам’ятки, треба\nклацнути по них на мапі. Виділені об’єкти будуть підсвічені, з’явиться\nпанель з подробицями про них та меню із переліком того, що можна\nзробити.\n\nДля виділення кількох об’єктів натисніть 'Shift', клацніть та потягніть\nмишею по мапі. Будуть виділені всі об’єкти, що попали у прямокутник\nвиділення, це дозволить вам виконувати дії одночасно над кількома\nоб’єктами одночасно.\n\n### Збереження правок\n\nПісля того як ви зробили зміни, виправивши дорогу, чи будинок, вони є\nлокальними доки ви не збережете їх на сервері. Не хвилюйтесь, якщо\nви припустились помилки, ви можете відмінити зміни натиснувши на\nкнопку 'Відмінити', а також повернути зміни — натиснувши 'Повернути'\n\nНатисніть 'Зберегти', щоб закінчити групу правок, наприклад, якщо ви\nзакінчили роботу над одним районом міста і бажаєте перейти до іншого.\nВи будете мати можливість переглянути те, що ви зробили, а редактор\nзапропонує вам корисні поради та видасть попередження, якщо у ваші\nправки не виглядають вірними.\n\nЯкщо все виглядає добре, ви можете додати коротке пояснення того, що\nви зробили та натиснути кнопку 'Зберегти' ще раз, щоб надіслати зміни\nдо  [OpenStreetMap.org](http://www.openstreetmap.org/), де вони стануть\nдоступні для всіх інших користувачів для перегляду та вдосконалення.\n\nЯкщо ви не можете закінчити ваші правки за один раз, ви можете лишити\nвікно з редактором відкритим і повернутись (на тому самому комп’ютері та\nоглядачі) до роботи потім — редактор запропонує вам відновити вашу\nроботу.\n"
    },
    "intro": {
        "navigation": {
            "drag": "На основній мапі показуються данні OpenStreetMap поверх фонового зображення.  Ви можете рухатись мапою перетягуючи її так само, як і на будь якій іншій веб-мапі. **Потягніть мапу!**",
            "select": "Об’єкти мапи показані трьома різними способами: у вигляді точок, ліній та полігонів. Для того щоб їх виділити треба клацнути по них. **Клацніть на точку для її виділення.**",
            "header": "В заголовку показується тип об’єкта."
        }
    },
    "presets": {
        "fields": {
            "access": {
                "label": "Доступ"
            },
            "address": {
                "label": "Адреса",
                "placeholders": {
                    "housename": "Назвабудинку",
                    "number": "Номер",
                    "street": "Вулиця",
                    "city": "Місто"
                }
            },
            "aeroway": {
                "label": "Тип"
            },
            "amenity": {
                "label": "Тип"
            },
            "atm": {
                "label": "Банкомат"
            },
            "barrier": {
                "label": "Тип"
            },
            "bicycle_parking": {
                "label": "Тип"
            },
            "building": {
                "label": "Будинок"
            },
            "building_area": {
                "label": "Будинок"
            },
            "building_yes": {
                "label": "Будинок"
            },
            "capacity": {
                "label": "Міськість"
            },
            "collection_times": {
                "label": "Час виїмки пошти"
            },
            "construction": {
                "label": "Тип"
            },
            "country": {
                "label": "Країна"
            },
            "crossing": {
                "label": "Тип"
            },
            "cuisine": {
                "label": "Кухня"
            },
            "denomination": {
                "label": "Віросповідання"
            },
            "denotation": {
                "label": "Позначення"
            },
            "elevation": {
                "label": "Висота"
            },
            "emergency": {
                "label": "Аварійні служби"
            },
            "entrance": {
                "label": "Тип"
            },
            "fax": {
                "label": "Факс"
            },
            "fee": {
                "label": "Плата"
            },
            "highway": {
                "label": "Тип"
            },
            "historic": {
                "label": "Тип"
            },
            "internet_access": {
                "label": "Доступ до Інтеренету",
                "options": {
                    "wlan": "Wifi",
                    "wired": "Дротовий",
                    "terminal": "Термінал"
                }
            },
            "landuse": {
                "label": "Тип"
            },
            "layer": {
                "label": "Шар"
            },
            "leisure": {
                "label": "Тип"
            },
            "levels": {
                "label": "Поверхи"
            },
            "man_made": {
                "label": "Тип"
            },
            "maxspeed": {
                "label": "Обмеження швидкості"
            },
            "name": {
                "label": "Назва"
            },
            "natural": {
                "label": "Природа"
            },
            "network": {
                "label": "Мережа"
            },
            "note": {
                "label": "Примітка"
            },
            "office": {
                "label": "Тип"
            },
            "oneway": {
                "label": "Односторонній рух"
            },
            "oneway_yes": {
                "label": "Односторонній рух"
            },
            "opening_hours": {
                "label": "Години"
            },
            "operator": {
                "label": "Оператор"
            },
            "phone": {
                "label": "Телефон"
            },
            "place": {
                "label": "Тип"
            },
            "power": {
                "label": "Тип"
            },
            "railway": {
                "label": "Тип"
            },
            "ref": {
                "label": "Посилання"
            },
            "religion": {
                "label": "Релігія",
                "options": {
                    "christian": "Християнство",
                    "muslim": "Мусульманство",
                    "buddhist": "Будизм",
                    "jewish": "Іудейство",
                    "hindu": "Хінду",
                    "shinto": "Сінто",
                    "taoist": "Даосизм"
                }
            },
            "service": {
                "label": "Тип"
            },
            "shelter": {
                "label": "Притулок"
            },
            "shop": {
                "label": "Тип"
            },
            "source": {
                "label": "Джерело"
            },
            "sport": {
                "label": "Спорт"
            },
            "structure": {
                "label": "Споруда",
                "options": {
                    "bridge": "Міст",
                    "tunnel": "Тунель",
                    "embankment": "Насип",
                    "cutting": "Виїмка"
                }
            },
            "surface": {
                "label": "Поверхня"
            },
            "tourism": {
                "label": "Тип"
            },
            "water": {
                "label": "Тип"
            },
            "waterway": {
                "label": "Тип"
            },
            "website": {
                "label": "Вебсайт"
            },
            "wetland": {
                "label": "Тип"
            },
            "wheelchair": {
                "label": "Для інвалідних візків"
            },
            "wikipedia": {
                "label": "Вікіпедія"
            },
            "wood": {
                "label": "Тип"
            }
        },
        "presets": {
            "aeroway": {
                "name": "Аеропорт"
            },
            "aeroway/aerodrome": {
                "name": "Аеропорт",
                "terms": "літак,аеропорт,аеродром"
            },
            "aeroway/helipad": {
                "name": "Вертолітний майданчик",
                "terms": "вертоліт,вертолітний майданчик,вертодром"
            },
            "amenity": {
                "name": "Зручності"
            },
            "amenity/bank": {
                "name": "Банк",
                "terms": "депозитний сейф,бухгалтерія,кредитна спілка,казна,фонди,накопичення,інвестиційна компанія,сховище,резерв,скарбниця,сейф,заощадження,біржа,запаси,запас,скарбниця,багатство,казначейство,трастова компанія,сховище"
            },
            "amenity/bar": {
                "name": "Бар"
            },
            "amenity/bench": {
                "name": "Лавка"
            },
            "amenity/bicycle_parking": {
                "name": "Вело-парковка"
            },
            "amenity/bicycle_rental": {
                "name": "Прокат велосипедів"
            },
            "amenity/cafe": {
                "name": "Кафе",
                "terms": "кава,чай,кав’ярня"
            },
            "amenity/cinema": {
                "name": "Кінотеатр"
            },
            "amenity/courthouse": {
                "name": "Суд"
            },
            "amenity/embassy": {
                "name": "Амбасада"
            },
            "amenity/fast_food": {
                "name": "Фаст-Фуд"
            },
            "amenity/fire_station": {
                "name": "Пожежна станція"
            },
            "amenity/fuel": {
                "name": "Заправка"
            },
            "amenity/grave_yard": {
                "name": "Цвинтар"
            },
            "amenity/hospital": {
                "name": "Лікарня"
            },
            "amenity/library": {
                "name": "Бібліотека"
            },
            "amenity/marketplace": {
                "name": "Ринок"
            },
            "amenity/parking": {
                "name": "Стоянка"
            },
            "amenity/pharmacy": {
                "name": "Аптека"
            },
            "amenity/place_of_worship": {
                "name": "Культове місце"
            },
            "amenity/place_of_worship/christian": {
                "name": "Церква"
            },
            "amenity/place_of_worship/jewish": {
                "name": "Синагога",
                "terms": "іудейство,синагога"
            },
            "amenity/place_of_worship/muslim": {
                "name": "Мечеть",
                "terms": "мусульманство,мечеть"
            },
            "amenity/police": {
                "name": "Міліція/Поліція"
            },
            "amenity/post_box": {
                "name": "Поштова скриня"
            },
            "amenity/post_office": {
                "name": "Пошта"
            },
            "amenity/pub": {
                "name": "Паб"
            },
            "amenity/restaurant": {
                "name": "Ресторан"
            },
            "amenity/school": {
                "name": "Школа"
            },
            "amenity/swimming_pool": {
                "name": "Басейн"
            },
            "amenity/telephone": {
                "name": "Телефон"
            },
            "amenity/theatre": {
                "name": "Театр",
                "terms": "театр,вистава,гра,музичний"
            },
            "amenity/toilets": {
                "name": "Туалет"
            },
            "amenity/townhall": {
                "name": "Міська державна адміністрація"
            },
            "amenity/university": {
                "name": "Університет"
            },
            "barrier": {
                "name": "Перепони"
            },
            "barrier/block": {
                "name": "Блок"
            },
            "barrier/bollard": {
                "name": "Стовпчик"
            },
            "barrier/cattle_grid": {
                "name": "Перешкода для худоби"
            },
            "barrier/city_wall": {
                "name": "Міська стіна"
            },
            "barrier/cycle_barrier": {
                "name": "Перешкода для велосипедистів"
            },
            "barrier/ditch": {
                "name": "Канава"
            },
            "barrier/entrance": {
                "name": "Вхід"
            },
            "barrier/fence": {
                "name": "Огорожа"
            },
            "barrier/gate": {
                "name": "Ворота"
            },
            "barrier/hedge": {
                "name": "Жива огорожа"
            },
            "barrier/kissing_gate": {
                "name": "Вузька хвіртка"
            },
            "barrier/lift_gate": {
                "name": "Шлагбаум"
            },
            "barrier/retaining_wall": {
                "name": "Підпірна стіна"
            },
            "barrier/stile": {
                "name": "Перелаз/Турнікет"
            },
            "barrier/toll_booth": {
                "name": "Пункт сплати за проїзд"
            },
            "barrier/wall": {
                "name": "Стіна"
            },
            "boundary/administrative": {
                "name": "Адміністративний кордон"
            },
            "building": {
                "name": "Будинок"
            },
            "building/entrance": {
                "name": "Вхід"
            },
            "building/house": {
                "name": "Дім"
            },
            "entrance": {
                "name": "Вхід"
            },
            "highway": {
                "name": "Дорога"
            },
            "highway/bridleway": {
                "name": "Сходи"
            },
            "highway/bus_stop": {
                "name": "Автобусна зупинка"
            },
            "highway/crossing": {
                "name": "Прехресття"
            },
            "highway/cycleway": {
                "name": "Вело-доріжка"
            },
            "highway/footway": {
                "name": "Тротуар"
            },
            "highway/motorway": {
                "name": "Автомагістраль"
            },
            "highway/motorway_link": {
                "name": "З’їзд з/на автомагістраль"
            },
            "highway/path": {
                "name": "Тропа"
            },
            "highway/primary": {
                "name": "Головна дорога"
            },
            "highway/primary_link": {
                "name": "З’їзд з/на головну дорогу"
            },
            "highway/residential": {
                "name": "Дорога місцевого значення"
            },
            "highway/road": {
                "name": "Тип невідомий"
            },
            "highway/secondary": {
                "name": "Другорядна дорога"
            },
            "highway/secondary_link": {
                "name": "З’їзд з/на другорядну дорогу"
            },
            "highway/service": {
                "name": "Третинна дорога"
            },
            "highway/steps": {
                "name": "Сходи"
            },
            "highway/tertiary": {
                "name": "Третинна дорога"
            },
            "highway/tertiary_link": {
                "name": "З’їзд з/на третинну дорогу"
            },
            "highway/track": {
                "name": "Грунтовка"
            },
            "highway/traffic_signals": {
                "name": "Світлофор"
            },
            "highway/trunk": {
                "name": "Шосе"
            },
            "highway/trunk_link": {
                "name": "З’їзд з/на шосе"
            },
            "highway/turning_circle": {
                "name": "Місце для розвороту"
            },
            "highway/unclassified": {
                "name": "Не має класифікації"
            },
            "historic": {
                "name": "Історичні місця"
            },
            "historic/archaeological_site": {
                "name": "Археологічні пам’ятки"
            },
            "historic/boundary_stone": {
                "name": "Прикордонний камінь"
            },
            "historic/castle": {
                "name": "За́мок"
            },
            "historic/memorial": {
                "name": "Пам’ятник"
            },
            "historic/monument": {
                "name": "Пам’ятник"
            },
            "historic/ruins": {
                "name": "Руїни"
            },
            "historic/wayside_cross": {
                "name": "Придорожній хрест"
            },
            "historic/wayside_shrine": {
                "name": "Придорожня рака"
            },
            "landuse": {
                "name": "Землекористування"
            },
            "landuse/allotments": {
                "name": "Дачі/горо́ди"
            },
            "landuse/basin": {
                "name": "Водойма"
            },
            "landuse/cemetery": {
                "name": "Кладовище"
            },
            "landuse/commercial": {
                "name": "Діловий район"
            },
            "landuse/construction": {
                "name": "Будівництво"
            },
            "landuse/farm": {
                "name": "Ферма"
            },
            "landuse/farmyard": {
                "name": "Двір ферми"
            },
            "landuse/forest": {
                "name": "Лісовий масив"
            },
            "landuse/grass": {
                "name": "Трава"
            },
            "landuse/industrial": {
                "name": "Промзона"
            },
            "landuse/meadow": {
                "name": "Левада"
            },
            "landuse/orchard": {
                "name": "Сад"
            },
            "landuse/quarry": {
                "name": "Кар’єр"
            },
            "landuse/residential": {
                "name": "Житлова зона"
            },
            "landuse/vineyard": {
                "name": "Виноградник"
            },
            "leisure": {
                "name": "Дозвілля"
            },
            "leisure/garden": {
                "name": "Сад"
            },
            "leisure/golf_course": {
                "name": "Поле для гольфу"
            },
            "leisure/marina": {
                "name": "Пристань для яхт"
            },
            "leisure/park": {
                "name": "Парк"
            },
            "leisure/pitch": {
                "name": "Спортивний майданчик"
            },
            "leisure/pitch/american_football": {
                "name": "Поле для американського футболу"
            },
            "leisure/pitch/baseball": {
                "name": "Бейсбольний майданчик"
            },
            "leisure/pitch/basketball": {
                "name": "Баскетбольний майданчик"
            },
            "leisure/pitch/soccer": {
                "name": "Футбольне поле"
            },
            "leisure/pitch/tennis": {
                "name": "Тенісний майданчик"
            },
            "leisure/playground": {
                "name": "Ігровий майданчик"
            },
            "leisure/slipway": {
                "name": "Сліп"
            },
            "leisure/stadium": {
                "name": "Стадіон"
            },
            "leisure/swimming_pool": {
                "name": "Басейн"
            },
            "man_made": {
                "name": "Штучні споруди"
            },
            "man_made/lighthouse": {
                "name": "Маяк"
            },
            "man_made/pier": {
                "name": "Пірс"
            },
            "man_made/survey_point": {
                "name": "Геодезичний пункт"
            },
            "man_made/wastewater_plant": {
                "name": "Очисні споруди"
            },
            "man_made/water_tower": {
                "name": "Водонапірна вежа"
            },
            "natural": {
                "name": "Природа"
            },
            "natural/bay": {
                "name": "Затока"
            },
            "natural/beach": {
                "name": "Пляж"
            },
            "natural/cliff": {
                "name": "Скеля/Яр"
            },
            "natural/coastline": {
                "name": "Берегова лінія",
                "terms": "прибійна смуга"
            },
            "natural/glacier": {
                "name": "Льодовик"
            },
            "natural/grassland": {
                "name": "Трави"
            },
            "natural/heath": {
                "name": "Пустир/Вереск"
            },
            "natural/peak": {
                "name": "Пік"
            },
            "natural/scrub": {
                "name": "Чагарник"
            },
            "natural/spring": {
                "name": "Джерело"
            },
            "natural/tree": {
                "name": "Дерево"
            },
            "natural/water": {
                "name": "Вода"
            },
            "natural/water/lake": {
                "name": "Озеро"
            },
            "natural/water/pond": {
                "name": "Ставок"
            },
            "natural/water/reservoir": {
                "name": "Резервуар"
            },
            "natural/wetland": {
                "name": "Заболочені землі"
            },
            "natural/wood": {
                "name": "Дерева"
            },
            "office": {
                "name": "Офіс"
            },
            "other": {
                "name": "Інше"
            },
            "other_area": {
                "name": "Інше"
            },
            "place": {
                "name": "Місцевість"
            },
            "place/hamlet": {
                "name": "Хутір"
            },
            "place/island": {
                "name": "Острів"
            },
            "place/locality": {
                "name": "Місцевість"
            },
            "place/village": {
                "name": "Село"
            },
            "power": {
                "name": "Енергетика"
            },
            "power/generator": {
                "name": "Електростанція"
            },
            "power/line": {
                "name": "Лінія електропередач"
            },
            "power/pole": {
                "name": "Опора"
            },
            "power/sub_station": {
                "name": "Підстанція"
            },
            "power/tower": {
                "name": "Опора ЛЕП"
            },
            "power/transformer": {
                "name": "Трансформатор"
            },
            "railway": {
                "name": "Залізниця"
            },
            "railway/abandoned": {
                "name": "Занедбані колії"
            },
            "railway/disused": {
                "name": "Путі, що не використовуються"
            },
            "railway/level_crossing": {
                "name": "Залізничний переїзд"
            },
            "railway/monorail": {
                "name": "Монорейка"
            },
            "railway/rail": {
                "name": "Рейки"
            },
            "railway/subway": {
                "name": "Метрополітен"
            },
            "railway/subway_entrance": {
                "name": "Вхід до метро"
            },
            "railway/tram": {
                "name": "Трамвай"
            },
            "shop": {
                "name": "Магазини/Майстерні"
            },
            "shop/bakery": {
                "name": "Булочна"
            },
            "shop/beverages": {
                "name": "Напої"
            },
            "shop/bicycle": {
                "name": "Веломагазин"
            },
            "shop/books": {
                "name": "Книгарня"
            },
            "shop/boutique": {
                "name": "Бутік"
            },
            "shop/butcher": {
                "name": "М’ясна лавка"
            },
            "shop/car": {
                "name": "Автосалон"
            },
            "shop/car_parts": {
                "name": "Автозапчастини"
            },
            "shop/car_repair": {
                "name": "Автомайстерня"
            },
            "shop/chemist": {
                "name": "Побутова хімія"
            },
            "shop/clothes": {
                "name": "Одяг"
            },
            "shop/computer": {
                "name": "Комп’ютери"
            },
            "shop/confectionery": {
                "name": "Кондитерська"
            },
            "shop/convenience": {
                "name": "міні-маркет"
            },
            "shop/deli": {
                "name": "Делікатеси/Вишукана їжа"
            },
            "shop/department_store": {
                "name": "Універмаг"
            },
            "shop/doityourself": {
                "name": "Зроби сам"
            },
            "shop/dry_cleaning": {
                "name": "Хімчистка"
            },
            "shop/electronics": {
                "name": "Електроніка"
            },
            "shop/fishmonger": {
                "name": "Риба"
            },
            "shop/florist": {
                "name": "Квіти"
            },
            "shop/furniture": {
                "name": "Меблі"
            },
            "shop/garden_centre": {
                "name": "Садово-парковий центр"
            },
            "shop/gift": {
                "name": "Подарунки"
            },
            "shop/greengrocer": {
                "name": "Овочевий"
            },
            "shop/hairdresser": {
                "name": "Перукарня"
            },
            "shop/hardware": {
                "name": "Господарські товари"
            },
            "shop/hifi": {
                "name": "Аудіо апаратура"
            },
            "shop/jewelry": {
                "name": "Ювелірні прикраси"
            },
            "shop/kiosk": {
                "name": "Кіоск"
            },
            "shop/laundry": {
                "name": "Пральня"
            },
            "shop/mall": {
                "name": "Торгівельний центр"
            },
            "shop/mobile_phone": {
                "name": "Мобільні телефони"
            },
            "shop/motorcycle": {
                "name": "Мотомагазин"
            },
            "shop/music": {
                "name": "Музичний магазин"
            },
            "shop/optician": {
                "name": "Оптика"
            },
            "shop/outdoor": {
                "name": "Товари для активного відпочинку"
            },
            "shop/pet": {
                "name": "Товари для тварин"
            },
            "shop/shoes": {
                "name": "Взуття"
            },
            "shop/sports": {
                "name": "Спорттовари"
            },
            "shop/stationery": {
                "name": "Канцтовари"
            },
            "shop/supermarket": {
                "name": "Супермаркет"
            },
            "shop/toys": {
                "name": "Іграшки"
            },
            "shop/travel_agency": {
                "name": "Туристична агенція"
            },
            "shop/tyres": {
                "name": "Колеса та шини"
            },
            "shop/vacant": {
                "name": "Здається в оренду"
            },
            "shop/variety_store": {
                "name": "Універсам"
            },
            "shop/video": {
                "name": "Відео"
            },
            "tourism": {
                "name": "Туризм"
            },
            "tourism/alpine_hut": {
                "name": "Гірський притулок"
            },
            "tourism/artwork": {
                "name": "Витвори мистецтв"
            },
            "tourism/attraction": {
                "name": "Визначне місце"
            },
            "tourism/camp_site": {
                "name": "Кемпінг"
            },
            "tourism/caravan_site": {
                "name": "Караван-парк"
            },
            "tourism/chalet": {
                "name": "Шале"
            },
            "tourism/guest_house": {
                "name": "Гостьовий будинок"
            },
            "tourism/hostel": {
                "name": "Хостел"
            },
            "tourism/hotel": {
                "name": "Готель"
            },
            "tourism/information": {
                "name": "Інформація"
            },
            "tourism/motel": {
                "name": "Мотель"
            },
            "tourism/museum": {
                "name": "Музей"
            },
            "tourism/picnic_site": {
                "name": "Місце для пікніка"
            },
            "tourism/theme_park": {
                "name": "Тематичний парк"
            },
            "tourism/viewpoint": {
                "name": "Оглядовий майданчик"
            },
            "tourism/zoo": {
                "name": "Зоопарк"
            },
            "waterway": {
                "name": "Водний шлях"
            },
            "waterway/canal": {
                "name": "Канал"
            },
            "waterway/dam": {
                "name": "Дамба"
            },
            "waterway/ditch": {
                "name": "Канава"
            },
            "waterway/drain": {
                "name": "Дренажний канал"
            },
            "waterway/river": {
                "name": "Ріка"
            },
            "waterway/riverbank": {
                "name": "Берег ріки"
            },
            "waterway/stream": {
                "name": "Струмок"
            },
            "waterway/weir": {
                "name": "Водозлив"
            }
        }
    }
};
locale.vi = {
    "modes": {
        "add_area": {
            "title": "Vùng",
            "description": "Thêm công viên, tòa nhà, hồ nước, hoặc vùng khác vào bản đồ.",
            "tail": "Nhấn vào bản đồ để bắt đầu vẽ vùng."
        },
        "add_line": {
            "title": "Đường",
            "description": "Thêm con đường, lối đi bộ, dòng nước, hoặc đường kẻ khác vào bản đồ.",
            "tail": "Nhấn vào bản đồ để bắt đầu vẽ đường kẻ."
        },
        "add_point": {
            "title": "Điểm",
            "description": "Thêm nhà hàng, đài kỷ niệm, hòm thư, hoặc địa điểm khác.",
            "tail": "Nhấn vào bản đồ để thêm địa điểm."
        },
        "browse": {
            "title": "Duyệt",
            "description": "Di chuyển và thu phóng bản đồ."
        },
        "draw_area": {
            "tail": "Nhấn chuột để thêm nốt vào vùng. Nhấn nốt đầu tiên để hoàn thành vùng."
        },
        "draw_line": {
            "tail": "Nhấn chuột để thêm nốt vào đường kẻ. Nhấn vào đường khác để nối đường lại. Nhấn đúp để hoàn thành đường."
        }
    },
    "operations": {
        "add": {
            "annotation": {
                "point": "Đã thêm địa điểm.",
                "vertex": "Đã thêm nốt vào lối."
            }
        },
        "start": {
            "annotation": {
                "line": "Đã bắt đầu vẽ đường kẻ.",
                "area": "Đã bắt đầu vẽ vùng."
            }
        },
        "continue": {
            "annotation": {
                "line": "Đã vẽ tiếp đường kẻ.",
                "area": "Đã vẽ tiếp vùng."
            }
        },
        "cancel_draw": {
            "annotation": "Đã hủy vẽ đối tượng."
        },
        "change_tags": {
            "annotation": "Đã thay đổi thẻ."
        },
        "circularize": {
            "title": "Làm Tròn",
            "description": {
                "line": "Làm tròn đường kẻ này.",
                "area": "Làm tròn vùng này."
            },
            "key": "O",
            "annotation": {
                "line": "Đã làm tròn một đường kẻ.",
                "area": "Đã làm tròn một vùng."
            },
            "not_closed": "Không thể làm tròn một đối tượng không phải là đa giác kín."
        },
        "orthogonalize": {
            "title": "Làm Vuông góc",
            "description": "Làm vuông góc một đối tượng.",
            "key": "Q",
            "annotation": {
                "line": "Đã làm vuông góc một đường kẻ.",
                "area": "Đã làm vuông góc một vùng."
            },
            "not_closed": "Không thể làm vuông góc một đối tượng không phải là đa giác kín."
        },
        "delete": {
            "title": "Xóa",
            "description": "Xóa đối tượng này khỏi bản đồ.",
            "annotation": {
                "point": "Đã xóa địa điểm.",
                "vertex": "Đã xóa nốt khỏi lối.",
                "line": "Đã xóa đường kẻ.",
                "area": "Đã xóa vùng.",
                "relation": "Đã xóa quan hệ.",
                "multiple": "Đã xóa {n} đối tượng."
            }
        },
        "connect": {
            "annotation": {
                "point": "Đã nối liền lối với địa điểm.",
                "vertex": "Đã nối liền đường kẻ với đường khác.",
                "line": "Đã nối liền lối với đường kẻ.",
                "area": "Đã nối liền đường kẻ với vùng."
            }
        },
        "disconnect": {
            "title": "Tháo gỡ",
            "description": "Gỡ các lối này khỏi nhau.",
            "key": "G",
            "annotation": "Đã tháo gỡ đường kẻ và vùng.",
            "not_connected": "Không có đủ đường kẻ hoặc vùng ở đây để tháo gỡ."
        },
        "merge": {
            "title": "Hợp nhất",
            "description": "Hợp nhất các đường kẻ này.",
            "key": "H",
            "annotation": "Đã hợp nhất {n} đường kẻ.",
            "not_eligible": "Không thể hợp nhất các đối tượng này.",
            "not_adjacent": "Không thể hợp nhất các đường kẻ không nối liền với nhau."
        },
        "move": {
            "title": "Di chuyển",
            "description": "Di chuyển đối tượng này sang chỗ khác.",
            "key": "D",
            "annotation": {
                "point": "Đã di chuyển địa điểm.",
                "vertex": "Đã di chuyển nốt trong lối.",
                "line": "Đã di chuyển đường kẻ.",
                "area": "Đã di chuyển vùng.",
                "multiple": "Đã di chuyển hơn một đối tượng."
            },
            "incomplete_relation": "Không thể di chuyển đối tượng chưa được tải về hoàn toàn."
        },
        "rotate": {
            "title": "Xoay",
            "description": "Xoay đối tượng này quanh trung tâm.",
            "key": "X",
            "annotation": {
                "line": "Đã xoay đường kẻ.",
                "area": "Đã xoay vùng."
            }
        },
        "reverse": {
            "title": "Đảo ngược",
            "description": "Đảo nguợc chiều đường kẻ này.",
            "key": "V",
            "annotation": "Đã đảo ngược đường kẻ."
        },
        "split": {
            "title": "Chia cắt",
            "description": {
                "line": "Cắt đôi đường kẻ này tại nốt này.",
                "area": "Cắt đôi đường biên của vùng này.",
                "multiple": "Cắt đôi các đường kẻ và đường biên tại nốt này."
            },
            "key": "C",
            "annotation": {
                "line": "Đã cắt đôi một đường kẻ.",
                "area": "Đã cắt đôi một đường biên của vùng.",
                "multiple": "Đã cắt đôi {n} đường kẻ và đường biên."
            },
            "not_eligible": "Không thể cắt đôi đường kẻ vào đầu hoặc cuối đường.",
            "multiple_ways": "Có quá nhiều đường kẻ tại đây để cắt đôi."
        }
    },
    "nothing_to_undo": "Không có gì để hoàn tác.",
    "nothing_to_redo": "Không có gì để làm lại.",
    "just_edited": "Bạn vừa sửa đổi OpenStreetMap!",
    "browser_notice": "Chường trình vẽ bản đồ này chạy tốt trong Firefox, Chrome, Safari, Opera, và Internet Explorer 9 trở lên. Xin vui lòng nâng cấp trình duyệt của bạn hoặc sửa đổi bản đồ trong Potlatch 2.",
    "view_on_osm": "Xem tại OSM",
    "zoom_in_edit": "phóng to để sửa đổi bản đồ",
    "logout": "đăng xuất",
    "loading_auth": "Đang kết nối với OpenStreetMap…",
    "report_a_bug": "báo cáo lỗi",
    "commit": {
        "title": "Lưu các Thay đổi",
        "description_placeholder": "Tóm lược các đóng góp của bạn",
        "message_label": "Tóm lược sửa đổi",
        "upload_explanation": "Các thay đổi bạn thực hiện dưới tên {user} sẽ xuất hiện trên tất cả các bản đồ sử dụng dữ liệu OpenStreetMap.",
        "save": "Lưu",
        "cancel": "Hủy bỏ",
        "warnings": "Cảnh báo",
        "modified": "Đã Thay đổi",
        "deleted": "Đã Xóa",
        "created": "Đã Tạo"
    },
    "contributors": {
        "list": "Đang xem các đóng góp của {users}",
        "truncated_list": "Đang xem các đóng góp của {users} và {count} người khác"
    },
    "geocoder": {
        "title": "Tìm kiếm Địa phương",
        "placeholder": "Tìm kiếm địa phương",
        "no_results": "Không tìm thấy địa phương với tên “{name}”"
    },
    "geolocate": {
        "title": "Nhảy tới Vị trí của Tôi"
    },
    "inspector": {
        "no_documentation_combination": "Không có tài liệu về tổ hợp thẻ này",
        "no_documentation_key": "Không có tài liệu về chìa khóa này",
        "show_more": "Xem thêm",
        "new_tag": "Thẻ mới",
        "view_on_osm": "Xem tại OSM",
        "editing_feature": "Đang sửa {feature}",
        "additional": "Các thẻ nâng cao",
        "choose": "Chọn thể loại đối tượng",
        "results": "{n} kết quả cho {search}",
        "reference": "Tra cứu OpenStreetMap Wiki →",
        "back_tooltip": "Thay đổi thể loại đối tượng"
    },
    "background": {
        "title": "Hình nền",
        "description": "Tùy chọn Hình nền",
        "percent_brightness": "Sáng {opacity}%",
        "fix_misalignment": "Chỉnh lại hình nền bị chệch",
        "reset": "đặt lại"
    },
    "restore": {
        "heading": "Bạn có thay đổi chưa lưu",
        "description": "Bạn có thay đổi chưa lưu từ một phiên làm việc trước đây. Bạn có muốn khôi phục các thay đổi này không?",
        "restore": "Mở lại",
        "reset": "Đặt lại"
    },
    "save": {
        "title": "Lưu",
        "help": "Lưu các thay đổi vào OpenStreetMap để cho mọi người xem.",
        "no_changes": "Không có thay đổi nào để lưu.",
        "error": "Đã xuất hiện lỗi khi lưu",
        "uploading": "Đang tải các thay đổi lên OpenStreetMap.",
        "unsaved_changes": "Bạn có Thay đổi Chưa lưu"
    },
    "splash": {
        "welcome": "Chào mừng bạn đến với iD, chương trình sửa đổi OpenStreetMap",
        "text": "Đây là phiên bản đang phát triển {version}. Xem thêm thông tin tại {website} và báo cáo lỗi tại {github}.",
        "walkthrough": "Mở trình hướng dẫn",
        "start": "Tiến hành sửa đổi"
    },
    "source_switch": {
        "live": "thật",
        "lose_changes": "Bạn có các thay đổi chưa lưu. Các thay đổi này sẽ bị mất khi bạn đổi máy chủ bản đồ. Bạn có chắc chắn muốn đổi máy chủ?",
        "dev": "thử"
    },
    "tag_reference": {
        "description": "Miêu tả",
        "on_wiki": "{tag} tại wiki.osm.org",
        "used_with": "được sử dụng với {type}"
    },
    "validations": {
        "untagged_point": "Địa điểm không có thẻ mà không trực thuộc đường kẻ hoặc vùng",
        "untagged_line": "Đường kẻ không có thẻ",
        "untagged_area": "Vùng không có thẻ",
        "many_deletions": "Bạn có chắc chắn muốn xóa {n} đối tượng? Các đối tượng này sẽ bị xóa khỏi bản đồ công cộng tại openstreetmap.org.",
        "tag_suggests_area": "Thẻ {tag} có lẽ dành cho vùng nhưng được gắn vào đường kẻ",
        "deprecated_tags": "Thẻ bị phản đối: {tags}"
    },
    "zoom": {
        "in": "Phóng to",
        "out": "Thu nhỏ"
    },
    "gpx": {
        "local_layer": "Tập tin GPX địa phương",
        "drag_drop": "Kéo thả một tập tin .gpx vào trang"
    },
    "help": {
        "title": "Trợ giúp",
        "help": "# Trợ giúp\n\nĐây là trình vẽ của [OpenStreetMap](http://www.openstreetmap.org/), bản đồ có mã nguồn mở và dữ liệu mở cho phép mọi người cùng sửa đổi. Bạn có thể sử dụng chương trình này để bổ sung và cập nhật dữ liệu bản đồ tại khu vực của bạn. Bạn có thể cải tiến bản đồ thế giới mở để cho mọi người sử dụng.\n\nCác sửa đổi của bạn trên bản đồ này sẽ xuất hiện cho mọi người dùng OpenStreetMap. Để sửa bản đồ, bạn cần có một [tài khoản OpenStreetMap miễn phí](https://www.openstreetmap.org/user/new).\n\n[Trình vẽ iD](http://ideditor.com/) là một dự án cộng tác. [Tất cả mã nguồn](https://github.com/systemed/iD) được xuất bản tại GitHub.\n",
        "editing_saving": "# Sửa đổi & Lưu giữ\n\nĐây là một trình vẽ trực tuyến, nên bạn hiện đang truy cập nó qua một trang Web.\n\n### Lựa chọn Đối tượng\n\nĐể lựa chọn một đối tượng, thí dụ con đường hay địa điểm quan tâm, nhấn chuột vào nó trên bản đồ. Khi đối tượng được chọn, bạn sẽ thấy một biểu mẫu ở bên phải chứa các chi tiết về đối tượng, cũng như một trình đơn giống bảng màu của họa sĩ chứa các tác vụ để thực hiện với đối tượng.\n\nCó thể lựa chọn nhiều đối tượng cùng lúc bằng cách nhấn giữ phím Shift và kéo chuột trên bản đồ. Khi kéo chuột, một hộp sẽ xuất hiện và các đối tượng nằm ở trong hộp này sẽ được chọn. Bạn có thể thực hiện một tác vụ với tất cả các đối tượng này cùng lúc.\n\n### Lưu giữ Sửa đổi\n\nKhi bạn sửa đổi các đường sá, tòa nhà, và địa điểm, các thay đổi này được lưu giữ trên máy cho đến khi bạn đăng nó lên máy chủ. Đừng lo nhầm lẫn: chỉ việc nhấn vào các nút Hoàn tác và Làm lại.\n\nNhấn “Lưu” để hoàn thành một tập hợp sửa đổi, thí dụ bạn vừa vẽ xong một khu và muốn bắt đầu vẽ khu mới. Trình vẽ sẽ trình bày các thay đổi để bạn xem lại, cũng như các gợi ý và cảnh báo nếu bạn đã sửa nhầm lẫn.\n\nNếu các thay đổi đều đâu vào đấy, bạn sẽ nhập lời tóm lược các thay đổi và nhấn “Lưu” lần nữa để đăng các thay đổi lên [OpenStreetMap.org](http://www.openstreetmap.org/). Các thay đổi sẽ xuất hiện tại trang đó để mọi người xem và cải tiến.\n\nNếu bạn chưa xong mà cần rời khỏi máy tính, bạn có thể đóng trình vẽ này không sao. Lần sau trở lại, trình vẽ này sẽ cho phép khôi phục các thay đổi chưa lưu của bạn (miễn là bạn sử dụng cùng máy tính và trình duyệt).\n",
        "roads": "# Đường sá\n\nTrình vẽ này cho phép tạo, sửa, và xóa các con đường. Con đường không nhất thiết phải là đường phố: có thể vẽ đường cao tốc, đường mòn, đường đi bộ, đường xe đạp…\n\n### Lựa chọn\n\nNhấn vào con đường để lựa chọn nó. Con đường sẽ được tô sáng, một trình đơn giống bảng màu của họa sĩ sẽ xuất hiện gần con trỏ, và thanh bên sẽ trình bày các chi tiết về con đường.\n\n### Sửa đổi\n\nNhiều khi bạn sẽ gặp những con đường bị chệch đối với hình nền hoặc tuyến đường GPS. Bạn có thể chỉnh lại các con đường này để chính xác hơn.\n\nTrước tiên, nhấn vào con đường cần chỉnh lại. Đường sẽ được tô sáng và các nốt sẽ xuất hiện để bạn kéo sang vị trí đúng hơn. Để thêm chi tiết, nhấn đúp vào một khúc đường chưa có nốt, và một nốt mới sẽ xuất hiện để bạn kéo.\n\nNếu con đường nối với đường khác trên thực tiếp, nhưng trên bản đồ thì chưa nối liền, hãy kéo một nốt của một con đường sang đường kia để nối liền hai con đường. Nối liền các đường tại giao lộ là một điều rất quan trọng tăng khả năng chỉ đường.\n\nĐể di chuyển toàn bộ con đường cùng lúc, nhấn vào công cụ “Di chuyển” hoặc nhấn phím tắt `M`, chuyển con trỏ sang vị trí mới, rồi nhấn chuột để hoàn thành việc di chuyển.\n\n### Xóa\n\nHãy tưởng tượng bạn gặp một con đường hoàn toàn sai: bạn không thấy được con đường trong hình ảnh trên không và, theo lý tưởng, cũng đã ghé vào chỗ đó để xác nhận rằng nó không tồn tại. Nếu trường hợp này, bạn có thể xóa con đường hoàn toàn khỏi bản đồ. Xin cẩn thận khi xóa đối tượng: giống như mọi sửa đổi khác, mọi người sẽ thấy được kết quả. Ngoài ra, hình ảnh trên không nhiều khi lỗi thời – có thể mới xây con đường – thành thử tốt nhất là ghé vào chỗ đó để quan sát chắc chắn, nếu có thể.\n\nĐể xóa một con đường, lựa chọn nó bằng cách nhấn vào nó, rồi nhấn vào hình thùng rác hoặc nhấn phím Delete.\n\n### Tạo mới\n\nBạn có tìm ra một con đường chưa được vẽ trên bản đồ? Hãy bắt đầu vẽ đường kẻ mới bằng cách nhấn vào nút “Đường” ở phía trên bên trái của trình vẽ, hoặc nhấn phím tắt `2`.\n\nNhấn vào bản đồ tại điểm bắt đầu của con đường. Hoặc nếu con đường chia ra từ đường khác đã tồn tại, trước tiên nhấn chuột tại giao lộ giữa hai con đường này.\n\nSau đó, nhấn chuột lần lượt theo lối đường dùng hình ảnh trên không hoặc tuyến đường GPS. Khi nào con đường giao với đường khác, nhấn chuột tại giao lộ để nối liền hai con đường này. Sau khi vẽ xong, nhấn đúp vào nốt cuối dùng hoặc nhấn phím Return hay Enter.\n",
        "gps": "# GPS\n\nHệ thống định vị toàn cầu, còn gọi GPS, là nguồn dữ liệu tin tưởng nhất trong dự án OpenStreetMap. Trình vẽ này hỗ trợ các tuyến đường địa phương, tức tập tin `.gpx` trên máy tính của bạn. Bạn có thể thu loại tuyến đường GPS này dùng một ứng dụng điện thoại thông minh hoặc máy thu GPS.\n\nĐọc về cách khảo sát bằng GPS trong “[Surveying with a GPS](http://learnosm.org/en/beginner/using-gps/)”.\n\nĐể sử dụng một tuyến đường GPX trong việc vẽ bản đồ, kéo thả tập tin GPX vào trình vẽ bản đồ này. Nếu trình vẽ nhận ra tuyến đường, tuyến đường sẽ được tô màu xanh nõn chuối trên bản đồ. Mở hộp “Tùy chọn Hình nền” ở thanh công cụ bên trái để bật tắt hoặc thu phóng lớp GPX này.\n\nTuyến đường GPX không được tải lên OpenStreetMap trực tiếp. Cách tốt nhất sử dụng nó là vạch đường theo nó trên bản đồ.\n",
        "imagery": "# Hình ảnh\n\nHình ảnh trên không là một tài nguyên quan trọng trong việc vẽ bản đồ. Có sẵn một số nguồn hình ảnh từ máy bay, vệ tinh, và dịch vụ mở trong trình vẽ này, dưới trình đơn “Tùy chọn Hình nền” ở bên trái.\n\nTheo mặc định, trình vẽ hiển thị lớp trên không của [Bản đồ Bing](http://www.bing.com/maps/), nhưng có sẵn nguồn khác tùy theo vị trí đang xem trong trình duyệt. Ngoài ra có hình ảnh rất rõ tại nhiều vùng ở một số quốc gia như Hoa Kỳ, Pháp, và Đan Mạch.\n\nHình ảnh đôi khi bị chệch đối với dữ liệu bản đồ vì dịch vụ hình ảnh có lỗi. Nếu bạn nhận thấy nhiều con đường bị chệch đối với hình nền, xin đừng di chuyển các đường này để trùng hợp với hình ảnh. Thay vì di chuyển các con đường, hãy chỉnh lại hình ảnh để phù hợp với dữ liệu tồn tại bằng cách nhấn “Chỉnh lại hình nền bị chệch” ở cuối hộp Tùy chọn Hình nền.\n",
        "addresses": "# Địa chỉ\n\nĐịa chỉ là những thông tin rất cần thiết trên bản đồ.\n\nTuy bản đồ thường trình bày các địa chỉ như một thuộc tính của đường sá, nhưng OpenStreetMap liên kết các địa chỉ với các tòa nhà hoặc miếng đất dọc đường.\n\nBạn có thể thêm thông tin địa chỉ vào các hình dạng tòa nhà hoặc các địa điểm quan tâm. Tốt nhất là lấy thông tin địa chỉ từ kinh nghiệm cá nhân, thí dụ đi dạo trên phố và ghi chép các địa chỉ hoặc nhớ lại những chi tiết từ hoạt động hàng ngày của bạn. Cũng như bất cứ chi tiết nào, dự án này hoàn toàn cấm sao chép từ các nguồn thương mại như Bản đồ Google.\n",
        "inspector": "# Biểu mẫu\n\nBiểu mẫu là hộp xuất hiện ở bên phải của trang khi nào một đối tượng được chọn. Biểu mẫu này cho phép sửa đổi các chi tiết của các đối tượng được chọn.\n\n### Chọn Thể loại\n\nSau khi thêm địa điểm, đường kẻ, hoặc vùng vào bản đồ, bạn có thể cho biết đối tượng này tượng trưng cho gì, chẳng hạn con đường, siêu thị, hoặc quán cà phê. Biểu mẫu trình bày các nút tiện để chọn các thể loại đối tượng thường gặp, hoặc bạn có thể gõ một vài chữ miêu tả vào hộp tìm kiếm để tìm ra các thể loại khác.\n\nNhấn vào hình dấu trang ở phía dưới bên phải của một nút thể loại để tìm hiểu thêm về thể loại đó. Nhấn vào nút để chọn thể loại đó.\n\n### Điền đơn và Gắn thẻ\n\nSau khi bạn chọn thể loại, hoặc nếu chọn một đối tượng đã có thể loại, biểu mẫu trình bày các trường văn bản và điều khiển để xem và sửa các thuộc tính của đối tượng như tên và địa chỉ.\n\nỞ dưới các điều khiển có một số hình tượng có thể nhấn để thêm chi tiết, chẳng hạn tên bài [Wikipedia](http://www.wikipedia.org/) và mức hỗ trợ xe lăn.\n\nNhấn vào “Các thẻ năng cao” ở cuối biểu mẫu để gắn bất cứ thẻ nào vào đối tượng. [Taginfo](http://taginfo.openstreetmap.org/) là một công cụ rất hữu ích để tìm ra những phối hợp thẻ phổ biến.\n\nCác thay đổi trong biểu mẫu được tự động áp dụng vào bản đồ. Bạn có thể nhấn vào nút “Hoàn tác” vào bất cứ lúc nào để hoàn tác các thay đổi.\n\n### Đóng Biểu mẫu\n\nĐể đóng biểu mẫu, nhấn vào nút Đóng ở phía trên bên phải, nhấn phím Esc, hoặc nhấn vào một khoảng trống trên bản đồ.\n",
        "buildings": "# Tòa nhà\n\nOpenStreetMap là cơ sở dữ liệu tòa nhà lớn nhất trên thế giới. Mời bạn cùng xây dựng và cải tiến cơ sở dữ liệu này.\n\n### Lựa chọn\n\nNhấn vào một vùng tòa nhà để lựa chọn nó. Đường biên của vùng sẽ được tô sáng, một trình đơn giống bảng màu của họa sĩ sẽ xuất hiện gần con trỏ, và thanh bên sẽ trình bày các chi tiết về con đường.\n\n### Sửa đổi\n\nĐôi khi vị trí hoặc các thẻ của một tòa nhà không chính xác.\n\nĐể di chuyển toàn bộ tòa nhà cùng lúc, lựa chọn vùng, rồi nhấn vào công cụ “Di chuyển”. Chuyển con trỏ sang vị trí mới và nhấn chuột để hoàn thành việc di chuyển.\n\nĐể sửa hình dạng của một tòa nhà, kéo các nốt của đường biên sang các vị trí chính xác.\n\n### Vẽ mới\n\nMột trong những điều gây nhầm lẫn là một tòa nhà có thể là vùng hoặc có thể là địa điểm. Nói chung, khuyên bạn _vẽ tòa nhà là vùng nếu có thể_. Nếu tòa nhà chứa hơn một công ty, chỗ ở, hoặc gì đó có địa chỉ, hãy đặt một địa điểm riêng cho mỗi địa chỉ đó và đưa mỗi địa điểm vào trong vùng của tòa nhà.\n\nĐể bắt đầu vẽ tòa nhà, nhấn vào nút “Vùng” ở phía trên bên trái của trình vẽ. Nhấn chuột tại các góc tường, rồi “đóng” vùng bằng cách nhấn phím Return hay Enter hoặc nhấn vào nốt đầu tiên.\n\n### Xóa\n\nHãy tưởng tượng bạn gặp một tòa nhà hoàn toàn sai: bạn không thấy được tòa nhà trong hình ảnh trên không và, theo lý tưởng, cũng đã ghé vào chỗ đó để xác nhận rằng nó không tồn tại. Nếu trường hợp này, bạn có thể xóa tòa nhà hoàn toàn khỏi bản đồ. Xin cẩn thận khi xóa đối tượng: giống như mọi sửa đổi khác, mọi người sẽ thấy được kết quả. Ngoài ra, hình ảnh trên không nhiều khi lỗi thời – có thể mới xây tòa nhà – thành thử tốt nhất là ghé vào chỗ đó để quan sát chắc chắn, nếu có thể.\n\nĐể xóa một tòa nhà, lựa chọn nó bằng cách nhấn vào nó, rồi nhấn vào hình thùng rác hoặc nhấn phím Delete.\n"
    },
    "intro": {
        "navigation": {
            "drag": "Bản đồ ở giữa cho xem dữ liệu OpenStreetMap ở trên một hình nền. Bạn có thể kéo thả và cuộn nó để đi tới đi lui, giống như một bản đồ trực tuyến bình thường. **Kéo bản đồ này!**",
            "select": "Có ba hình thức đối tượng tượng trưng cho tất cả các chi tiết trên bản đồ: địa điểm, đường kẻ, vùng. Nhấn vào một đối tượng để lựa chọn nó. **Nhấn vào địa điểm để lựa chọn nó.**",
            "header": "Đầu đề cho biết thể loại đối tượng.",
            "pane": "Khi lựa chọn một đối tượng, bạn sẽ thấy biểu mẫu để sửa đối tượng. Đầu đề của biểu mẫu cho biết thể loại đối tượng, và dưới đó có các thuộc tính của đối tượng, chẳng hạn tên và địa chỉ. **Bấm nút Đóng ở phía trên bên phải để đóng biểu mẫu.**"
        },
        "points": {
            "add": "Một địa điểm chỉ ra và miêu tả một vị trí, chẳng hạn tiệm quán, nhà hàng, đài tưởng niệm. **Nhấn nút Điểm để thêm một địa điểm mới.**",
            "place": "Nhấn vào bản đồ để đặt địa điểm. **Đặt địa điểm trên tòa nhà.**",
            "search": "Có đủ thứ địa điểm. Bạn vừa đặt một địa điểm quán cà phê. **Tìm cho “cà phê”.**",
            "choose": "***Chọn Quán Cà phê từ lưới.***",
            "describe": "Địa điểm hiện là một quán cà phê. Bây giờ bạn có thể cung cấp thêm chi tiết về địa điểm này trong biểu mẫu. **Nhập tên của địa điểm.**",
            "close": "Nhấn vào nút Đóng để đóng biểu mẫu. **Đóng biểu mẫu.**",
            "reselect": "Nhiều khi một địa điểm đã tồn tại nhưng không chính xác hoặc không đầy đủ. Chúng ta có thể sửa đổi địa điểm đã tồn tại. **Lựa chọn địa điểm mà bạn vừa tạo ra.**",
            "fixname": "**Đổi tên và đóng biểu mẫu.**",
            "reselect_delete": "Có thể xóa bất cứ đối tượng nào trên bản đồ. **Nhấn vào điểm mà bạn vừa vẽ.**",
            "delete": "Một trình đơn nhìn giống bảng màu của họa sĩ bọc quanh địa điểm. Nó chứa các tác vụ có thể thực hiện với địa điểm, thí dụ xóa. **Xóa địa điểm này.**"
        },
        "areas": {
            "add": "Bạn có thể vẽ kỹ hơn bằng cách vẽ vùng thay vì địa điểm. Phần nhiều thể loại địa điểm có thể được vẽ như vùng. Khuyên bạn cố gắng vẽ vùng thay vì địa điểm để cho biết đường biên của đối tượng. **Nhấn vào nút Vùng để bắt đầu vẽ vùng mới.**",
            "corner": "Để vẽ vùng, đặt các nốt theo đường biên của vùng. **Đặt nốt đầu tiên vào một góc của khu vui chơi trẻ em.**",
            "place": "Đặt thêm nốt để tiếp tục vẽ vùng, rồi nhấn vào nốt đầu tiên để “đóng” vùng này. **Vẽ một vùng cho khu vui chơi trẻ em.**",
            "search": "**Tìm Khu Vui chơi Trẻ em.**",
            "choose": "**Chọn Khu Vui chơi Trẻ em từ lưới.**",
            "describe": "**Đặt tên và đóng biểu mẫu.**"
        },
        "lines": {
            "add": "Các đường kẻ tượng trưng cho đường sá, đường sắt, dòng sông chẳng hạn. **Nhấn vào nút Đường để bắt đầu vẽ đường mới.**",
            "start": "**Nhấn vào cuối đường để bắt đầu vẽ con đường.**",
            "intersect": "Nhấn chuột để thêm nốt và kéo dài đường kẻ. Bạn có thể kéo bản đồ vào lúc vẽ đường để xem vùng chung quanh. Tương tự với nhiều thể loại đường kẻ, các đường bộ kết hợp nhau thành một mạng lớn hơn. Để cho các ứng dụng chỉ đường có thể hoạt động chính xác, xin chú ý nối liền các đường ở những giao lộ trên thực tế. **Nhấn vào đường Flower Street để nối liền hai con đường tại giao lộ.**",
            "finish": "Để kết thúc đường kẻ, nhấn vào điểm cuối cùng lần nữa. **Kết thúc con đường.**",
            "road": "**Chọn Đường Giao thông từ lưới.**",
            "residential": "Có nhiều kiểu con đường; kiểu phổ biến nhất là Ngõ Dân cư. **Chọn kiểu con đường là Ngõ Dân cư.**",
            "describe": "**Đặt tên cho con đường và đóng biểu mẫu.**",
            "restart": "Con đường phải giao với đường Flower Street."
        },
        "startediting": {
            "help": "Có sẵn trình hướng dẫn này và thêm tài liệu tại đây.",
            "save": "Hãy nhớ lưu các thay đổi của bạn thường xuyên!",
            "start": "Hãy bắt đầu vẽ bản đồ!"
        }
    },
    "presets": {
        "fields": {
            "access": {
                "label": "Quyền Truy cập"
            },
            "address": {
                "label": "Địa chỉ",
                "placeholders": {
                    "housename": "Tên nhà",
                    "number": "123",
                    "street": "Tên đường",
                    "city": "Thành phố"
                }
            },
            "admin_level": {
                "label": "Cấp Hành chính"
            },
            "aeroway": {
                "label": "Loại"
            },
            "amenity": {
                "label": "Loại"
            },
            "atm": {
                "label": "Máy Rút tiền"
            },
            "barrier": {
                "label": "Kiểu"
            },
            "bicycle_parking": {
                "label": "Kiểu"
            },
            "building": {
                "label": "Tòa nhà"
            },
            "building_area": {
                "label": "Tòa nhà"
            },
            "building_yes": {
                "label": "Tòa nhà"
            },
            "capacity": {
                "label": "Số Chỗ Đậu Xe"
            },
            "collection_times": {
                "label": "Giờ Lấy thư"
            },
            "construction": {
                "label": "Kiểu"
            },
            "country": {
                "label": "Quốc gia"
            },
            "crossing": {
                "label": "Kiểu"
            },
            "cuisine": {
                "label": "Ẩm thực"
            },
            "denomination": {
                "label": "Giáo phái"
            },
            "denotation": {
                "label": "Tầm Quan trọng"
            },
            "elevation": {
                "label": "Cao độ"
            },
            "emergency": {
                "label": "Khẩn cấp"
            },
            "entrance": {
                "label": "Kiểu"
            },
            "fax": {
                "label": "Số Fax"
            },
            "fee": {
                "label": "Phí"
            },
            "highway": {
                "label": "Kiểu"
            },
            "historic": {
                "label": "Loại"
            },
            "internet_access": {
                "label": "Truy cập Internet",
                "options": {
                    "wlan": "Wi-Fi",
                    "wired": "Qua dây điện",
                    "terminal": "Máy tính công cộng"
                }
            },
            "landuse": {
                "label": "Mục đích"
            },
            "layer": {
                "label": "Lớp"
            },
            "leisure": {
                "label": "Loại"
            },
            "levels": {
                "label": "Số Tầng"
            },
            "man_made": {
                "label": "Loại"
            },
            "maxspeed": {
                "label": "Tốc độ Tối đa"
            },
            "name": {
                "label": "Tên"
            },
            "natural": {
                "label": "Thiên nhiên"
            },
            "network": {
                "label": "Hệ thống"
            },
            "note": {
                "label": "Chú thích"
            },
            "office": {
                "label": "Kiểu"
            },
            "oneway": {
                "label": "Một chiều"
            },
            "oneway_yes": {
                "label": "Một chiều"
            },
            "opening_hours": {
                "label": "Giờ Mở cửa"
            },
            "operator": {
                "label": "Cơ quan Chủ quản"
            },
            "phone": {
                "label": "Số Điện thoại"
            },
            "place": {
                "label": "Kiểu"
            },
            "power": {
                "label": "Kiểu"
            },
            "railway": {
                "label": "Kiểu"
            },
            "ref": {
                "label": "Số"
            },
            "religion": {
                "label": "Tôn giáo",
                "options": {
                    "christian": "Kitô giáo",
                    "muslim": "Hồi giáo",
                    "buddhist": "Phật giáo",
                    "jewish": "Do Thái giáo",
                    "hindu": "Ấn Độ giáo",
                    "shinto": "Thần đạo",
                    "taoist": "Đạo giáo"
                }
            },
            "service": {
                "label": "Kiểu"
            },
            "shelter": {
                "label": "Chỗ che"
            },
            "shop": {
                "label": "Kiểu"
            },
            "source": {
                "label": "Nguồn"
            },
            "sport": {
                "label": "Môn Thể thao"
            },
            "structure": {
                "label": "Cấu trúc",
                "options": {
                    "bridge": "Cầu",
                    "tunnel": "Đường hầm",
                    "embankment": "Đường đắp cao",
                    "cutting": "Đường xẻ"
                }
            },
            "surface": {
                "label": "Mặt"
            },
            "tourism": {
                "label": "Loại"
            },
            "water": {
                "label": "Loại"
            },
            "waterway": {
                "label": "Loại"
            },
            "website": {
                "label": "Trang Web"
            },
            "wetland": {
                "label": "Loại"
            },
            "wheelchair": {
                "label": "Đi Xe lăn Được"
            },
            "wikipedia": {
                "label": "Wikipedia"
            },
            "wood": {
                "label": "Loại"
            }
        },
        "presets": {
            "aeroway": {
                "name": "Hàng không"
            },
            "aeroway/aerodrome": {
                "name": "Sân bay",
                "terms": "máy bay,phi cơ,tàu bay,sân bay,phi trường"
            },
            "aeroway/helipad": {
                "name": "Sân bay Trực thăng",
                "terms": "máy bay trực thăng,máy bay lên thẳng,sân bay trực thăng,sân bay lên thẳng,phi trường trực thăng,sàn đỗ trực thăng,sàn đáp trực thăng"
            },
            "amenity": {
                "name": "Tiện nghi"
            },
            "amenity/bank": {
                "name": "Ngân hàng",
                "terms": "ngân hàng,nhà băng,ngân hàng công đoàn,nhà băng công đoàn,công đoàn tín dụng"
            },
            "amenity/bar": {
                "name": "Quán rượu"
            },
            "amenity/bench": {
                "name": "Ghế"
            },
            "amenity/bicycle_parking": {
                "name": "Chỗ Đậu Xe đạp"
            },
            "amenity/bicycle_rental": {
                "name": "Chỗ Mướn Xe đạp"
            },
            "amenity/cafe": {
                "name": "Quán Cà phê",
                "terms": "cà phê,quán cà phê,trà,quán trà"
            },
            "amenity/cinema": {
                "name": "Rạp phim",
                "terms": "rạp phim,rạp điện ảnh,xi nê, xi-nê,xinê,phim,điện ảnh"
            },
            "amenity/courthouse": {
                "name": "Tòa"
            },
            "amenity/embassy": {
                "name": "Tòa đại sứ"
            },
            "amenity/fast_food": {
                "name": "Nhà hàng Ăn nhanh"
            },
            "amenity/fire_station": {
                "name": "Trạm Cứu hỏa"
            },
            "amenity/fuel": {
                "name": "Cây xăng"
            },
            "amenity/grave_yard": {
                "name": "Nghĩa địa"
            },
            "amenity/hospital": {
                "name": "Bệnh viện",
                "terms": "bệnh viện,nhà thương,phòng khám khẩn cấp,phòng khẩn cấp"
            },
            "amenity/library": {
                "name": "Thư viện"
            },
            "amenity/marketplace": {
                "name": "Chợ phiên"
            },
            "amenity/parking": {
                "name": "Bãi Đậu xe"
            },
            "amenity/pharmacy": {
                "name": "Nhà thuốc"
            },
            "amenity/place_of_worship": {
                "name": "Nơi Thờ phụng",
                "terms": "nơi thờ phụng,nhà thờ,giáo xứ,thánh đường,hội đường"
            },
            "amenity/place_of_worship/christian": {
                "name": "Nhà thờ",
                "terms": "nhà thờ,Kitô giáo,Kitô giáo,Thiên Chúa giáo,đạo Thiên Chúa,giáo xứ,thánh đường"
            },
            "amenity/place_of_worship/jewish": {
                "name": "Nhà thờ Do Thái giáo",
                "terms": "Do Thái giáo,đạo Do Thái,hội đường"
            },
            "amenity/place_of_worship/muslim": {
                "name": "Nhà thờ Hồi giáo",
                "terms": "Hồi giáo,nhà thờ"
            },
            "amenity/police": {
                "name": "Đồn Cảnh sát",
                "terms": "cảnh sát,sở cảnh sát,đồn cảnh sát,trạm cảnh sát,sen đầm,sở sen đầm,đội sen đầm,hiến binh,sở hiến binh,đồn hiến binh,công an,sở công an,đồn công an,trạm công an"
            },
            "amenity/post_box": {
                "name": "Hòm thư",
                "terms": "hòm thư,hộp thư,thùng thư"
            },
            "amenity/post_office": {
                "name": "Bưu điện"
            },
            "amenity/pub": {
                "name": "Quán rượu Pub"
            },
            "amenity/restaurant": {
                "name": "Nhà hàng",
                "terms": "quán ăn,nhà hàng,tiệm ăn,nhà ăn,phòng ăn,quán ăn nhanh,nhà hàng ăn nhanh,quán ăn qua loa,căng tin,căng-tin,xe đẩy,quán rượu,quán bia,tiệm rượu,hiệu chả cá,quán chả nướng,quán phở,tiệm phở,quán cơm,quán bánh cuốn,tiệm bánh cuốn,quán bánh mì,tiệm bánh mì,quán bánh xèo,tiệm bánh xèo,quán chè,tiệm chè,quán gỏi cuốn,quán bún,quán hải sản,quán gà,quán cà ri,quán cà-ri,tiệm cà ri, tiệm cà-ri"
            },
            "amenity/school": {
                "name": "Nhà trường",
                "terms": "trường,trường học,nhà trường,học viện,trường tư,trường tư thực,trường công,trường công lập,tiểu học,trường tiểu học,trung học,trường trung học,trung học cơ sở,trường trung học cơ sở,THCS,TTHCS,trung học phổ thông,trường trung học phổ thông,THPT,TTHPT,trung học chuyên nghiệp,trường trung học chuyên nghiệp,THCN,TTHCN,cao đẳng,trường cao đẳng,CĐ,đại học,trường đại học,ĐH,trường dòng,khoa,học"
            },
            "amenity/swimming_pool": {
                "name": "Hồ Bơi"
            },
            "amenity/telephone": {
                "name": "Điện thoại"
            },
            "amenity/theatre": {
                "name": "Nhà hát",
                "terms": "nhà hát,rạp hát,sân khấu,kịch"
            },
            "amenity/toilets": {
                "name": "Phòng Vệ sinh"
            },
            "amenity/townhall": {
                "name": "Tòa thị chính Thị xã",
                "terms": "tòa thị chính,tòa thị chánh,toà thị chính,toà thị chánh,trụ sở thành phố,trụ sở thị xã,trụ sở làng"
            },
            "amenity/university": {
                "name": "Trường Đại học"
            },
            "barrier": {
                "name": "Chướng ngại"
            },
            "barrier/block": {
                "name": "Tấm Bê tông"
            },
            "barrier/bollard": {
                "name": "Cột Bê tông"
            },
            "barrier/cattle_grid": {
                "name": "Bẫy Trâu bò Trên đường"
            },
            "barrier/city_wall": {
                "name": "Tường thành"
            },
            "barrier/cycle_barrier": {
                "name": "Hàng rào Ngăn Xe đạp"
            },
            "barrier/ditch": {
                "name": "Mương"
            },
            "barrier/entrance": {
                "name": "Cửa vào"
            },
            "barrier/fence": {
                "name": "Hàng rào"
            },
            "barrier/gate": {
                "name": "Cổng"
            },
            "barrier/hedge": {
                "name": "Hàng rào Cây"
            },
            "barrier/kissing_gate": {
                "name": "Cửa Hàng rào Chắn Trâu bò"
            },
            "barrier/lift_gate": {
                "name": "Rào chắn Đóng mở"
            },
            "barrier/retaining_wall": {
                "name": "Tường Chắn Đất"
            },
            "barrier/stile": {
                "name": "Bậc trèo"
            },
            "barrier/toll_booth": {
                "name": "Nhà thu phí"
            },
            "barrier/wall": {
                "name": "Tường"
            },
            "boundary/administrative": {
                "name": "Biên giới Hành chính"
            },
            "building": {
                "name": "Tòa nhà"
            },
            "building/apartments": {
                "name": "Khu chung cư"
            },
            "building/entrance": {
                "name": "Cửa vào"
            },
            "building/house": {
                "name": "Nhà ở"
            },
            "entrance": {
                "name": "Cửa vào"
            },
            "highway": {
                "name": "Đường Giao thông"
            },
            "highway/bridleway": {
                "name": "Đường mòn Ngựa",
                "terms": "đường mòn ngựa,đường cưỡi ngựa,đường đi ngựa"
            },
            "highway/bus_stop": {
                "name": "Trạm Xe buýt"
            },
            "highway/crossing": {
                "name": "Lối Băng qua Đường",
                "terms": "lối băng qua đường,lối qua đường,đường ngựa vằn"
            },
            "highway/cycleway": {
                "name": "Đường Xe đạp"
            },
            "highway/footway": {
                "name": "Đường Đi bộ",
                "terms": "đường đi bộ,hè,vỉa hè,đường mòn,phố,đường đi dạo"
            },
            "highway/motorway": {
                "name": "Đường Cao tốc"
            },
            "highway/motorway_link": {
                "name": "Nhánh Ra vào Đường Cao tốc",
                "terms": "đường nhánh,đoạn nhánh,đường nhánh rẽ,đoạn nhánh rẽ,đường nhánh chuyển đường,nhánh chuyển đường,lối ra vào,lối ra,lối vào,nhánh ra,nhánh vào,đường nối"
            },
            "highway/path": {
                "name": "Lối"
            },
            "highway/primary": {
                "name": "Đường Chính"
            },
            "highway/primary_link": {
                "name": "Nhánh Ra vào Đường Chính",
                "terms": "đường nhánh,đoạn nhánh,đường nhánh rẽ,đoạn nhánh rẽ,đường nhánh chuyển đường,nhánh chuyển đường,lối ra vào,lối ra,lối vào,nhánh ra,nhánh vào,đường nối"
            },
            "highway/residential": {
                "name": "Ngõ Dân cư"
            },
            "highway/road": {
                "name": "Đường Nói chung"
            },
            "highway/secondary": {
                "name": "Đường Lớn"
            },
            "highway/secondary_link": {
                "name": "Nhánh Ra vào Đường Lớn",
                "terms": "đường nhánh,đoạn nhánh,đường nhánh rẽ,đoạn nhánh rẽ,đường nhánh chuyển đường,nhánh chuyển đường,lối ra vào,lối ra,lối vào,nhánh ra,nhánh vào,đường nối"
            },
            "highway/service": {
                "name": "Ngách"
            },
            "highway/steps": {
                "name": "Cầu thang",
                "terms": "cầu thang"
            },
            "highway/tertiary": {
                "name": "Phố"
            },
            "highway/tertiary_link": {
                "name": "Nhánh Ra vào Phố",
                "terms": "đường nhánh,đoạn nhánh,đường nhánh rẽ,đoạn nhánh rẽ,đường nhánh chuyển đường,nhánh chuyển đường,lối ra vào,lối ra,lối vào,nhánh ra,nhánh vào,đường nối"
            },
            "highway/track": {
                "name": "Đường mòn"
            },
            "highway/traffic_signals": {
                "name": "Đèn Giao thông",
                "terms": "đèn giao thông,đèn tín hiệu giao thông,đèn tín hiệu,đèn điều khiển giao thông,đèn điều khiển,đèn xanh đèn đỏ,đèn xanh đỏ,đèn ngã tư,đèn ngã ba"
            },
            "highway/trunk": {
                "name": "Xa lộ"
            },
            "highway/trunk_link": {
                "name": "Nhánh Ra vào Xa lộ",
                "terms": "đường nhánh,đoạn nhánh,đường nhánh rẽ,đoạn nhánh rẽ,đường nhánh chuyển đường,nhánh chuyển đường,lối ra vào,lối ra,lối vào,nhánh ra,nhánh vào,đường nối"
            },
            "highway/turning_circle": {
                "name": "Cuối đường Vòng tròn"
            },
            "highway/unclassified": {
                "name": "Phố"
            },
            "historic": {
                "name": "Nơi Lịch sử"
            },
            "historic/archaeological_site": {
                "name": "Khu vực Khảo cổ"
            },
            "historic/boundary_stone": {
                "name": "Mốc Biên giới"
            },
            "historic/castle": {
                "name": "Lâu đài"
            },
            "historic/memorial": {
                "name": "Đài Tưởng niệm"
            },
            "historic/monument": {
                "name": "Đài tưởng niệm"
            },
            "historic/ruins": {
                "name": "Tàn tích"
            },
            "historic/wayside_cross": {
                "name": "Thánh Giá Dọc đường"
            },
            "historic/wayside_shrine": {
                "name": "Đền thánh Dọc đường"
            },
            "landuse": {
                "name": "Kiểu Sử dụng Đất"
            },
            "landuse/allotments": {
                "name": "Khu Vườn Gia đình"
            },
            "landuse/basin": {
                "name": "Lưu vực"
            },
            "landuse/cemetery": {
                "name": "Nghĩa địa"
            },
            "landuse/commercial": {
                "name": "Thương mại"
            },
            "landuse/construction": {
                "name": "Công trường Xây dựng"
            },
            "landuse/farm": {
                "name": "Trại"
            },
            "landuse/farmyard": {
                "name": "Sân Trại"
            },
            "landuse/forest": {
                "name": "Rừng Trồng cây"
            },
            "landuse/grass": {
                "name": "Cỏ"
            },
            "landuse/industrial": {
                "name": "Công nghiệp"
            },
            "landuse/meadow": {
                "name": "Đồng cỏ"
            },
            "landuse/orchard": {
                "name": "Vườn Cây"
            },
            "landuse/quarry": {
                "name": "Mỏ Đá"
            },
            "landuse/residential": {
                "name": "Dân cư"
            },
            "landuse/vineyard": {
                "name": "Vườn Nho"
            },
            "leisure": {
                "name": "Giải trí"
            },
            "leisure/garden": {
                "name": "Vườn"
            },
            "leisure/golf_course": {
                "name": "Sân Golf"
            },
            "leisure/marina": {
                "name": "Bến tàu"
            },
            "leisure/park": {
                "name": "Công viên",
                "terms": "công viên,vườn,vườn hoa,vườn cây,bãi cỏ,bãi cỏ xanh,thảm cỏ xanh,vành đai xanh,sân chơi,khu vui chơi,khu vui chơi trẻ em,khu chơi trẻ em,quảng trường,rừng"
            },
            "leisure/pitch": {
                "name": "Sân cỏ"
            },
            "leisure/pitch/american_football": {
                "name": "Sân cỏ Bóng bầu dục Mỹ"
            },
            "leisure/pitch/baseball": {
                "name": "Sân cỏ Bóng chày"
            },
            "leisure/pitch/basketball": {
                "name": "Sân Bóng rổ"
            },
            "leisure/pitch/soccer": {
                "name": "Sân cỏ Bóng đá"
            },
            "leisure/pitch/tennis": {
                "name": "Sân Quần vợt"
            },
            "leisure/playground": {
                "name": "Khu Vui chơi Trẻ em"
            },
            "leisure/slipway": {
                "name": "Đường Trượt tàu"
            },
            "leisure/stadium": {
                "name": "Sân vận động"
            },
            "leisure/swimming_pool": {
                "name": "Hồ Bơi"
            },
            "man_made": {
                "name": "Công trình"
            },
            "man_made/lighthouse": {
                "name": "Hải đăng"
            },
            "man_made/pier": {
                "name": "Cầu tàu"
            },
            "man_made/survey_point": {
                "name": "Điểm Khảo sát"
            },
            "man_made/wastewater_plant": {
                "name": "Nhà máy Nước thải",
                "terms": "nhà máy nước thải,nhà máy xử lý nước thải,nhà máy xử lí nước thải"
            },
            "man_made/water_tower": {
                "name": "Tháp nước"
            },
            "man_made/water_works": {
                "name": "Nhà máy Nước"
            },
            "natural": {
                "name": "Thiên nhiên"
            },
            "natural/bay": {
                "name": "Vịnh"
            },
            "natural/beach": {
                "name": "Bãi biển"
            },
            "natural/cliff": {
                "name": "Vách đá"
            },
            "natural/coastline": {
                "name": "Bờ biển",
                "terms": "bờ biển,bờ sông,bờ"
            },
            "natural/glacier": {
                "name": "Sông băng"
            },
            "natural/grassland": {
                "name": "Đồng cỏ"
            },
            "natural/heath": {
                "name": "Bãi hoang"
            },
            "natural/peak": {
                "name": "Đỉnh núi",
                "terms": "đồi,núi,đỉnh núi,đỉnh,chỏm núi,chỏm,chóp núi,chóp,chỏm chóp"
            },
            "natural/scrub": {
                "name": "Đất Bụi rậm"
            },
            "natural/spring": {
                "name": "Suối"
            },
            "natural/tree": {
                "name": "Cây"
            },
            "natural/water": {
                "name": "Nước"
            },
            "natural/water/lake": {
                "name": "Hồ",
                "terms": "hồ,hồ nước"
            },
            "natural/water/pond": {
                "name": "Ao nước",
                "terms": "hồ nhỏ,ao,ao cá,hồ cá,hồ đánh cá"
            },
            "natural/water/reservoir": {
                "name": "Bể nước"
            },
            "natural/wetland": {
                "name": "Đầm lầy"
            },
            "natural/wood": {
                "name": "Rừng"
            },
            "office": {
                "name": "Văn phòng"
            },
            "other": {
                "name": "Khác"
            },
            "other_area": {
                "name": "Khác"
            },
            "place": {
                "name": "Địa phương"
            },
            "place/hamlet": {
                "name": "Xóm"
            },
            "place/island": {
                "name": "Đảo",
                "terms": "đảo,hòn đảo,quần đảo,đảo san hô,san hô,cồn cát,cồn,đá ngầm,chỗ nông,chỗ cạn"
            },
            "place/locality": {
                "name": "Địa phương"
            },
            "place/village": {
                "name": "Làng"
            },
            "power": {
                "name": "Điện năng"
            },
            "power/generator": {
                "name": "Nhà máy Điện"
            },
            "power/line": {
                "name": "Đường Dây điện"
            },
            "power/pole": {
                "name": "Cột điện"
            },
            "power/sub_station": {
                "name": "Trạm Điện Phụ"
            },
            "power/tower": {
                "name": "Cột điện Cao thế"
            },
            "power/transformer": {
                "name": "Máy biến áp"
            },
            "railway": {
                "name": "Đường sắt"
            },
            "railway/abandoned": {
                "name": "Đường sắt Bỏ hoang"
            },
            "railway/disused": {
                "name": "Đường sắt Không hoạt động"
            },
            "railway/level_crossing": {
                "name": "Giao lộ Đường sắt",
                "terms": "giao lộ đường sắt,giao lộ đường ray,nút giao đường sắt"
            },
            "railway/monorail": {
                "name": "Đường sắt Một ray"
            },
            "railway/rail": {
                "name": "Đường sắt"
            },
            "railway/subway": {
                "name": "Đường Tàu điện ngầm"
            },
            "railway/subway_entrance": {
                "name": "Cửa vào Nhà ga Tàu điện ngầm"
            },
            "railway/tram": {
                "name": "Đường Tàu điện",
                "terms": "đường tàu điện,tàu điện,đường xe điện,xe điện"
            },
            "shop": {
                "name": "Tiệm"
            },
            "shop/alcohol": {
                "name": "Tiệm Rượu"
            },
            "shop/bakery": {
                "name": "Tiệm Bánh"
            },
            "shop/beauty": {
                "name": "Tiệm Mỹ phẩm"
            },
            "shop/beverages": {
                "name": "Tiệm Đồ uống"
            },
            "shop/bicycle": {
                "name": "Tiệm Xe đạp"
            },
            "shop/books": {
                "name": "Hiệu Sách"
            },
            "shop/boutique": {
                "name": "Tiệm Thời trang"
            },
            "shop/butcher": {
                "name": "Tiệm Thịt"
            },
            "shop/car": {
                "name": "Tiệm Xe hơi"
            },
            "shop/car_parts": {
                "name": "Tiệm Phụ tùng Xe hơi"
            },
            "shop/car_repair": {
                "name": "Tiệm Sửa Xe"
            },
            "shop/chemist": {
                "name": "Tiệm Dược phẩm"
            },
            "shop/clothes": {
                "name": "Tiệm Quần áo"
            },
            "shop/computer": {
                "name": "Tiệm Máy tính"
            },
            "shop/confectionery": {
                "name": "Tiệm Kẹo"
            },
            "shop/convenience": {
                "name": "Tiệm Tiện lợi"
            },
            "shop/deli": {
                "name": "Tiệm Deli"
            },
            "shop/department_store": {
                "name": "Tiệm Bách hóa"
            },
            "shop/doityourself": {
                "name": "Tiệm Vật liệu Xây dựng"
            },
            "shop/dry_cleaning": {
                "name": "Tiệm Giặt Hấp tẩy"
            },
            "shop/electronics": {
                "name": "Tiệm Thiết bị Điện tử"
            },
            "shop/fishmonger": {
                "name": "Tiệm Cá"
            },
            "shop/florist": {
                "name": "Tiệm Hoa"
            },
            "shop/furniture": {
                "name": "Tiệm Đồ đạc"
            },
            "shop/garden_centre": {
                "name": "Trung tâm Làm vườn"
            },
            "shop/gift": {
                "name": "Tiệm Quà tặng"
            },
            "shop/greengrocer": {
                "name": "Tiệm Rau quả"
            },
            "shop/hairdresser": {
                "name": "Tiệm Làm tóc"
            },
            "shop/hardware": {
                "name": "Tiệm Ngũ kim"
            },
            "shop/hifi": {
                "name": "Tiệm Thiết bị Âm thanh"
            },
            "shop/jewelry": {
                "name": "Tiệm Kim hoàn"
            },
            "shop/kiosk": {
                "name": "Gian hàng"
            },
            "shop/laundry": {
                "name": "Tiệm Máy giặt"
            },
            "shop/mall": {
                "name": "Trung tâm Thương mại"
            },
            "shop/mobile_phone": {
                "name": "Tiệm Điện thoại Di động"
            },
            "shop/motorcycle": {
                "name": "Tiệm Xe máy"
            },
            "shop/music": {
                "name": "Tiệm Âm nhạc"
            },
            "shop/newsagent": {
                "name": "Quầy báo"
            },
            "shop/optician": {
                "name": "Tiệm Kính mắt"
            },
            "shop/outdoor": {
                "name": "Tiệm Thể thao Ngoài trời"
            },
            "shop/pet": {
                "name": "Tiệm Vật nuôi"
            },
            "shop/shoes": {
                "name": "Tiệm Giày"
            },
            "shop/sports": {
                "name": "Tiệm Thể thao"
            },
            "shop/stationery": {
                "name": "Tiệm Văn phòng phẩm"
            },
            "shop/supermarket": {
                "name": "Siêu thị",
                "terms": "siêu thị,chợ,tiệm,cửa hàng,khu buôn bán,trung tâm buôn bán,chợ trời,chợ phiên,chợ xổm"
            },
            "shop/toys": {
                "name": "Tiệm Đồ chơ"
            },
            "shop/travel_agency": {
                "name": "Văn phòng Du lịch"
            },
            "shop/tyres": {
                "name": "Tiệm Lốp xe"
            },
            "shop/vacant": {
                "name": "Tiệm Đóng cửa"
            },
            "shop/variety_store": {
                "name": "Tiệm Tạp hóa"
            },
            "shop/video": {
                "name": "Tiệm Phim"
            },
            "tourism": {
                "name": "Du lịch"
            },
            "tourism/alpine_hut": {
                "name": "Túp lều trên Núi"
            },
            "tourism/artwork": {
                "name": "Nghệ phẩm"
            },
            "tourism/attraction": {
                "name": "Điểm Thu hút Du lịch"
            },
            "tourism/camp_site": {
                "name": "Nơi Cắm trại"
            },
            "tourism/caravan_site": {
                "name": "Bãi Đậu Nhà lưu động"
            },
            "tourism/chalet": {
                "name": "Nhà nghỉ Riêng biệt"
            },
            "tourism/guest_house": {
                "name": "Nhà khách",
                "terms": "nhà khách,nhà trọ"
            },
            "tourism/hostel": {
                "name": "Nhà trọ"
            },
            "tourism/hotel": {
                "name": "Khách sạn"
            },
            "tourism/information": {
                "name": "Thông tin"
            },
            "tourism/motel": {
                "name": "Khách sạn Dọc đường"
            },
            "tourism/museum": {
                "name": "Bảo tàng",
                "terms": "viện bảo tàng,bảo tàng,thư viện,văn thư lưu trữ,lưu trữ,kho"
            },
            "tourism/picnic_site": {
                "name": "Nơi Ăn Ngoài trời"
            },
            "tourism/theme_park": {
                "name": "Công viên Chủ đề"
            },
            "tourism/viewpoint": {
                "name": "Điểm Ngắm cảnh"
            },
            "tourism/zoo": {
                "name": "Vườn thú"
            },
            "waterway": {
                "name": "Đường sông"
            },
            "waterway/canal": {
                "name": "Kênh đào"
            },
            "waterway/dam": {
                "name": "Đập nước"
            },
            "waterway/ditch": {
                "name": "Mương"
            },
            "waterway/drain": {
                "name": "Cống"
            },
            "waterway/river": {
                "name": "Sông",
                "terms": "sông,con sông,dòng sông,nhánh sông,sông nhánh,sông con,suối,suối nước,dòng suối,châu thổ"
            },
            "waterway/riverbank": {
                "name": "Bờ sông"
            },
            "waterway/stream": {
                "name": "Dòng suối",
                "terms": "nhánh sông,sông nhánh,sông con,suối,suối nước,dòng suối"
            },
            "waterway/weir": {
                "name": "Đập Tràn"
            }
        }
    }
};
