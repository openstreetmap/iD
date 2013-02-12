locale.da = {
    modes: {
        add_area: {
            title: "Område",
            description: "Tilføj parker, bygninger, søer, eller andre områder til kortet.",
            tail: "Klik på kortet for at indtegne et område fx en park, sø eller bygning.",
            key: "A"
        },
        add_line: {
            title: "Linje",
            description: "Linjer kan være veje, gader eller stier selv kanaler kan være linjer.",
            tail: "Klik på koret for at indtegne en vej, sti eller rute.",
            key: "L"
        },
        add_point: {
            title: "Punkt",
            description: "Restauranter, mindesmærker og postkasser er punkter.",
            tail: "Klik på kortet for at tilføje et punkt.",
            key: "P"
        },
        browse: {
            title: "Browse",
            description: "Træk rundt og zoom på kortet.",
            key: "B"
        },
        draw_area: {
            tail: "Klik her for at tilføje punkter til dit område. Click the first point to finish the area."
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

    save: "Save",
    unsaved_changes: "You have unsaved changes",
    save_help: "Save changes to OpenStreetMap, making them visible to other users",
    no_changes: "You don't have any changes to save.",
    save_error: "An error occurred while trying to save",
    uploading_changes: "Uploading changes to OpenStreetMap.",
    just_edited: "You Just Edited OpenStreetMap!",
    okay: "Okay",

    "zoom-in": "Zoom ind",
    "zoom-out": "Zoom ud",

    nothing_to_undo: "Nothing to undo.",
    nothing_to_redo: "Nothing to redo.",

    browser_notice: "This editor is supported in Firefox, Chrome, Safari, Opera, and Internet Explorer 9 and above. Please upgrade your browser or use Potlatch 2 to edit the map.",

    inspector: {
        no_documentation_combination:  "This is no documentation available for this tag combination",
        no_documentation_key: "This is no documentation available for this key",
        new_tag: "Nyt Tag"
    },

    view_on_osm: "Vis på OSM",

    zoom_in_edit: "zoom ind for at rette kortet",

    edit_tags: "Ret tags",

    geocoder: {
        title: "Find  et sted",
        placeholder: "find et sted",
        no_results: "Kunne ikke finde '{name}'"
    },

    description: "Description",

    logout: "log ud",

    report_a_bug: "report a bug",

    layerswitcher: {
        title: "Background",
        description: "Background Settings",
        percent_brightness: "{opacity}% brightness",
        fix_misalignment: "Fix misalignment",
        reset: "nulstill"
    },

    contributors: {
        list: "Vis bidrag fra {users}",
        truncated_list: "Vis bidrag fra {users} og {count} andre"
    },

    source_switch: {
        live: "live",
        dev: "dev"
    }
};
