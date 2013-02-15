locale.nl = {
    modes: {
        add_area: {
            title: "Vlakken",
            description: "Voeg parken, gebouwen, meren of andere vlakken aan de kaart toe.",
            tail: "Klik in de kaart om het tekenen van een vlak zoals een park, gebouw of meer te starten."
        },
        add_line: {
            title: "Lijn",
            description: "Lijnen zijn rijkswegen, straten, voetpaden of kanalen.",
            tail: "Klik in de kaart om het tekenen van straat, pad of route te starten."
        },
        add_point: {
            title: "Punt",
            description: "Restaurants, monumenten en brievenbussen zijn punten.",
            tail: "Klik in de kaart om een punt toe te voegen."
        },
        browse: {
            title: "Navigatie",
            description: "Verschuiven en vergroten/verkleinen van de kaartuitsnede."
        },
        draw_area: {
            tail: "Klik om punten aan het vlak toe te voegen. Klik op het eerste punt om het vlak te sluiten."
        },
        draw_line: {
            tail: "Klik om  meer punten aan de lijn toe te voegen. Klik op een andere lijn om de lijnen te verbinden en dubbelklik om het tekenen te stoppen."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Punt toegevoegd.",
                vertex: "Stützpunkt einem Weg hinzugefügt."
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
            annotation: "Tags veranderd."
        },
        circularize: {
            title: "Abrunden",
            description: "Runde dies ab.",
            key: "O",
            annotation: {
                line: "Runde eine Linie ab.",
                area: "Runde eine Fläche ab."
            }
        },
        orthogonalize: {
            title: "Rechtwinkligkeit herstellen",
            description: "Diese Ecken rechtwinklig ausrichten.",
            key: "Q",
            annotation: {
                line: "Die Ecken einer Linie rechtwinklig ausgerichtet.",
                area: "Die Ecken einer Fläche rechtwinklig ausgerichtet."
            }
        },
        'delete': {
            title: "Verwijderen",
            description: "Verwijder deze van de kaart.",
            key: "⌫",
            annotation: {
                point: "Punt verwijderd.",
                vertex: "Stützpunkt aus einem Weg gelöscht.",
                line: "Lijn verwijderd.",
                area: "Vlak verwijderd.",
                relation: "Relatie verwijderd.",
                multiple: "{n} objecten verwijderd."
            }
        },
        connect: {
            annotation: {
                point: "Weg mit einem Punkt verbunden.",
                vertex: "Weg mit einem anderem Weg verbunden.",
                line: "Weg mit einer Linie verbunden.",
                area: "Weg mit einer Fläche verbunden."
            }
        },
        disconnect: {
            title: "Trennen",
            description: "Trenne diese Wege voneinander.",
            key: "D",
            annotation: "Wege getrennt."
        },
        merge: {
            title: "Vereinigen",
            description: "Vereinige diese Linien.",
            key: "C",
            annotation: "{n} Linien vereinigt."
        },
        move: {
            title: "Verschuiven",
            description: "Verschuif dit object naar een andere plek.",
            key: "M",
            annotation: {
                point: "Punt verschoven.",
                vertex: "Stützpunkt in einen Weg veschoben.",
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
            description: "Splits dit in twee wegen op dit punt.",
            key: "X",
            annotation: "Weg opgesplitst."
        }
    },

    nothing_to_undo: "Nichts zum Rückgängigmachen.",
    nothing_to_redo: "Nichts zum Wiederherstellen.",

    just_edited: "Je hebt zojuist OpenStreetMap aangepast!",
    browser_notice: "Deze editor wordt door Firefox, Chrome, Safari, Opera en Internet Explorer (versie 9 en hoger) ondersteund. Download een nieuwere versie van je browser of gebruik Potlatch 2 om de kaart aan te passen.",
    view_on_osm: "Op OSM bekijken",
    zoom_in_edit: "Zoom in om de kaart aan te passen.",
    logout: "Afmelden",
    report_a_bug: "Softwareprobleem melden",

    commit: {
        title: "Aanpassingen opslaan",
        description_placeholder: "Een korte omschrijving van je bijdragen",
        upload_explanation: "Aanpassingen die je als {user} uploadt worden zichtbaar op alle kaarten die OpenStreetMap gebruiken.",
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
        title: "Toen mijn locatie"
    },

    inspector: {
        no_documentation_combination: "Voor dit attribuut is geen documentatie beschikbaar.",
        no_documentation_key: "Voor dit trefwoord is geen documentatie beschikbaar",
        new_tag: "Nieuw attribuut",
        edit_tags: "Attribuut aanpassen",
        okay: "OK",
        view_on_osm: "op OSM bekijken"
    },

    layerswitcher: {
        title: "Achtergrond",
        description: "Achtergrondinstellingen",
        percent_brightness: "{opacity}% helderheid",
        fix_misalignment: "Fehlerhafte Ausrichtung reparieren",
        reset: "Terugzetten"
    },

    restore: {
        description: "Er zijn niet-opgeslagen aanpassingen uit een vorige sessie. Wil je deze aanpassingen herstellen?",
        restore: "Herstellen",
        reset: "Terugzetten"
    },

    save: {
        title: "Opslaan",
        help: "Sla de aanpassingen op op OpenStreetMap om deze voor andere gebruikers zichtbaar te maken",
        error: "Bij het opslaan is een fout opgetreden",
        uploading: "De aanpassingen zijn naar OpenStreetMap geüpload.",
        unsaved_changes: "Niet-opgeslagen aanpassingen beschikbaar",
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
        description: "Beschreibung",
        on_wiki: "{tag} auf wiki.osm.org",
        used_with: "benutzt mit {type}"
    },

    validations: {
        untagged_point: "Punkt ohne Attribute, der kein Teil einer Linie oder Fläche ist",
        untagged_line: "Linie ohne Attribute",
        untagged_area: "Fläche ohne Attribute",
        tag_suggests_area: "Das Attribut {tag} suggeriert eine Fläche, ist aber keine Fläche",
        deprecated_tags: "Veralterte Attribute: {tags}"
    },

    zoom: {
        in: "Hineinzoomen",
        out: "Herauszoomen"
    }
};
