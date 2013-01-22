/******************************************************************************
	rtree.js - General-Purpose Non-Recursive Javascript R-Tree Library
	Version 0.6.2, December 5st 2009

@license Copyright (c) 2009 Jon-Carlos Rivera

  Permission is hereby granted, free of charge, to any person obtaining
  a copy of this software and associated documentation files (the
  "Software"), to deal in the Software without restriction, including
  without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so, subject to
  the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	Jon-Carlos Rivera - imbcmdth@hotmail.com
******************************************************************************/

/**
 * RTree - A simple r-tree structure for great results.
 * @constructor
 */
var RTree = function(width){
	// Variables to control tree-dimensions
	var _Min_Width = 3;  // Minimum width of any node before a merge
	var _Max_Width = 6;  // Maximum width of any node before a split
	if(!isNaN(width)){ _Min_Width = Math.floor(width/2.0); _Max_Width = width;}
	// Start with an empty root-tree
	var _T = {x:0, y:0, w:0, h:0, id:"root", nodes:[] };

	var isArray = function(o) {
		return Object.prototype.toString.call(o) === '[object Array]';
	};

	/**@function
	 * @description Function to generate unique strings for element IDs
	 * @param {String} n			The prefix to use for the IDs generated.
	 * @return {String}				A guarenteed unique ID.
	 */
    var _name_to_id = (function() {
        // hide our idCache inside this closure
        var idCache = {};

        // return the api: our function that returns a unique string with incrementing number appended to given idPrefix
        return function(idPrefix) {
            var idVal = 0;
            if(idPrefix in idCache) {
                idVal = idCache[idPrefix]++;
            } else {
                idCache[idPrefix] = 0;
            }
            return idPrefix + "_" + idVal;
        }
    })();

	// This is my special addition to the world of r-trees
	// every other (simple) method I found produced crap trees
	// this skews insertions to prefering squarer and emptier nodes
	RTree.Rectangle.squarified_ratio = function(l, w, fill) {
	  // Area of new enlarged rectangle
	  var lperi = (l + w) / 2.0; // Average size of a side of the new rectangle
	  var larea = l * w; // Area of new rectangle
	  // return the ratio of the perimeter to the area - the closer to 1 we are,
	  // the more "square" a rectangle is. conversly, when approaching zero the
	  // more elongated a rectangle is
	  var lgeo = larea / (lperi*lperi);
	  return(larea * fill / lgeo);
	};

	/**find the best specific node(s) for object to be deleted from
	 * [ leaf node parent ] = _remove_subtree(rectangle, object, root)
	 * @private
	 */
	var _remove_subtree = function(rect, obj, root) {
		var hit_stack = []; // Contains the elements that overlap
		var count_stack = []; // Contains the elements that overlap
		var ret_array = [];
		var current_depth = 1;

		if(!rect || !RTree.Rectangle.overlap_rectangle(rect, root))
		 return ret_array;

		var ret_obj = {x:rect.x, y:rect.y, w:rect.w, h:rect.h, target:obj};

		count_stack.push(root.nodes.length);
		hit_stack.push(root);

		do {
			var tree = hit_stack.pop();
			var i = count_stack.pop()-1;

		  if("target" in ret_obj) { // We are searching for a target
				while(i >= 0)	{
					var ltree = tree.nodes[i];
					if(RTree.Rectangle.overlap_rectangle(ret_obj, ltree)) {
						if( (ret_obj.target && "leaf" in ltree && ltree.leaf === ret_obj.target)
							||(!ret_obj.target && ("leaf" in ltree || RTree.Rectangle.contains_rectangle(ltree, ret_obj)))) { // A Match !!
				  		// Yup we found a match...
				  		// we can cancel search and start walking up the list
				  		if("nodes" in ltree) {// If we are deleting a node not a leaf...
				  			ret_array = _search_subtree(ltree, true, [], ltree);
				  			tree.nodes.splice(i, 1);
				  		} else {
								ret_array = tree.nodes.splice(i, 1);
							}
							// Resize MBR down...
							RTree.Rectangle.make_MBR(tree.nodes, tree);
							delete ret_obj.target;
							if(tree.nodes.length < _Min_Width) { // Underflow
								ret_obj.nodes = _search_subtree(tree, true, [], tree);
							}
							break;
			  		}/*	else if("load" in ltree) { // A load
				  	}*/	else if("nodes" in ltree) { // Not a Leaf
				  		current_depth += 1;
				  		count_stack.push(i);
				  		hit_stack.push(tree);
				  		tree = ltree;
				  		i = ltree.nodes.length;
				  	}
				  }
					i -= 1;
				}
			} else if("nodes" in ret_obj) { // We are unsplitting
				tree.nodes.splice(i+1, 1); // Remove unsplit node
				// ret_obj.nodes contains a list of elements removed from the tree so far
				if(tree.nodes.length > 0)
					RTree.Rectangle.make_MBR(tree.nodes, tree);
				for(var t = 0;t<ret_obj.nodes.length;t++)
					_insert_subtree(ret_obj.nodes[t], tree);
				ret_obj.nodes.length = 0;
				if(hit_stack.length == 0 && tree.nodes.length <= 1) { // Underflow..on root!
					ret_obj.nodes = _search_subtree(tree, true, ret_obj.nodes, tree);
					tree.nodes.length = 0;
					hit_stack.push(tree);
					count_stack.push(1);
				} else if(hit_stack.length > 0 && tree.nodes.length < _Min_Width) { // Underflow..AGAIN!
					ret_obj.nodes = _search_subtree(tree, true, ret_obj.nodes, tree);
					tree.nodes.length = 0;
				}else {
					delete ret_obj.nodes; // Just start resizing
				}
			} else { // we are just resizing
				RTree.Rectangle.make_MBR(tree.nodes, tree);
			}
			current_depth -= 1;
		}while(hit_stack.length > 0);

		return(ret_array);
	};

	/**choose the best damn node for rectangle to be inserted into
	 * [ leaf node parent ] = _choose_leaf_subtree(rectangle, root to start search at)
	 * @private
	 */
	var _choose_leaf_subtree = function(rect, root) {
		var best_choice_index = -1;
		var best_choice_stack = [];
		var best_choice_area;

		var load_callback = function(local_tree, local_node){
			return(function(data) {
				local_tree._attach_data(local_node, data);
			});
		};

		best_choice_stack.push(root);
		var nodes = root.nodes;

		do {
			if(best_choice_index != -1)	{
				best_choice_stack.push(nodes[best_choice_index]);
				nodes = nodes[best_choice_index].nodes;
				best_choice_index = -1;
			}

			for(var i = nodes.length-1; i >= 0; i--) {
				var ltree = nodes[i];
				if("leaf" in ltree) {
					// Bail out of everything and start inserting
					best_choice_index = -1;
					break;
			  } /*else if(ltree.load) {
  				throw( "Can't insert into partially loaded tree ... yet!");
  				//jQuery.getJSON(ltree.load, load_callback(this, ltree));
  				//delete ltree.load;
  			}*/
			  // Area of new enlarged rectangle
			  var old_lratio = RTree.Rectangle.squarified_ratio(ltree.w, ltree.h, ltree.nodes.length+1);

			  // Enlarge rectangle to fit new rectangle
			  var nw = Math.max(ltree.x+ltree.w, rect.x+rect.w) - Math.min(ltree.x, rect.x);
			  var nh = Math.max(ltree.y+ltree.h, rect.y+rect.h) - Math.min(ltree.y, rect.y);

			  // Area of new enlarged rectangle
			  var lratio = RTree.Rectangle.squarified_ratio(nw, nh, ltree.nodes.length+2);

			  if(best_choice_index < 0 || Math.abs(lratio - old_lratio) < best_choice_area) {
			  	best_choice_area = Math.abs(lratio - old_lratio); best_choice_index = i;
			  }
			}
		}while(best_choice_index != -1);

		return(best_choice_stack);
	};

	/**split a set of nodes into two roughly equally-filled nodes
	 * [ an array of two new arrays of nodes ] = linear_split(array of nodes)
	 * @private
	 */
	var _linear_split = function(nodes) {
		var n = _pick_linear(nodes);
		while(nodes.length > 0)	{
			_pick_next(nodes, n[0], n[1]);
		}
		return(n);
	};

	/**insert the best source rectangle into the best fitting parent node: a or b
	 * [] = pick_next(array of source nodes, target node array a, target node array b)
	 * @private
	 */
	var _pick_next = function(nodes, a, b) {
	  // Area of new enlarged rectangle
		var area_a = RTree.Rectangle.squarified_ratio(a.w, a.h, a.nodes.length+1);
		var area_b = RTree.Rectangle.squarified_ratio(b.w, b.h, b.nodes.length+1);
		var high_area_delta;
		var high_area_node;
		var lowest_growth_group;

		for(var i = nodes.length-1; i>=0;i--) {
			var l = nodes[i];
			var new_area_a = {};
			new_area_a.x = Math.min(a.x, l.x); new_area_a.y = Math.min(a.y, l.y);
			new_area_a.w = Math.max(a.x+a.w, l.x+l.w) - new_area_a.x;	new_area_a.h = Math.max(a.y+a.h, l.y+l.h) - new_area_a.y;
			var change_new_area_a = Math.abs(RTree.Rectangle.squarified_ratio(new_area_a.w, new_area_a.h, a.nodes.length+2) - area_a);

			var new_area_b = {};
			new_area_b.x = Math.min(b.x, l.x); new_area_b.y = Math.min(b.y, l.y);
			new_area_b.w = Math.max(b.x+b.w, l.x+l.w) - new_area_b.x;	new_area_b.h = Math.max(b.y+b.h, l.y+l.h) - new_area_b.y;
			var change_new_area_b = Math.abs(RTree.Rectangle.squarified_ratio(new_area_b.w, new_area_b.h, b.nodes.length+2) - area_b);

			if( !high_area_node || !high_area_delta || Math.abs( change_new_area_b - change_new_area_a ) < high_area_delta ) {
				high_area_node = i;
				high_area_delta = Math.abs(change_new_area_b-change_new_area_a);
				lowest_growth_group = change_new_area_b < change_new_area_a ? b : a;
			}
		}
		var temp_node = nodes.splice(high_area_node, 1)[0];
		if(a.nodes.length + nodes.length + 1 <= _Min_Width)	{
			a.nodes.push(temp_node);
			RTree.Rectangle.expand_rectangle(a, temp_node);
		}	else if(b.nodes.length + nodes.length + 1 <= _Min_Width) {
			b.nodes.push(temp_node);
			RTree.Rectangle.expand_rectangle(b, temp_node);
		}
		else {
			lowest_growth_group.nodes.push(temp_node);
			RTree.Rectangle.expand_rectangle(lowest_growth_group, temp_node);
		}
	};

	/**pick the "best" two starter nodes to use as seeds using the "linear" criteria
	 * [ an array of two new arrays of nodes ] = pick_linear(array of source nodes)
	 * @private
	 */
	var _pick_linear = function(nodes) {
		var lowest_high_x = nodes.length-1;
		var highest_low_x = 0;
		var lowest_high_y = nodes.length-1;
		var highest_low_y = 0;
        var t1, t2;

		for(var i = nodes.length-2; i>=0;i--)	{
			var l = nodes[i];
			if(l.x > nodes[highest_low_x].x ) highest_low_x = i;
			else if(l.x+l.w < nodes[lowest_high_x].x+nodes[lowest_high_x].w) lowest_high_x = i;
			if(l.y > nodes[highest_low_y].y ) highest_low_y = i;
			else if(l.y+l.h < nodes[lowest_high_y].y+nodes[lowest_high_y].h) lowest_high_y = i;
		}
		var dx = Math.abs((nodes[lowest_high_x].x+nodes[lowest_high_x].w) - nodes[highest_low_x].x);
		var dy = Math.abs((nodes[lowest_high_y].y+nodes[lowest_high_y].h) - nodes[highest_low_y].y);
		if( dx > dy )	{
			if(lowest_high_x > highest_low_x)	{
				t1 = nodes.splice(lowest_high_x, 1)[0];
				t2 = nodes.splice(highest_low_x, 1)[0];
			}	else {
				t2 = nodes.splice(highest_low_x, 1)[0];
				t1 = nodes.splice(lowest_high_x, 1)[0];
			}
		}	else {
			if(lowest_high_y > highest_low_y)	{
				t1 = nodes.splice(lowest_high_y, 1)[0];
				t2 = nodes.splice(highest_low_y, 1)[0];
			}	else {
				t2 = nodes.splice(highest_low_y, 1)[0];
				t1 = nodes.splice(lowest_high_y, 1)[0];
			}
		}
		return([{x:t1.x, y:t1.y, w:t1.w, h:t1.h, nodes:[t1]},
			      {x:t2.x, y:t2.y, w:t2.w, h:t2.h, nodes:[t2]} ]);
	};

	var _attach_data = function(node, more_tree){
		node.nodes = more_tree.nodes;
		node.x = more_tree.x; node.y = more_tree.y;
		node.w = more_tree.w; node.h = more_tree.h;
		return(node);
	};

	/**non-recursive internal search function
	 * [ nodes | objects ] = _search_subtree(rectangle, [return node data], [array to fill], root to begin search at)
	 * @private
	 */
	var _search_subtree = function(rect, return_node, return_array, root) {
		var hit_stack = []; // Contains the elements that overlap

		if(!RTree.Rectangle.overlap_rectangle(rect, root))
		 return(return_array);

		var load_callback = function(local_tree, local_node){
			return(function(data) {
				local_tree._attach_data(local_node, data);
			});
		};

		hit_stack.push(root.nodes);

		do {
			var nodes = hit_stack.pop();

			for(var i = nodes.length-1; i >= 0; i--) {
				var ltree = nodes[i];
			  if(RTree.Rectangle.overlap_rectangle(rect, ltree)) {
			  	if("nodes" in ltree) { // Not a Leaf
			  		hit_stack.push(ltree.nodes);
			  	} else if("leaf" in ltree) { // A Leaf !!
			  		if(!return_node)
		  				return_array.push(ltree.leaf);
		  			else
		  				return_array.push(ltree);
		  		}/*	else if("load" in ltree) { // We need to fetch a URL for some more tree data
	  				jQuery.getJSON(ltree.load, load_callback(this, ltree));
	  				delete ltree.load;
	  			//	i++; // Replay this entry
	  			}*/
				}
			}
		}while(hit_stack.length > 0);

		return(return_array);
	};

	/**non-recursive internal insert function
	 * [] = _insert_subtree(rectangle, object to insert, root to begin insertion at)
	 * @private
	 */
	var _insert_subtree = function(node, root) {
		var bc; // Best Current node
		// Initial insertion is special because we resize the Tree and we don't
		// care about any overflow (seriously, how can the first object overflow?)
		if(root.nodes.length == 0) {
			root.x = node.x; root.y = node.y;
			root.w = node.w; root.h = node.h;
			root.nodes.push(node);
			return;
		}

		// Find the best fitting leaf node
		// choose_leaf returns an array of all tree levels (including root)
		// that were traversed while trying to find the leaf
		var tree_stack = _choose_leaf_subtree(node, root);
		var ret_obj = node;//{x:rect.x,y:rect.y,w:rect.w,h:rect.h, leaf:obj};

		// Walk back up the tree resizing and inserting as needed
		do {
			//handle the case of an empty node (from a split)
			if(bc && "nodes" in bc && bc.nodes.length == 0) {
				var pbc = bc; // Past bc
				bc = tree_stack.pop();
				for(var t=0;t<bc.nodes.length;t++)
					if(bc.nodes[t] === pbc || bc.nodes[t].nodes.length == 0) {
						bc.nodes.splice(t, 1);
						break;
				}
			} else {
				bc = tree_stack.pop();
			}

			// If there is data attached to this ret_obj
			if("leaf" in ret_obj || "nodes" in ret_obj || isArray(ret_obj)) {
				// Do Insert
				if(isArray(ret_obj)) {
					for(var ai = 0; ai < ret_obj.length; ai++) {
						RTree.Rectangle.expand_rectangle(bc, ret_obj[ai]);
					}
					bc.nodes = bc.nodes.concat(ret_obj);
				} else {
					RTree.Rectangle.expand_rectangle(bc, ret_obj);
					bc.nodes.push(ret_obj); // Do Insert
				}

				if(bc.nodes.length <= _Max_Width)	{ // Start Resizeing Up the Tree
					ret_obj = {x:bc.x,y:bc.y,w:bc.w,h:bc.h};
				}	else { // Otherwise Split this Node
					// linear_split() returns an array containing two new nodes
					// formed from the split of the previous node's overflow
					var a = _linear_split(bc.nodes);
					ret_obj = a;//[1];

					if(tree_stack.length < 1)	{ // If are splitting the root..
						bc.nodes.push(a[0]);
						tree_stack.push(bc);     // Reconsider the root element
						ret_obj = a[1];
					} /*else {
						delete bc;
					}*/
				}
			}	else { // Otherwise Do Resize
				//Just keep applying the new bounding rectangle to the parents..
				RTree.Rectangle.expand_rectangle(bc, ret_obj);
				ret_obj = {x:bc.x,y:bc.y,w:bc.w,h:bc.h};
			}
		} while(tree_stack.length > 0);
	};

	/**quick 'n' dirty function for plugins or manually drawing the tree
	 * [ tree ] = RTree.get_tree(): returns the raw tree data. useful for adding
	 * @public
	 * !! DEPRECATED !!
	 */
	this.get_tree = function() {
		return _T;
	};

	/**quick 'n' dirty function for plugins or manually loading the tree
	 * [ tree ] = RTree.set_tree(sub-tree, where to attach): returns the raw tree data. useful for adding
	 * @public
	 * !! DEPRECATED !!
	 */
	this.set_tree = function(new_tree, where) {
		if(!where)
			where = _T;
		return(_attach_data(where, new_tree));
	};

	/**non-recursive search function
	 * [ nodes | objects ] = RTree.search(rectangle, [return node data], [array to fill])
	 * @public
	 */
	this.search = function(rect, return_node, return_array) {
		if(arguments.length < 1)
			throw "Wrong number of arguments. RT.Search requires at least a bounding rectangle."

		switch(arguments.length) {
			case 1:
				arguments[1] = false;// Add an "return node" flag - may be removed in future
			case 2:
				arguments[2] = []; // Add an empty array to contain results
			case 3:
				arguments[3] = _T; // Add root node to end of argument list
			default:
				arguments.length = 4;
		}
		return(_search_subtree.apply(this, arguments));
	};

	/**partially-recursive toJSON function
	 * [ string ] = RTree.toJSON([rectangle], [tree])
	 * @public
	 */
	this.toJSON = function(rect, tree) {
		var hit_stack = []; // Contains the elements that overlap
		var count_stack = []; // Contains the elements that overlap
		var return_stack = {}; // Contains the elements that overlap
		var max_depth = 3;  // This triggers recursion and tree-splitting
		var current_depth = 1;
		var return_string = "";

		if(rect && !RTree.Rectangle.overlap_rectangle(rect, _T))
		 return "";

		if(!tree)	{
			count_stack.push(_T.nodes.length);
			hit_stack.push(_T.nodes);
			return_string += "var main_tree = {x:"+_T.x.toFixed()+",y:"+_T.y.toFixed()+",w:"+_T.w.toFixed()+",h:"+_T.h.toFixed()+",nodes:[";
		}	else {
			max_depth += 4;
			count_stack.push(tree.nodes.length);
			hit_stack.push(tree.nodes);
			return_string += "var main_tree = {x:"+tree.x.toFixed()+",y:"+tree.y.toFixed()+",w:"+tree.w.toFixed()+",h:"+tree.h.toFixed()+",nodes:[";
		}

		do {
			var nodes = hit_stack.pop();
			var i = count_stack.pop()-1;

			if(i >= 0 && i < nodes.length-1)
				return_string += ",";

			while(i >= 0)	{
				var ltree = nodes[i];
			  if(!rect || RTree.Rectangle.overlap_rectangle(rect, ltree)) {
			  	if(ltree.nodes) { // Not a Leaf
			  		if(current_depth >= max_depth) {
			  			var len = return_stack.length;
			  			var nam = _name_to_id("saved_subtree");
			  			return_string += "{x:"+ltree.x.toFixed()+",y:"+ltree.y.toFixed()+",w:"+ltree.w.toFixed()+",h:"+ltree.h.toFixed()+",load:'"+nam+".js'}";
			  			return_stack[nam] = this.toJSON(rect, ltree);
							if(i > 0)
								return_string += ","
			  		}	else {
				  		return_string += "{x:"+ltree.x.toFixed()+",y:"+ltree.y.toFixed()+",w:"+ltree.w.toFixed()+",h:"+ltree.h.toFixed()+",nodes:[";
				  		current_depth += 1;
				  		count_stack.push(i);
				  		hit_stack.push(nodes);
				  		nodes = ltree.nodes;
				  		i = ltree.nodes.length;
				  	}
			  	}	else if(ltree.leaf) { // A Leaf !!
			  		var data = ltree.leaf.toJSON ? ltree.leaf.toJSON() : JSON.stringify(ltree.leaf);
		  			return_string += "{x:"+ltree.x.toFixed()+",y:"+ltree.y.toFixed()+",w:"+ltree.w.toFixed()+",h:"+ltree.h.toFixed()+",leaf:" + data + "}";
						if(i > 0)
							return_string += ","
		  		}	else if(ltree.load) { // A load
		  			return_string += "{x:"+ltree.x.toFixed()+",y:"+ltree.y.toFixed()+",w:"+ltree.w.toFixed()+",h:"+ltree.h.toFixed()+",load:'" + ltree.load + "'}";
						if(i > 0)
							return_string += ","
			  	}
				}
				i -= 1;
			}
			if(i < 0)	{
					return_string += "]}"; current_depth -= 1;
			}
		}while(hit_stack.length > 0);

		return_string+=";";

		for(var my_key in return_stack) {
			return_string += "\nvar " + my_key + " = function(){" + return_stack[my_key] + " return(main_tree);};";
		}
		return(return_string);
	};

	/**non-recursive function that deletes a specific
	 * [ number ] = RTree.remove(rectangle, obj)
	 */
	this.remove = function(rect, obj) {
		if(arguments.length < 1)
			throw "Wrong number of arguments. RT.remove requires at least a bounding rectangle."

		switch(arguments.length) {
			case 1:
				arguments[1] = false; // obj == false for conditionals
			case 2:
				arguments[2] = _T; // Add root node to end of argument list
			default:
				arguments.length = 3;
		}
		if(arguments[1] === false) { // Do area-wide delete
			var numberdeleted = 0;
			var ret_array = [];
			do {
				numberdeleted=ret_array.length;
				ret_array = ret_array.concat(_remove_subtree.apply(this, arguments));
			}while( numberdeleted !=  ret_array.length);
			return ret_array;
		}
		else { // Delete a specific item
			return(_remove_subtree.apply(this, arguments));
		}
	};

	/**non-recursive insert function
	 * [] = RTree.insert(rectangle, object to insert)
	 */
	this.insert = function(rect, obj) {
/*		if(arguments.length < 2)
			throw "Wrong number of arguments. RT.Insert requires at least a bounding rectangle and an object."*/

		return(_insert_subtree({x:rect.x,y:rect.y,w:rect.w,h:rect.h,leaf:obj}, _T));
	};

	/**non-recursive delete function
	 * [deleted object] = RTree.remove(rectangle, [object to delete])
	 */

//End of RTree
};

/**Rectangle - Generic rectangle object - Not yet used */

RTree.Rectangle = function(ix, iy, iw, ih) { // new Rectangle(bounds) or new Rectangle(x, y, w, h)
    var x, x2, y, y2, w, h;

    if(ix.x) {
		x = ix.x; y = ix.y;
			if(ix.w !== 0 && !ix.w && ix.x2){
				w = ix.x2-ix.x;	h = ix.y2-ix.y;
			}	else {
				w = ix.w;	h = ix.h;
			}
		x2 = x + w; y2 = y + h; // For extra fastitude
	} else {
		x = ix; y = iy;	w = iw;	h = ih;
		x2 = x + w; y2 = y + h; // For extra fastitude
	}

	this.x1 = this.x = x;
	this.y1 = this.y = y;
	this.x2 = x2;
	this.y2 = y2;
	this.w = w;
	this.h = h;

	this.toJSON = function() {
		return('{"x":'+x.toString()+', "y":'+y.toString()+', "w":'+w.toString()+', "h":'+h.toString()+'}');
	};

	this.overlap = function(a) {
		return(this.x() < a.x2() && this.x2() > a.x() && this.y() < a.y2() && this.y2() > a.y());
	};

	this.expand = function(a) {
		var nx = Math.min(this.x(), a.x());
		var ny = Math.min(this.y(), a.y());
		w = Math.max(this.x2(), a.x2()) - nx;
		h = Math.max(this.y2(), a.y2()) - ny;
		x = nx; y = ny;
		return(this);
	};

	this.setRect = function(ix, iy, iw, ih) {
        var x, x2, y, y2, w, h;
		if(ix.x) {
			x = ix.x; y = ix.y;
			if(ix.w !== 0 && !ix.w && ix.x2) {
				w = ix.x2-ix.x;	h = ix.y2-ix.y;
			}	else {
				w = ix.w;	h = ix.h;
			}
			x2 = x + w; y2 = y + h; // For extra fastitude
		} else {
			x = ix; y = iy;	w = iw;	h = ih;
			x2 = x + w; y2 = y + h; // For extra fastitude
		}
	};
//End of RTree.Rectangle
};


/**returns true if rectangle 1 overlaps rectangle 2
 * [ boolean ] = overlap_rectangle(rectangle a, rectangle b)
 * @static function
 */
RTree.Rectangle.overlap_rectangle = function(a, b) {
	return(a.x < (b.x+b.w) && (a.x+a.w) > b.x && a.y < (b.y+b.h) && (a.y+a.h) > b.y);
};

/**returns true if rectangle a is contained in rectangle b
 * [ boolean ] = contains_rectangle(rectangle a, rectangle b)
 * @static function
 */
RTree.Rectangle.contains_rectangle = function(a, b) {
	return((a.x+a.w) <= (b.x+b.w) && a.x >= b.x && (a.y+a.h) <= (b.y+b.h) && a.y >= b.y);
};

/**expands rectangle A to include rectangle B, rectangle B is untouched
 * [ rectangle a ] = expand_rectangle(rectangle a, rectangle b)
 * @static function
 */
RTree.Rectangle.expand_rectangle = function(a, b)	{
	var nx = Math.min(a.x, b.x);
	var ny = Math.min(a.y, b.y);
	a.w = Math.max(a.x+a.w, b.x+b.w) - nx;
	a.h = Math.max(a.y+a.h, b.y+b.h) - ny;
	a.x = nx; a.y = ny;
	return(a);
};

/**generates a minimally bounding rectangle for all rectangles in
 * array "nodes". If rect is set, it is modified into the MBR. Otherwise,
 * a new rectangle is generated and returned.
 * [ rectangle a ] = make_MBR(rectangle array nodes, rectangle rect)
 * @static function
 */
RTree.Rectangle.make_MBR = function(nodes, rect) {
	if(nodes.length < 1)
		return({x:0, y:0, w:0, h:0});
		//throw "make_MBR: nodes must contain at least one rectangle!";
	if(!rect)
		rect = {x:nodes[0].x, y:nodes[0].y, w:nodes[0].w, h:nodes[0].h};
	else
		rect.x = nodes[0].x; rect.y = nodes[0].y; rect.w = nodes[0].w; rect.h = nodes[0].h;

	for(var i = nodes.length-1; i>0; i--)
		RTree.Rectangle.expand_rectangle(rect, nodes[i]);

	return(rect);
};
