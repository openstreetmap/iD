import { t } from '../util/locale';


export function rendererTaskingManager(data) {
    var source = Object.assign({}, data);   // shallow copy

    var name = source.name;
    var description = source.description;
    var template = source.template;

    source.tileSize = data.tileSize || 256;
    source.zoomExtent = data.zoomExtent || [0, 22];
    source.overzoom = data.overzoom !== false;


    source.name = function() {
        var id_safe = source.id.replace(/\./g, '<TX_DOT>');
        return t('manager.' + id_safe + '.name', { default: name });
    };


    source.description = function() {
        var id_safe = source.id.replace(/\./g, '<TX_DOT>');
        return t('manager.' + id_safe + '.description', { default: description });
    };

    source.template = function(_) {
        if (!arguments.length) return template;
        if (source.id === 'custom') template = _;
        return source;
    };

    return source;
}


rendererTaskingManager.None = function() {
    var source = rendererTaskingManager({ id: 'none', template: '' });


    source.name = function() {
        return t('tasking.managers.none.name');
    };


    return source;
};


rendererTaskingManager.Custom = function(template) {
    var source = rendererTaskingManager({ id: 'custom', template: template });


    source.name = function() {
        return t('tasking.managers.custom.name');
    };


    return source;
};
