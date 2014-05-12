//select image with lowest leader accuracy

//download input image from server

//download leader dna from server

//initialise variables

//calculate complexity = 1 / (pixel colour standard deviation)

//split image into quadtree where each node is a region with similar complexity

//if no leader dna exists yet
if(){
	for each region {
  //pick a sensible initial dna
		//find average colour of region
		//add polygon(s) filling whole region with average colour
	}
}

//render leader dna

//divvy up polygon budget for each region
regionpolygons = polygons / regions;

//for each region
{
	//launch a new webworker thread
	var worker = new Worker('evolver.js');

	worker.addEventListener('message', function(e) {
  	console.log('Worker said: ', e.data);
	}, false);

worker.postMessage('Hello World'); // Send data to our worker.
	
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

//render dna

function render(dna){}

//render shape

function renderpoly(dna){}

//calculate complexity = 1 / (pixel colour standard deviation)

function complexitycalc(image){}