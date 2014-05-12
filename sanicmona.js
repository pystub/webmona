//download input image from server

//split image into quadtree where each node is a region with similar complexity
	//complexity = 1 / (pixel colour standard deviation)
//divvy up polygon budget for each region
regionpolygons = polygons / regions;
//for each region
{
//pick a sensible initial dna
	//find average colour of region
	//add polygon(s) filling whole region with average colour

	//evolve until desired accuracy is met
		//mutate dna
		//render mutated shape
		//render original shape
		//create bounding box containing mutated shape + original shape
		//load original image within bounding box
		//compare mutated and original shape for %match
		//if mutated is better match, update leaderdna
}

//stitch image back together

//upload dna to server
//upload rendered image to server
//upload svg to server
