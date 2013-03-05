locale.ru = {
    modes: {
        add_area: {
            title: "Контур",
            description: "Добавить парки, здания, озёра или иные объекты на карту.",
            tail: "Щёлкните на карту, чтобы начать рисование области — например, парка, озера или здания."
        },
        add_line: {
            title: "Линия",
            description: "Линиями можно обозначить дороги, тропинки, заборы или, к примеру, ручьи.",
            tail: "Щёлкните на карту, чтобы начать рисование дороги, тропинки или ручья."
        },
        add_point: {
            title: "Точка",
            description: "Точки — это рестораны, памятники, почтовые ящики.",
            tail: "Щёлкните на карту, чтобы поставить точку."
        },
        browse: {
            title: "Просмотр",
            description: "Двигать и масштабировать карту."
        },
        draw_area: {
            tail: "Щёлкайте, чтобы добавить точки в контур. Щёлкните начальную точку для завершения."
        },
        draw_line: {
            tail: "Щёлкайте, чтобы добавить точки в линию. Щёлкните на другую линию, чтобы соединить их, двойной щелчок завершит линию."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Добавлена точка.",
                vertex: "В линию добавлена точка."
            }
        },
        start: {
            annotation: {
                line: "Начато рисование линии.",
                area: "Начато рисование области."
            }
        },
        'continue': {
            annotation: {
                line: "Продлена линия.",
                area: "Дополнен контур."
            }
        },
        cancel_draw: {
            annotation: "Рисование отменено."
        },
        change_tags: {
            annotation: "Изменены теги."
        },
        circularize: {
            title: "Округлить",
            description: "Превратить объект в окружность.",
            key: "O",
            annotation: {
                line: "Линия превращена в окружность.",
                area: "Контур превращён в окружность."
            }
        },
        orthogonalize: {
            title: "Ортогонализировать",
            description: "Выпрямить все углы.",
            key: "Q",
            annotation: {
                line: "Выпрямлены углы в линии.",
                area: "Выпрямлены углы контура."
            }
        },
        'delete': {
            title: "Удалить",
            description: "Убрать объект с карты.",
            annotation: {
                point: "Удалена точка.",
                vertex: "Удалёна точка из линии.",
                line: "Удалена линия.",
                area: "Удалён контур.",
                relation: "Удалено отношение.",
                multiple: "Удалены {n} объектов."
            }
        },
        connect: {
            annotation: {
                point: "Линия присоединена к точке.",
                vertex: "Одна линия присоединена к другой.",
                line: "Линия соединена с другой линией.",
                area: "Линия присоединена к контуру."
            }
        },
        disconnect: {
            title: "Разъединить",
            description: "Разъединить эти линии.",
            key: "D",
            annotation: "Разъединены линии."
        },
        merge: {
            title: "Объединить",
            description: "Объединить две линии.",
            key: "C",
            annotation: "Объединены {n} линий."
        },
        move: {
            title: "Сместить",
            description: "Сместить объект в другое место.",
            key: "M",
            annotation: {
                point: "Смещена точка.",
                vertex: "Смещена точка линии.",
                line: "Смещена линия.",
                area: "Смещён контур.",
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
            title: "Развернуть",
            description: "Сменить направление этой линии на противоположное.",
            key: "V",
            annotation: "Линия развёрнута."
        },
        split: {
            title: "Разрезать",
            description: "Разбить линию на две в этой точке.",
            key: "X",
            annotation: "Разрезана линия."
        }
    },

    nothing_to_undo: "Отменять нечего.",
    nothing_to_redo: "Повторять нечего.",

    just_edited: "Вы только что отредактировали карту OpenStreetMap!",
    browser_notice: "Этот редактор работает в браузерах Firefox, Chrome, Safari, Opera и Internet Explorer версии 9 и выше. Пожалуйста, обновите свой браузер или воспользуйтесь редактором Potlatch 2.",
    view_on_osm: "Посмотреть на OSM",
    zoom_in_edit: "приблизьте для редактирования",
    logout: "выйти",
    report_a_bug: "сообщить об ошибке",

    commit: {
        title: "Сохранить изменения",
        description_placeholder: "Краткое описание ваших правок",
        upload_explanation: "Изменения, сделанные вами под именем {user}, появятся на всех картах, основанных на данных OpenStreetMap.",
        save: "Сохранить",
        cancel: "Отменить",
        warnings: "Предупреждения",
        modified: "Изменено",
        deleted: "Удалено",
        created: "Создано"
    },

    contributors: {
        list: "Здесь карту редактировали {users}",
        truncated_list: "Здесь карту редактировали {users} и ещё {count} человек"
    },

    geocoder: {
        title: "Найти место",
        placeholder: "найти место",
        no_results: "Не могу найти место с названием «{name}»"
    },

    geolocate: {
        title: "К моим координатам"
    },

    inspector: {
        no_documentation_combination: "Для этой комбинации ключа и значения нет описания",
        no_documentation_key: "Для этого ключа описания нет",
        new_tag: "Новый тег",
        edit_tags: "Править теги",
        okay: "Готово",
        view_on_osm: "Посмотреть в OSM",
        name: "Name",
        editing: "Editing {type}",
        additional: "Additional tags",
        choose: "What are you adding?",
        results: "{n} results for {search}"
    },

    background: {
        title: "Подложка",
        description: "Настройка подложки",
        percent_brightness: "яркость {opacity}%",
        fix_misalignment: "Поправить смещение",
        reset: "сброс"
    },

    restore: {
        description: "У вас обнаружились несохранённые правки с прошлого раза. Восстановить их?",
        restore: "Восстановить",
        reset: "Забыть"
    },

    save: {
        title: "Сохранить",
        help: "Отправить сделанные изменения на сервер OpenStreetMap, сделав их доступными всему миру",
        error: "Во время сохранения произошла ошибка",
        uploading: "Отправляем данные на сервер OpenStreetMap.",
        unsaved_changes: "У вас есть несохранённые правки"
    },

    splash: {
        welcome: "Здравствуйте! Это iD, редактор карты OpenStreetMap",
        text: "Вы пользуетесь неокончательной версией {version}. Подробнее на сайте {website}, об ошибках сообщайте в {github}."
    },

    source_switch: {
        live: "основной",
        dev: "тест"
    },

    tag_reference: {
        description: "Описание",
        on_wiki: "{tag} в вики OSM",
        used_with: "ставится на {type}"
    },

    validations: {
        untagged_point: "Точка без тегов и не в составе линии или контура",
        untagged_line: "Линия без тегов",
        untagged_area: "Контур без тегов",
        many_deletions: "You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        tag_suggests_area: "Тег {tag} обычно ставится на замкнутые контуры, но это не контур",
        deprecated_tags: "Теги устарели: {tags}"
    },

    zoom: {
        'in': "Приблизить",
        out: "Отдалить"
    }
};
