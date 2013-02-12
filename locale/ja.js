locale.en = {
    modes: {
        add_area: {
            title: "エリア",
            description: "公園や建物、湖沼、をマップに追加します",
            tail: "マップをクリックすると、公園や湖沼、建物などのエリアの描画が開始されます。"
        },
        add_line: {
            title: "ライン",
            description: "ラインは車両用の道路や歩道、用水路を表すことができます",
            tail: "マップをクリックすると、道路や歩道、流水経路の描画が始まります"
        },
        add_point: {
            title: "ポイント",
            description: "レストランや記念碑、郵便ボックスはポイントで表現します",
            tail: "マップをクリックするとポイントを追加できます"
        },
        browse: {
            title: "ブラウズ",
            description: "マップを拡大縮小します"
        },
        draw_area: {
            tail: "クリックするとエリア上にポイントを追加できます。起点となっているポイントをクリックするとエリアが作成されます"
        },
        draw_line: {
            tail: "クリックするとライン上にポイントを追加できます。クリックすることで他のラインと接続することが可能です。ライン描画を終了するにはダブルクリックしてください"
        }
    },

    operations: {
        add: {
            annotation: {
                point: "ポイントを追加しました",
                vertex: "ウェイにノードを追加しました"
            }
        },
        start: {
            annotation: {
                line: "ラインの描画を開始しました",
                area: "エリアの描画を開始しました"
            }
        },
        'continue': {
            annotation: {
                line: "ライン描画を継続中",
                area: "エリア描画を継続中"
            }
        },
        cancel_draw: {
            annotation: "描画をキャンセルしました"
        },
        change_tags: {
            annotation: "タグを変更しました"
        },
        circularize: {
            title: "円状に並べる",
            description: "この地物を円状に配置します",
            key: "O",
            annotation: {
                line: "ラインを円状にしました",
                area: "エリアを円状にしました"
            }
        },
        orthogonalize: {
            title: "角の直交化Orthogonalize",
            description: "角を90度に配置します",
            key: "Q",
            annotation: {
                line: "ラインの角を90度にしました",
                area: "エリアの角を90度にしました"
            }
        },
        'delete': {
            title: "削除",
            description: "この地物をマップから削除します",
            key: "⌫",
            annotation: {
                point: "ポイント削除しました",
                vertex: "ウェイ上のノードを削除しました",
                line: "ライン削除しました",
                area: "エリア削除しました",
                relation: "リレーション削除しました",
                multiple: "{n} 個のオブジェクトを削除しました"
            }
        },
        connect: {
            annotation: {
                point: "ウェイをポイントに接続しました",
                vertex: "ウェイを他のウェイト接続しました",
                line: "ウェイとラインを接続しました",
                area: "ウェイとエリアを接続しました"
            }
        },
        disconnect: {
            title: "接続解除",
            description: "ウェイの接続を解除して切り離します",
            key: "D",
            annotation: "ウェイの接続を解除しました"
        },
        merge: {
            title: "結合",
            description: "複数のラインを結合します",
            key: "C",
            annotation: "{n} 本のラインを結合しました"
        },
        move: {
            title: "移動",
            description: "この地物を別の位置に移動させます",
            key: "M",
            annotation: {
                point: "ポイントを移動しました",
                vertex: "ウェイ上のノードを移動しました",
                line: "ラインを移動しました",
                area: "エリアを移動しました"
            }
        },
        reverse: {
            title: "方向反転",
            description: "ラインの向きを反転させます",
            key: "V",
            annotation: "ラインの向きを反転しました"
        },
        split: {
            title: "分割",
            description: "このポイントを境目としてウェイを2つに分割します",
            key: "X",
            annotation: "ウェイを分割しました"
        }
    },

    validations: {
        untagged_point: "ポイントにタグが付与されておらず、ラインやエリアの一部でもありません",
        untagged_line: "ラインにタグが付与されていません",
        untagged_area: "エリアにタグが付与されていません",
        tag_suggests_area: "ラインに {tag} タグが付与されています。エリアで描かれるべきです",
        deprecated_tags: "タグの重複: {tags}"
    },

    save: "Save",
    unsaved_changes: "変更が保存されていません",
    save_help: "変更点をOpenStreetMapに保存し、他ユーザが確認できるようにします",
    no_changes: "変更点がありません",
    save_error: "データ保存中にエラーが発生しました",
    uploading_changes: "変更点をOpenStreetMapへアップロードしています",
    just_edited: "OpenStreetMap編集完了！",
    okay: "OK",

    "zoom-in": "ズームイン",
    "zoom-out": "ズームアウト",

    nothing_to_undo: "やり直す変更点がありません",
    nothing_to_redo: "やり直した変更点がありません",

    browser_notice: "このエディタは Firefox, Chrome, Safari, Opera, および Internet Explorer 9 以上をサポートしています。ブラウザのバージョンを更新するか、Potlatch 2を使用して編集してください",

    inspector: {
        no_documentation_combination: "このタグの組み合わせに関する説明文はありません",
        no_documentation_key: "このキーに対する説明文はありません",
        new_tag: "新規タグ"
    },

    view_on_osm: "OSMで確認",

    zoom_in_edit: "編集するにはさらに地図を拡大してください",

    edit_tags: "タグを編集",

    geocoder: {
        title: "特定地点を検索",
        placeholder: "地点を検索",
        no_results: "'{name}' という名称の地点が見つかりません"
    },

    description: "説明",

    logout: "ログアウト",

    report_a_bug: "バグを報告",

    layerswitcher: {
        title: "背景画像",
        description: "背景画像設定",
        percent_brightness: "{opacity}% 輝度",
        fix_misalignment: "背景画像を移動",
        reset: "設定リセット"
    },

    contributors: {
        list: "{users} による編集履歴を確認",
        truncated_list: "{users} とその他 {count} 人による編集履歴を表示"
    },

    source_switch: {
        live: "本番サーバ",
        dev: "開発サーバ"
    }
};
