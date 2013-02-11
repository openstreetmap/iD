locale.de = {
    modes: {
        add_area: {
            title: "Fläche",
            description: "Füge Parks, Gebäude, Seen oder andere Flächen zur Karte hinzu.",
            tail: "Klicke in die Karte, um das Zeichnen einer Fläche wie einen Park, einen See oder Gebäude zu starten.",
            key: "A"
        },
        add_line: {
            title: "Linie",
            description: "Linien können Autobahnen, Straßen, Fußwege oder sogar Kanäle sein.",
            tail: "Klicke in die Karte, um das Zeichnen einer Straße eines Pfades oder einer Route zu starten.",
            key: "L"
        },
        add_point: {
            title: "Punkt",
            description: "Restaurants, Denkmäler und Briefkästen sind Punkte",
            tail: "Klicke in die Karte, um einen Punkt hinzuzufügen.",
            key: "P"
        },
        browse: {
            title: "Navigation",
            description: "Verschieben und Vergrößern/Verkleinern des Kartenausschnitts.",
            key: "B"
        },
        draw_area: {
            tail: "Klicke, um Punkte zur Fläche hinzuzufügen. Klicke auf den ersten Punkt, um die Fläche abzuschließen."
        },
        draw_line: {
            tail: "Klicke, um mehr Punkte zur Linie hizuzufügen. Klicke auf eine andere Linie um die Linien zu verbinden und klicke doppelt, um die Linie zu beenden."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Punkt hinzugefügt.",
                vertex: "Stützpunkt einem Weg hinzugefügt."
            }
        },
        start: {
            annotation: {
                line: "Linie begonnen.",
                area: "Fläche begonnen."
            }
        },
        'continue': {
            annotation: {
                line: "Linie fortgesetzt.",
                area: "Fläche fortgesetzt."
            }
        },
        cancel_draw: {
            annotation: "Zeichnen abgebrochen."
        },
        change_tags: {
            annotation: "Tags verändert."
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
            title: "Löschen",
            description: "Lösche dies aus der Karte.",
            key: "⌫",
            annotation: {
                point: "Punkt gelöscht.",
                vertex: "Stützpunkt aus einem Weg gelöscht.",
                line: "Linie gelöscht.",
                area: "Fläche gelöscht.",
                relation: "Verbindung gelöscht.",
                multiple: "{n} Objekte gelöscht."
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
            title: "Verschieben",
            description: "Verschiebe dieses Objekt an einen anderen Ort.",
            key: "M",
            annotation: {
                point: "Punkt verschoben.",
                vertex: "Stützpunkt in einen Weg veschoben.",
                line: "Linie verschoben.",
                area: "Fläche verschoben."
            }
        },
        reverse: {
            title: "Umkehren",
            description: "Ändere die Richtung dieser Linie.",
            key: "V",
            annotation: "Linienrichtung umgekehrt."
        },
        split: {
            title: "Teilen",
            description: "Teile dies in zwei Wege an diesem Punkt.",
            key: "X",
            annotation: "Weg geteilt."
        }
    },

    validations: {
        untagged_point: "Punkt ohne Attribute, der kein Teil einer Linie oder Fläche ist",
        untagged_line: "Linie ohne Attribute",
        untagged_area: "Fläche ohne Attribute",
        tag_suggests_area: "Das Attribut {tag} suggeriert eine Fläche, ist aber keine Fläche",
        deprecated_tags: "Veralterte Attribute: {tags}"
    },

    save: "Speichern",
    save_help: "Speichere Änderungen zu OpenStreetMap, so dass sie für andere Nutzer sichtbar werden",
    no_changes: "Sie haben keine Änderungen zum Speichern.",
    save_error: "Es ist ein Fehler aufgetreten beim Versuch des Speicherns",
    uploading_changes: "Lade Änderungen zu OpenStreetMap.",
    just_edited: "Sie haben gerade OpenStreetMap editiert!",
    okay: "Okay",

    "zoom-in": "Hineinzoomen",
    "zoom-out": "Herauszoomen",

    nothing_to_undo: "Nichts zum Rückgängigmachen.",
    nothing_to_redo: "Nichts zum Wiederherstellen.",

    browser_notice: "Dieser Editor wird in Firefox, Chrome, Safari, Opera, und Internet Explorer 9 und höher unterstzützt. Bitte aktualisieren Sie Ihren Browser oder nutzen Sie Potlatch 2, um die Karte zu modifizieren.",

    inspector: {
        no_documentation_combination:  "Es ist keine Dokumentation verfügbar für diese Markierungskombination.",
        no_documentation_key: "Es ist keine Dokumentation verfügbar für dieses Schlüsselwort",
        new_tag: "Neue Markierung"
    },

    view_on_osm: "Bei OSM anschauen",

    zoom_in_edit: "Hineinzoomen, um die Karte zu editieren",

    edit_tags: "Markierungen bearbeiten",

    geocoder: {
        "find_location": "Finde einen Ort",
        "find_a_place": "Finde einen Platz"
    },

    description: "Beschreibung",

    logout: "Abmelden",

    layerswitcher: {
        title: "Hintergrund",
        description: "Hintergrundeinstellungen",
        percent_brightness: "{opacity}% Helligkeit",
        fix_misalignment: "Fehlerhafte Ausrichtung reparieren",
        reset: "Zurücksetzen"
    }
};
