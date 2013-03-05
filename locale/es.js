locale.es = {
    modes: {
        add_area: {
            title: "Área", //"Area",
            description: "Agregar parques, edificios, lagos u otras zonas en el mapa", //"Add parks, buildings, lakes, or other areas to the map.",
            tail: "Haz clic en el mapa para empezar a dibujar un área. Parques, lagos o edificios" //"Click on the map to start drawing an area, like a park, lake, or building."
        },
        add_line: {
            title: "Línea", //"Line",
            description: "Las líneas pueden ser autopistas, calles, pasos peatonales o canales.", //"Lines can be highways, streets, pedestrian paths, or even canals.",
            tail: "Haz clic para dibujar en el mapa, una calle, camino o ruta." //"Click on the map to start drawing an road, path, or route.",
        },
        add_point: {
            title: "Punto", //"Point",
            description: "Un punto puede ser un restaurante, un monumento, un buzón... etc.", //"Restaurants, monuments, and postal boxes are points.",
            tail: "Haz clic para agregar un punto en el mapa" //"Click on the map to add a point.",
        },
        browse: {
            title: "Navegar", //"Browse",
            description: "Acercar y mover el mapa" //"Pan and zoom the map.",
        },
        draw_area: {
            tail: "Haz clic para agregar vértices en tu área. Haz clic de nuevo en el primer vértice para cerrar el área." //"Click to add points to your area. Click the first point to finish the area."
        },
        draw_line: {
            tail: "Hacer clic para agregar más vértices a la línea. Hacer clic en otras líneas para conectarlas, y doble clic para terminar." //"Click to add more points to the line. Click on other lines to connect to them, and double-click to end the line."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Punto agregado", //"Added a point.",
                vertex: "Vértice añadido a la ruta" //"Added a node to a way."
            }
        },
        start: {
            annotation: {
                line: "Línea iniciada", //"Started a line.",
                area: "Área iniciada" //"Started an area."
            }
        },
        'continue': {
            annotation: {
                line: "Línea continuada.", //"Continued a line.",
                area: "Área continuada." //"Continued an area."
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
            description: "Redondear esto.", //"Make this round.",
            key: "O",
            annotation: {
                line: "Redondear línea.", //"Made a line circular.",
                area: "Redondear área." //"Made an area circular."
            }
        },
        orthogonalize: {
            title: "Escuadrar", //"Orthogonalize",
            description: "Escuadrar esquinas.", //"Square these corners.",
            key: "E", //"Q",
            annotation: {
                line: "Esquinas de la línea escuadrados.", //"Squared the corners of a line.",
                area: "Esquinas del área escuadrados." //"Squared the corners of an area."
            }
        },
        'delete': {
            title: "Eliminar", //"Delete",
            description: "Eliminar del mapa.", //"Remove this from the map.",
            annotation: {
                point: "Punto eliminado.", //"Deleted a point.",
                vertex: "Vértice elimnado de la ruta.", //"Deleted a node from a way.",
                line: "Línea eliminada.", //"Deleted a line.",
                area: "Área eliminada.", //"Deleted an area.",
                relation: "Relación eliminada.", //"Deleted a relation.",
                multiple: "{n} objetos eliminados." //"Deleted {n} objects."
            }
        },
        connect: {
            annotation: {
                point: "Punto conectado a la línea.", //"Connected a way to a point.",
                vertex: "Ruta conectada a otra línea.", //"Connected a way to another.",
                line: "Línea conectada a la línea.", //"Connected a way to a line.",
                area: "Línea conectada al área." //"Connected a way to an area."
            }
        },
        disconnect: {
            title: "Desconectar", //"Disconnect",
            description: "Desconectar líneas.", //"Disconnect these ways from each other.",
            key: "D",
            annotation: "Líneas desconectadas." //"Disconnected ways."
        },
        merge: {
            title: "Combinar", //"Merge",
            description: "Combinar líneas.", //"Merge these lines.",
            key: "C",
            annotation: "{n} líneas combinadas." //"Merged {n} lines."
        },
        move: {
            title: "Mover", //"Move",
            description: "Mover a otra ubicación.", //"Move this to a different location.",
            key: "M",
            annotation: {
                point: "Punto movido", //"Moved a point.",
                vertex: "Vertice movido", //"Moved a node in a way.",
                line: "Línea movida", //"Moved a line.",
                area: "Área movida", //"Moved an area.",
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
            title: "Invertir", //"Reverse",
            description: "Invertir sentido de la linea.", //"Make this line go in the opposite direction.",
            key: "I", //"V",
            annotation: "Sentido de la línea invertido." //"Reversed a line."
        },
        split: {
            title: "Dividir", //"Split",
            description: "Dividir en dos en éste punto.", //"Split this into two ways at this point.",
            key: "D", //"X",
            annotation: "Dividir ruta." //"Split a way."
        }
    },

    nothing_to_undo: "Nada que deshacer", //"Nothing to undo.",
    nothing_to_redo: "Nada que rehacer", //"Nothing to redo.",

    just_edited: "Acabas de editar OpenStreetMap!", //"You Just Edited OpenStreetMap!",
    browser_notice: "Este editor soporta Firefox, Chrome, Safari, Opera e Internet Explorer 9 o superior. Por favor actualiza tu navegador o utiliza Potlatch 2 para editar el mapa.", //"This editor is supported in Firefox, Chrome, Safari, Opera, and Internet Explorer 9 and above. Please upgrade your browser or use Potlatch 2 to edit the map.",
    view_on_osm: "Ver en OSM", //"View on OSM",
    zoom_in_edit: "Acerca para editar el mapa", //"zoom in to edit the map",
    logout: "Cerrar sesión", //"logout",
    report_a_bug: "Reportar un error", //"report a bug",

    commit: {
        title: "Guardar Cambios", // "Save Changes"
        description_placeholder: "Breve descripción de tus contribuciones", //"Brief description of your contributions"
        upload_explanation: "Los cambios que subes como {user} serán visibles en todos los mapas que usen datos de OpenStreetMap.", //"The changes you upload as {user} will be visible on all maps that use OpenStreetMap data."
        save: "Guardar", //"Save"
        cancel: "Cancelar", //"Cancel"
        warnings: "Avisos", //"Warnings"
        modified: "Modificado", //"Modified"
        deleted: "Borrado", //"Deleted"
        created: "Creado" //"Created"
    },

    contributors: {
        list: "Viendo las contribuciones de {users}", //"Viewing contributions by {users}",
        truncated_list: "Viendo las contribuciones de {users} y {count} más" //"Viewing contributions by {users} and {count} others"
    },

    geocoder: {
        title: "Buscar un lugar", //"Find A Place",
        placeholder: "buscar un lugar", //"find a place",
        no_results: "No se pudo encontrar el lugar llamado '{name}'" //"Couldn't locate a place named '{name}'"
    },

    geolocate: {
        title: "Mostrar mi Localización" //"Show My Location"
    },

    inspector: {
        no_documentation_combination: "No hay documentación disponible para esta combinación de etiquetas", //"This is no documentation available for this tag combination",
        no_documentation_key: "No hay documentación disponible para esta tecla", //"This is no documentation available for this key",
        new_tag: "Nueva etiqueta", //"New Tag"
        edit_tags: "Editar etiquetas", //"Edit tags",
        okay: "OK",
        view_on_osm: "Ver en OSM", //"View on OSM",
        name: "Name",
        editing: "Editing {type}",
        additional: "Additional tags",
        choose: "What are you adding?",
        results: "{n} results for {search}"
    },

    background: {
        title: "Fondo", //"Background",
        description: "Configuración de fondo", //"Background Settings",
        percent_brightness: "{opacity}% brillo", //"{opacity}% brightness",
        fix_misalignment: "Alinear", //"Fix misalignment",
        reset: "reiniciar" //"reset"
    },

    restore: {
        description: "Tienes cambios no guardados de una sesión de edición previa. ¿Quieres recuperar tus cambios?", //"You have unsaved changes from a previous editing session. Do you wish to restore these changes?"
        restore: "Restaurar", //"Restore"
        reset: "Descartar" //"Reset"
    },

    save: {
        title: "Guardar", //"Save",
        help: "Guardar los cambios en OpenStreetMap haciéndolos visibles a otros usuarios.", //"Save changes to OpenStreetMap, making them visible to other users.",
        error: "Ha ocurrido un error tratando de guardar", //"An error occurred while trying to save",
        uploading: "Subiendo cambios a OpenStreetMap", //"Uploading changes to OpenStreetMap.",
        unsaved_changes: "Tienes cambios sin guardar" //"You have unsaved changes",
    },

    splash: {
        welcome: "Bienvenido al editor de OpenStreetMap iD", //"Welcome to the iD OpenStreetMap editor"
        text: "Esto es una versión {version} de desarrollo. Para más información visita {website} y reporta cualquier error en {github}." //"This is development version {version}. For more information see {website} and report bugs at {github}."
    },

    source_switch: {
        live: "en vivo", //"live",
        dev: "dev"
    },

    tag_reference: {
        description: "Descripción",
        on_wiki: "{tag} en wiki.osm.org", //"{tag} on wiki.osm.org"
        used_with: "usado con {type}" //"used with {type}"
    },

    validations: {
        untagged_point: "Punto sin etiquetar que no es parte de una línea ni de un área.", //"Untagged point which is not part of a line or area",
        untagged_line: "Línea sin etiquetar", //"Untagged line",
        untagged_area: "Área sin etiquetar", //"Untagged area",
        many_deletions: "You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        tag_suggests_area: "La etiqueta {tag} sugiere que esta línea debería ser una área, pero no lo es.", //"The tag {tag} suggests line should be area, but it is not an area",
        deprecated_tags: "Etiquetas obsoletas: {tags}" //"Deprecated tags: {tags}"
    },

    zoom: {
        'in': "Acercar", // "Zoom In",
        out: "Alejar" //"Zoom Out",
    }
};
