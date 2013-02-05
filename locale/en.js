locale.en = {
    modes: {
        add_area: {
            title: "Area",
            description: "Add parks, buildings, lakes, or other areas to the map.",
            tail: "Click on the map to start drawing an area, like a park, lake, or building.",
            key: "A"
        },
        add_line: {
            title: "Line",
            description: "Lines can be highways, streets, pedestrian paths, or even canals.",
            tail: "Click on the map to start drawing an road, path, or route.",
            key: "L"
        },
        add_point: {
            title: "Point",
            description: "Restaurants, monuments, and postal boxes are points.",
            tail: "Click on the map to add a point.",
            key: "P"
        },
        browse: {
            title: "Browse",
            description: "Pan and zoom the map.",
            key: "B"
        },
        draw_area: {
            tail: "Click to add points to your area. Click the first point to finish the area."
        },
        draw_line: {
            tail: "Click to add more points to the line. Click on other lines to connect to them, and double-click to end the line."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Added a point.",
                vertex: "Added a node to a way."
            }
        },
        start: {
            annotation: {
                line: "Started a line.",
                area: "Started an area."
            }
        },
        'continue': {
            annotation: {
                line: "Continued a line.",
                area: "Continued an area."
            }
        },
        cancel_draw: {
            annotation: "Cancelled drawing."
        },
        change_tags: {
            annotation: "Changed tags."
        },
        circularize: {
            title: "Circularize",
            description: "Make this round.",
            key: "O",
            annotation: {
                line: "Made a line circular.",
                area: "Made an area circular."
            }
        },
        orthogonalize: {
            title: "Orthogonalize",
            description: "Square these corners.",
            key: "Q",
            annotation: {
                line: "Squared the corners of a line.",
                area: "Squared the corners of an area."
            }
        },
        'delete': {
            title: "Delete",
            description: "Remove this from the map.",
            key: "⌫",
            annotation: {
                point: "Deleted a point.",
                vertex: "Deleted a node from a way.",
                line: "Deleted a line.",
                area: "Deleted an area.",
                relation: "Deleted a relation.",
                multiple: "Deleted {n} objects."
            }
        },
        connect: {
            annotation: {
                point: "Connected a way to a point.",
                vertex: "Connected a way to another.",
                line: "Connected a way to a line.",
                area: "Connected a way to an area."
            }
        },
        disconnect: {
            title: "Disconnect",
            description: "Disconnect these ways from each other.",
            key: "D",
            annotation: "Disconnected ways."
        },
        merge: {
            title: "Merge",
            description: "Merge these lines.",
            key: "C",
            annotation: "Merged {n} lines."
        },
        move: {
            title: "Move",
            description: "Move this to a different location.",
            key: "M",
            annotation: {
                point: "Moved a point.",
                vertex: "Moved a node in a way.",
                line: "Moved a line.",
                area: "Moved an area."
            }
        },
        reverse: {
            title: "Reverse",
            description: "Make this line go in the opposite direction.",
            key: "V",
            annotation: "Reversed a line."
        },
        split: {
            title: "Split",
            description: "Split this into two ways at this point.",
            key: "X",
            annotation: "Split a way."
        }
    },

    validations: {
        untagged_point: "Untagged point which is not part of a line or area",
        untagged_line: "Untagged line",
        untagged_area: "Untagged area",
        tag_suggests_area: "The tag {tag} suggests line should be area, but it is not an area",
        deprecated_tags: "Deprecated tags: {tags}"
    },

    "save": "Save",
    "save_help": "Save changes to OpenStreetMap, making them visible to other users",
    "no_changes": "You don't have any changes to save.",
    "save_error": "An error occurred while trying to save",
    "uploading_changes": "Uploading changes to OpenStreetMap.",
    "just_edited": "You Just Edited OpenStreetMap!",
    "okay": "Okay",

    "zoom-in": "Zoom In",
    "zoom-out": "Zoom Out",

    nothing_to_undo: "Nothing to undo.",
    nothing_to_redo: "Nothing to redo.",

    "browser_notice": "This editor is supported in Firefox, Chrome, Safari, Opera, and Internet Explorer 9 and above. Please upgrade your browser or use Potlatch 2 to edit the map.",

    inspector: {
        no_documentation_combination:  "This is no documentation available for this tag combination",
        no_documentation_key: "This is no documentation available for this key",
        new_tag: "New Tag"
    },

    "view_on_osm": "View on OSM",

    "zoom_in_edit": "zoom in to edit the map",

    "edit_tags": "Edit tags",

    geocoder: {
        "find_location": "Find A Location",
        "find_a_place": "find a place"
    },

    "description": "Description",

    "logout": "logout",

    layerswitcher: {
        title: "Background",
        description: "Background Settings",
        percent_brightness: "{opacity}% brightness",
        fix_misalignment: "Fix misalignment",
        reset: "reset"
    }
};
