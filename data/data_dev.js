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
                presets: {
                    presets: data[4],
                    defaults: data[5],
                    categories: data[6],
                    fields: data[7]
                },
                imperial: data[8],
                maki: data[9],
                en: data[10]
            };

            callback();
        });
    }
};
