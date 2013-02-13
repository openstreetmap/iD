locale.lv = {
    modes: {
        add_area: {
            title: "Apgabals",
            description: "Pievieno parkus, ēkas, ezerus un citus apgabalus.",
            tail: "Klikšķiniet uz kartes, lai sāktu zīmēt apgabalu, piemēram, parku, ezeru, vai ēku."
        },
        add_line: {
            title: "Līnija",
            description: "Līnijas var būt ceļi, ielas, takas vai pat kanāli.",
            tail: "Klikšķiniet uz kartes, lai sāktu zīmēt līniju, piemēram, ceļu vai taku."
        },
        add_point: {
            title: "Punkts",
            description: "Kafejnīcas, pieminekļi, un veikali var būt punkti.",
            tail: "Klikšķiniet uz kartes, lai pievienotu interešu punktu."
        },
        browse: {
            title: "Pārlūkot",
            description: "Pārlūko karti."
        },
        draw_area: {
            tail: "Klikšķiniet, lai pievinotu mezglus apgabalam. Lai beigtu zīmēt apgabalu, klikšķiniet uz sākuma mezgla."
        },
        draw_line: {
            tail: "Klikšķiniet, lai pievienotu mezglus līnijai. Lai savienotu ar citām linijām, klikšķiniet uz tām. Dubultklikšķis nobeidz līniju."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Punkts pievienots.",
                vertex: "Mezgls pievienots līnijai."
            }
        },
        start: {
            annotation: {
                line: "Līnija iesākta.",
                area: "Apgabals iesākts."
            }
        },
        'continue': {
            annotation: {
                line: "Līnija turpināta.",
                area: "Apgabals turpināts."
            }
        },
        cancel_draw: {
            annotation: "Zīmēšana atcelta."
        },
        change_tags: {
            annotation: "Apzīmējumi mainīti."
        },
        circularize: {
            title: "Pārveidot par apļveida",
            description: "Pārveidot šo objektu par apļveida.",
            key: "O",
            annotation: {
                line: "Līnija pārveidota par apļveida.",
                area: "Apgabals pārveidots par apļveida."
            }
        },
        orthogonalize: {
            title: "Ortogonalizēt",
            description: "Pārveidot, lai visi leņķi būtu tasnleņķi.",
            key: "Q",
            annotation: {
                line: "Līnijas leņķi pārvedoti par taisnleņķiem.",
                area: "Apgabala leņķi pārvedoti par taisnleņķiem."
            }
        },
        'delete': {
            title: "Dzēst",
            description: "Izdzēst no kartes.",
            key: "⌫",
            annotation: {
                point: "Punkts dzēsts.",
                vertex: "Mezgls dzests.",
                line: "Līnija dzēsta.",
                area: "Apgabals dzēsts.",
                relation: "Relācija dzēsta.",
                multiple: "{n} objekti dzēsti."
            }
        },
        connect: {
            annotation: {
                point: "Līnija savienota ar punktu.",
                vertex: "Līnija savienota ar citu.",
                line: "Līnija savienota ar līniju.",
                area: "Līnija savienota ar apgabalu."
            }
        },
        disconnect: {
            title: "Atvienot",
            description: "Atvieno līnijas.",
            key: "D",
            annotation: "Līnijas atvienotas."
        },
        merge: {
            title: "Sapludināt",
            description: "Sapludināt līnijas.",
            key: "C",
            annotation: "{n} līnijas sapludinātas."
        },
        move: {
            title: "Pārvietot",
            description: "Pārvieto objektu.",
            key: "M",
            annotation: {
                point: "Punkts pārvietots.",
                vertex: "Mezgls pārvietots.",
                line: "Līnija pārvietota.",
                area: "Apgabals pārvietots."
            }
        },
        reverse: {
            title: "Mainīt virzienu",
            description: "Mainīt līnijas virzienu.",
            key: "V",
            annotation: "Līnijas virziens mainīts."
        },
        split: {
            title: "Sadalīt",
            description: "Sadalīt līniju pie šī punkta.",
            key: "X",
            annotation: "Līnija sadalīta."
        }
    },

    nothing_to_undo: "Nav nekā, ko atcelt",
    nothing_to_redo: "Nav nekā, ko atsaukt",

    just_edited: "Jūs nupat rediģējāt OpenStreetMap",
    browser_notice: "Šis redaktors tiek atbalstīts ar Firefox, Chrome, Safari, Opera, un Internet Explorer 9 un jaunāku. Lūdzu, atjauniniet savu pārlūkprogrammu vai izmantojiet Potlatch 2 to kartes rediģēšanai",
    view_on_osm: "Apskatīt OSM lapu",
    zoom_in_edit: "pietuviniet, lai rediģētu karti",
    logout: "atslēgties",
    report_a_bug: "ziņot par kļūdu",

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
        list: "{users} papildinājumi redzami",
        truncated_list: "{users} un {count} citu papildinājumi redzami"
    },

    geocoder: {
        title: "Atrast vietu",
        placeholder: "meklē vietu",
        no_results: "Nevar atrast vietu '{name}'"
    },

    geolocate: {
        title: "Show My Location"
    },

    inspector: {
        no_documentation_combination: "Šai apzīmējumu kombinācijai nav piejama dokumetācija",
        no_documentation_key: "There is no documentation available for this key",
        new_tag: "Jauns apzīmējums",
        edit_tags: "Rediģēt apzīmējumus",
        okay: "Labi",
        view_on_osm: "View on OSM"
    },

    layerswitcher: {
        title: "Fons",
        description: "Fona iestatījumi",
        percent_brightness: "{opacity}% gaišums",
        fix_misalignment: "Labot fona nolīdzināšanu",
        reset: "Pārstatīt"
    },

    restore: {
        description: "You have unsaved changes from a previous editing session. Do you wish to restore these changes?",
        restore: "Restore",
        reset: "Reset"
    },

    save: {
        title: "Saglabāt",
        help: "Saglabā izmaiņas, padarot tās redzamas citiem",
        error: "Kļūda. Nevarēja saglabāt maiņas",
        uploading: "Augšupielādē",
        unsaved_changes: "Jums ir nesaglabātas izmaiņas"
    },

    source_switch: {
        live: "live",
        dev: "dev"
    },

    tag_reference: {
        description: "Apraksts",
        on_wiki: "{tag} on wiki.osm.org",
        used_with: "used with {type}"
    },

    validations: {
        untagged_point: "Neapzīmēts punkts",
        untagged_line: "Neapzīmēta līnija",
        untagged_area: "Neapzīmēts apgabals",
        tag_suggests_area: "Apzīmējums {tag} parasti tiek lietots apgabaliem, bet objekts nav apgabals",
        deprecated_tags: "Novecojuši apzīmējumi: {tags}"
    },

    zoom: {
        in: "Pietuvināt",
        out: "Attālināt"
    }
};
