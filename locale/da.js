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
                point: "Tilføjede et punkt.",
                vertex: "Tilføjede en node til en vej."
            }
        },
        start: {
            annotation: {
                line: "Startede en linje.",
                area: "Startede et område."
            }
        },
        'continue': {
            annotation: {
                line: "Forsatte en linje.",
                area: "Forsatte et område."
            }
        },
        cancel_draw: {
            annotation: "Annulleret indtegning."
        },
        change_tags: {
            annotation: "Ændret tags."
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
            title: "Slet",
            description: "Fjern dette fra kortet.",
            key: "⌫",
            annotation: {
                point: "Slettede et punkt.",
                vertex: "Slettede en node fra en vej.",
                line: "Slettede en linje.",
                area: "Slettede et område.",
                relation: "Sletede en relation.",
                multiple: "Slettede {n} objekter."
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
            title: "Flyt",
            description: "Flyt dette til anden lokation.",
            key: "M",
            annotation: {
                point: "Flyttede et punktMoved.",
                vertex: "Flyttede en node i en vej.",
                line: "Flyttede en linje.",
                area: "Flyttede et område."
            }
        },
        reverse: {
            title: "Reverse",
            description: "Make this line go in the opposite direction.",
            key: "V",
            annotation: "Reversed a line."
        },
        split: {
            title: "Del op",
            description: "Del op i to vej ved dette punkt.",
            key: "X",
            annotation: "Del op en vej."
        }
    },

    validations: {
        untagged_point: "Untagged point which is not part of a line or area",
        untagged_line: "Untagged line",
        untagged_area: "Untagged area",
        tag_suggests_area: "The tag {tag} suggests line should be area, but it is not an area",
        deprecated_tags: "Deprecated tags: {tags}"
    },

    save: "Gem",
    unsaved_changes: "Du har ændringer der ikke er gemt endnu",
    save_help: "Gem ændringer til OpenStreetMap gør dem synlige for andre brugere",
    no_changes: "Du har ingen ændringer til at gemme endnu.",
    save_error: "Der skete en fejl da du prøvede at gemme",
    uploading_changes: "Gemmer nu ændringer til OpenStreetMap.",
    just_edited: "Du har lige rettede i OpenStreetMap!",
    okay: "Ok",

    "zoom-in": "Zoom ind",
    "zoom-out": "Zoom ud",

    nothing_to_undo: "Nothing to undo.",
    nothing_to_redo: "Nothing to redo.",

    browser_notice: "This editor is supported in Firefox, Chrome, Safari, Opera, and Internet Explorer 9 and above. Please upgrade your browser or use Potlatch 2 to edit the map.",

    inspector: {
        no_documentation_combination:  "Der er ingen dokumentation for denne tag kombination",
        no_documentation_key: "Der er ingen dokumenation tilgængelig for denne nøgle",
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
