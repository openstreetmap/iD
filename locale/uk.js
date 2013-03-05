locale.uk = {
    modes: {
        add_area: {
            title: "Полігон",
            description: "Додати парки, будівлі, озера та інше на мапу.",
            tail: "Клацніть на мапу, щоб розпочати креслити — наприклад, парк, озеро чи будинок."
        },
        add_line: {
            title: "Лінія",
            description: "Лініями позначаються дороги, вулиці, стежки, чи навіть, канали.",
            tail: "Клацніть на мапу, щоб розпочати креслити дорогу, стежку чи канал."
        },
        add_point: {
            title: "Точка",
            description: "Ресторани, пам’ятники, поштові скрині.",
            tail: "Клацніть на мапу, щоб постаивти точку."
        },
        browse: {
            title: "Перегляд",
            description: "Пересування та масштабування мапи."
        },
        draw_area: {
            tail: "Клацніть, щоб додати точку до полігону. Клацніть на початкову точку, щоб замкнути полігон."
        },
        draw_line: {
            tail: "Клацніть, щоб додати ще точку до лінії. Клацніть на іншу лінію, щоб з’єднатись з нею, подвійне клачання — завершення креслення лінії."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Додано точку.",
                vertex: "Точку додано до лінії."
            }
        },
        start: {
            annotation: {
                line: "Розпочато креслення лінії.",
                area: "Розпочато креслення полігону."
            }
        },
        'continue': {
            annotation: {
                line: "Лінію подовженно.",
                area: "Полігон змінено."
            }
        },
        cancel_draw: {
            annotation: "Креслення відмінене."
        },
        change_tags: {
            annotation: "Теґи змінені."
        },
        circularize: {
            title: "Закруглити",
            description: "Перетворити на коло.",
            key: "O",
            annotation: {
                line: "Лінія перетворена на коло.",
                area: "Полігон перетворено на коло."
            }
        },
        orthogonalize: {
            title: "Ортогоналізувати",
            description: "Зробити кути прямими.",
            key: "Q",
            annotation: {
                line: "Випрямлено кути лінії.",
                area: "Випрямлено кути полігону."
            }
        },
        'delete': {
            title: "Вилучити",
            description: "Вилучити об’єкт з мапи.",
            annotation: {
                point: "Вилучено точку.",
                vertex: "Вилучено точку з лінії.",
                line: "Вилучено лінію.",
                area: "Вилучено полігон.",
                relation: "Вилучено зв’язок.",
                multiple: "Вилучено {n} обґктів."
            }
        },
        connect: {
            annotation: {
                point: "Лінію приєднано до точки.",
                vertex: "Лінію приєднано до іншої лінії.",
                line: "Ліняя з’єднана з іншою лінією.",
                area: "Лінія з’єднана з полігоном."
            }
        },
        disconnect: {
            title: "Роз’єднати",
            description: "Роз’єднати лінії одна від одної.",
            key: "D",
            annotation: "Роз’єднано лінії."
        },
        merge: {
            title: "Поєднати",
            description: "Поєднати лінії.",
            key: "C",
            annotation: "З’єднати {n} ліній."
        },
        move: {
            title: "Посунтуи",
            description: "Посунути об’єкт на інше місце.",
            key: "M",
            annotation: {
                point: "Точку посунуто.",
                vertex: "Точку лінії посунуто.",
                line: "Лінію посунуто.",
                area: "Полігон посунуто.",
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
            title: "Розвернути",
            description: "Змінити напрямок лінії на протилежний.",
            key: "V",
            annotation: "Напрямок лінії змінено."
        },
        split: {
            title: "Розділити",
            description: "Розділити лінію на дві в цій точці.",
            key: "X",
            annotation: "Розділити лінію."
        }
    },

    nothing_to_undo: "Скасовувати нічого.",
    nothing_to_redo: "Повертати нічого.",

    just_edited: "Ви тільки що відредагували мапу OpenStreetMap!",
    browser_notice: "Цей редактор працює в оглядачах Firefox, Chrome, Safari, Opera і Internet Explorer версії 9 і вище.  Будь ласка, оновіть свій оглядач або скористайтеся редактором Potlatch 2.",
    view_on_osm: "Подивитись в ОСМ",
    zoom_in_edit: "наблизтесь, щоб редагувати",
    logout: "вийти",
    report_a_bug: "повідомити про помилку",

    commit: {
        title: "Зберегти зміни",
        description_placeholder: "Короткий опис ваших правок",
        upload_explanation: "Зміни, зроблені вами під іменем {user}, з’являться на всіх мапах, що використовують дані OpenStreetMap.",
        save: "Зберегти",
        cancel: "Відмінити",
        warnings: "Попередження",
        modified: "Змінено",
        deleted: "Вилучено",
        created: "Створено"
    },

    contributors: {
        list: "Тут мапу редагували: {users}",
        truncated_list: "Тут мапу редагували {users} та ще {count} інших"
    },

    geocoder: {
        title: "Знайти місце",
        placeholder: "знайти місце",
        no_results: "Неможливо знайти '{name}'"
    },

    geolocate: {
        title: "Моє місцезнаходження"
    },

    inspector: {
        no_documentation_combination: "Для цієї комбінації теґів немає документації",
        no_documentation_key: "Для цього теґа немає документації",
        new_tag: "Новий теґ",
        edit_tags: "Редагувати теґи",
        okay: "Готово",
        view_on_osm: "Подивтись в ОСМ",
        name: "Name",
        editing: "Editing {type}",
        additional: "Additional tags",
        choose: "What are you adding?",
        results: "{n} results for {search}"
    },

    layerswitcher: {
        title: "Фон",
        description: "Налаштування фону",
        percent_brightness: "прозорість {opacity}%",
        fix_misalignment: "Виправити зсув",
        reset: "скинути"
    },

    restore: {
        description: "У вас виявилися незбережені правки з минулого разу. Відновити їх?",
        restore: "Відновити",
        reset: "Відкинути"
    },

    save: {
        title: "Зберегти",
        help: "Зберегти зміни надіславши їх на OpenStreetMap, та зробивши їх доступними всім іншим.",
        error: "Під час збереження виникла помилка",
        uploading: "Надсилання змін до OpenStreetMap.",
        unsaved_changes: "Ви маєте незбережені правки"
    },

    splash: {
        welcome: "Ласкаво просимо до редактора OpenStreetMap — iD",
        text: "Це експериментальна версія {version}. Докладніше на {website}, сповіщайте про помилки на {github}."
    },

    source_switch: {
        live: "основна",
        dev: "тест"
    },

    tag_reference: {
        description: "Опис",
        on_wiki: "{tag} на wiki.osm.org",
        used_with: "використовується з {type}"
    },

    validations: {
        untagged_point: "Точка без теґів, що не є частиною лінію чи полігону",
        untagged_line: "Лінія без теґів",
        untagged_area: "Полігон без  теґів",
        many_deletions: "You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        tag_suggests_area: "Теґ {tag} зазвичай ставться на полігони, але об’єкт ним не є",
        deprecated_tags: "Застарілі теґи: {tags}"
    },

    zoom: {
        'in': "Наблизитись",
        out: "Віддалитись"
    }
};
