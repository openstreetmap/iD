locale.da = {
    modes: {
        add_area: {
            title: "Område",
            description: "Tilføj parker, bygninger, søer, eller andre områder til kortet.",
            tail: "Klik på kortet for at indtegne et område fx en park, sø eller bygning."
        },
        add_line: {
            title: "Linje",
            description: "Linjer kan være veje, gader eller stier selv kanaler kan være linjer.",
            tail: "Klik på koret for at indtegne en vej, sti eller rute."
        },
        add_point: {
            title: "Punkt",
            description: "Restauranter, mindesmærker og postkasser er punkter.",
            tail: "Klik på kortet for at tilføje et punkt."
        },
        browse: {
            title: "Browse",
            description: "Træk rundt og zoom på kortet."
        },
        draw_area: {
            tail: "Klik her for at tilføje punkter til dit område. Klik på første punkt igen for at færdiggøre området."
        },
        draw_line: {
            tail: "Klik her for at tilføje flere punkter til linjen. Klik på andre linjer for at forbinde dem og dobbeltklik for at afslutte linjen."
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
                line: "Fortsatte en linje.",
                area: "Fortsatte et område."
            }
        },
        cancel_draw: {
            annotation: "Annullerede indtegning."
        },
        change_tags: {
            annotation: "Ændret tags."
        },
        circularize: {
            title: "Cirkularisere",
            description: "Lav denne rund.",
            key: "O",
            annotation: {
                line: "Lavede en linje rund.",
                area: "Lave et område rundt."
            }
        },
        orthogonalize: {
            title: "Ortogonalisering",
            description: "Gør disse hjørner firkantet.",
            key: "Q",
            annotation: {
                line: "Lavede hjørner på en linje firkantet.",
                area: "Lavede hjørner på et område firkantet."
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
                point: "Forbandt en vej til et punkt.",
                vertex: "Forbandt en vej til en anden vej.",
                line: "Forbandt en vej til en linje.",
                area: "Forbandt en vej til et område."
            }
        },
        disconnect: {
            title: "Afbryd",
            description: "Afbryd disse veje fra hinanden.",
            key: "D",
            annotation: "Afbrød vejene."
        },
        merge: {
            title: "Flet",
            description: "Flet disse linjer.",
            key: "C",
            annotation: "Flettede {n} linjer."
        },
        move: {
            title: "Flyt",
            description: "Flyt dette til en anden lokation.",
            key: "M",
            annotation: {
                point: "Flyttede et punkt.",
                vertex: "Flyttede en node i en vej.",
                line: "Flyttede en linje.",
                area: "Flyttede et område."
            }
        },
        reverse: {
            title: "Omvendt",
            description: "Lad denne linje gå i modsat retning.",
            key: "V",
            annotation: "Omvendte en linje."
        },
        split: {
            title: "Del op",
            description: "Del op i to veje ved dette punkt.",
            key: "X",
            annotation: "Del en vej op."
        }
    },

    nothing_to_undo: "Ingenting at fortryde.",
    nothing_to_redo: "Ingenting at gendanne.",

    just_edited: "Du har lige rettet i OpenStreetMap!",
    browser_notice: "Dette værktøj er understøttet i Firefox, Chrome, Safari, Opera og Internet Explorer 9 og højere. Vær venlig at opgradere din browser eller benyt Potlatch 2 for at rette i kortet.",
    view_on_osm: "Vis på OSM",
    zoom_in_edit: "zoom ind for at rette på kortet",
    logout: "log ud",
    report_a_bug: "rapportere en fejl",

    layerswitcher: {
        title: "Baggrund",
        description: "Baggrundsindstillinger",
        percent_brightness: "{opacity}% lysstyrke",
        fix_misalignment: "Lav fejljustering",
        reset: "nulstil"
    },

    commit: {
        title: "Gem ændringer",
        description_placeholder: "Kort beskrivelse af dine bidrag",
        upload_explanation: "Dine ændringer vil som brugernavn {user} blive synligt på alle kort der bruger OpenStreetMap data.",
        save: "Gem",
        cancel: "Fortryd",
        warnings: "Advarsler",
        modified: "Modificeret",
        deleted: "Slettede",
        created: "Lavede"
    },

    contributors: {
        list: "Vis bidrag fra {users}",
        truncated_list: "Vis bidrag fra {users} og {count} andre"
    },

    geocoder: {
        title: "Find et sted",
        placeholder: "find et sted",
        no_results: "Kunne ikke finde '{name}'"
    },

    geolocate: {
        title: "Vis min lokalitet"
    },

    inspector: {
        no_documentation_combination:  "Der er ingen dokumentation for denne tag kombination",
        no_documentation_key: "Der er ingen dokumentation tilgængelig for denne nøgle",
        new_tag: "Nyt tag",
        edit_tags: "Ret tags",
        okay: "Ok",
        view_on_osm: "Vis på OSM",
        name: "Name",
        editing: "Editing {type}",
        additional: "Additional tags",
        choose: "What are you adding?"
    },

    restore: {
        description: "Du har ændringer fra forrige session som ikke er gemt. Ønsker du at gendanne disse ændringer?",
        restore: "Gendan",
        reset: "Nulstil"
    },

    save: {
        title: "Gem",
        help: "Gem ændringer til OpenStreetMap vil gøre dem synlige for andre brugere.",
        error: "Der skete en fejl da du prøvede at gemme",
        uploading: "Gemmer nu ændringer til OpenStreetMap.",
        unsaved_changes: "Du har ændringer der ikke er gemt endnu",
    },

    splash: {
        welcome: "Velkommen til iD OpenStreetMap værktøjet",
        text: "Dette er udviklingsversion {version}. Mere information se {website} og rapportere fejl på {github}."
    },

    source_switch: {
        live: "live",
        dev: "dev"
    },

    tag_reference: {
        description: "Beskrivelse",
        on_wiki: "{tag} på wiki.osm.org",
        used_with: "brugt med {type}"
    },

    zoom: {
        in: "Zoom ind",
        out: "Zoom ud"
    },

    validations: {
        untagged_point: "Mangler et tag på punkt som ikke er del af en linje eller område",
        untagged_line: "Mangler tag på linje",
        untagged_area: "Mangler tag på område",
        tag_suggests_area: "Dette tag {tag} mener denne linje skule være et område, men dette er ikke et område",
        deprecated_tags: "Uønskede tags: {tags}"
    }
};
