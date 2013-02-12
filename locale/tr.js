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
            key: "⌫",
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
                area: "Bir alan taşındı."
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

    validations: {
        untagged_point: "Herhangi bir çizgi ya da alana bağlantısı olmayan ve etiketlenmemiş bir nokta.",
        untagged_line: "Etiketlenmemiş çizgi",
        untagged_area: "Etiketlenmemiş alan",
        tag_suggests_area: "{tag} etiketi buranın alan olmasını tavsiye ediyor ama alan değil.",
        deprecated_tags: "Kullanımdan kaldırılmış etiket : {tags}"
    },

    save: "Kaydet",
    unsaved_changes: "Kaydedilmemiş değişiklikleriniz var",
    save_help: "Diğer kullanıcıların yaptığınız değişiklikleri görmesi için OpenStreetMap'e kaydediniz",
    no_changes: "Kaydedecek hiçbir değişikliğiniz yok",
    save_error: "Kaydederken bir hata oluştu",
    uploading_changes: "Değişiklikleriniz OpenStreetMap'e gönderiliyor.",
    just_edited: "Şu an OpenStreetMap'de bir değişiklik yaptınız!",
    okay: "Tamam",

    "zoom-in": "Yaklaş",
    "zoom-out": "Uzaklaş",

    nothing_to_undo: "Geri alınacak birşey yok.",
    nothing_to_redo: "Tekrar yapılacak birşey yok.",

    browser_notice: "Bu editör sadece Firefox, Chrome, Safari, Opera ile Internet Explorer 9 ve üstü tarayıcılarda çalışmaktadır. Lütfen tarayınıcı güncelleyin ya da Potlatch 2'yi kullanarak haritada güncelleme yapınız.",

    inspector: {
        no_documentation_combination:  "Bu etiket kombinasyonu için dökümantasyon bulunmamaktadır.",
        no_documentation_key: "Bu anahtar için dökümantasyon bulunmamaktadır.",
        new_tag: "Yeni Etiket"
    },

    view_on_osm: "OSM üstünde Gör",

    zoom_in_edit: "Güncelleme yapmak için haritada yakınlaşmalısınız",

    edit_tags: "Etiketleri güncelle",

    geocoder: {
        title: "Bir Yer Bul",
        placeholder: "bir yer bul",
        no_results: "'{name}' ismindeki yer bulunamadı"
    },

    description: "Açıklama",

    logout: "Çıkış",

    report_a_bug: "Hata rapor et",

    layerswitcher: {
        title: "Arkaplan",
        description: "Arkaplan Ayarları",
        percent_brightness: "{opacity}% parlaklık",
        fix_misalignment: "Yanlış hizalamayı düzelt",
        reset: "Sıfırla"
    },

    contributors: {
        list: "{users} tarafından yapılan katkılar görünmektedir",
        truncated_list: "{users} ve diğer {count} tarafından yapılan katkılar görünmektedir"
    },

    source_switch: {
        live: "canlı",
        dev: "geliştirme"
    }
};
