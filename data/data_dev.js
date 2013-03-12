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
            path + 'data/keys.json',
            path + 'data/presets/presets.json',
            path + 'data/presets/defaults.json',
            path + 'data/presets/categories.json',
            path + 'data/presets/forms.json'], d3.json, function (err, data) {

            iD.data = {
                deprecated: data[0],
                discarded: data[1],
                imagery: data[2],
                keys: data[3],
                presets: {
                    presets: data[4],
                    defaults: data[5],
                    categories: data[6],
                    forms: data[7]
                }
            };

            callback();
        });
    }
};
