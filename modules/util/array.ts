// Returns true if a and b have the same elements at the same indices.
export function utilArrayIdentical<T>(a: T[], b: T[]): boolean {
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
export function utilArrayDifference<T>(a: Iterable<T>, b: Iterable<T>): T[] {
    const other = new Set(b);
    return Array.from(new Set(a))
        .filter(v => !other.has(v));
}

// Intersection (a ∩ b): create a set that contains those elements of set a that are also in set b.
// var a = [1,2,3];
// var b = [4,3,2];
// utilArrayIntersection(a, b)
//   [2,3]
export function utilArrayIntersection<T>(a: Iterable<T>, b: Iterable<T>): T[] {
    const other = new Set(b);
    return Array.from(new Set(a))
        .filter(v => other.has(v));
}

// Union (a ∪ b): create a set that contains the elements of both set a and set b.
// var a = [1,2,3];
// var b = [4,3,2];
// utilArrayUnion(a, b)
//   [1,2,3,4]
export function utilArrayUnion<T>(a: Iterable<T>, b: T[]): T[] {
    const result = new Set(a);
    b.forEach(v => result.add(v));
    return Array.from(result);
}

// Returns an Array with all the duplicates removed
// var a = [1,1,2,3,3];
// utilArrayUniq(a)
//   [1,2,3]
export function utilArrayUniq<T>(a: Iterable<T>): T[] {
    return Array.from(new Set(a));
}


// Splits array into chunks of given chunk size
// var a = [1,2,3,4,5,6,7];
// utilArrayChunk(a, 3);
//   [[1,2,3],[4,5,6],[7]];
export function utilArrayChunk<T>(a: T[], chunkSize?: number): T[][] {
    if (!chunkSize || chunkSize < 0) return [a.slice()];

    var result = new Array(Math.ceil(a.length / chunkSize));
    return Array.from(result, (item, i) =>
        a.slice(i * chunkSize, i * chunkSize + chunkSize));
}


// Flattens two level array into a single level
// var a = [[1,2,3],[4,5,6],[7]];
// utilArrayFlatten(a);
//   [1,2,3,4,5,6,7];
export function utilArrayFlatten<T>(a: T[][]): T[] {
    return a.reduce((acc, val) => acc.concat(val), []);
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
export function utilArrayGroupBy<T>(a: T[], key: keyof T): Record<string, T[]>;
export function utilArrayGroupBy<T, K extends string | number | symbol>(a: T[], key: (item: T) => K): Record<K, T[]>;
export function utilArrayGroupBy<T, K extends string | number | symbol>(a: T[], key: keyof T | ((item: T) => K)): Record<K, T[]> {
    return a.reduce<Record<K, T[]>>((acc, item) => {
        const group: K = (typeof key === 'function') ? key(item) : <K>item[key];
        (acc[group] = acc[group] || []).push(item);
        return acc;
    }, <Record<K, T[]>>{});
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
export function utilArrayUniqBy<T>(a: T[], key: keyof T): T[];
export function utilArrayUniqBy<T, K>(a: T[], key: (item: T) => K): T[];
export function utilArrayUniqBy<T, K>(a: T[], key: keyof T | ((item: T) => K)): T[] {
    var seen: Set<K> = new Set();
    return a.reduce<T[]>((acc, item) => {
        const val: K = (typeof key === 'function') ? key(item) : <K>item[key];
        if (val && !seen.has(val)) {
            seen.add(val);
            acc.push(item);
        }
        return acc;
    }, []);
}
