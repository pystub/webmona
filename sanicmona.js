//download input image from server

//download leader dna from server

//initialise variables

//render leader dna

//calculate complexity = 1 / (pixel colour standard deviation)

//split image into quadtree where each node is a region with similar complexity

//divvy up polygon budget for each region
regionpolygons = polygons / regions;

//for each region
{
	//pick a sensible initial dna
		//find average colour of region
		//add polygon(s) filling whole region with average colour

	//evolve until accuracy is better than leading accuracy
		//mutate dna
		//render mutated shape
		//render original shape
		//create bounding box containing mutated shape + original shape
		//load original image within bounding box
		//compare mutated and original shape for %match
		//if mutated is better match, update leaderdna
}

//render whole image

//compare to input image 

//if better match than leader rendered image

if (mutatedfitness>leaderfitness) 
	{
		//upload dna to server
		//upload rendered image to server
		//upload svg to server
	}




