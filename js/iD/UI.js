iD.UI = {};

iD.UI.bind = function() {
    this.buttons = {
        place: d3.select('button#place'),
        area: d3.select('button#area'),
        road: d3.select('button#road')
    };

    this.undoText = d3.select('button#undo small');
};

iD.UI.update = function() {
};
