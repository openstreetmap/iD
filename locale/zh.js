locale.zh = {
    modes: {
        add_area: {
            title: "面",
            description: "在地图上添加公园，建筑物，湖泊或其他面状区域。",
            tail: "在地图上点击开始绘制一个区域，像一个公园，湖边，或建筑物。"
        },
        add_line: {
            title: "线",
            description: "在地图上添加公路，街道，行人路，运河或其他线路。",
            tail: "在地图上点击开始绘制道路，路径或路线。"
        },
        add_point: {
            title: "点",
            description: "在地图上添加餐馆，古迹，邮箱或其他点。",
            tail: "在地图上点击添加一个点。"
        },
        browse: {
            title: "浏览",
            description: "平移和缩放地图。"
        },
        draw_area: {
            tail: "通过点击给你的面添加结点。单击第一个点完成面的绘制。"
        },
        draw_line: {
            tail: "通过单击给线添加更多的点。点击其他线路连接它们，双击结束。"
        }
    },

    operations: {
        add: {
            annotation: {
                point: "添加一个点。",
                vertex: "给线添加一个节点。"
            }
        },
        start: {
            annotation: {
                line: "开始一条线。",
                area: "开始一个面。"
            }
        },
        'continue': {
            annotation: {
                line: "接着绘制一条线。",
                area: "接着绘制一个面。"
            }
        },
        cancel_draw: {
            annotation: "取消绘图。"
        },
        change_tags: {
            annotation: "改变标签。"
        },
        circularize: {
            title: "圆",
            description: "制作圆形。",
            key: "O",
            annotation: {
                line: "把线制作成圆形。",
                area: "把面制作成圆形。"
            }
        },
        orthogonalize: {
            title: "直角化",
            description: "边角直角化。",
            key: "Q",
            annotation: {
                line: "线直角化。",
                area: "面直角化。"
            }
        },
        'delete': {
            title: "删除",
            description: "从地图中删除此。",
            annotation: {
                point: "删除一个点。",
                vertex: "删除线上一个结点。",
                line: "删除一条点。",
                area: "删除一个面。",
                relation: "删除一个关系。",
                multiple: "删除{n}个对象。"
            }
        },
        connect: {
            annotation: {
                point: "连接线到一个点上。",
                vertex: "连接线到另一条线上。",
                line: "连接线到一条线上。",
                area: "连接线到一个面上。"
            }
        },
        disconnect: {
            title: "断开",
            description: "断开这些线。",
            key: "D",
            annotation: "断开线。"
        },
        merge: {
            title: "合并",
            description: "合并这些线。",
            key: "C",
            annotation: "合并{n}条线。"
        },
        move: {
            title: "移动",
            description: "移动到其他的位置。",
            key: "M",
            annotation: {
                point: "移动一个点。",
                vertex: "移动线上一个结点",
                line: "移动一条线。",
                area: "移动一个面。",
                multiple: "移动多个对象。"
            }
        },
        rotate: {
            title: "旋转",
            description: "绕其中心点旋转该对象。",
            key: "R",
            annotation: {
                line: "旋转一条线。",
                area: "旋转一个面。"
            }
        },
        reverse: {
            title: "反转",
            description: "这条线走在相反的方向。",
            key: "V",
            annotation: "反转一条线。"
        },
        split: {
            title: "分割",
            description: "在这点上分成两条线。",
            key: "X",
            annotation: "分割一条线。"
        }
    },

    nothing_to_undo: "没有可撤消的。",
    nothing_to_redo: "没有可重做的。",

    just_edited: "你正在编辑的OpenStreetMap！",
    browser_notice: "该编辑器支持Firefox、Chrome、Safari、Opera和Internet Explorer9及以上的浏览器。请升级您的浏览器或者使用Potlatch 2来编辑地图。",
    view_on_osm: "在OSM上查看",
    zoom_in_edit: "放大编辑地图",
    logout: "退出",
    report_a_bug: "报告bug",

    commit: {
        title: "保存更改",
        description_placeholder: "简要说明你的贡献",
        upload_explanation: "{user}你上传的更新将会显示在所有使用OpenStreetMap数据的地图上。",
        save: "保存",
        cancel: "取消",
        warnings: "警告",
        modified: "修改的",
        deleted: "删除的",
        created: "创建的"
    },

    contributors: {
        list: "查看{users}的贡献",
        truncated_list: "查看{count}个其他成员{users}的贡献"
    },

    geocoder: {
        title: "查找位置",
        placeholder: "查找位置",
        no_results: "无法找到叫'{name}'的地方"
    },

    geolocate: {
        title: "显示我的位置"
    },

    inspector: {
        no_documentation_combination: "没有关于此标签组合的文档",
        no_documentation_key: "没有关于此键的文档",
        new_tag: "新建标签",
        edit_tags: "编辑标签",
        okay: "确定",
        view_on_osm: "在OSM上查看",
        name: "名称",
        editing: "编辑 {type}",
        additional: "附加标签",
        choose: "你添加的是什么？",
        results: "{search}共有{n}个结果",
        reference: "查看 OpenStreetMap Wiki →"
    },

    background: {
        title: "背景",
        description: "设置背景",
        percent_brightness: "{opacity}% 亮度",
        fix_misalignment: "修复错位",
        reset: "重置"
    },

    restore: {
        description: "上次您有未保存的更改。你想恢复这些更改吗？",
        restore: "恢复",
        reset: "重置"
    },

    save: {
        title: "保存",
        help: "保存更改到OpenStreetMap上，使其他用户可已看见。",
        no_changes: "没有可以保存的更改。",
        error: "保存发生错误",
        uploading: "正在向OpenStreetMap上传更改。",
        unsaved_changes: "您有未保存的更改"
    },

    splash: {
        welcome: "欢迎使用OpenStreetMap编辑器iD",
        text: "这是开发版本{version}。欲了解更多信息，请参阅{website}，在{github}报告bug。"
    },

    source_switch: {
        live: "live",
        dev: "dev"
    },

    tag_reference: {
        description: "描述",
        on_wiki: "在wiki.osm.org查看{tag}",
        used_with: "使用{type}"
    },

    validations: {
        untagged_point: "未标记点，他并不是线或面的一部分",
        untagged_line: "未标记的线",
        untagged_area: "未标记的面",
        many_deletions: "您正在删除{n}个对象。你确定你想这样做吗？所有的其他openstreetmap.org用户都将在地图上看不到这些数据。You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        tag_suggests_area: "{tag}这个标签建议使用在面上，但是他不是一个面",
        deprecated_tags: "已过时标签：{tags}"
    },

    zoom: {
        'in': "放大",
        out: "缩小"
    },

    // We expect these to be extracted at some point.
    "presets": {
        "forms": {
            "access": {
                "label": "Access"
            },
            "address": {
                "label": "Address",
                "placeholders": {
                    "housename": "Housename",
                    "number": "123",
                    "street": "Street",
                    "city": "City"
                }
            },
            "aeroway": {
                "label": "Type"
            },
            "amenity": {
                "label": "Type"
            },
            "atm": {
                "label": "ATM"
            },
            "bicycle_parking": {
                "label": "Type"
            },
            "building": {
                "label": "Building"
            },
            "building_area": {
                "label": "Building"
            },
            "building_yes": {
                "label": "Building"
            },
            "capacity": {
                "label": "Capacity"
            },
            "collection_times": {
                "label": "Collection Times"
            },
            "construction": {
                "label": "Type"
            },
            "crossing": {
                "label": "Type"
            },
            "cuisine": {
                "label": "Cuisine"
            },
            "denomination": {
                "label": "Denomination"
            },
            "denotation": {
                "label": "Denotation"
            },
            "elevation": {
                "label": "Elevation"
            },
            "emergency": {
                "label": "Emergency"
            },
            "fax": {
                "label": "Fax"
            },
            "fee": {
                "label": "Fee"
            },
            "highway": {
                "label": "Type"
            },
            "internet_access": {
                "label": "Internet Access",
                "options": {
                    "yes": "Yes",
                    "no": "No",
                    "wlan": "Wifi",
                    "wired": "Wired",
                    "terminal": "Terminal"
                }
            },
            "landuse": {
                "label": "Type"
            },
            "layer": {
                "label": "Layer"
            },
            "leisure": {
                "label": "Type"
            },
            "levels": {
                "label": "Levels"
            },
            "man_made": {
                "label": "Type"
            },
            "maxspeed": {
                "label": "Speed Limit"
            },
            "natural": {
                "label": "Natural"
            },
            "network": {
                "label": "Network"
            },
            "office": {
                "label": "Type"
            },
            "oneway": {
                "label": "One Way"
            },
            "opening_hours": {
                "label": "Hours"
            },
            "operator": {
                "label": "Operator"
            },
            "phone": {
                "label": "Phone"
            },
            "place": {
                "label": "Type"
            },
            "railway": {
                "label": "Type"
            },
            "religion": {
                "label": "Religion",
                "options": {
                    "christian": "Christian",
                    "muslim": "Muslim",
                    "buddhist": "Buddhist",
                    "jewish": "Jewish",
                    "hindu": "Hindu",
                    "shinto": "Shinto",
                    "taoist": "Taoist"
                }
            },
            "roadtype": {
                "label": "Features",
                "options": {
                    "bridge": "Bridge",
                    "tunnel": "Tunnel",
                    "embankment": "Embankment",
                    "cutting": "Cutting"
                }
            },
            "service": {
                "label": "Type"
            },
            "shelter": {
                "label": "Shelter"
            },
            "shop": {
                "label": "Type"
            },
            "source": {
                "label": "Source"
            },
            "sport": {
                "label": "Sport"
            },
            "surface": {
                "label": "Surface"
            },
            "tourism": {
                "label": "Type"
            },
            "wikipedia": {
                "label": "Wikipedia"
            },
            "water": {
                "label": "Type"
            },
            "waterway": {
                "label": "Type"
            },
            "wetland": {
                "label": "Type"
            },
            "wood": {
                "label": "Type"
            }
        }
    }
};
