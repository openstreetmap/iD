locale.en = {
    modes: {
        add_area: {
            title: "Area",
            description: "Add parks, buildings, lakes, or other areas to the map.",
            tail: "Click on the map to start drawing an area, like a park, lake, or building."
        },
        add_line: {
            title: "Line",
            description: "Lines can be highways, streets, pedestrian paths, or even canals.",
            tail: "Click on the map to start drawing an road, path, or route."
        },
        add_point: {
            title: "Point",
            description: "Restaurants, monuments, and postal boxes are points.",
            tail: "Click on the map to add a point."
        },
        browse: {
            title: "Browse",
            description: "Pan and zoom the map."
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
            annotation: "Canceled drawing."
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
                area: "Moved an area.",
                multiple: "Moved multiple objects"
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

    nothing_to_undo: "Nothing to undo.",
    nothing_to_redo: "Nothing to redo.",

    just_edited: "You Just Edited OpenStreetMap!",
    browser_notice: "This editor is supported in Firefox, Chrome, Safari, Opera, and Internet Explorer 9 and above. Please upgrade your browser or use Potlatch 2 to edit the map.",
    view_on_osm: "View on OSM",
    zoom_in_edit: "zoom in to edit the map",
    logout: "logout",
    report_a_bug: "report a bug",

    commit: {
        title: "Save Changes",
        description_placeholder: "Brief description of your contributions",
        upload_explanation: "The changes you upload as {user} will be visible on all maps that use OpenStreetMap data.",
        save: "Save",
        cancel: "Cancel",
        warnings: "Warnings",
        modified: "Modified",
        deleted: "Deleted",
        created: "Created"
    },

    contributors: {
        list: "Viewing contributions by {users}",
        truncated_list: "Viewing contributions by {users} and {count} others"
    },

    geocoder: {
        title: "Find A Place",
        placeholder: "find a place",
        no_results: "Couldn't locate a place named '{name}'"
    },

    geolocate: {
        title: "Show My Location"
    },

    inspector: {
        no_documentation_combination: "There is no documentation available for this tag combination",
        no_documentation_key: "There is no documentation available for this key",
        new_tag: "New Tag",
        edit_tags: "Edit tags",
        okay: "Okay",
        view_on_osm: "View on OSM",
        name: "Name",
        editing: "Editing {type}",
        additional: "Additional tags",
        choose: "What are you adding?"
    },

    layerswitcher: {
        title: "Background",
        description: "Background Settings",
        percent_brightness: "{opacity}% brightness",
        fix_misalignment: "Fix misalignment",
        reset: "reset"
    },

    restore: {
        description: "You have unsaved changes from a previous editing session. Do you wish to restore these changes?",
        restore: "Restore",
        reset: "Reset"
    },

    save: {
        title: "Save",
        help: "Save changes to OpenStreetMap, making them visible to other users.",
        error: "An error occurred while trying to save",
        uploading: "Uploading changes to OpenStreetMap.",
        unsaved_changes: "You have unsaved changes"
    },

    splash: {
        welcome: "Welcome to the iD OpenStreetMap editor",
        text: "This is development version {version}. For more information see {website} and report bugs at {github}."
    },

    source_switch: {
        live: "live",
        dev: "dev"
    },

    tag_reference: {
        description: "Description",
        on_wiki: "{tag} on wiki.osm.org",
        used_with: "used with {type}"
    },

    validations: {
        untagged_point: "Untagged point which is not part of a line or area",
        untagged_line: "Untagged line",
        untagged_area: "Untagged area",
        tag_suggests_area: "The tag {tag} suggests line should be area, but it is not an area",
        deprecated_tags: "Deprecated tags: {tags}"
    },

    zoom: {
        'in': "Zoom In",
        out: "Zoom Out"
    }
};
