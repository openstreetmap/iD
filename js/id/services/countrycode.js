iD.countryCode  = function(context) {
    var countryCode = {};

    if (!iD.countryCode.grid) {
        // Initialise with tiles path
        iD.countryCode.grid = codegrid.CodeGrid (context.assetPath()+'tiles/', iD.data.worldGrid);
    }

    countryCode.search = function(location, callback) {
        iD.countryCode.grid.getCode (location[1], location[0], callback); 
        return;
    };

    return countryCode;
};
