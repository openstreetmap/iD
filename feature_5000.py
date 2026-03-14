from typing import List, Tuple, Optional

class TurnRestrictionSplitter:
    def __init__(self, ways: List[dict], intersections: List[dict]):
        self.ways = ways
        self.intersections = intersections

    def find_intersection_ways(self, intersection_id: str) -> List[dict]:
        return [way for way in self.ways if intersection_id in way['nodes']]

    def split_ways_at_intersection(self, intersection_id: str) -> List[Tuple[dict, dict]]:
        intersection_ways = self.find_intersection_ways(intersection_id)
        split_ways = []
        for way in intersection_ways:
            nodes = way['nodes']
            for i in range(len(nodes) - 1):
                if nodes[i] == intersection_id:
                    split_point = i
                    before_intersection = {'nodes': nodes[:split_point], 'tags': way['tags'].copy()}
                    after_intersection = {'nodes': nodes[split_point:], 'tags': way['tags'].copy()}
                    split_ways.append((before_intersection, after_intersection))
        return split_ways

    def apply_split(self, split_ways: List[Tuple[dict, dict]]) -> List[dict]:
        new_ways = self.ways.copy()
        for before, after in split_ways:
            new_ways.append(before)
            new_ways.remove(before)
            if after:
                new_ways.append(after)
        return new_ways

# Test cases
def test_split_at_intersection():
    ways = [
        {'id': '1', 'nodes': ['1', '2', '3'], 'tags': {'highway': 'primary'}},
        {'id': '2', 'nodes': ['2', '3', '4'], 'tags': {'highway': 'primary'}},
        {'id': '3', 'nodes': ['3', '4', '5'], 'tags': {'highway': 'primary'}}
    ]
    intersections = [{'id': '2'}]
    splitter = TurnRestrictionSplitter(ways, intersections)
    split_ways = splitter.split_ways_at_intersection('2')
    assert len(split_ways) == 2
    assert split_ways[0][0]['nodes'] == ['1', '2']
    assert split_ways[0][1]['nodes'] == ['2', '3']
    assert split_ways[1][0]['nodes'] == ['3', '4']
    assert split_ways[1][1]['nodes'] == ['4', '5']

    # Test with no intersection
    split_ways = splitter.split_ways_at_intersection('6')
    assert len(split_ways) == 0

    print("All tests passed.")

test_split_at_intersection()