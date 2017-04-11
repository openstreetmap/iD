export function freezeMap(mapObj) {
  if (mapObj instanceof Map) {
    mapObj.set = function(key) {
      throw new Error('Can\'t add property ' + key + ', map is not extensible');
    };

    mapObj.delete = function(key) {
      throw new Error('Can\'t delete property ' + key + ', map is frozen');
    };

    mapObj.clear = function() {
      throw new Error('Can\'t clear map, map is frozen');
    };
  }

  Object.freeze(mapObj);
}

export function getKeys(mapObj) {
     if (mapObj instanceof Map) {
         var keys = [];
         mapObj.forEach(function (v, k) {
             keys.push(k);
         });
         return keys;
     }
     console.error('not map');
     return Object.keys(mapObj);
}