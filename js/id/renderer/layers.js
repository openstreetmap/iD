iD.layers = iD.data.imagery.map(iD.BackgroundSource.template);

iD.layers.push((function() {
    function custom() {
        var template = window.prompt('Enter a tile template. Valid tokens are {z}, {x}, {y} for Z/X/Y scheme and {u} for quadtile scheme.');
        if (!template) return null;
        if (template.match(/google/g)) return null;
        return iD.BackgroundSource.template({
            template: template,
            name: 'Custom (customized)'
        });
    }
    custom.data = { name: 'Custom' };
    return custom;
})());
