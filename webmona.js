//initialise variables
	//image input file picker
	var	imageInput = document.getElementById('image-input');
	//image canvas
	var	inputCtx = document.getElementById('input-canvas').getContext ('2d');
	//test canvas
	var	testCtx = document.getElementById('test-canvas').getContext ('2d');
	//best match canvas
	var	bestCtx = document.getElementById('best-canvas').getContext ('2d');
	//best match dna
	var bestDNA;
	//dna to be tested against best match dna
	var testDNA;
	//fitness displayed on html page
	var fitnessOut = document.getElementById('fitness');
	//evolution count displayed on html page
	var evolutionCountOut = document.getElementById('evolution-count');
	//evolutions per second displayed on html page
	var evolutionsPerSecondOut = document.getElementById('evolutions-per-second');
	//consecutive failures displayed on html page
	var consecutiveFailuresOut = document.getElementById('consecutive-failures');
	//consecutive wins displayed on html page
	var consecutiveWinsOut = document.getElementById('consecutive-wins');
	//fail streak displayed on html page
	var failStreakOut = document.getElementById('fail-streak');
	//win streak displayed on html page
	var winStreakOut = document.getElementById('win-streak');
	//fails per second displayed on html page
	var failsPerSecondOut = document.getElementById('fails-per-second');
	//win streak displayed on html page
	var winsPerSecondOut = document.getElementById('wins-per-second');
	//time elapsed displayed on html page
	var timeElapsedOut = document.getElementById('time-elapsed');
	//start button on html page
	var startButton = document.getElementById('start');
	//pause button on html page
	var pauseButton = document.getElementById('pause');
	//export dna button on html page
	var exportButton = document.getElementById('b_export_dna');
	//export svg button on html page
	var exportSVGButton = document.getElementById('b_export_svg');
	//number of polygons displayed on html page
	var numPolysInput = document.getElementById('num-polys');
	//number of vertices displayed on html page
	var numVertsInput = document.getElementById('num-verts');
	//import dna button on html page
	var importButton = document.getElementById('b_import_dna');
	//minimise/maximise toolbox button on html page
	var minmaxButton = document.getElementById('minmax');
	//clipboard on html page
	var clipboard = document.getElementById('clipboard');
	var bitsPP = 4;
	//time when evolution started
	var startTime;
	//how long has evolution been running?
	var elapsedTime = 0;
	//how many different dna combinations have been tried?
	var evolutionCount;
	//how many times has mutated dna been less fit than leader dna?
	var consecutiveFailures;
	//how many times has mutated dna been more fit than leader dna?
	var consecutiveWins = 0;
	//largest streak of unsuccessful mutations.
	var failStreak = 0;
	//largest streak of successful mutations.
	var winStreak = 0;
	var lastRateEval = {time: 0,  evolutions: 0 };
	//how many mutations per second are happening?
	var evolutionsPerSecond;
	//is the evolution running?
	var running = false;
	//how long has the evolution been running?
	var evolutionTimer;
	//what's the maximum difference between a mutation and the input image?
	var maximumDifference;
	//what's the best difference between a mutation and the input image?
	var bestDifference;
	//what's the best complexity?
	var bestComplexity;
	//how many comparator webworkers should be started?
	var numComparators = 8;
	//comparator webworkers
	var comparators;
	//file reader
	var reader = new FileReader ();
	//proxy image
	var proxyImage = new Image ();
	//change shape mutation
	var CHANGE_SHAPE = 1;
	//null contribution mutation
	var NULL_CONTRIBUTION_CHECK = 2;
	//move shape to top of stack mutation
	var MOVE_SHAPE_TO_TOP = 3;
	//which type of mutation?
	var mutationType;
	//index of target shape
	var targetShapeIndex;
	//target shape
	var targetShape;
	//number of vertices
	var verts;
	var width;
	var newWidth;
	var evolutionsPerSecond;
	//accumulated difference
	var accumulatedDifference;
	//comparator responces
	var pendingComparatorResponses;
	/*
		Splits millisecond count to collection of larger time units that
		collectively represent the same time amount.
		arguments:
			ms (Number) millisecond count to be converted
			limit (Number) limits the variety possible resulting units. The last
				allowed unit will contain the remainder of time value.
		returns:
			Object {
				ms (Number) count of millisecondsvar  from 0 to 999 (Infinity if limit
					is less than 1)
				s (Number) count of seconds, from 0 to 59 (Infinity if limit is 1)
				m (Number) count of minutes, from 0 to 59 (Infinity if limit is 2)
				h (Number) count of hours, from 0 to 23 (Infinity if limit is 3)
				d (Number) count of days, from 0 to 6 (Infinity if limit is 4)
				w (Number) count of weeks, from 0 to Infinity
			}
	*/
	//set up time units
	var timeUnits = 	[{n: 'ms', m: 1000}, {n: 's', m: 60}, 
						{n: 'm', m: 60}, {n: 'h', m: 24},	
						{n: 'd', m: 7},	{n: 'w', m: Infinity}];

function clamp (value, min, max) 
	{
		//return a clamped value
		return Math.max (min, Math.min (max, value));
	}

function randInt (n) 
	{
		//return a random integer
		return Math.floor (Math.random () * n);
	}

function randSignedInt (n) 
	{
		//return a random signed integer
		return Math.floor (Math.random () * ((n << 1) + 1)) - n;
	}

function msToTimeInfo (ms, limit) 
	{
		//go from milliseconds to properly formatted time
		//set up time variable
		var ti = {ms: ms, s: 0, m: 0, h: 0, d: 0, w: 0};
		//if limit is undefined, set it to something sensible
		if (limit === undefined)
			{
				limit = timeUnits.length - 1;
			}
		//for under limit
		for (var i = 0; i < limit; i++) 
			{
				// store the modulo remainder of this unit in a temp value
				var thisUnit = ti[timeUnits[i].n] % timeUnits[i].m;
				// calculate the value of next unit
				ti[timeUnits[i + 1].n] = (ti[timeUnits[i].n] - thisUnit) / timeUnits[i].m;
				// store the current unit's value
				ti[timeUnits[i].n] = thisUnit;
			}
		//return formatted time
		return ti;
	}

function Shape (r, g, b, a, n) 
	{
		if (!(this && this instanceof Shape))
			{
				throw new TypeError ();
			}
		//red
		this.r = r;
		//green
		this.g = g;
		//blue
		this.b = b;
		//alpha
		this.a = a;
		//vertices
		this.verts = [];
		//push vertices
		for (var i = n * 2 - 1; i >= 0; --i)
			{
				this.verts.push (0);
			}
	}

Shape.prototype.x = function getX (i) 
	{
		return this.verts [i * 2];
	};

Shape.prototype.y = function getY (i) 
	{
		return this.verts [i * 2 + 1];
	};

Shape.prototype.setX = function setX (i, value) 
	{
		return this.verts [i * 2] = value;
	};
 
Shape.prototype.setY = function setY (i, value) 
	{
		return this.verts [i * 2 + 1] = value;
	};

Shape.prototype.getPolycount = function getShapePolycount () 
	{
		return this.verts.length / 2;
	};

Shape.prototype.dupe = function dupeShape () 
	{
		//duplicate shape
		var result = new Shape (this.r, this.g, this.b, this.a, 0);
		for (var i = this.verts.length - 1; i >= 0; --i)
			{
				result.verts.unshift (this.verts[i]);
			}
		return result;
	};

Shape.prototype.changePolycount = function changeShapePolycount (newPolycount) 
	{
		//change number of polygons
		while (newPolycount * 2 > this.verts.length)
			{
				this.verts.push (0);
			}
		while (newPolycount * 2 < this.verts.length)
			{
				this.verts.pop ();
			}
	};

function DNA (length, polycount) 
	{
		if (!(this && this instanceof DNA))
			{
				throw new TypeError ();
			}
		if (arguments.length == 1 && (typeof arguments[0] == 'string')) 
			{
				var data = arguments[0].split (/[ \n\r\t]+/);
				this.polycount = parseInt (data.shift ());
				this.strand = Array (parseInt (data.shift ()));
				for (var i = 0; i < this.strand.length; i++) 
					{
						this.strand[i] = new Shape (
							parseInt (data.shift ()),
							parseInt (data.shift ()),
							parseInt (data.shift ()),
							parseFloat (data.shift ()) * 255, 0
						);
				for (var j = 0; j < this.polycount * 2; j++)
					{
						this.strand[i].verts.push (parseFloat (data.shift ()));
					}
			}
			return;
		}
		this.strand = [];
		this.width = width;
		for (var m = length - 1; m >= 0; --m)
			{
				this.strand.push (new Shape (0, 0, 0, 255, polycount));
			}
	}

DNA.prototype.dupe = function dupeDNA () 
	{
		//duplicate dna
		var result = new DNA (0, this.polycount);
		//for each element in strand
		for (var i = 0; i < this.strand.length; ++i)
			{
				result.strand.push (this.strand[i].dupe ());
			}
		//return the result
		return result;
	};

DNA.prototype.changeLength = function changeDNALength (newLength, factory) 
	{
		//change dna length
		//push
		while (newLength > this.strand.length){this.strand.push (factory instanceof Function ?
				factory (this.polycount) :
				new Shape (0, 0, 0, 255, this.polycount)
			);}
		//pop
		while (newLength < this.strand.length)
			{
				this.strand.pop ();
			}
	};

DNA.prototype.changePolycount = function changeDNAPolycount (newPolycount) 
	{
		//change dna polycount
		//for each element in strand
		for (var i = this.strand.length - 1; i >= 0; --i)
			{
				this.width = newWidth;this.strand[i].changePolycount (newPolycount);
			}
		//set new width
		this.polycount = newPolycount;
	};

DNA.prototype.toString = function serializeDNA () 
	{
		//make dna into a string
		//header
		var string =
			this.polycount + ' ' +
			this.strand.length;
		//for each shape in dna
		for (var i = 0; i < this.strand.length; i++) 
			{
				string += ' '+ this.strand[i].r + ' ' 
					+ this.strand[i].g + ' ' + this.strand[i].b + ' '
					+ this.strand[i].a / 255;
				//co-ordinates
				for (var j = 0; j < this.polycount; j++) {
					string +=
						' ' + this.strand[i].x (j) +
						' ' + this.strand[i].y (j);
			}
		}
		return string;
	};

DNA.prototype.toSVG = function DNA2SVG () 
	{
		// output DNA string in SVG format
		//header
		var string = '<?xml version="1.0" encoding="utf-8"?>\n<svg version="1.1"' 
			+ ' baseProfile="full" xmlns="http://www.w3.org/2000/svg"' + ' width="' 
			+ inputCtx.canvas.width + 'px"' + ' height="' + inputCtx.canvas.height 
			+ 'px"' + ' viewBox="0 0 ' + inputCtx.canvas.width + ' ' 
			+ inputCtx.canvas.height + '">\n';
		//for each polygon
		for (var i = 0; i < this.strand.length; i++) 
			{
				string += '<polygon fill="rgb('	
					+ this.strand[i].r + ',' 
					+ this.strand[i].g + ',' 
					+ this.strand[i].b + ')" opacity="' 
					+ this.strand[i].a / 255 + '" points="';
				//for each vertex
				for (var j = 0; j < this.strand[i].getPolycount (); j++) 
					{
						string += ' ' + this.strand[i].x (j) + ' ' + this.strand[i].y (j);
					}
				//close bracket in svg file
				string += '" />\n';
			}
		//terminate svg file
		string += '</svg>';
		//return svg file
		return string;
	};

/* complexity is sum of
 *     all shapes'
 *     neighbouring edges'
 *     dot products'
 *     absolute values
 */

DNA.prototype.computeComplexity = function computeDNAComplexity () 
	{
		//find the complexity of a certain dna
		var complexity = 0;
		var shape;
		var x0;
		var y0;
		var x1;
		var y1;
		//for each element in dna strand
		for (var i = this.strand.length; i > 0;) {
			// calculate the vector that goes from the last point to the first
			shape = this.strand[--i];
			x1 = shape.x (shape.getPolycount () - 1) - shape.x (0);
			y1 = shape.y (shape.getPolycount () - 1) - shape.y (0);
			for (var j = 0; j < shape.getPolycount (); j++) 
				{
					// calculate current vector
					x0 = shape.x (j) - shape.x ((j + 1) % shape.getPolycount ());
					y0 = shape.y (j) - shape.y ((j + 1) % shape.getPolycount ());
					// calculate dot product, and add absolute of it
					complexity += Math.abs (x0 * x1 + y0 * y1);
					// store current vector for next cycle
					x1 = x0;
					y1 = y0;
				}
		}
		//return the complexity of input dna
		return complexity;
	};

DNA.prototype.randomize = function randomizeDNA (width, height) 
	{
		//make some random dna
		for (var i = this.strand.length; i > 0;) 
			{
				var shape = this.strand[--i];
				//red
				shape.r = randInt (255);
				//green
				shape.g = randInt (255);
				//blue
				shape.b = randInt (255);
				//alpha
				shape.a = randInt (128) + 127;
				//for each vertex
				for (var j = 0; j < shape.verts.length; j += 2) 
					{
						//x
						shape.verts[j] = randInt (width);
						//y
						shape.verts[j + 1] = randInt (height);
					}
			}
	};

function initialize () 
	{
		//add some random DNA to start
		//set number of polygons
		var newLength = parseInt (numPolysInput.value);
			//set number of vertices
		var newPolycount = parseInt (numVertsInput.value);
			//set image width
		var width = inputCtx.canvas.width;
			//set image height
		var height = inputCtx.canvas.height;
		//make some empty new dna
		bestDNA = new DNA (newLength, newPolycount);
		//put random data into new dna
		bestDNA.randomize (width, height);
		//initialise best difference
		bestDifference = Infinity;
		//initialise best complexity
		bestComplexity = Infinity;
		//TODO: detect transparent/grayscale images and update bitsPP
		maximumDifference = width * height * bitsPP * 255;
		//record the time evolution started
		startTime = lastRateEval.time = + new Date ();
		//initialise elapsed time variable
		elapsedTime = 0;
		//initialise number of generations variable
		evolutionCount = 0;
		//draw the dna
		drawDNA (bestCtx, bestDNA);
	}

function startEvolution () 
	{
		//check if an image has been loaded
		if (proxyImage.src === '') 
			{
				return;
			}
		// if we are using comparators, check the value
		// otherwise check if evolution timer is active
		if (comparators ? running : evolutionTimer)
			{
				return;
			}

		//record time that evolution started
		startTime = lastRateEval.time = + new Date ();

		if (comparators) 
			{
				//mutations are running
				running = true;
				//step through evolution
				evolutionStep ();
			}
		else 
			{
				evolutionTimer = setInterval (evolutionStep, 0);
			}
		//update information displayed on html page
		updateInfo ();
	}

function pauseEvolution () 
	{
		// if we are using comparators, stop by setting the value
		// otherwise stop the timer
		if (comparators)
			{
				running = false;
			}
		else 
			{
				clearTimeout (evolutionTimer);
				evolutionTimer = null;
			}

		elapsedTime += (+new Date ()) - startTime;
	}

function compareContextData (a, b) 
	{
		var difference = 0;
		var width = Math.min (a.canvas.width, b.canvas.width);
		var height = Math.min (a.canvas.height, b.canvas.height);
		var aData = a.getImageData (0, 0, width, height).data;
		var bData = b.getImageData (0, 0, width, height).data;

		for (var i = width * height * 4; i > 0;) 
			{
				// ITERATIONS ARE REVERSED
				difference +=
					Math.abs (aData[--i] - bData[i]) + // A
					Math.abs (aData[--i] - bData[i]) + // B
					Math.abs (aData[--i] - bData[i]) + // G
					Math.abs (aData[--i] - bData[i]);  // R
			}
		return difference;
	}

function evolutionStep () 
	{
		if (comparators && !running){return;}
		//randomly choose a mutation type
		var rr = Math.random ();
		//change shape
		if (rr < 0.9)
			{
				mutationType = CHANGE_SHAPE;
			}
		//null contribution check
		else if (rr < 0.95)
			{
				mutationType = NULL_CONTRIBUTION_CHECK;
			}
		//move shape to top of stack
		else 
			{
				mutationType = MOVE_SHAPE_TO_TOP;
			}

		// mutate DNA
		//duplicate the leading dna
		testDNA = bestDNA.dupe ();
		//select random target shape
		targetShapeIndex = randInt (testDNA.strand.length);
		//get target shape
		targetShape = testDNA.strand[targetShapeIndex];
		//set number of vertices
		verts = targetShape.verts;
		//set width
		var width = inputCtx.canvas.width, height = inputCtx.canvas.height;

		switch (mutationType) 
			{
			case CHANGE_SHAPE:
				if (rr < 0.4) 
					{
						var rand = Math.random ();
						if (rand <= 0.25)
							{
								//red de/increase
								targetShape.r = clamp (targetShape.r + randSignedInt (15), 0, 255);
							}
						if (rand <= 0.5 && rand > 0.25)
							{
								//green de/increase
								targetShape.g = clamp (targetShape.g + randSignedInt (15), 0, 255);
							}
						if (rand <= 0.75 && rand > 0.5)
							{
								//blue de/increase
								targetShape.b = clamp (targetShape.b + randSignedInt (15), 0, 255);
							}
						if (rand > 0.75)
							{
								//alpha de/increase
								targetShape.a = clamp (targetShape.a + randSignedInt (15), 0, 255);
							}	
					}
				else if (rr < 0.8) 
					{
						// TODO: fix/explain this
						var targetVertIndex = randInt (verts.length >> 1) << 1;
						verts[targetVertIndex] = randInt (width);
						verts[targetVertIndex + 1] = randInt (height);
					}
				else 
					{
						for (var i = verts.length; i > 0;) 
							{
								// ITERATIONS ARE REVERSED
								verts[--i] = clamp (verts[i] + randSignedInt (5), 0, height); // Y
								verts[--i] = clamp (verts[i] + randSignedInt (5), 0, width); // X
							}
					}
				break;

			case NULL_CONTRIBUTION_CHECK:
				for (var k = verts.length; k > 0;) 
					{
						// ITERATIONS ARE REVERSED
						verts[--k] = 0; // Y
						verts[--k] = 0; // X
					}
				break;

			case MOVE_SHAPE_TO_TOP:
				testDNA.strand.push (testDNA.strand.splice (targetShapeIndex, 1)[0]);
				targetShapeIndex = testDNA.strand.length - 1;
				break;
			}

		// difference evaluation
		drawDNA (testCtx, testDNA);

		if (comparators) 
			{
				var scan = 0;
				accumulatedDifference = 0;
				pendingComparatorResponses = comparators.length;

				for (var l = comparators.length; l > 0; l--) 
					{
						var slice = Math.floor ((width - scan) / l);
						var data = testCtx.getImageData (scan, 0, slice, height).data;
						scan += slice;
						comparators[l - 1].postMessage (data.buffer, [data.buffer]);
					}
				// comparators have their data and will return with results so we need
				// to end it here
				return;
			} 
		else 
			{
				// comparators are not enabled, calculate difference "manually"
				var difference = compareContextData (inputCtx, testCtx);
				var complexity = testDNA.computeComplexity ();
				validateMutation (difference, complexity);
			}
		}

//comparator response
function comparatorResponse (event) 
	{
		accumulatedDifference += event.data;
		--pendingComparatorResponses;
		if (pendingComparatorResponses == 0){validateMutation (accumulatedDifference, testDNA.computeComplexity ());}
	}
//validate mutation
function validateMutation (difference, complexity) 
	{
		var success = false;
		//set width to input image width
		var width = inputCtx.canvas.width;
		//set height to input image height
		var height = inputCtx.canvas.height;
		var panicRatio = Math.sqrt (consecutiveFailures / testDNA.strand.length);
		switch (mutationType) {
		//change shape
		case CHANGE_SHAPE:
			if (difference + complexity < bestDifference + bestComplexity) 
				{
					//win
					success = true;
					//overwrite best difference
					bestDifference = difference;
					//overwrite best complexity
					bestComplexity = complexity;
				}
			break;
		//move shape to top
		case MOVE_SHAPE_TO_TOP:
			if (difference < bestDifference) 
				{
					success = true;
					bestDifference = difference;
					// complexity doesn't change
				}
			break;
		//null contribution check
		case NULL_CONTRIBUTION_CHECK:
			if (difference == bestDifference) 
				{
					success = true;
					//random red
					targetShape.r = randInt (255);
					//random green
					targetShape.g = randInt (255);
					//random blue
					targetShape.b = randInt (255);
					//random alpha
					targetShape.a = randInt (255);
					//random start x
					var originX = randInt (width);
					//random start y
					var originY = randInt (height);
					//for each vertex
					for (var i = verts.length; i > 0;) {
						// ITERATIONS ARE REVERSED
						verts[--i] = clamp (originY + randSignedInt (5), 0, height); // Y
						verts[--i] = clamp (originX + randSignedInt (5), 0, width); // X
					}
					//draw test dna
					drawDNA (testCtx, testDNA);
					//get best difference
					bestDifference = compareContextData (inputCtx, testCtx);
					//get best complexity
					bestComplexity = testDNA.computeComplexity ();
				}
			break;
		}
		//increment number of mutations
		++evolutionCount;
		//increment number of consecutive fails
		++consecutiveFailures;
		//if the mutated dna is better than the leader dna
		if (success) 
			{
				//overwrite leader dna
				bestDNA = testDNA;
				//draw leader dna
				drawDNA (bestCtx, bestDNA);
				//reset number of consecutive fails to 0
				consecutiveFailures = 0;
				//increment number of consecutive wins
				++consecutiveWins;
			}
		//if the mutated dna is worse than the leader dna
		else 
			{
			//reset number of consecutive wins to 0
			consecutiveWins = 0;
			}

		if (new Date () - lastRateEval.time >= 1000) 
			{
				//failsPerSecond = 0;
				//winsPerSecond = 0;
				evolutionsPerSecond = evolutionCount - lastRateEval.evolutions;
				lastRateEval.time += 1000;
				lastRateEval.evolutions = evolutionCount;
			}
		//if the current number of consecutive failures beats the streak, overwrite it
		if (consecutiveFailures>failStreak) 
			{
				failStreak = consecutiveFailures;
			}	
		//if the current number of consecutive wins beats the streak, overwrite it
		if (consecutiveWins>winStreak) 
			{
				winStreak = consecutiveWins;
			}
		if (comparators) 
			{
				evolutionStep ();
			}
	}

function updateInfo () 
	{
		//calculate fitness as a %
		var fitness = (maximumDifference - bestDifference) / maximumDifference;
		var timeFromStart = 0;
		//update the fitness % value on html page
		fitnessOut.value = fitness.toLocaleString (navigator.language, {
			style: 'percent',
			maximumFractionDigits: '2',
			minimumFractionDigits: '2',
		});
		//update evolution count on html page
		evolutionCountOut.value = evolutionCount;
		//update evolution per second on html page
		evolutionsPerSecondOut.value = evolutionsPerSecond;
		//update consecutive failures count on html page
		consecutiveFailuresOut.value = consecutiveFailures;
		//update consecutive wins count on html page
		consecutiveWinsOut.value = consecutiveWins;
		//update win streak count on html page
		winStreakOut.value = failStreak;
		//update fail streak count on html page
		failStreakOut.value = winStreak;
		//winsPerSecondOut.value = winsPerSecond;
		//failsPerSecondOut.value = failsPerSecond;
		// if the evolution is still running, schedule next info update with RAF
		// because RAF fires only once per actual screen refresh
		if (comparators ? running : evolutionTimer) 
			{
				requestAnimationFrame (updateInfo);
				timeFromStart = +new Date () - startTime;
			}
		var tInfo = msToTimeInfo (elapsedTime + timeFromStart, 4);
		timeElapsedOut.value =
			tInfo.d ? tInfo.d + ' days ' + tInfo.h + ' hours ' + tInfo.m + ' minutes' :
			tInfo.h ? tInfo.h + ' hours ' + tInfo.m + ' minutes ' + tInfo.s + ' seconds' :
			tInfo.m ? tInfo.m + ' minutes ' + tInfo.s + ' seconds':
			tInfo.s + '.' + tInfo.ms + ' seconds';
	}

function drawDNA (ctx, dna) 
	{
		//draw input dna
		ctx.clearRect (0, 0, ctx.canvas.width, ctx.canvas.height);
		//for each shape
		for (var i = 0; i < dna.strand.length; i++) 
			{
				var shape = dna.strand[i];
				//begin the shape
				ctx.beginPath ();
				//set the fill style
				ctx.fillStyle = 'rgba('	+ shape.r + ','	+ shape.g + ','	+ shape.b + ','	+ shape.a / 255 + ')';
				ctx.moveTo (shape.x (0), shape.y (0));
				//for each vertex in shape
				for (var j = 1; j < shape.verts.length / 2; j += 1)
					{
						//draw line to next vertex
						ctx.lineTo (shape.x (j), shape.y (j));
					}
				//fill the shape
				ctx.fill ();
			}
	}

//event listeners
//start evolution when the start button is clicked
startButton.addEventListener ('click', startEvolution);
//pause evolution when the pause button is clicked
pauseButton.addEventListener ('click', pauseEvolution);
//when the number of polygons is changed
numPolysInput.addEventListener ('change', function (event) 
	{
		//set new number of polygons
		var newLength = parseInt (numPolysInput.value);
		//change number of polygons in leader dna
		bestDNA.changeLength (newLength, function (polycount) 
			{
				var result = new Shape (randInt (255), randInt (255), randInt (255), randInt (255),	polycount);
				for (var i = 0; i < polycount; i++) 
					{
						result.setX (i, randInt (inputCtx.canvas.width));
						result.setY (i, randInt (inputCtx.canvas.height));
					}
				return result;
			});
		//draw the modified dna
		drawDNA (bestCtx, bestDNA);
		//calculate the best difference
		bestDifference = compareContextData (inputCtx, bestCtx);
	});

//when the number of vertices is changed
numVertsInput.addEventListener ('change', function (event) 
	{
		//set new number of vertices
		var newPolycount = parseInt (numVertsInput.value);
		//change number of vertices in leader dna
		bestDNA.changePolycount (newPolycount);
		//draw the modified dna
		drawDNA (bestCtx, bestDNA);
		//calculate the best difference
		bestDifference = compareContextData (inputCtx, bestCtx);
	});

//when the input image is changed
imageInput.addEventListener ('change', function (event) 
	{
		//read the new input image
		reader.readAsDataURL (event.target.files[0]);
	}, false);

//prepare for loading image
reader.addEventListener ('load', function (event) 
	{
		//set the image source
		proxyImage.src = event.target.result;
	});

//load the image
proxyImage.addEventListener ('load', function (event) 
	{
		//setup image width
		inputCtx.canvas.width =
		testCtx.canvas.width =
		bestCtx.canvas.width = event.target.width;
		//setup image height
		inputCtx.canvas.height = 
		testCtx.canvas.height =
		bestCtx.canvas.height = event.target.height;
		// just in case we have transparent input
		inputCtx.clearRect (0, 0, event.target.width, event.target.height);
		inputCtx.drawImage (event.target, 0, 0);

		if (Worker) 
			{
				try 
				{
					comparators = []; // TODO: reuse old comparators	
					var width = inputCtx.canvas.width;
					var scan = 0;

					for (var i = numComparators; i > 0; i--) 
						{
							var comparator = new Worker ('comparator.js');
							var slice = Math.floor ((width - scan) / i);
							var data = inputCtx.getImageData (scan, 0, slice, inputCtx.canvas.height).data;
							console.log (scan, slice);
							scan += slice;

							comparator.onmessage = comparatorResponse;
							comparator.postMessage (data.buffer, [data.buffer]);
							if (data.byteLength) 
								{  // no support for transferring
									comparators = null;
									break;
								}
							else
								{
									comparators.unshift (comparator);
								}
						}
				} 
				catch (ex) 
				{
					alert (ex);
					comparators = null;
				}
			}

		//add random DNA to start with
		initialize ();
		//start evolving the image
		startEvolution ();
	});

//when dna import button is clicked
importButton.addEventListener ('click', function (event) 
	{
		//if not left click then return
		if (event.button !== 0)
			{
				return;
			}
		//import DNA
		bestDNA = new DNA (clipboard.value);
		//draw imported dna
		drawDNA (bestCtx, bestDNA);
		//update best difference for imported dna
		bestDifference = compareContextData (inputCtx, bestCtx);
	});

//when dna export button is clicked
exportButton.addEventListener ('click', function (event) 
	{
		//check if an image has been loaded
		if (proxyImage.src === '') 
			{
				return;
			}
		//if not left click then return
		if (event.button !== 0)
			{
				return;
			}
		//export dna
		clipboard.value = bestDNA;
	});

//when svg export button is clicked
exportSVGButton.addEventListener ('click', function (event) 
	{
		//check if an image has been loaded
		if (proxyImage.src === '') 
			{
				return;
			}
		//if not left click then return
		if (event.button !== 0) 
			{
				return;
			}
		//export svg
		clipboard.value = bestDNA.toSVG ();
	});

//when toolbox minimise/maximise button is clicked
minmaxButton.addEventListener ('click', function (event) 
	{
		//if not left click then return
		if (event.button !== 0)
			{
				return;
			}
		//get toolbox div
		var div = document.getElementById('toolbox');
		//if toolbox is not hidden
		if (div.style.display !== 'none') 
			{
			//change minmax button to down arrow
			document.getElementById("minmax").innerText = '▼';
			//hide toolbox
			div.style.display = 'none';
			}
			else 
			{
			//change minmax button to up arrow
			document.getElementById("minmax").innerText = '▲';
			//show toolbox
			div.style.display = 'block';
			}
	});