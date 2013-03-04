locale.ja = {
    modes: {
        add_area: {
            title: "エリア",
            description: "公園や建物、湖沼等をマップに追加",
            tail: "クリックした地点から公園や湖沼、建物など、エリアの描画を行います"
        },
        add_line: {
            title: "ライン",
            description: "道路や歩道、用水路などのラインを描画",
            tail: "クリックした地点から道路や歩道、流水経路など、ラインの描画を開始します"
        },
        add_point: {
            title: "ポイント",
            description: "レストランや記念碑、郵便ボックス等、ポイント情報を追加",
            tail: "クリックした地点にポイントを追加します"
        },
        browse: {
            title: "ブラウズ",
            description: "マップの拡大縮小"
        },
        draw_area: {
            tail: "クリックするとエリア上にポイントを追加できます。ラインの起点となっているポイントをクリックするとエリアが作成されます"
        },
        draw_line: {
            tail: "クリックするとライン上にポイントを追加できます。ラインを描画中に他のラインをクリックすることで、2つのラインを接続することが可能です。描画を終了するにはダブルクリックしてください"
        }
    },

    operations: {
        add: {
            annotation: {
                point: "ポイントの追加",
                vertex: "ウェイへのノード追加"
            }
        },
        start: {
            annotation: {
                line: "ラインの描画開始",
                area: "エリアの描画開始"
            }
        },
        'continue': {
            annotation: {
                line: "ライン描画の継続",
                area: "エリア描画の継続"
            }
        },
        cancel_draw: {
            annotation: "描画のキャンセル"
        },
        change_tags: {
            annotation: "タグの変更"
        },
        circularize: {
            title: "円状に並べる",
            description: "この地物を円状に配置",
            key: "O",
            annotation: {
                line: "ラインを円状に整形",
                area: "エリアを円状に整形"
            }
        },
        orthogonalize: {
            title: "角の直交化",
            description: "角を90度に整形",
            key: "Q",
            annotation: {
                line: "ラインの角を90度に整形",
                area: "エリアの角を90度に整形"
            }
        },
        'delete': {
            title: "削除",
            description: "この地物をマップから削除",
            key: "⌦",
            annotation: {
                point: "ポイントを削除",
                vertex: "ウェイ上のノードを削除",
                line: "ライン削除",
                area: "エリア削除",
                relation: "リレーション削除",
                multiple: "{n} 個のオブジェクトを削除"
            }
        },
        connect: {
            annotation: {
                point: "ウェイをポイントに接続",
                vertex: "ウェイを他のウェイト接続",
                line: "ウェイとラインを接続",
                area: "ウェイとエリアを接続"
            }
        },
        disconnect: {
            title: "接続解除",
            description: "ウェイの接続を解除して切り離す",
            key: "D",
            annotation: "ウェイの接続を解除"
        },
        merge: {
            title: "結合",
            description: "複数のラインを結合",
            key: "C",
            annotation: "{n} 本のラインを結合"
        },
        move: {
            title: "移動",
            description: "この地物を別の位置へ移動",
            key: "M",
            annotation: {
                point: "ポイントを移動",
                vertex: "ウェイ上のノードを移動",
                line: "ラインの移動",
                area: "エリアの移動"
            }
        },
        reverse: {
            title: "方向反転",
            description: "ラインの向きを反転",
            key: "V",
            annotation: "ラインの方向反転"
        },
        split: {
            title: "分割",
            description: "このポイントを境としてウェイを分割",
            key: "X",
            annotation: "ウェイの分割"
        }
    },

    nothing_to_undo: "やり直す変更点がありません",
    nothing_to_redo: "やり直した変更点がありません",

    just_edited: "OpenStreetMap編集完了！",
    browser_notice: "このエディタは Firefox, Chrome, Safari, Opera, および Internet Explorer 9 以上をサポートしています。ブラウザのバージョンを更新するか、Potlatch 2を使用して編集してください",
    view_on_osm: "OSMで確認",
    zoom_in_edit: "編集するにはさらに地図を拡大してください",
    logout: "ログアウト",
    report_a_bug: "バグ報告",

    commit: {
        title: "編集結果を保存",
        description_placeholder: "Brief description of your contributions",
        upload_explanation: "編集した内容を {user} アカウントでアップロードし、OpenStreetMapを利用しているすべてのユーザが閲覧できるようにします",
        save: "Save",
        cancel: "キャンセル",
        warnings: "注意",
        modified: "変更した地物",
        deleted: "削除した地物",
        created: "作成した地物"
    },

    contributors: {
        list: "{users} による編集履歴を確認",
        truncated_list: "{users} とその他 {count} 人による編集履歴を表示"
    },

    geocoder: {
        title: "特定地点を検索",
        placeholder: "対象地点の名称",
        no_results: "'{name}' という名称の地点が見つかりません"
    },

    geolocate: {
        title: "編集画面を現在地へ移動"
    },

    inspector: {
        no_documentation_combination: "このタグの組み合わせに関する説明文はありません",
        no_documentation_key: "このキーに対する説明文はありません",
        new_tag: "新規タグ",
        edit_tags: "タグ編集",
        okay: "OK",
        view_on_osm: "詳細情報確認",
        name: "Name",
        editing: "Editing {type}",
        additional: "Additional tags",
        choose: "What are you adding?"
    },

    layerswitcher: {
        title: "背景画像",
        description: "背景画像設定",
        percent_brightness: "{opacity}% 輝度",
        fix_misalignment: "背景画像をずらす",
        reset: "設定リセット"
    },

    restore: {
        description: "前回作業した編集内容がアップロードされていません。編集内容を復元しますか？",
        restore: "復元",
        reset: "破棄"
    },

    save: {
        title: "Save",
        help: "編集内容をOpenStreetMapへ保存し、他ユーザへ公開",
        error: "データ保存中にエラーが発生しました",
        uploading: "編集内容をOpenStreetMapへアップロードしています",
        unsaved_changes: "編集内容が保存されていません"
    },

    splash: {
        welcome: "iD 起動中",
        text: "開発版 {version} を起動します。詳細は {website} を参照してください。バグ報告は {github} で受付中です"
    },

    source_switch: {
        live: "本番サーバ",
        dev: "開発サーバ"
    },

    tag_reference: {
        description: "説明",
        on_wiki: "wiki.osm.org の {tag} 説明",
        used_with: "used with {type}"
    },

    validations: {
        untagged_point: "ポイントにタグが付与されておらず、ラインやエリアの一部でもありません",
        untagged_line: "ラインにタグが付与されていません",
        untagged_area: "エリアにタグが付与されていません",
        many_deletions: "You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        tag_suggests_area: "ラインに {tag} タグが付与されています。エリアで描かれるべきです",
        deprecated_tags: "タグの重複: {tags}"
    },

    zoom: {
        in: "ズームイン",
        out: "ズームアウト"
    }
};
