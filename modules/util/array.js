
// Returns true if a and b have the same elements at the same indices.
export function utilArrayIdentical(a, b) {
    // an array is always identical to itself
    if (a === b) return true;

    var i = a.length;
    if (i !== b.length) return false;
    while (i--) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

// http://2ality.com/2015/01/es6-set-operations.html

// Difference (a \ b): create a set that contains those elements of set a that are not in set b.
// This operation is also sometimes called minus (-).
// var a = [1,2,3];
// var b = [4,3,2];
// utilArrayDifference(a, b)
//   [1]
// utilArrayDifference(b, a)
//   [4]
export function utilArrayDifference(a, b) {
    var other = new Set(b);
    return Array.from(new Set(a))
        .filter(function(v) { return !other.has(v); });
}

// Intersection (a ∩ b): create a set that contains those elements of set a that are also in set b.
// var a = [1,2,3];
// var b = [4,3,2];
// utilArrayIntersection(a, b)
//   [2,3]
export function utilArrayIntersection(a, b) {
    var other = new Set(b);
    return Array.from(new Set(a))
        .filter(function(v) { return other.has(v); });
}

// Union (a ∪ b): create a set that contains the elements of both set a and set b.
// var a = [1,2,3];
// var b = [4,3,2];
// utilArrayUnion(a, b)
//   [1,2,3,4]
export function utilArrayUnion(a, b) {
    var result = new Set(a);
    b.forEach(function(v) { result.add(v); });
    return Array.from(result);
}

// Returns an Array with all the duplicates removed
// var a = [1,1,2,3,3];
// utilArrayUniq(a)
//   [1,2,3]
export function utilArrayUniq(a) {
    return Array.from(new Set(a));
}


// Splits array into chunks of given chunk size
// var a = [1,2,3,4,5,6,7];
// utilArrayChunk(a, 3);
//   [[1,2,3],[4,5,6],[7]];
export function utilArrayChunk(a, chunkSize) {
    if (!chunkSize || chunkSize < 0) return [a.slice()];

    var result = new Array(Math.ceil(a.length / chunkSize));
    return Array.from(result, function(item, i) {
        return a.slice(i * chunkSize, i * chunkSize + chunkSize);
    });
}


// Flattens two level array into a single level
// var a = [[1,2,3],[4,5,6],[7]];
// utilArrayFlatten(a);
//   [1,2,3,4,5,6,7];
export function utilArrayFlatten(a) {
    return a.reduce(function(acc, val) {
        return acc.concat(val);
    }, []);
}


// Groups the items of the Array according to the given key
// `key` can be passed as a property or as a key function
//
// var pets = [
//     { type: 'Dog', name: 'Spot' },
//     { type: 'Cat', name: 'Tiger' },
//     { type: 'Dog', name: 'Rover' },
//     { type: 'Cat', name: 'Leo' }
// ];
//
// utilArrayGroupBy(pets, 'type')
//   {
//     'Dog': [{type: 'Dog', name: 'Spot'}, {type: 'Dog', name: 'Rover'}],
//     'Cat': [{type: 'Cat', name: 'Tiger'}, {type: 'Cat', name: 'Leo'}]
//   }
//
// utilArrayGroupBy(pets, function(item) { return item.name.length; })
//   {
//     3: [{type: 'Cat', name: 'Leo'}],
//     4: [{type: 'Dog', name: 'Spot'}],
//     5: [{type: 'Cat', name: 'Tiger'}, {type: 'Dog', name: 'Rover'}]
//   }
export function utilArrayGroupBy(a, key) {
    return a.reduce(function(acc, item) {
        var group = (typeof key === 'function') ? key(item) : item[key];
        (acc[group] = acc[group] || []).push(item);
        return acc;
    }, {});
}


// Returns an Array with all the duplicates removed
// where uniqueness determined by the given key
// `key` can be passed as a property or as a key function
//
// var pets = [
//     { type: 'Dog', name: 'Spot' },
//     { type: 'Cat', name: 'Tiger' },
//     { type: 'Dog', name: 'Rover' },
//     { type: 'Cat', name: 'Leo' }
// ];
//
// utilArrayUniqBy(pets, 'type')
//   [
//     { type: 'Dog', name: 'Spot' },
//     { type: 'Cat', name: 'Tiger' }
//   ]
//
// utilArrayUniqBy(pets, function(item) { return item.name.length; })
//   [
//     { type: 'Dog', name: 'Spot' },
//     { type: 'Cat', name: 'Tiger' },
//     { type: 'Cat', name: 'Leo' }
//   }
export function utilArrayUniqBy(a, key) {
    var seen = new Set();
    return a.reduce(function(acc, item) {
        var val = (typeof key === 'function') ? key(item) : item[key];
        if (val && !seen.has(val)) {
            seen.add(val);
            acc.push(item);
        }
        return acc;
    }, []);
}
