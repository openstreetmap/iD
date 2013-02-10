locale.tr = {
    modes: {
        add_area: {
            title: "Alan",
            description: "Park, bina, göl ve benzeri alanları haritaya ekle.",
            tail: "Park, göl ya da bina gibi alanları çizmek için haritaya tıklayın.",
            key: "A"
        },
        add_line: {
            title: "Çizgi",
            description: "Yollar, sokaklar, patikalar ya da kanallar çizgi ile çizilebilir.",
            tail: "Yol, patika yada rota çizmek için haritaya tıklayın.",
            key: "L"
        },
        add_point: {
            title: "Nokta",
            description: "Restoranlar, anıtlar ya da posta kutuları nokta ile gösterilebilir.",
            tail: "Nokta eklemek için haritaya tıklayın.",
            key: "P"
        },
        browse: {
            title: "Tara",
            description: "Harita üzerinde dolan ve yaklaş.",
            key: "B"
        },
        draw_area: {
            tail: "Alanınıza nokta eklemek için tıklayınız. İlk noktaya tıklayarak alan çizimini bitirebilirsiniz."
        },
        draw_line: {
            tail: "Çizgiye daha fazla nokta eklemek için tıklayınız. Diğer çizgilerle bağlamak için üstlerine tıklyınız ve bitirmek için de son noktada çift tıklayınız."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Nokta eklendi.",
                vertex: "Çizgiye bir nod eklendi."
            }
        },
        start: {
            annotation: {
                line: "Çizgi çizimi başlatıldı.",
                area: "Alan çizimi başlatıldı."
            }
        },
        'continue': {
            annotation: {
                line: "Çizgiye devam edildi.",
                area: "Alana devam edildi."
            }
        },
        cancel_draw: {
            annotation: "Çizim iptal edildi."
        },
        change_tags: {
            annotation: "Etiketler değiştirildi."
        },
        circularize: {
            title: "Circularize",
            description: "Make this round.",
            key: "O",
            annotation: {
                line: "Made a line circular.",
                area: "Made an area circular."
            }
        },
        orthogonalize: {
            title: "Orthogonalize",
            description: "Square these corners.",
            key: "Q",
            annotation: {
                line: "Squared the corners of a line.",
                area: "Squared the corners of an area."
            }
        },
        'delete': {
            title: "Delete",
            description: "Remove this from the map.",
            key: "⌫",
            annotation: {
                point: "Deleted a point.",
                vertex: "Deleted a node from a way.",
                line: "Deleted a line.",
                area: "Deleted an area.",
                relation: "Deleted a relation.",
                multiple: "Deleted {n} objects."
            }
        },
        connect: {
            annotation: {
                point: "Connected a way to a point.",
                vertex: "Connected a way to another.",
                line: "Connected a way to a line.",
                area: "Connected a way to an area."
            }
        },
        disconnect: {
            title: "Disconnect",
            description: "Disconnect these ways from each other.",
            key: "D",
            annotation: "Disconnected ways."
        },
        merge: {
            title: "Merge",
            description: "Merge these lines.",
            key: "C",
            annotation: "Merged {n} lines."
        },
        move: {
            title: "Move",
            description: "Move this to a different location.",
            key: "M",
            annotation: {
                point: "Moved a point.",
                vertex: "Moved a node in a way.",
                line: "Moved a line.",
                area: "Moved an area."
            }
        },
        reverse: {
            title: "Reverse",
            description: "Make this line go in the opposite direction.",
            key: "V",
            annotation: "Reversed a line."
        },
        split: {
            title: "Split",
            description: "Split this into two ways at this point.",
            key: "X",
            annotation: "Split a way."
        }
    },

    validations: {
        untagged_point: "Untagged point which is not part of a line or area",
        untagged_line: "Untagged line",
        untagged_area: "Untagged area",
        tag_suggests_area: "The tag {tag} suggests line should be area, but it is not an area",
        deprecated_tags: "Deprecated tags: {tags}"
    },

    save: "Save",
    unsaved_changes: "You have unsaved changes",
    save_help: "Save changes to OpenStreetMap, making them visible to other users",
    no_changes: "You don't have any changes to save.",
    save_error: "An error occurred while trying to save",
    uploading_changes: "Uploading changes to OpenStreetMap.",
    just_edited: "You Just Edited OpenStreetMap!",
    okay: "Okay",

    "zoom-in": "Zoom In",
    "zoom-out": "Zoom Out",

    nothing_to_undo: "Nothing to undo.",
    nothing_to_redo: "Nothing to redo.",

    browser_notice: "This editor is supported in Firefox, Chrome, Safari, Opera, and Internet Explorer 9 and above. Please upgrade your browser or use Potlatch 2 to edit the map.",

    inspector: {
        no_documentation_combination:  "This is no documentation available for this tag combination",
        no_documentation_key: "This is no documentation available for this key",
        new_tag: "New Tag"
    },

    view_on_osm: "View on OSM",

    zoom_in_edit: "zoom in to edit the map",

    edit_tags: "Edit tags",

    geocoder: {
        title: "Find A Place",
        placeholder: "find a place",
        no_results: "Couldn't locate a place named '{name}'"
    },

    description: "Description",

    logout: "logout",

    report_a_bug: "report a bug",

    layerswitcher: {
        title: "Background",
        description: "Background Settings",
        percent_brightness: "{opacity}% brightness",
        fix_misalignment: "Fix misalignment",
        reset: "reset"
    },

    contributors: {
        list: "Viewing contributions by {users}",
        truncated_list: "Viewing contributions by {users} and {count} others"
    },

    source_switch: {
        live: "live",
        dev: "dev"
    }
};
