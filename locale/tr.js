locale.tr = {
    modes: {
        add_area: {
            title: "Alan",
            description: "Park, bina, göl ve benzeri alanları haritaya ekle.",
            tail: "Park, göl ya da bina gibi alanları çizmek için haritaya tıklayın."
        },
        add_line: {
            title: "Çizgi",
            description: "Yollar, sokaklar, patikalar ya da kanallar çizgi ile çizilebilir.",
            tail: "Yol, patika yada rota çizmek için haritaya tıklayın."
        },
        add_point: {
            title: "Nokta",
            description: "Restoranlar, anıtlar ya da posta kutuları nokta ile gösterilebilir.",
            tail: "Nokta eklemek için haritaya tıklayın."
        },
        browse: {
            title: "Dolaş",
            description: "Harita üzerinde dolan ve yaklaş."
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
            title: "Daireleştir",
            description: "Yuvarlak hale getir",
            key: "O",
            annotation: {
                line: "Çizgiyi daireleştirin.",
                area: "Alanı daireleştirin."
            }
        },
        orthogonalize: {
            title: "Doğrultmak",
            description: "Köşeleri doğrultun.",
            key: "Q",
            annotation: {
                line: "Çizginin köşeleri doğrultuldu.",
                area: "Alanın köşeleri doğrultuldu."
            }
        },
        'delete': {
            title: "Sil",
            description: "Haritan bunu sil.",
            annotation: {
                point: "Bir nokta silindi.",
                vertex: "Yoldan bir nod silindi.",
                line: "Bir çizgi silindi.",
                area: "Bir alan silindi.",
                relation: "Bir ilişki silindi.",
                multiple: "{n} adet obje silindi."
            }
        },
        connect: {
            annotation: {
                point: "Taraf bir noktaya bağlandı.",
                vertex: "Bir taraf diğerine bağlandı.",
                line: "Taraf bir çizgiye bağlandı.",
                area: "Taraf bir alana bağlandı."
            }
        },
        disconnect: {
            title: "Birbirinden Ayır",
            description: "Her iki tarafı da ayır.",
            key: "D",
            annotation: "Taraflar birbirinden ayrıldı."
        },
        merge: {
            title: "Birleştir",
            description: "Bu çizgileri birleştir.",
            key: "C",
            annotation: "{n} adet çizgi birleştirildi."
        },
        move: {
            title: "Taşı",
            description: "Bunu farklı bir konuma taşı.",
            key: "M",
            annotation: {
                point: "Bir nokta taşındı.",
                vertex: "Yoldan bir nokta taşındı.",
                line: "Bir çizgi taşındı.",
                area: "Bir alan taşındı.",
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
            title: "Ters çevir",
            description: "Bu çizgiyi ters yönde çevir.",
            key: "V",
            annotation: "Çizgi ters çevrildi."
        },
        split: {
            title: "Ayır",
            description: "Bu yolu bu noktadan ikiye ayır.",
            key: "X",
            annotation: "Yolu ayır."
        }
    },

    nothing_to_undo: "Geri alınacak birşey yok.",
    nothing_to_redo: "Tekrar yapılacak birşey yok.",

    just_edited: "Şu an OpenStreetMap'de bir değişiklik yaptınız!",
    browser_notice: "Bu editör sadece Firefox, Chrome, Safari, Opera ile Internet Explorer 9 ve üstü tarayıcılarda çalışmaktadır. Lütfen tarayınıcı güncelleyin ya da Potlatch 2'yi kullanarak haritada güncelleme yapınız.",
    view_on_osm: "OSM üstünde Gör",
    zoom_in_edit: "Güncelleme yapmak için haritada yakınlaşmalısınız",
    logout: "Çıkış",
    report_a_bug: "Hata rapor et",

    commit: {
        title: "Değişiklikleri kaydet",
        description_placeholder: "Katkı sağlayanlar hakkında kısa açıklama",
        upload_explanation: "{user} kullanıcısı olarak yaptığınız değişiklikler tüm OpenStreetMap kullanan haritalarda görünür olacaktır.",
        save: "Kaydet",
        cancel: "İptal",
        warnings: "Uyarılar",
        modified: "Değiştirildi",
        deleted: "Silindi",
        created: "Oluşturuldu"
    },

    contributors: {
        list: "{users} tarafından yapılan katkılar görünmektedir",
        truncated_list: "{users} ve diğer {count} tarafından yapılan katkılar görünmektedir"
    },

    geocoder: {
        title: "Bir Yer Bul",
        placeholder: "bir yer bul",
        no_results: "'{name}' ismindeki yer bulunamadı"
    },

    geolocate: {
        title: "Konumumu göster"
    },

    inspector: {
        no_documentation_combination:  "Bu etiket kombinasyonu için dökümantasyon bulunmamaktadır.",
        no_documentation_key: "Bu anahtar için dökümantasyon bulunmamaktadır.",
        new_tag: "Yeni Etiket",
        edit_tags: "Etiketleri güncelle",
        okay: "Tamam",
        view_on_osm: "View on OSM",
        name: "Name",
        editing: "Editing {type}",
        additional: "Additional tags",
        choose: "What are you adding?",
        results: "{n} results for {search}"
    },

    background: {
        title: "Arkaplan",
        description: "Arkaplan Ayarları",
        percent_brightness: "{opacity}% parlaklık",
        fix_misalignment: "Yanlış hizalamayı düzelt",
        reset: "Sıfırla"
    },

    restore: {
        description: "Daha önceki oturumunuzdan kaydedilmemiş değişiklikler var. Bu değişiklikleri geri getirmek ister misiniz?",
        restore: "Geri Getir",
        reset: "Sıfırla"
    },

    save: {
        title: "Kaydet",
        help: "Diğer kullanıcıların yaptığınız değişiklikleri görmesi için OpenStreetMap'e kaydediniz.",
        error: "Kaydederken bir hata oluştu",
        uploading: "Değişiklikleriniz OpenStreetMap'e gönderiliyor.",
        unsaved_changes: "Kaydedilmemiş değişiklikleriniz var"
    },

    splash: {
        welcome: "OpenStreetMap Editörü iD'ye hoşgeldiniz",
        text: "Bu {version} versiyonu geliştirme versiyonudur. Daha fazla bilgi için {website} sitesine bakabilirsiniz ve hataları {github} sitesine raporlayabilirsiniz."
    },

    source_switch: {
        live: "canlı",
        dev: "geliştirme"
    },

    tag_reference: {
        description: "Açıklama",
        on_wiki: "wiki.osm.org sitesindeki {tag} ",
        used_with: "{type} ile birlikte"
    },

    validations: {
        untagged_point: "Herhangi bir çizgi ya da alana bağlantısı olmayan ve etiketlenmemiş bir nokta.",
        untagged_line: "Etiketlenmemiş çizgi",
        untagged_area: "Etiketlenmemiş alan",
        many_deletions: "You're deleting {n} objects. Are you sure you want to do this? This will delete them from the map that everyone else sees on openstreetmap.org.",
        tag_suggests_area: "{tag} etiketi buranın alan olmasını tavsiye ediyor ama alan değil.",
        deprecated_tags: "Kullanımdan kaldırılmış etiket : {tags}"
    },

    zoom: {
        'in': "Yaklaş",
        out: "Uzaklaş"
    }
};
