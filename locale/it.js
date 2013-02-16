locale.it = {
    modes: {
        add_area: {
            title: "Area",
            description: "Aggiungi parchi, edifici, laghi, o altre aree alla mappa.",
            tail: "Clicca sulla mappa per iniziare a disegnare un'area, come un parco, un lago, o un edificio."
        },
        add_line: {
            title: "Linea",
            description: "Linee possono essere strade, vie, percorsi pedonali, o perfino canali.",
            tail: "Clicca sulla mappa per iniziare a disegnare una strada, un percorso, o un itinerario."
        },
        add_point: {
            title: "Punto",
            description: "Ristoranti, monumenti, e cassette postali sono punti.",
            tail: "Clicca sulla mappa per inserire un punto."
        },
        browse: {
            title: "Naviga",
            description: "Muovi ed ingrandisci la mappa."
        },
        draw_area: {
            tail: "Clicca per aggiungere punti all'area. Clicca sul primo punto per completarla."
        },
        draw_line: {
            tail: "Clicca per aggiungere più punti alla linea. Clicca su altre linee per connetterle, e clicca due volte per terminare la linea."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Aggiunto un punto.",
                vertex: "Aggiunto un punto ad una linea."
            }
        },
        start: {
            annotation: {
                line: "Iniziata una linea.",
                area: "Iniziata un'area."
            }
        },
        'continue': {
            annotation: {
                line: "Continuata una linea.",
                area: "Continuata un'area."
            }
        },
        cancel_draw: {
            annotation: "Cancellato il disegno."
        },
        change_tags: {
            annotation: "Cambiati i tag."
        },
        circularize: {
            title: "Rendi rotondo",
            description: "Fallo diventare rotondo.",
            key: "O",
            annotation: {
                line: "Linea resa rotonda.",
                area: "Area resa rotonda."
            }
        },
        orthogonalize: {
            title: "Ortogonalizza",
            description: "Fai diventare gli angoli quadrati.",
            key: "Q",
            annotation: {
                line: "Gli angoli della linea sono stati resi rotondi.",
                area: "Gli angoli dell'area sono stati resi rotondi."
            }
        },
        'delete': {
            title: "Cancella",
            description: "Cancella questo dalla mappa.",
            key: "⌫",
            annotation: {
                point: "Cancellato un punto.",
                vertex: "Cancellato un punto da una linea.",
                line: "Cancellata una linea.",
                area: "Cancellata un'area.",
                relation: "Cancellata una relazione.",
                multiple: "Cancellati {n} oggetti."
            }
        },
        connect: {
            annotation: {
                point: "Connessa una linea ad un punto.",
                vertex: "Connessa una strada ad un'altra.",
                line: "Connessa una strada ad una linea.",
                area: "Connessa una strada ad un'area."
            }
        },
        disconnect: {
            title: "Disconnetti",
            description: "Disconnetti queste linee tra loro.",
            key: "D",
            annotation: "Linee disconnesse."
        },
        merge: {
            title: "Unisci",
            description: "Unisci queste linee.",
            key: "C",
            annotation: "Unite {n} linee."
        },
        move: {
            title: "Muovi",
            description: "Muovi questo in una posizione differente.",
            key: "M",
            annotation: {
                point: "Mosso un punto.",
                vertex: "Mosso un nodo su una strada.",
                line: "Mossa una linea.",
                area: "Mossa un'area."
            }
        },
        reverse: {
            title: "Cambia direzione",
            description: "Fai andare questa linea nella direzione opposta.",
            key: "V",
            annotation: "Cambiata direzione ad una linea."
        },
        split: {
            title: "Dividi",
            description: "Dividi in questo punto le due strade.",
            key: "X",
            annotation: "Divisa una via."
        }
    },

    nothing_to_undo: "Niente da ripristinare.",
    nothing_to_redo: "Niente da rifare.",

    just_edited: "Hai appena modificato OpenStreetMap!",
    browser_notice: "Questo editor è supportato in Firefox, Chrome, Safari, Opera, e Internet Explorer 9 e superiori. Aggiorna il tuo browser o usa Potlatch 2 per modificare la mappa.",
    view_on_osm: "Guarda su OSM",
    zoom_in_edit: "ingrandisci per modificare la mappa",
    logout: "logout",
    report_a_bug: "segnala un bug",

    commit: {
        title: "Salva le modifiche",
        description_placeholder: "Una breve descrizione delle tue modifiche",
        upload_explanation: "I cambiamenti che carichi come {user} saranno visibili su tutte le mappe che usano i dati di OpenStreetMap.",
        save: "Salva",
        cancel: "Cancella",
        warnings: "Avvertimenti",
        modified: "Modificati",
        deleted: "Cancellati",
        created: "Creati"
    },

    contributors: {
        list: "Stai vedendo i contributi di {users}",
        truncated_list: "Stai vedendo i contributi di {users} ed altri {count}"
    },

    geocoder: {
        title: "Trova un luogo",
        placeholder: "trova un luogo",
        no_results: "Non trovo un luogo chiamato '{name}'"
    },

    geolocate: {
        title: "Mostra la mia posizione"
    },

    inspector: {
        no_documentation_combination: "Non c'è documentazione per questa combinazione di tag",
        no_documentation_key: "Non c'è documentazione per questa chiave",
        new_tag: "Nuovo Tag",
        edit_tags: "Modifica i tag",
        okay: "Ok",
        view_on_osm: "Mostra su OSM"
    },

    layerswitcher: {
        title: "Sfondo",
        description: "Impostazioni dello sfondo",
        percent_brightness: "{opacity}% opacità",
        fix_misalignment: "Allinea",
        reset: "reset"
    },

    restore: {
        description: "Hai modifiche non salvate da una sessione precedente. Vuoi ripristinare questi cambiamenti?",
        restore: "Ripristina",
        reset: "Reset"
    },

    save: {
        title: "Salva",
        help: "Salva i cambiamenti su OpenStreetMap, rendendoli visibili ad altri utenti.",
        error: "E' accaduto un errore mentre veniva tentato il salvataggio",
        uploading: "Caricando le modifiche su OpenStreetMap.",
        unsaved_changes: "Hai modifiche non salvate"
    },

    splash: {
        welcome: "Benvenuti nell'editor OpenStreetMap iD",
        text: "Questa è la versione di sviluppo {version}. Per maggiori informazioni vedi {website} e segnala i bug su {github}."
    },

    source_switch: {
        live: "live",
        dev: "dev"
    },

    tag_reference: {
        description: "Descrizione",
        on_wiki: "{tag} su wiki.osm.org",
        used_with: "usato con {type}"
    },

    validations: {
        untagged_point: "Punto senza tag che non è parte di una linea o di un'area",
        untagged_line: "Linea senza tag",
        untagged_area: "Area senza tag",
        tag_suggests_area: "Il tag {tag} fa pensare che la linea sia un'area, ma non rappresenta un'area",
        deprecated_tags: "Tag deprecati: {tags}"
    },

    zoom: {
        in: "Zoom Maggiore",
        out: "Zoom Minore"
    }
};
