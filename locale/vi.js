locale.vi = {
    modes: {
        add_area: {
            title: "Vùng",
            description: "Thêm công viên, tòa nhà, hồ nước, hoặc vùng khác vào bản đồ.",
            tail: "Nhấn vào bản đồ để bắt đầu vẽ vùng."
        },
        add_line: {
            title: "Đường",
            description: "Thêm con đường, lối đi bộ, dòng nước, hoặc đường kẻ khác vào bản đồ.",
            tail: "Nhấn vào bản đồ để bắt đầu vẽ đường kẻ."
        },
        add_point: {
            title: "Điểm",
            description: "Thêm nhà hàng, đài kỷ niệm, hòm thư, hoặc địa điểm khác.",
            tail: "Nhấn vào bản đồ để thêm địa điểm."
        },
        browse: {
            title: "Duyệt",
            description: "Di chuyển và thu phóng bản đồ."
        },
        draw_area: {
            tail: "Nhấn để thêm nốt vào vùng. Nhấn nốt đầu tiên để hoàn thành vùng."
        },
        draw_line: {
            tail: "Nhấn để thêm nốt vào đường kẻ. Nhấn vào đường khác để nối đường lại. Nhấn đúp để hoàn thành đường."
        }
    },

    operations: {
        add: {
            annotation: {
                point: "Thêm địa điểm.",
                vertex: "Thêm nốt vào lối."
            }
        },
        start: {
            annotation: {
                line: "Bắt đầu vẽ đường kẻ.",
                area: "Bắt đầu vẽ vùng."
            }
        },
        'continue': {
            annotation: {
                line: "Vẽ tiếp đường kẻ.",
                area: "Vẽ tiếp vùng."
            }
        },
        cancel_draw: {
            annotation: "Hủy vẽ đối tượng."
        },
        change_tags: {
            annotation: "Thay đổi thẻ."
        },
        circularize: {
            title: "Làm Tròn",
            description: "Làm tròn một đối tượng.",
            key: "O",
            annotation: {
                line: "Làm tròn một đường kẻ.",
                area: "Làm tròn một vùng."
            }
        },
        orthogonalize: {
            title: "Làm Vuông góc",
            description: "Làm vuông góc một đối tượng.",
            key: "Q",
            annotation: {
                line: "Làm vuông góc một đường kẻ.",
                area: "Làm vuông góc một vùng."
            }
        },
        'delete': {
            title: "Xóa",
            description: "Xóa đối tượng này khỏi bản đồ.",
            key: "⌫",
            annotation: {
                point: "Xóa địa điểm.",
                vertex: "Xóa nốt khỏi lối.",
                line: "Xóa đường kẻ.",
                area: "Xóa vùng.",
                relation: "Xóa quan hệ.",
                multiple: "Xóa {n} đối tượng."
            }
        },
        connect: {
            annotation: {
                point: "Nối liền lối với địa điểm.",
                vertex: "Nối liền đường kẻ với đường khác.",
                line: "Nối liền lối với đường kẻ.",
                area: "Nối liền đường kẻ với vùng."
            }
        },
        disconnect: {
            title: "Tháo gỡ",
            description: "Gỡ các lối này khỏi nhau.",
            key: "G",
            annotation: "Tháo gỡ lối."
        },
        merge: {
            title: "Hợp nhất",
            description: "Hợp nhất các đường kẻ này.",
            key: "H",
            annotation: "Hợp nhất {n} đường kẻ."
        },
        move: {
            title: "Di chuyển",
            description: "Di chuyển đối tượng này sang chỗ khác.",
            key: "D",
            annotation: {
                point: "Di chuyển địa điểm.",
                vertex: "Di chuyển nốt trong lối.",
                line: "Di chuyển đường kẻ.",
                area: "Di chuyển vùng."
            }
        },
        reverse: {
            title: "Đảo nguợc",
            description: "Làm cho đường kẻ này hướng về phía ngược.",
            key: "V",
            annotation: "Đảo nguợc đường kẻ."
        },
        split: {
            title: "Chia cắt",
            description: "Cắt đôi lối này tại nốt được chọn.",
            key: "X",
            annotation: "Cắt đôi một lối."
        }
    },

    nothing_to_undo: "Không có gì để hoàn tác.",
    nothing_to_redo: "Không có gì để làm lại.",

    just_edited: "Bạn vừa sửa đổi OpenStreetMap!",
    browser_notice: "Chường trình vẽ bản đồ này chạy tốt trong Firefox, Chrome, Safari, Opera, và Internet Explorer 9 trở lên. Xin vui lòng nâng cấp trình duyệt của bạn hoặc sửa đổi bản đồ trong Potlatch 2.",
    view_on_osm: "Xem tại OSM",
    zoom_in_edit: "phóng to để sửa đổi bản đồ",
    logout: "đăng xuất",
    report_a_bug: "báo cáo lỗi",

    commit: {
        title: "Lưu các Thay đổi",
        description_placeholder: "Tóm lược các đóng góp của bạn",
        upload_explanation: "Các thay đổi bạn thực hiện duới tên {user} sẽ xuất hiện trên tất cả các bản đồ sử dụng dữ liệu OpenStreetMap.",
        save: "Lưu",
        cancel: "Hủy bỏ",
        warnings: "Cảnh báo",
        modified: "Đã Thay đổi",
        deleted: "Đã Xóa",
        created: "Đã Tạo"
    },

    contributors: {
        list: "Đang xem các đóng góp của {users}",
        truncated_list: "Đang xem các đóng góp của {users} và {count} nguời khác"
    },

    geocoder: {
        title: "Tìm kiếm Địa phương",
        placeholder: "tìm kiếm địa phương",
        no_results: "Không tìm thấy địa phương với tên “{name}”"
    },

    geolocate: {
        title: "Nhảy tới Vị trí của Tôi"
    },

    inspector: {
        no_documentation_combination: "Không có tài liệu về tổ hợp thẻ này",
        no_documentation_key: "Không có tài liệu về khóa này",
        new_tag: "Thẻ Mới",
        edit_tags: "Sửa đổi các thẻ",
        okay: "OK",
        view_on_osm: "Xem tại OSM"
    },

    layerswitcher: {
        title: "Hình nền",
        description: "Tùy chọn Hình nền",
        percent_brightness: "Sáng {opacity}%",
        fix_misalignment: "Chỉnh lại hình nền bị chệch",
        reset: "đặt lại"
    },

    restore: {
        description: "Bạn có thay đổi chưa lưu từ một phiên làm việc truớc đây. Bạn có muốn khôi phục các thay đổi này không?",
        restore: "Khôi phục",
        reset: "Đặt lại"
    },

    save: {
        title: "Lưu",
        help: "Lưu các thay đổi vào OpenStreetMap để cho mọi nguời xem",
        error: "Đã xuất hiện lỗi khi lưu",
        uploading: "Đang tải các thay đổi lên OpenStreetMap.",
        unsaved_changes: "Bạn có Thay đổi Chưa lưu"
    },

    splash: {
        welcome: "Chào mừng bạn đến với iD, chương trình sửa đổi OpenStreetMap",
        text: "Đây là phiên bản đang phát triển {version}. Xem thêm thông tin tại {website} và báo cáo lỗi tại {github}."
    },

    source_switch: {
        live: "thật",
        dev: "thử"
    },

    tag_reference: {
        description: "Miêu tả",
        on_wiki: "{tag} tại wiki.osm.org",
        used_with: "được sử dụng với {type}"
    },

    validations: {
        untagged_point: "Địa điểm không có thẻ mà không trực thuộc đường kẻ hoặc vùng",
        untagged_line: "Đường kẻ không có thẻ",
        untagged_area: "Vùng không có thẻ",
        tag_suggests_area: "Thẻ {tag} có lẽ dành cho vùng nhưng được gắn vào đường kẻ",
        deprecated_tags: "Thẻ bị phản đối: {tags}"
    },

    zoom: {
        in: "Phóng to",
        out: "Thu nhỏ"
    }
};
