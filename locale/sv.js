locale.sv = {
    modes: {
        add_area: {
            title: "Område",
            description: "Lägg till parker, byggnader, sjöar, eller andra områden till kartan.",
            tail: "Klicka på kartan för att börja rita ett område, typ en park, sjö eller byggnad."
        },
        add_line: {
            title: "Linje",
            description: "Linjer kan vara vägar, gator, stigar, kanaler etc.",
            tail: "Klicka på kartan för att rita en väg, stig eller vattendrag."
        },
        add_point: {
            title: "Punkt",
            description: "Restauranter, minnesmärken och postkontor kan vara punkter.",
            tail: "Klicka på kartan för att lägga till en punkt."
        },
        browse: {
            title: "Bläddra",
            description: "Panera runt och zooma kartan."
        },
        draw_area: {
            tail: "Klicka här för att lägga till punkter till ditt område. Klicka på förste punkten igen for att avsluta området."
        },
        draw_line: {
            tail: "Klicka här för att lägga till fler punkter till linjen. Klicka på andra linjer for att knyta ihop dem och dubbelklicka för att slutföra linjen."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Lagt till en punkt.",
                vertex: "Lagt till en nod till en linje."
            }
        },
        start: {
            annotation: {
                line: "Startat en linje.",
                area: "Startat ett område."
            }
        },
        'continue': {
            annotation: {
                line: "Fortsatt en linje.",
                area: "Fortsatt ett område."
            }
        },
        cancel_draw: {
            annotation: "Avbröt ritning."
        },
        change_tags: {
            annotation: "Ändrat tagg."
        },
        circularize: {
            title: "Cirkularisera",
            description: "Gör denna rund.",
            key: "O",
            annotation: {
                line: "Gjorde en linje rund.",
                area: "Gjorde ett område runt."
            }
        },
        orthogonalize: {
            title: "Ortogonalisering",
            description: "Gör kvadrat-hörn.",
            key: "Q",
            annotation: {
                line: "Gjort hörnen på en linje fyrkantiga.",
                area: "Gjort hörnen på ett område fyrkantiga."
            }
        },
        'delete': {
            title: "Ta bort",
            description: "Tag bort detta från kartan.",
            annotation: {
                point: "Tagit bort en punkt.",
                vertex: "Tagit bort en nod från en väg.",
                line: "Tagit bort en linje.",
                area: "Tagit bort ett område.",
                relation: "Tagit bort en relation.",
                multiple: "Tagit bort {n} objekt."
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
            title: "Bryt av",
            description: "Bryt av dessa vägar från varandra.",
            key: "D",
            annotation: "Bryt av linjen."
        },
        merge: {
            title: "Sammanfoga",
            description: "Sammanfoga dessa linjer.",
            key: "C",
            annotation: "Sammanfogade {n} linjer."
        },
        move: {
            title: "Flytta",
            description: "Flytta detta till ett annan ställe.",
            key: "M",
            annotation: {
                point: "Flyttade en punkt.",
                vertex: "Flyttade en nod i en väg.",
                line: "Flyttade en linje.",
                area: "Flyttade ett område.",
                multiple: "Flyttade flera objekt."
            }
        },
        rotate: {
            title: "Rotera",
            description: "Rotera detta objekt runt dess centerpunkt.",
            key: "R",
            annotation: {
                line: "Roterade en linje.",
                area: "Roterade ett område."
            }
        },
        reverse: {
            title: "Byt riktning",
            description: "Byt riktning på linjen.",
            key: "V",
            annotation: "Bytte riktning på en linje."
        },
        split: {
            title: "Dela upp",
            description: "Dela upp vägen till två vägar vid den här punkten.",
            key: "X",
            annotation: "Delade upp."
        }
    },

    nothing_to_undo: "Inget att ångra.",
    nothing_to_redo: "Inget att upprepa.",

    just_edited: "Du har nu redigerat OpenStreetMap!",
    browser_notice: "Denna redigerare funkar i Firefox, Chrome, Safari, Opera och Internet Explorer 9 och högre. Uppgradera din webbläsare eller använd Potlatch 2 för att redigera på kartan.",
    view_on_osm: "Visa på OSM",
    zoom_in_edit: "Zooma in för att fixa på kartan",
    logout: "logga ut",
    report_a_bug: "rapportera ett fel",

    commit: {
        title: "Spara ändringar",
        description_placeholder: "Kort beskrivning av dina ändringar",
        upload_explanation: "Ändringar du uppladdar som {user} kommer att kunna ses på alla kartor som användar OpenStreetMap data.",
        save: "Spara",
        cancel: "Avbryt",
        warnings: "Varningar",
        modified: "Ändrat",
        deleted: "Borttaget",
        created: "Skapat"
    },

    contributors: {
        list: "Visa bidrag från {users}",
        truncated_list: "Visa bidrag från {users} och {count} andra"
    },

    geocoder: {
        title: "Hitta ett ställe",
        placeholder: "Hitta ett ställe",
        no_results: "Kunde inte hitta '{name}'"
    },

    geolocate: {
        title: "Visa var jag är"
    },

    inspector: {
        no_documentation_combination:  "Der er ingen dokumentation for denne tag kombination",
        no_documentation_key: "Det finns inget dokumentation för denna nyckel.",
        new_tag: "Ny tagg",
        edit_tags: "Redigera taggar",
        okay: "Ok",
        view_on_osm: "Visa på OSM",
        name: "Namn",
        editing: "Redigerar {type}",
        additional: "Fler taggar",
        choose: "Vad lägger du till?",
        results: "{n} sökresult för {search}",
        reference: "Visa OpenStreetMap Wiki →"
    },

    background: {
        title: "Bakgrund",
        description: "Bakgrundsinställningar",
        percent_brightness: "{opacity}% ljusstyrka",
        fix_misalignment: "Fixa feljustering",
        reset: "återställ"
    },

    restore: {
        description: "Du har ändringar från förra sessiones som inte har sparats. Vill du spara dessa ändringar?",
        restore: "Återställ",
        reset: "Återställ"
    },

    save: {
        title: "Spara",
        help: "Spara ändringer till OpenStreetMap så att andra användare kan se dem.",
        no_changes: "Inget att spara.",
        error: "Något gick fel vid sparandet",
        uploading: "Dina ändringer sparas nu till OpenStreetMap.",
        unsaved_changes: "Du har icke-sparade ändringer.",
    },

    splash: {
        welcome: "Välkommen till iD OpenStreetMap redigerare",
        text: "Detta är utvecklingsversion {version}. Mer information besök {website} och rapportera fel på {github}."
    },

    source_switch: {
        live: "live",
        dev: "dev"
    },

    tag_reference: {
        description: "Beskrivning",
        on_wiki: "{tag} på wiki.osm.org",
        used_with: "används med {type}"
    },

    validations: {
        untagged_point: "Otaggad punkt som inte är del av linje eller område",
        untagged_line: "Otaggad linje",
        untagged_area: "Otaggat område",
        many_deletions: "Du håller på att ta bort {n} objekt. Är du helt säker? Detta tar bort dem för alla som använder openstreetmap.org.",
        tag_suggests_area: "Denna tagg {tag} indikerar att denna linje borde vara ett område, men detta är inte ett område",
        deprecated_tags: "Uönskade taggar: {tags}"
    },

    zoom: {
        'in': "Zooma in",
        out: "Zooma ut"
    }
};
