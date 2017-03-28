export function pointBox(loc, context) {
    var rect = context.surfaceRect();
    var point = context.curtainProjection(loc);
    return {
        left: point[0] + rect.left - 40,
        top: point[1] + rect.top - 60,
        width: 80,
        height: 90
    };
}


export function pad(locOrBox, padding, context) {
    var box;
    if (locOrBox instanceof Array) {
        var rect = context.surfaceRect();
        var point = context.curtainProjection(locOrBox);
        box = {
            left: point[0] + rect.left,
            top: point[1] + rect.top
        };
    } else {
        box = locOrBox;
    }

    return {
        left: box.left - padding,
        top: box.top - padding,
        width: (box.width || 0) + 2 * padding,
        height: (box.width || 0) + 2 * padding
    };
}


export function icon(name, svgklass) {
    return '<svg class="icon ' + (svgklass || '') + '">' +
         '<use xlink:href="' + name + '"></use></svg>';
}


export var localNames = {
    n2140018997: 'city_hall',
    n367813436: 'fire_department',
    w203988286: 'memory_isle_park',
    w203972937: 'riverwalk_trail',
    w203972938: 'riverwalk_trail',
    w203972940: 'riverwalk_trail',
    w41785752: 'w_michigan_ave',
    w134150789: 'w_michigan_ave',
    w134150795: 'w_michigan_ave',
    w134150800: 'w_michigan_ave',
    w134150811: 'w_michigan_ave',
    w134150802: 'e_michigan_ave',
    w134150836: 'e_michigan_ave',
    w41074896: 'e_michigan_ave',
    w17965834: 'spring_st',
    w203986457: 'scidmore_park',
    w203049587: 'petting_zoo',
    w17967397: 'n_andrews_st',
    w17967315: 's_andrews_st',
    w17967326: 'n_constantine_st',
    w17966400: 's_constantine_st',
    w170848823: 'rocky_river',
    w170848824: 'rocky_river',
    w170848331: 'rocky_river',
    w17967752: 'railroad_dr',
    w17965998: 'conrail_rr',
    w134150845: 'conrail_rr',
    w170989131: 'st_joseph_river',
    w143497377: 'n_main_st',
    w134150801: 's_main_st',
    w134150830: 's_main_st',
    w17966462: 's_main_st',
    w17967734: 'water_st',
    w17964996: 'foster_st',
    w170848330: 'portage_river',
    w17965351: 'flower_st',
    w17965502: 'elm_st',
    w17965402: 'walnut_st',
    w17964793: 'morris_ave',
    w17967444: 'east_st',
    w17966984: 'portage_ave'
};

