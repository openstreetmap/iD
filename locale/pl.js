locale.pl = {
    modes: {
        add_area: {
            title: "Obszar",
            description: "Obaszary mogą być na przykład parkami, budynkami, jeziorami.",
            tail: "Kliknij na mapę aby zacząć rysować obszar, na przykład park, jezioro lub budynek."
        },
        add_line: {
            title: "Linia",
            description: "Linie mogą być na przykład jezdniami, ścieżkami dla pieszych lub nawet kanałami.",
            tail: "Kliknij na mapę aby zacząć rysować linię, na przykład drogę, ścieżkę lub trasę."
        },
        add_point: {
            title: "Punkt",
            description: "Punkty mogą być na przykład restauracjami, pomnikami i skrzynkami pocztowymi.",
            tail: "Kliknij na mapę aby dodać punkt, na przykład restaurację, pomnik lub skrzynkę pocztową."
        },
        browse: {
            title: "Przeglądaj",
            description: "Przesuwaj i zmieniaj skalę mapy."
        },
        draw_area: {
            tail: "Kliknij aby dodać punkty do obszaru. Kliknij na pierwszy punkt aby skończyć rysowanie obszaru."
        },
        draw_line: {
            tail: "Kliknij aby dodać punkty do linii. Kliknij na inne linie aby je połączyć, a dwa razy kliknij na linię aby skończyć ją rysować."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Dodano punkt.",
                vertex: "Dodano węzeł do drogi."
            }
        },
        start: {
            annotation: {
                line: "Zaczęto linię.",
                area: "Zaczęto obszar."
            }
        },
        'continue': {
            annotation: {
                line: "Kontynuacja linii.",
                area: "Kontynuacja obszaru."
            }
        },
        cancel_draw: {
            annotation: "Przestano rysować."
        },
        change_tags: {
            annotation: "Zmieniono tagi."
        },
        circularize: {
            title: "Zaokrąglij",
            description: "Wyrównaj na okręgu.",
            key: "O",
            annotation: {
                line: "Zaokrąglij linię.",
                area: "Zaokrąglij obszar."
            }
        },
        orthogonalize: {
            title: "Ortogonalizuj",
            description: "Spraw, aby te kąty były proste.",
            key: "Q",
            annotation: {
                line: "Zortogonalizowano kąty linii.",
                area: "Zortogonalizowano kąty obszaru."
            }
        },
        'delete': {
            title: "Usuń",
            description: "Usuń to z mapy.",
            annotation: {
                point: "Usunięto punkt.",
                vertex: "Usunięto węzeł z drogi.",
                line: "Usunięto linię.",
                area: "Usunięto obszar.",
                relation: "Usunięto relację.",
                multiple: "Usunięto {n} obietów/obiekty."
            }
        },
        connect: {
            annotation: {
                point: "Połączono drogę z punktem.",
                vertex: "Połączono dwie drogi.",
                line: "Połączono drogę z linią.",
                area: "Połączono drogę z obszarem."
            }
        },
        disconnect: {
            title: "Rozłącz",
            description: "Rozłącz te dwie drogi.",
            key: "D",
            annotation: "Rozłączono drogi."
        },
        merge: {
            title: "Scal",
            description: "Scal te linie.",
            key: "C",
            annotation: "Scalono {n} linii."
        },
        move: {
            title: "Przesuń",
            description: "Przesuń to w inne miejsce.",
            key: "M",
            annotation: {
                point: "Przesunięto punkt.",
                vertex: "Przesunięto węzeł drogi.",
                line: "Przesunięto linię.",
                area: "Przesunięto obszar.",
                multiple: "Moved multiple objects."
            }
        },
        rotate: {
            title: "Rotate",
            description: "Rotate this object around its centre point.",
            key: "R",
            annotation: {
                line: "Rotated a line.",
                area: "Rotated an area."
            }
        },
        reverse: {
            title: "Odwróć",
            description: "Spraw by ta linia biegła w przeciwnym kierunku.",
            key: "V",
            annotation: "Odwrócono linię."
        },
        split: {
            title: "Rozdziel",
            description: "Rozdziel to na dwie drogi w tym punkcie.",
            key: "X",
            annotation: "Rozdzielono drogę."
        }
    },

    nothing_to_undo: "Nie ma nic do cofnięcia.",
    nothing_to_redo: "Nie ma nic do powtórzenia.",

    just_edited: "Właśnie wprowadziłeś zmiany w OpenStreetMap!!",
    browser_notice: "Ten edytor działa w Firefox, Chrome, Safari, Opera, and Internet Explorer 9 i wyższych. Zaktualizuj swoją przeglądarkę lub użyj Potlatch 2 aby edytować mapę.",
    view_on_osm: "Pokaż w OSM",
    zoom_in_edit: "zwiększ skalę aby edytować mapę",
    logout: "wyloguj",
    report_a_bug: "zgłoś błąd",

    commit: {
        title: "Zapisz zmiany",
        description_placeholder: "Krótki opis twoich zmian",
        upload_explanation: "Zmiany które wyślesz jako {user} będą widoczne na wszystkich mapach używających danych OpenStreetMap.",
        save: "Zapisz",
        cancel: "Anuluj",
        warnings: "Ostrzeżenia",
        modified: "Zmodyfikowano",
        deleted: "Usunięto",
        created: "Utworzono"
    },

    contributors: {
        list: "Przeglądanie wkładu użytkowników {users}",
        truncated_list: "Przeglądanie wkładu użytkownikówy {users} {count} innych"
    },

    geocoder: {
        title: "Znajdź miejsce",
        placeholder: "znajdź miejsce",
        no_results: "Nie można znaleźć miejsca o nazwie '{name}'"
    },

    geolocate: {
        title: "Pokaż moją pozycję."
    },

    inspector: {
        no_documentation_combination: "Nie ma dokumentacji dla tej kombinacji tagu.",
        no_documentation_key: "Nie ma dokumentacji dla tego klucza",
        new_tag: "Nowy tag",
        edit_tags: "Edytuj tagi",
        okay: "Okej",
        view_on_osm: "Zobacz w OSM",
        name: "Name",
        editing: "Editing {type}",
        additional: "Additional tags",
        choose: "What are you adding?",
        results: "{n} results for {search}"
    },

    background: {
        title: "Tło",
        description: "Ustawienia tła",
        percent_brightness: "jasność {opacity}%",
        fix_misalignment: "Wyrównaj podkład",
        reset: "resetuj"
    },

    restore: {
        description: "Masz niezapisane zmiany z poprzedniej sesji. Chcesz je przywrócić?",
        restore: "Przywróć",
        reset: "Resetuj"
    },

    save: {
        title: "Zapisz",
        help: "Zapisz zmiany na OpenStreetMap, aby były one widoczne dla innych",
        error: "Wystąpił błąd podczas próby zapisu.",
        uploading: "Wysyłanie zmian do OpenStreetMap.",
        unsaved_changes: "Masz niezapisane zmiany."
    },

    splash: {
        welcome: "Witaj w edytorze iD map OpenStreetMap",
        text: "To jest wersja rozwojowa {version}. Informacji szukaj na {website} i zgłaszaj błędy na {github}."
    },

    source_switch: {
        live: "live",
        dev: "dev"
    },

    tag_reference: {
        description: "Opis",
        on_wiki: "{tag} na wiki.osm.org",
        used_with: "używany z {type}"
    },

    validations: {
        untagged_point: "Nieopisany punkt, który nie jest częścią linii lub obszaru.",
        untagged_line: "Nieopisana linia.",
        untagged_area: "Nieopisany obszar.",
        many_deletions: "You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        tag_suggests_area: "Tag {tag} sugeruje, że linia powinna być obszarem, ale nim nie jest.",
        deprecated_tags: "Przestarzałe tagi: {tags}"
    },

    zoom: {
        'in': "Powiększ",
        out: "Zmniejsz"
    }
};
