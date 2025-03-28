export const tagOperations = {
    sum: ['step_count', 'parking:left:capacity', 'parking:right:capacity', 'capacity', 'population'],
    avg: ['maxspeed', 'width', 'height', 'minspeed'],
    max: ['maxheight', 'maxweight', 'max_age'],
    min: ['min_age', 'min_height', 'min_level']
};
export const allTagOperations = Object.values(tagOperations).flat();