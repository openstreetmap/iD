locale.es = {
    modes: {
        add_area: {
            title: "Zona", //"Area",
            description: "Agregar parques, edificios, lagos u otras zonas en el mapa", //"Add parks, buildings, lakes, or other areas to the map.",
            tail: "Hacer click en el mapa para empezar a dibujar una zona como un parque, lago o edificio" //"Click on the map to start drawing an area, like a park, lake, or building."
        },
        add_line: {
            title: "Línea", //"Line",
            description: "Las líneas pueden ser autopistas, calles, pasos peatonales o canales.", //"Lines can be highways, streets, pedestrian paths, or even canals.",
            tail: "Hace clic para dibujar en el mapa, una calle, camino o ruta." //"Click on the map to start drawing an road, path, or route.",
        },
        add_point: {
            title: "Punto", //"Point",
            description: "Son puntos los restaurantes, monumentos y buzones", //"Restaurants, monuments, and postal boxes are points.",
            tail: "Hacer clic para agregar un punto en el mapa" //"Click on the map to add a point.",
        },
        browse: {
            title: "Navegar", //"Browse",
            description: "Aumentar y navegar el mapa" //"Pan and zoom the map.",
        },
        draw_area: {
            tail: "Hacer clic para agregar puntos en tu zona. Hacer hacer click en el primer punto para finalizar la zona." //"Click to add points to your area. Click the first point to finish the area."
        },
        draw_line: {
            tail: "Hacer clic para agregar más puntos a la línea. Hacer clic en otras líneas para conectarlas, y doble clic para finalizar." //"Click to add more points to the line. Click on other lines to connect to them, and double-click to end the line."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Punto agregado", //"Added a point.",
                vertex: "Nodo agregado a una ruta" //"Added a node to a way."
            }
        },
        start: {
            annotation: {
                line: "Línea iniciada", //"Started a line.",
                area: "Zona iniciada" //"Started an area."
            }
        },
        'continue': {
            annotation: {
                line: "Línea continuada.", //"Continued a line.",
                area: "Zona continuada." //"Continued an area."
            }
        },
        cancel_draw: {
            annotation: "Dibujo cancelado." //"Cancelled drawing."
        },
        change_tags: {
            annotation: "Etiquetas cambiadas." //"Changed tags."
        },
        circularize: {
            title: "Redondear", //"Circularize",
            description: "Hacer esto redondo.", //"Make this round.",
            key: "O",
            annotation: {
                line: "Redondear una línea.", //"Made a line circular.",
                area: "Redondear una zona." //"Made an area circular."
            }
        },
        orthogonalize: {
            title: "Escuadrar", //"Orthogonalize",
            description: "Escuadrar estas esquinas.", //"Square these corners.",
            key: "E", //"Q",
            annotation: {
                line: "Esquinas de la línea escuadrados.", //"Squared the corners of a line.",
                area: "Esquinas de la zona escuadrados." //"Squared the corners of an area."
            }
        },
        'delete': {
            title: "Eliminar", //"Delete",
            description: "Eliminar esto del mapa.", //"Remove this from the map.",
            key: "⌫",
            annotation: {
                point: "Punto eliminado.", //"Deleted a point.",
                vertex: "Nodo elimnado de una ruta.", //"Deleted a node from a way.",
                line: "Línea eliminada.", //"Deleted a line.",
                area: "Zona eliminada.", //"Deleted an area.",
                relation: "Relación eliminada.", //"Deleted a relation.",
                multiple: "{n} objetos eliminados." //"Deleted {n} objects."
            }
        },
        connect: {
            annotation: {
                point: "Punto conectado a una ruta.", //"Connected a way to a point.",
                vertex: "Ruta conectada a otra.", //"Connected a way to another.",
                line: "Ruta conectada a una línea.", //"Connected a way to a line.",
                area: "Ruta conectada a una zona." //"Connected a way to an area."
            }
        },
        disconnect: {
            title: "Desconectar", //"Disconnect",
            description: "Desconectar estas rutas.", //"Disconnect these ways from each other.",
            key: "D",
            annotation: "Rutas desconectadas." //"Disconnected ways."
        },
        merge: {
            title: "Combinar", //"Merge",
            description: "Combinar estas líneas.", //"Merge these lines.",
            key: "C",
            annotation: "{n} líneas combinadas" //"Merged {n} lines."
        },
        move: {
            title: "Mover", //"Move",
            description: "Mover esto a una ubicación diferente.", //"Move this to a different location.",
            key: "M",
            annotation: {
                point: "Punto movido", //"Moved a point.",
                vertex: "Nodo movido a una ruta", //"Moved a node in a way.",
                line: "Línea movida", //"Moved a line.",
                area: "Zona movida" //"Moved an area."
            }
        },
        reverse: {
            title: "Invertir", //"Reverse",
            description: "Hacer que esta línea vaya en sentido inverso.", //"Make this line go in the opposite direction.",
            key: "I", //"V",
            annotation: "Línea invertida" //"Reversed a line."
        },
        split: {
            title: "Dividir", //"Split",
            description: "Dividir en dos rutas en éste punto.", //"Split this into two ways at this point.",
            key: "D", //"X",
            annotation: "Dividir una ruta." //"Split a way."
        }
    },

    validations: {
        untagged_point: "Punto sin etiquetar que no es parte de una línea ni zona.", //"Untagged point which is not part of a line or area",
        untagged_line: "Línea sin etiquetar", //"Untagged line",
        untagged_area: "Zona sin etiquetar", //"Untagged area",
        tag_suggests_area: "La etiqueta {tag} sugiere que esta línea debería ser una zona, pero no lo es.", //"The tag {tag} suggests line should be area, but it is not an area",
        deprecated_tags: "Etiquetas obsoletas: {tags}" //"Deprecated tags: {tags}"
    },

    save: "Guardar", //"Save",
    unsaved_changes: "Tienes cambios sin guardar", //"You have unsaved changes",
    save_help: "Guardar los cambios en OpenStreetMap haciéndolos visibles a otros usuarios", //"Save changes to OpenStreetMap, making them visible to other users",
    no_changes: "No tienes cambios sin guardar", //"You don't have any changes to save.",
    save_error: "Ha ocurrido un error tratando de guardar", //"An error occurred while trying to save",
    uploading_changes: "Subiendo cambios a OpenStreetMap", //"Uploading changes to OpenStreetMap.",
    just_edited: "Acabas de editar OpenStreetMap!", //"You Just Edited OpenStreetMap!",
    okay: "OK", //"Okay",

    nothing_to_undo: "Nada para deshacer", //"Nothing to undo.",
    nothing_to_redo: "Nada para rehacer", //"Nothing to redo.",

    browser_notice: "Este editor soporta Firefox, Chrome, Safari, Opera e Internet Explorer 9 o superior. Por favor actualiza tu navegador o utiliza Potlatch 2 para editar el mapa.", //"This editor is supported in Firefox, Chrome, Safari, Opera, and Internet Explorer 9 and above. Please upgrade your browser or use Potlatch 2 to edit the map.",

    inspector: {
        no_documentation_combination: "No hay documentación disponible para esta combinación de etiquetas", //"This is no documentation available for this tag combination",
        no_documentation_key: "No hay documentación disponible para esta tecla", //"This is no documentation available for this key",
        new_tag: "Nueve etiqueta" //"New Tag"
    },

    view_on_osm: "Ver en OSM", //"View on OSM",

    zoom_in_edit: "acercar para editar el mapa", //"zoom in to edit the map",

    edit_tags: "Editar etiquetas", //"Edit tags",

    geocoder: {
        title: "Encontrar un lugar", //"Find A Place",
        placeholder: "encontrar un lugar", //"find a place",
        no_results: "No se pudo encontrar el lugar llamado '{name}'" //"Couldn't locate a place named '{name}'"
    },

    geolocate: {
        title: "Show My Location"
    },

    description: "Descripción", //"Description",

    logout: "cerrar sesión", //"logout",

    report_a_bug: "reportar un error", //"report a bug",

    layerswitcher: {
        title: "Fondo", //"Background",
        description: "Configuración de fondo", //"Background Settings",
        percent_brightness: "{opacity}% brillo", //"{opacity}% brightness",
        fix_misalignment: "Arreglar alineamiento", //"Fix misalignment",
        reset: "reiniciar" //"reset"
    },

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
        list: "Viendo las contribuciones de usuarios {users}", //"Viewing contributions by {users}",
        truncated_list: "Viendo las contribuciones de {users} y {count} más" //"Viewing contributions by {users} and {count} others"
    },

    source_switch: {
        live: "en vivo", //"live",
        dev: "dev"
    },

    zoom: {
        in: "Aumentar", // "Zoom In",
        out: "Alejar" //"Zoom Out",
    }
};
