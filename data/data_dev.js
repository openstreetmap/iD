iD.data = {
    load: function(path, callback) {
        if (!callback) {
            callback = path;
            path = '';
        }
        iD.util.asyncMap([
            path + 'data/deprecated.json',
            path + 'data/discarded.json',
            path + 'data/imagery.json',
            path + 'data/wikipedia.json',
            path + 'data/keys.json',
            path + 'data/presets/presets.json',
            path + 'data/presets/defaults.json',
            path + 'data/presets/categories.json',
            path + 'data/presets/fields.json',
            path + 'data/imperial.json',
            path + 'data/maki-sprite.json',
            path + 'dist/locales/en.json'
            ], d3.json, function (err, data) {

            iD.data = {
                deprecated: data[0],
                discarded: data[1],
                imagery: data[2],
                wikipedia: data[3],
                keys: data[4],
                presets: {
                    presets: data[5],
                    defaults: data[6],
                    categories: data[7],
                    fields: data[8]
                },
                imperial: data[9],
                maki: data[10],
                en: data[11]
            };

            callback();
        });
    }
};
