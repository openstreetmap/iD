locale.pt = {
    modes: {
        add_area: {
            title: "Área", //"Area",
            description: "Adicione parques, edifícios, lagos, ou outras áreas ao mapa.", //"Add parks, buildings, lakes, or other areas to the map.",
            tail: "Clique no mapa para começar a desenhar uma área, como um parque, lago ou edifício." //"Click on the map to start drawing an area, like a park, lake, or building."
        },
        add_line: {
            title: "Linha", //"Line",
            description: "Linhas podem ser auto-estradas, ruas, caminhos pedestres e inclusive canais.", //"Lines can be highways, streets, pedestrian paths, or even canals.",
            tail: "Clique no mapa para começar a desenhar uma estrada, caminho ou rota." //"Click on the map to start drawing an road, path, or route.",
        },
        add_point: {
            title: "Ponto", //"Point",
            description: "Restaurantes, monumentos e caixas postais podem ser pontos.", //"Restaurants, monuments, and postal boxes are points.",
            tail: "Clique no mapa para adicionar um ponto." //"Click on the map to add a point.",
        },
        browse: {
            title: "Navegar", //"Browse",
            description: "Faça zoom e mova o mapa" //"Pan and zoom the map.",
        },
        draw_area: {
            tail: "Clique para adicionar pontos à sua área. Carregue no primeiro ponto para terminar a área." //"Click to add points to your area. Click the first point to finish the area."
        },
        draw_line: {
            tail: "Clique para adicionar mais pontos à linha. Clique em outras linhas para ligar, e duplo-clique para terminar a linha." //"Click to add more points to the line. Click on other lines to connect to them, and double-click to end the line."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Adicione um Ponto.", //"Added a point.",
                vertex: "Adicione um vértice a um caminho" //"Added a node to a way."
            }
        },
        start: {
            annotation: {
                line: "Linha iniciada.", //"Started a line.",
                area: "Área iniciada." //"Started an area."
            }
        },
        'continue': {
            annotation: {
                line: "Linha continuada.", //"Continued a line.",
                area: "Área continuada." //"Continued an area."
            }
        },
        cancel_draw: {
            annotation: "Desenho cancelado." //"Cancelled drawing."
        },
        change_tags: {
            annotation: "Tags alteradas." //"Changed tags."
        },
        circularize: {
            title: "Circularizar", //"Circularize",
            description: "Fazer isto circular.", //"Make this round.",
            key: "O",
            annotation: {
                line: "Fazer uma linha circular.", //"Made a line circular.",
                area: "Fazer uma área circular." //"Made an area circular."
            }
        },
        orthogonalize: {
            title: "Esquadrar", //"Orthogonalize",
            description: "Esquadrar estes cantos.", //"Square these corners.",
            key: "E", //"Q",
            annotation: {
                line: "Cantos da linha esquadrados.", //"Squared the corners of a line.",
                area: "Cantos da área esquadrados." //"Squared the corners of an area."
            }
        },
        'delete': {
            title: "Remover", //"Delete",
            description: "Remover isto do mapa.", //"Remove this from the map.",
            annotation: {
                point: "Ponto eliminado.", //"Deleted a point.",
                vertex: "Vértice elimnado de la ruta.", //"Deleted a node from a way.",
                line: "Linha eliminada.", //"Deleted a line.",
                area: "Área eliminada.", //"Deleted an area.",
                relation: "Relacão eliminada.", //"Deleted a relation.",
                multiple: "{n} objetos eliminados." //"Deleted {n} objects."
            }
        },
        connect: {
            annotation: {
                point: "Rota ligada a um ponto.", //"Connected a way to a point.",
                vertex: "Rota ligada a outra.", //"Connected a way to another.",
                line: "Rota ligada a uma linha.", //"Connected a way to a line.",
                area: "Rota ligada a uma área." //"Connected a way to an area."
            }
        },
        disconnect: {
            title: "Desligar", //"Disconnect",
            description: "Desligar rotas umas das outras.", //"Disconnect these ways from each other.",
            key: "D",
            annotation: "Rotas desligadas." //"Disconnected ways."
        },
        merge: {
            title: "Combinar", //"Merge",
            description: "Combinar linhas.", //"Merge these lines.",
            key: "C",
            annotation: "{n} linhas combinadas." //"Merged {n} lines."
        },
        move: {
            title: "Mover", //"Move",
            description: "Mover para outra localização.", //"Move this to a different location.",
            key: "M",
            annotation: {
                point: "Ponto movido,", //"Moved a point.",
                vertex: "Vértice movido.", //"Moved a node in a way.",
                line: "Linha movida.", //"Moved a line.",
                area: "Área movida,", //"Moved an area.",
                multiple: "Múltiplos objectos movidos."
            }
        },
        rotate: {
            title: "Rodar",
            description: "Rodar este objecto sobre o seu ponto central.",
            key: "R",
            annotation: {
                line: "Linha rodada.",
                area: "Área rodade."
            }
        },
        reverse: {
            title: "Inverter", //"Reverse",
            description: "Inverter direcção da linha.", //"Make this line go in the opposite direction.",
            key: "I", //"V",
            annotation: "Direcção da linha revertida." //"Reversed a line."
        },
        split: {
            title: "Dividir", //"Split",
            description: "Dividir em duas rotas este ponto.", //"Split this into two ways at this point.",
            key: "D", //"X",
            annotation: "Dividir rota." //"Split a way."
        }
    },

    nothing_to_undo: "Nada a desfazer.", //"Nothing to undo.",
    nothing_to_redo: "Nada a refazer.", //"Nothing to redo.",

    just_edited: "Acaba de editar o OpenStreetMap!", //"You Just Edited OpenStreetMap!",
    browser_notice: "Este editor suporta Firefox, Chrome, Safari, Opera e Internet Explorer 9 ou superior. Por favor actualize o seu browser ou utilize Potlatch 2 para editar o mapa.", //"This editor is supported in Firefox, Chrome, Safari, Opera, and Internet Explorer 9 and above. Please upgrade your browser or use Potlatch 2 to edit the map.",
    view_on_osm: "Ver em OSM", //"View on OSM",
    zoom_in_edit: "Aproxime-se para editar o mapa", //"zoom in to edit the map",
    logout: "Encerrar sessão", //"logout",
    report_a_bug: "Reportar un erro", //"report a bug",

    commit: {
        title: "Guardar Alterações", // "Save Changes"
        description_placeholder: "Breve descrição das suas contribuições", //"Brief description of your contributions"
        upload_explanation: "As alterações que envia como {user} serão visíveis em todos os mapas que utilizem dados do OpenStreetMap.", //"The changes you upload as {user} will be visible on all maps that use OpenStreetMap data."
        save: "Guardar", //"Save"
        cancel: "Cancelar", //"Cancel"
        warnings: "Avisos", //"Warnings"
        modified: "Modificado", //"Modified"
        deleted: "Removido", //"Deleted"
        created: "Criado" //"Created"
    },

    contributors: {
        list: "A ver contribuições de {users}", //"Viewing contributions by {users}",
        truncated_list: "A ver contribuições de {users} e mais {count} outros" //"Viewing contributions by {users} and {count} others"
    },

    geocoder: {
        title: "Encontrar Um Local", //"Find A Place",
        placeholder: "encontrar um local", //"find a place",
        no_results: "Não foi possível encontrar o local chamado '{name}'" //"Couldn't locate a place named '{name}'"
    },

    geolocate: {
        title: "Mostrar a minha localização" //"Show My Location"
    },

    inspector: {
        no_documentation_combination: "Não há documentação disponível para esta combinação de tags", //"This is no documentation available for this tag combination",
        no_documentation_key: "Não há documentação disponível para esta tecla", //"This is no documentation available for this key",
        new_tag: "Nova tag", //"New Tag"
        edit_tags: "Editar tags", //"Edit tags",
        okay: "OK",
        view_on_osm: "Ver em OSM", //"View on OSM",
        name: "Nome",
        editing: "A editar {type}",
        additional: "Tags adicionais",
        choose: "O que está a adicionar?",
        results: "{n} resultados para {search}"
    },

    background: {
        title: "Fundo", //"Background",
        description: "Configuração de fundo", //"Background Settings",
        percent_brightness: "{opacity}% brilho", //"{opacity}% brightness",
        fix_misalignment: "Arranjar desalinhamento", //"Fix misalignment",
        reset: "reiniciar" //"reset"
    },

    restore: {
        description: "Tem alterações por guardar de uma prévia sessão de edição. Deseja restaurar estas alterações?", //"You have unsaved changes from a previous editing session. Do you wish to restore these changes?"
        restore: "Restaurar", //"Restore"
        reset: "Descartar" //"Reset"
    },

    save: {
        title: "Guardar", //"Save",
        help: "Guardar alterações no OpenStreetMap, tornando-as visíveis a outros utilizadores.", //"Save changes to OpenStreetMap, making them visible to other users.",
        error: "Um erro ocorreu ao tentar guardar", //"An error occurred while trying to save",
        uploading: "Enviando alterações para OpenStreetMap.", //"Uploading changes to OpenStreetMap.",
        unsaved_changes: "Tem alterações por guardar" //"You have unsaved changes",
    },

    splash: {
        welcome: "Bemvindo ao editor OpenStreetMap iD", //"Welcome to the iD OpenStreetMap editor"
        text: "Esta é a versão de desenvolvimento {version}. Para mais informação visite {website} e reporte erros em {github}." //"This is development version {version}. For more information see {website} and report bugs at {github}."
    },

    source_switch: {
        live: "ao vivo", //"live",
        dev: "dev"
    },

    tag_reference: {
        description: "Descrição",
        on_wiki: "{tag} em wiki.osm.org", //"{tag} on wiki.osm.org"
        used_with: "usado com {type}" //"used with {type}"
    },

    validations: {
        untagged_point: "Punto sin etiquetar que no es parte de una línea ni de un área.", //"Untagged point which is not part of a line or area",
        untagged_line: "Linha sem tag", //"Untagged line",
        untagged_area: "Área sem tags", //"Untagged area",
        many_deletions: "Está a eliminar {n} objectos. Tem a certeza que deseja continuar? Esta operação eliminará os objectos do mapa que outros vêem em openstreetmap.org.",//"You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        tag_suggests_area: "A tag {tag} sugere que esta linha devia ser uma área, mas não é uma área.", //"The tag {tag} suggests line should be area, but it is not an area",
        deprecated_tags: "Tags obsoletas: {tags}" //"Deprecated tags: {tags}"
    },

    zoom: {
        'in': "Aproximar", // "Zoom In",
        out: "Afastar" //"Zoom Out",
    }
};
