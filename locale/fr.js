locale.fr = {
    modes: {
        add_area: {
            title: "Polygone",
            description: "Les polygones peuvent être des parcs, des batîments, des lacs ou tout autre objet surfacique.",
            tail: "Cliquez sur la carte pour ajouter un polygone tel qu'un parc, un lac ou un bâtiment."
        },
        add_line: {
            title: "Ligne",
            description: "Les lignes peuvent être des autoroutes, des routes, des chemins ou encore des caneaux.",
            tail: "Cliquez sur la carte pour ajouter une nouvelle ligne telle qu'une route ou un nouveau chemin."
        },
        add_point: {
            title: "Point",
            description: "Les points peuvent être des restaurants, des monuments, ou encore des boites aux lettres.",
            tail: "Cliquez sur la carte pour ajouter un point tel qu'un restaurant ou un monument."
        },
        browse: {
            title: "Navigation",
            description: "Naviguer ou zoomer sur la carte."
        },
        draw_area: {
            tail: "Cliquez pour ajouter un point à la zone. Cliquez sur le dernier point pour fermer la zone."
        },
        draw_line: {
            tail: "Cliquez pour ajouter un point à la ligne. Cliquez sur une autre ligne pour les connecter, puis faîtes un double-clique pour terminer la ligne."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Ajouter un point.",
                vertex: "Ajouter un noeud à une ligne."
            }
        },
        start: {
            annotation: {
                line: "Commencer une nouvelle ligne.",
                area: "Commencer un polygone."
            }
        },
        'continue': {
            annotation: {
                line: "Continuer une ligne.",
                area: "Continuer un polygone."
            }
        },
        cancel_draw: {
            annotation: "Annuler un ajout."
        },
        change_tags: {
            annotation: "Modifier les tags."
        },
        circularize: {
            title: "Circularize",
            description: "Créer un cercle.",
            key: "O",
            annotation: {
                line: "Créer un cercle linéaire.",
                area: "Créer un cercle surfacique (disque)."
            }
        },
        orthogonalize: {
            title: "Orthogonaliser",
            description: "Rendre une forme orthogonale.",
            key: "Q",
            annotation: {
                line: "Orthogonaliser une ligne orthogonale.",
                area: "Orthogonaliser un polygone orthogonale."
            }
        },
        'delete': {
            title: "Supprimer",
            description: "Supprime l'élément de la carte.",
            key: "⌫",
            annotation: {
                point: "Supprime un point.",
                vertex: "Supprime le noeud d'une ligne.",
                line: "Supprime une ligne.",
                area: "Supprime un polygone.",
                relation: "Supprime une relation.",
                multiple: "Supprime {n} objets."
            }
        },
        connect: {
            annotation: {
                point: "Joindre une ligne à un point.",
                vertex: "Joindre les noeuds à une ligne.",
                line: "Joindre les chemins ensemble.",
                area: "Joindre une ligne à un polygone."
            }
        },
        disconnect: {
            title: "Séparer",
            description: "Sépare les lignes l'une de l'autre.",
            key: "D",
            annotation: "Sépare les lignes."
        },
        merge: {
            title: "Fusionner",
            description: "Fusionne les lignes.",
            key: "C",
            annotation: "Fusionne les {n} ligne."
        },
        move: {
            title: "Déplacer",
            description: "Déplace l'élément à un autre endroit.",
            key: "M",
            annotation: {
                point: "Déplace un point.",
                vertex: "Déplace le noeud d'une ligne.",
                line: "Déplace une ligne.",
                area: "Déplace un polygone."
            }
        },
        reverse: {
            title: "Inverser",
            description: "Inverse le sens d'une ligne.",
            key: "V",
            annotation: "Inverse le sens d'une ligne."
        },
        split: {
            title: "Couper",
            description: "Coupe une ligne en deux par rapport au point sélectionné.",
            key: "X",
            annotation: "Coupe une ligne."
        }
    },

    nothing_to_undo: "Rien à annuler.",
    nothing_to_redo: "Rien à refaire.",

    just_edited: "Vous venez de participer à OpenStreetMap!",
    browser_notice: "Les navigateurs supportés par cet éditeur sont : Firefox, Chrome, Safari, Opera et Internet Explorer (version 9 et supérieures). Pour éditer la carte, veuillez mettre à jour votre navigateur ou utiliser Potlatch 2.",
    view_on_osm: "Consulter dans OSM",
    zoom_in_edit: "Zoomer pour modifier la carte",
    logout: "Déconnexion",
    report_a_bug: "Signaler un bug",

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
        list: "Consulter les contributions de {users}",
        truncated_list: "Consulter les contributions de {users} et {count} les autres"
    },

    geocoder: {
        title: "Trouver un emplacement",
        placeholder: "Trouver un endroit",
        no_results: "Impossible de localiser l'endroit nommé '{name}'"
    },

    geolocate: {
        title: "Show My Location"
    },

    inspector: {
        no_documentation_combination:  "Aucune documentation n'est disponible pour cette combinaison de tag",
        no_documentation_key: "Aucune documentation n'est disponible pour cette clé",
        new_tag: "Nouveau tag",
        edit_tags: "Editer les tags",
        okay: "Okay"
    },

    layerswitcher: {
        title: "Fond de carte",
        description: "Paramètres du fond de carte",
        percent_brightness: "{opacity}% brightness",
        fix_misalignment: "Fix misalignment",
        reset: "reset"
    },

    save: {
        title: "Sauvegarder",
        help: "Envoie des modifications au serveyr OpenStreetMap afin qu'elles soient visibles par les autres contributeurs.",
        error: "Une erreur est survenue lors de l'enregistrement des données",
        uploading: "Envoie des modifications vers OpenStreetMap.",
        unsaved_changes: "Vous avez des modifications non enregistrées"
    },

    source_switch: {
        live: "live",
        dev: "dev"
    },

    tag_reference: {
        description: "Déscription",
        on_wiki: "{tag} on wiki.osm.org",
        used_with: "used with {type}"
    },

    validations: {
        untagged_point: "Point sans aucun tag ne faisant partie ni d'une ligne, ni d'un polygone",
        untagged_line: "Ligne sans aucun tag",
        untagged_area: "Polygone sans aucun tag",
        tag_suggests_area: "Ce tag {tag} suppose que cette ligne devrait être un polygone, or ce n'est pas le cas",
        deprecated_tags: "Tags obsolètes : {tags}"
    },

    zoom: {
        in: "Zoomer",
        out: "Dézoomer"
    }
};
