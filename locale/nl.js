locale.nl = {
    modes: {
        add_area: {
            title: "Vlak",
            description: "Voeg parken, gebouwen, meren of andere vlakken aan de kaart toe.",
            tail: "Klik in de kaart om het tekenen van een vlak zoals een park, gebouw of meer te starten."
        },
        add_line: {
            title: "Lijn",
            description: "Lijnen zijn bijvoorbeeld rijkswegen, straten, voetpaden of kanalen.",
            tail: "Klik in de kaart om het tekenen van straat, pad of route te starten."
        },
        add_point: {
            title: "Punt",
            description: "Restaurants, monumenten en brievenbussen zijn bijvoorbeeld punten.",
            tail: "Klik in de kaart om een punt toe te voegen."
        },
        browse: {
            title: "Navigatie",
            description: "Verschuif en zoom in op de kaart."
        },
        draw_area: {
            tail: "Klik om punten aan het vlak toe te voegen. Klik op het eerste punt om het vlak te sluiten."
        },
        draw_line: {
            tail: "Klik om meer punten aan de lijn toe te voegen. Klik op een andere lijn om de lijnen te verbinden en dubbelklik om de lijn af te sluiten."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Punt toegevoegd.",
                vertex: "Knoop aan een weg toegevoegd."
            }
        },
        start: {
            annotation: {
                line: "Lijn begonnen.",
                area: "Vlak begonnen."
            }
        },
        'continue': {
            annotation: {
                line: "Lijn voortgezet.",
                area: "Vlak voortgezet."
            }
        },
        cancel_draw: {
            annotation: "Tekenen afgebroken."
        },
        change_tags: {
            annotation: "Tags aangepast."
        },
        circularize: {
            title: "Rond maken",
            description: "Maak dit rond.",
            key: "O",
            annotation: {
                line: "Maak een lijn rond.",
                area: "Maak een vlak rond."
            }
        },
        orthogonalize: {
            title: "Haaks maken",
            description: "Maak deze hoeken haaks.",
            key: "Q",
            annotation: {
                line: "Hoeken van een lijn zijn haaks gemaakt.",
                area: "Hoeken van een vlak zijn haaks gemaakt."
            }
        },
        'delete': {
            title: "Verwijderen",
            description: "Verwijder dit van de kaart.",
            key: "⌫",
            annotation: {
                point: "Punt verwijderd.",
                vertex: "Knoop uit een weg verwijderd.",
                line: "Lijn verwijderd.",
                area: "Vlak verwijderd.",
                relation: "Relatie verwijderd.",
                multiple: "{n} objecten verwijderd."
            }
        },
        connect: {
            annotation: {
                point: "Weg aan een punt verbonden.",
                vertex: "Weg aan een andere weg verbonden.",
                line: "Weg aan een lijn  verbonden.",
                area: "Weg aan een vlak verbonden."
            }
        },
        disconnect: {
            title: "Losmaken",
            description: "Maak deze wegen van elkaar los.",
            key: "D",
            annotation: "Wegen losgemaakt."
        },
        merge: {
            title: "Samenvoegen",
            description: "Voeg deze lijnen samen.",
            key: "C",
            annotation: "{n} lijnen samengevoegd."
        },
        move: {
            title: "Verschuiven",
            description: "Verschuif dit object naar een andere plek.",
            key: "M",
            annotation: {
                point: "Punt verschoven.",
                vertex: "Knoop van een weg verschoven.",
                line: "Lijn verschoven.",
                area: "Vlak verschoven."
            }
        },
        reverse: {
            title: "Omdraaien",
            description: "Draai de richting van deze lijn om.",
            key: "V",
            annotation: "Lijnrichting omgedraaid."
        },
        split: {
            title: "Splitsen",
            description: "Splits deze weg op het geselecteerde punt.",
            key: "X",
            annotation: "Weg opgesplitst."
        }
    },

    nothing_to_undo: "Niets om ongedaan te maken.",
    nothing_to_redo: "Niets om opnieuw uit te voeren.",

    just_edited: "Je hebt zojuist OpenStreetMap aangepast!",
    browser_notice: "Deze editor wordt door Firefox, Chrome, Safari, Opera en Internet Explorer (versie 9 en hoger) ondersteund. Download een nieuwere versie van je browser of gebruik Potlatch 2 om de kaart aan te passen.",
    view_on_osm: "Bekijk op OSM",
    zoom_in_edit: "Zoom in om de kaart aan te passen.",
    logout: "Afmelden",
    report_a_bug: "Meld een softwareprobleem",

    commit: {
        title: "Aanpassingen opslaan",
        description_placeholder: "Een korte omschrijving van je bijdragen",
        upload_explanation: "Aanpassingen die je als {user} uploadt worden zichtbaar op alle kaarten die de gegevens van OpenStreetMap gebruiken.",
        save: "Opslaan",
        cancel: "Afbreken",
        warnings: "Waarschuwingen",
        modified: "Aangepast",
        deleted: "Verwijderd",
        created: "Aangemaakt"
    },

    contributors: {
        list: "Deze kaartuitsnede bevat bijdragen van:",
        truncated_list: "Deze kaartuitsnede bevat bijdragen van: {users} en {count} anderen"
    },

    geocoder: {
        title: "Zoek een plaats",
        placeholder: "Zoek een plaats",
        no_results: "De plaats '{name}' kan niet worden gevonden"
    },

    geolocate: {
        title: "Toon mijn locatie"
    },

    inspector: {
        no_documentation_combination: "Voor deze tag is geen documentatie beschikbaar.",
        no_documentation_key: "Voor deze sleutel is geen documentatie beschikbaar",
        new_tag: "Nieuwe tag",
        edit_tags: "Tags aanpassen",
        okay: "OK",
        view_on_osm: "Bekijk op OSM"
    },

    layerswitcher: {
        title: "Achtergrond",
        description: "Achtergrondinstellingen",
        percent_brightness: "{opacity}% helderheid",
        fix_misalignment: "Repareer de verkeerde ligging",
        reset: "Ongedaan maken"
    },

    restore: {
        description: "Er zijn niet-opgeslagen aanpassingen uit een vorige sessie. Wil je deze aanpassingen behouden?",
        restore: "Behouden",
        reset: "Ongedaan maken"
    },

    save: {
        title: "Opslaan",
        help: "Sla de aanpassingen bij OpenStreetMap op om deze voor andere gebruikers zichtbaar te maken",
        error: "Bij het opslaan is een fout opgetreden",
        uploading: "De aanpassingen worden naar OpenStreetMap geüpload.",
        unsaved_changes: "Je hebt niet-opgeslagen aanpassingen",
    },

    splash: {
        welcome: "Welkom bij de iD OpenStreetMap editor",
        text: " Dit is een ontwikkelversie {version}. Voor meer informatie bezoek {website} of meld problemen op {github}."
    },

    source_switch: {
        live: "live",
        dev: "dev"
    },

    tag_reference: {
        description: "Omschrijving",
        on_wiki: "{tag} op wiki.osm.org",
        used_with: "gebruikt met {type}"
    },

    validations: {
        untagged_point: "Punt zonder tags, dat geen onderdeel is van een lijn of vlak",
        untagged_line: "Lijn zonder tags",
        untagged_area: "Vlak zonder tags",
        tag_suggests_area: "De tag {tag} suggereert dat de lijn een vlak is, maar het is geen vlak",
        deprecated_tags: "Afgeschafte tags: {tags}"
    },

    zoom: {
        in: "Inzoomen",
        out: "Uitzoomen"
    }
};
