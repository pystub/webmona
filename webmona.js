//set up variables
var 	//image input file picker
	imageInput = document.getElementById ('image-input')
	//image canvas
	,inputCtx = document.getElementById ('input-canvas').getContext ('2d')
	//test canvas
	,testCtx = document.getElementById ('test-canvas').getContext ('2d')
	//best match canvas
	,bestCtx = document.getElementById ('best-canvas').getContext ('2d')
	//best match dna
	,bestDNA
	//dna to be tested against best match dna
	,testDNA
	//fitness displayed on html page
	,fitnessOut = document.getElementById ('fitness')
	//evolution count displayed on html page
	,evolutionCountOut = document.getElementById ('evolution-count')
	//evolutions per second displayed on html page
	,evolutionsPerSecondOut = document.getElementById ('evolutions-per-second')
	//consecutive failures displayed on html page
	,consecutiveFailuresOut = document.getElementById ('consecutive-failures')
	//consecutive wins displayed on html page
	,consecutiveWinsOut = document.getElementById ('consecutive-wins')
	//fail streak displayed on html page
	,failStreakOut = document.getElementById ('fail-streak')
	//win streak displayed on html page
	,winStreakOut = document.getElementById ('win-streak')
	//fails per second displayed on html page
	//,failsPerSecondOut = document.getElementById ('fails-per-second')
	//win streak displayed on html page
	//,winsPerSecondOut = document.getElementById ('wins-per-second')
	//time elapsed displayed on html page
	,timeElapsedOut = document.getElementById ('time-elapsed')
	//start button on html page
	,startButton = document.getElementById ('start')
	//pause button on html page
	,pauseButton = document.getElementById ('pause')
	//export dna button on html page
	,exportButton = document.getElementById ('b_export_dna')
	//export svg button on html page
	,exportSVGButton = document.getElementById ('b_export_svg')
	//number of polygons displayed on html page
	,numPolysInput = document.getElementById ('num-polys')
	//number of vertices displayed on html page
	,numVertsInput = document.getElementById ('num-verts')
	//import dna button on html page
	,importButton = document.getElementById ('b_import_dna')
	//minimise/maximise toolbox button on html page
	,minmaxButton = document.getElementById ('minmax')
	//clipboard on html page
	,clipboard = document.getElementById ('clipboard')
	,bitsPP = 4
	//time when evolution started
	,startTime
	//how long has evolution been running?
	,elapsedTime = 0
	//how many different dna combinations have been tried?
	,evolutionCount
	//how many times has mutated dna been less fit than leader dna?
	,consecutiveFailures
	//how many times has mutated dna been more fit than leader dna?
	,consecutiveWins = 0
	//largest streak of unsuccessful mutations.
	,failStreak = 0
	//largest streak of successful mutations.
	,winStreak = 0
	,lastRateEval = {time: 0, evolutions: 0}
	//how many mutations per second are happening?
	,evolutionsPerSecond
	//is the evolution running?
	,running = false
	,evolutionTimer
	,maximumDifference
	,bestDifference
	,bestComplexity
	//how many comparator webworkers should be started?
	,numComparators = 8
	,comparators
	,reader = new FileReader ()
	,proxyImage = new Image ()
	,CHANGE_SHAPE = 1
	,NULL_CONTRIBUTION_CHECK = 2
	,MOVE_SHAPE_TO_TOP = 3
	,mutationType
	,targetShapeIndex
	,targetShape
	,verts
	,accumulatedDifference
	,pendingComparatorResponses
	/*
	 *     Splits millisecond count to collection of larger time units that
	 *     collectively represent the same time amount.
	 * arguments:
	 *     ms (Number) millisecond count to be converted
	 *     limit (Number) limits the variety possible resulting units. The last
	 *         allowed unit will contain the remainder of time value.
	 * returns:
	 *     Object {
	 *         ms (Number) count of milliseconds, from 0 to 999 (Infinity if limit
	 *             is less than 1)
	 *         s (Number) count of seconds, from 0 to 59 (Infinity if limit is 1)
	 *         m (Number) count of minutes, from 0 to 59 (Infinity if limit is 2)
 	 *         h (Number) count of hours, from 0 to 23 (Infinity if limit is 3)
	 *         d (Number) count of days, from 0 to 6 (Infinity if limit is 4)
 	 *         w (Number) count of weeks, from 0 to Infinity
 	 *     }
	 */
	,timeUnits = [
		/* name, modulo */
		{n: 'ms', m: 1000},
		{n: 's', m: 60},
		{n: 'm', m: 60},
		{n: 'h', m: 24},
		{n: 'd', m: 7},
		{n: 'w', m: Infinity},
	];

function clamp (value, min, max) 
{
	return Math.max (min, Math.min (max, value));
}

function randInt (n) 
{
	return Math.floor (Math.random () * n);
}

function randSignedInt (n) 
{
	return Math.floor (Math.random () * ((n << 1) + 1)) - n;
}



function msToTimeInfo (ms, limit) {
	var ti = {ms: ms, s: 0, m: 0, h: 0, d: 0, w: 0}
	if (limit === undefined)
		limit = timeUnits.length - 1
	for (var i = 0; i < limit; i++) {
		// store the modulo remainder of this unit in a temp value
		var thisUnit = ti[timeUnits[i].n] % timeUnits[i].m
		// calculate the value of next unit
		ti[timeUnits[i + 1].n] = (ti[timeUnits[i].n] - thisUnit) / timeUnits[i].m
		// store the current unit's value
		ti[timeUnits[i].n] = thisUnit
	}
	return ti
}

function Shape (r, g, b, a, n) {
	if (!(this && this instanceof Shape))
		throw new TypeError ();
	this.r = r;
	this.g = g;
	this.b = b;
	this.a = a;
	this.verts = [];
	for (var i = n * 2 - 1; i >= 0; --i)
		this.verts.push (0);
}
Shape.prototype.x = function getX (i) {
	return this.verts [i * 2];
}
Shape.prototype.y = function getY (i) {
	return this.verts [i * 2 + 1];
}
Shape.prototype.getWidth = function getShapeWidth () {
	return this.verts.length / 2;
}
Shape.prototype.dupe = function dupeShape () {
	var result = new Shape (this.r, this.g, this.b, this.a, 0);
	for (var i = this.verts.length - 1; i >= 0; --i)
		result.verts.unshift (this.verts[i]);
	return result;
}
Shape.prototype.changeWidth = function changeShapeWidth (newWidth) {
	while (newWidth * 2 > this.verts.length)
		this.verts.push (0);
	while (newWidth * 2 < this.verts.length)
		this.verts.pop ();
}

function DNA (length, width) {
	if (!(this && this instanceof DNA))
		throw new TypeError ();
	if (arguments.length == 1 && (typeof arguments[0] == 'string')) {
		var data = arguments[0].split (/[ \n\r\t]+/)
		this.width = parseInt (data.shift ())
		this.strand = Array (parseInt (data.shift ()))
		for (var i = 0; i < this.strand.length; i++) {
			this.strand[i] = new Shape (
				parseInt (data.shift ()),
				parseInt (data.shift ()),
				parseInt (data.shift ()),
				parseFloat (data.shift ()) * 255, 0
			)
			for (var j = 0; j < this.width * 2; j++)
				this.strand[i].verts.push (parseFloat (data.shift ()))
		}
		return
	}
	this.strand = [];
	this.width = width;
	for (var i = length - 1; i >= 0; --i)
		this.strand.push (new Shape (0, 0, 0, 255, width));
}

DNA.prototype.dupe = function dupeDNA () {
	var result = new DNA (0, this.width);
	for (var i = 0; i < this.strand.length; ++i)
		result.strand.push (this.strand[i].dupe ());
	return result
}

DNA.prototype.changeLength = function changeDNALength (newLength) {
	//change dna length
	while (newLength > this.strand.length)
		this.strand.push (new Shape (0, 0, 0, 255, this.width));
	while (newLength < this.strand.length)
		this.strand.pop ();
}

DNA.prototype.changeWidth = function changeDNAWidth (newWidth) {
	//change dna width
	for (var i = this.strand.length - 1; i >= 0; --i)
		this.strand[i].changeWidth (newWidth);
	this.width = newWidth;
}

DNA.prototype.toString = function serializeDNA () {
	//make dna into a string
	//header
	var string =
		this.width + ' ' +
		this.strand.length
	//for each shape in dna
	for (var i = 0; i < this.strand.length; i++) {
		string += ' '
			//red
			+ this.strand[i].r + ' '
			//green
			+ this.strand[i].g + ' '
			//blue
			+ this.strand[i].b + ' '
			//alpha
			+ this.strand[i].a / 255
		//co-ordinates
		for (var j = 0; j < this.width; j++) {
			string +=
				' ' + this.strand[i].x (j) +
				' ' + this.strand[i].y (j)
		}
	}
	return string
}

DNA.prototype.toSVG = function DNA2SVG () {
	// output DNA string in SVG format
	var string = '<?xml version="1.0" encoding="utf-8"?>\n<svg version="1.1"'
		+ ' baseProfile="full" xmlns="http://www.w3.org/2000/svg"'
		+ ' width="' + inputCtx.canvas.width + 'px"'
		+ ' height="' + inputCtx.canvas.height + 'px"'
		+ ' viewBox="0 0 '
		+ inputCtx.canvas.width + ' ' + inputCtx.canvas.height + '">\n'

	for (var i = 0; i < this.strand.length; i++) {
		string += '<polygon fill="rgb('
			+ this.strand[i].r + ','
			+ this.strand[i].g + ','
			+ this.strand[i].b + ')" opacity="'
			+ this.strand[i].a / 255 + '" points="'
		for (var j = 0; j < this.width; j++) {
			string += ' '
				+ this.strand[i].x (j) + ' '
				+ this.strand[i].y (j)
		}
		string += '" />\n'
	}
	string += '</svg>'
	return string
}
/* complexity is sum of
 *     all shapes'
 *     neighbouring edges'
 *     dot products'
 *     absolute values
 */

DNA.prototype.computeComplexity = function computeDNAComplexity () {
	var complexity = 0
		,shape
		,x0, y0, x1, y1
	for (var i = this.strand.length; i > 0;) {
		// calculate the vector that goes from the last point to the first
		shape = this.strand[--i]
		x1 = shape.x (shape.getWidth () - 1) - shape.x (0)
		y1 = shape.y (shape.getWidth () - 1) - shape.y (0)
		for (var j = 0; j < shape.getWidth (); j++) {
			// calculate current vector
			x0 = shape.x (j) - shape.x ((j + 1) % shape.getWidth ())
			y0 = shape.y (j) - shape.y ((j + 1) % shape.getWidth ())
			// calculate dot product, and add absolute of it
			complexity += Math.abs (x0 * x1 + y0 * y1)
			// store current vector for next cycle
			x1 = x0
			y1 = y0
		}
	}
	return complexity
}

DNA.prototype.randomize = function randomizeDNA (width, height) {
	for (var i = this.strand.length; i > 0;) {
		var shape = this.strand[--i]
		shape.r = randInt (255)
		shape.g = randInt (255)
		shape.b = randInt (255)
		shape.a = randInt (128) + 127
		for (var j = 0; j < shape.verts.length; j += 2) {
			shape.verts[j] = randInt (width)
			shape.verts[j + 1] = randInt (height)
		}
	}
}

function initialize () {
	//add some random DNA to start
	var newLength = parseInt (numPolysInput.value)
		,newWidth = parseInt (numVertsInput.value)
		,width = inputCtx.canvas.width
		,height = inputCtx.canvas.height
	bestDNA = new DNA (newLength, newWidth)
	bestDNA.randomize (width, height)
	bestDifference = Infinity
	bestComplexity = Infinity
	//TODO: detect transparent/grayscale images and update bitsPP
	maximumDifference = width * height * bitsPP * 255
	//record the time evolution started
	startTime = new Date ()
	//initialise elapsed time variable
	elapsedTime = 0
	//initialise number of generations variable
	evolutionCount = 0
	//draw the dna
	drawDNA (bestCtx, bestDNA)
}

function startEvolution () {
	//check if an image has been loaded
	if (proxyImage.src == '') {return;}
	// if we are using comparators, check the value
	// otherwise check if evolution timer is active
	if (comparators ? running : evolutionTimer)
		return

	startTime = +new Date ()

	lastRateEval.time = + new Date ()

	if (comparators) {
		running = true
		evolutionStep ()
	}
	else
		evolutionTimer = setInterval (evolutionStep, 0)

	updateInfo ()
}

function pauseEvolution () {
	// if we are using comparators, stop by setting the value
	// otherwise stop the timer
	if (comparators)
		running = false
	else {
		clearTimeout (evolutionTimer)
		evolutionTimer = null
	}

	elapsedTime += (+new Date ()) - startTime

	pauseButton.classList.add ('hidden')
	startButton.classList.remove ('hidden')
}

function compareContextData (a, b) {
	var difference = 0
		,width = Math.min (a.canvas.width, b.canvas.width)
		,height = Math.min (a.canvas.height, b.canvas.height)
		,aData = a.getImageData (0, 0, width, height).data
		,bData = b.getImageData (0, 0, width, height).data

	for (var i = width * height * 4; i > 0;) {
		// ITERATIONS ARE REVERSED
		difference +=
			Math.abs (aData[--i] - bData[i]) + // A
			Math.abs (aData[--i] - bData[i]) + // B
			Math.abs (aData[--i] - bData[i]) + // G
			Math.abs (aData[--i] - bData[i])   // R
	}
	return difference
}

function evolutionStep () {
	if (comparators && !running)
		return
	var rr = Math.random ()
	if (rr < 0.9)
		mutationType = CHANGE_SHAPE
	else if (rr < 0.95)
	 	mutationType = NULL_CONTRIBUTION_CHECK
	else
		mutationType = MOVE_SHAPE_TO_TOP

	// mutate DNA
	//duplicate the leading dna
	testDNA = bestDNA.dupe ()
	targetShapeIndex = randInt (testDNA.strand.length)
	targetShape = testDNA.strand[targetShapeIndex]
	verts = targetShape.verts
	var width = inputCtx.canvas.width, height = inputCtx.canvas.height;

	switch (mutationType) {
	case CHANGE_SHAPE:
		if (rr < 0.4) {
			targetShape.r = clamp (targetShape.r + randSignedInt (15), 0, 255)
			targetShape.g = clamp (targetShape.g + randSignedInt (15), 0, 255)
			targetShape.b = clamp (targetShape.b + randSignedInt (15), 0, 255)
			targetShape.a = clamp (targetShape.a + randSignedInt (15), 0, 255)
		}
		else if (rr < 0.8) {
			// TODO: fix/explain this
			var targetVertIndex = randInt (verts.length >> 1) << 1
			verts[targetVertIndex] = randInt (width)
			verts[targetVertIndex + 1] = randInt (height)
		}
		else {
			for (var i = verts.length; i > 0;) {
				// ITERATIONS ARE REVERSED
				verts[--i] = clamp (verts[i] + randSignedInt (5), 0, height) // Y
				verts[--i] = clamp (verts[i] + randSignedInt (5), 0, width) // X
			}
		}
		break

	case NULL_CONTRIBUTION_CHECK:
		for (var i = verts.length; i > 0;) {
			// ITERATIONS ARE REVERSED
			verts[--i] = 0 // Y
			verts[--i] = 0 // X
		}
		break

	case MOVE_SHAPE_TO_TOP:
		testDNA.strand.push (testDNA.strand.splice (targetShapeIndex, 1)[0])
		targetShapeIndex = testDNA.strand.length - 1
		break
	}

	// difference evaluation
	drawDNA (testCtx, testDNA)

	if (comparators) {
		var scan = 0;
		accumulatedDifference = 0;
		pendingComparatorResponses = comparators.length;

		for (var i = comparators.length; i > 0; i--) {
			var slice = Math.floor ((width - scan) / i)
				,data = testCtx.getImageData (scan, 0, slice, height).data
			scan += slice

			comparators[i - 1].postMessage (data.buffer, [data.buffer]);
		}
		// comparators have their data and will return with results so we need
		// to end it here
		return
	} else {
		// comparators are not enabled, calculate difference "manually"
		var difference = compareContextData (inputCtx, testCtx)
			,complexity = testDNA.computeComplexity ()

		validateMutation (difference, complexity)
	}
}

function comparatorResponse (event) {
	accumulatedDifference += event.data;
	--pendingComparatorResponses;
	if (pendingComparatorResponses == 0) 
		validateMutation (accumulatedDifference, testDNA.computeComplexity ())
}

function validateMutation (difference, complexity) {
	var success = false
		,width = inputCtx.canvas.width
		,height = inputCtx.canvas.height
	switch (mutationType) {
	case CHANGE_SHAPE:
		if (difference + complexity < bestDifference + bestComplexity) {
			success = true
			bestDifference = difference
			bestComplexity = complexity
		}
	case MOVE_SHAPE_TO_TOP:
		if (difference < bestDifference) {
			success = true
			bestDifference = difference
			// complexity doesn't change
		}
		break

	case NULL_CONTRIBUTION_CHECK:
		if (difference == bestDifference) {
			success = true
			targetShape.r = randInt (255)
			targetShape.g = randInt (255)
			targetShape.b = randInt (255)
			targetShape.a = randInt (255)
			var originX = randInt (width)
			var originY = randInt (height)
			for (var i = verts.length; i > 0;) {
				// ITERATIONS ARE REVERSED
				verts[--i] = clamp (originY + randSignedInt (5), 0, height) // Y
				verts[--i] = clamp (originX + randSignedInt (5), 0, width) // X
			}
			drawDNA (testCtx, testDNA)
			bestDifference = compareContextData (inputCtx, testCtx)
			bestComplexity = testDNA.computeComplexity ()
		}
		break
	}

	++evolutionCount
	++consecutiveFailures
	if (success) {
		bestDNA = testDNA;
		drawDNA (bestCtx, bestDNA);
		consecutiveFailures = 0;
		++consecutiveWins;
	}
	else {
	consecutiveWins = 0;

	}

	if (new Date () - lastRateEval.time >= 1000) {
		//failsPerSecond = 0;
		//winsPerSecond = 0;
		evolutionsPerSecond = evolutionCount - lastRateEval.evolutions;
		lastRateEval.time += 1000;
		lastRateEval.evolutions = evolutionCount;
	}
	if (consecutiveFailures>failStreak) {failStreak = consecutiveFailures}	
	if (consecutiveWins>winStreak) {winStreak = consecutiveWins}
	if (comparators)
		evolutionStep ()
}

function updateInfo () {
	var fitness = (maximumDifference - bestDifference) / maximumDifference
		,tInfo = msToTimeInfo (elapsedTime + (+new Date ()) - startTime, 4)
	fitnessOut.value = fitness.toLocaleString (navigator.language, {
		style: 'percent',
		maximumFractionDigits: '2',
		minimumFractionDigits: '2',
	})
	evolutionCountOut.value = evolutionCount
	evolutionsPerSecondOut.value = evolutionsPerSecond
	consecutiveFailuresOut.value = consecutiveFailures
	consecutiveWinsOut.value = consecutiveWins;
	winStreakOut.value = failStreak;
	failStreakOut.value = winStreak;
	//winsPerSecondOut.value = winsPerSecond;
	//failsPerSecondOut.value = failsPerSecond;

	
	timeElapsedOut.value =
		tInfo.d ? tInfo.d + ' days ' + tInfo.h + ' hours ' + tInfo.m + ' minutes' :
		tInfo.h ? tInfo.h + ' hours ' + tInfo.m + ' minutes ' + tInfo.s + ' seconds' :
		tInfo.m ? tInfo.m + ' minutes ' + tInfo.s + ' seconds':
		tInfo.s + '.' + tInfo.ms + ' seconds'
	// if the evolution is still running, schedule next info update with RAF
	// because RAF fires only once per actual screen refresh
	if (comparators ? running : evolutionTimer)
		requestAnimationFrame (updateInfo)
}

function drawDNA (ctx, dna) {
	//draw input dna
	ctx.clearRect (0, 0, ctx.canvas.width, ctx.canvas.height)
	for (var i = 0; i < dna.strand.length; i++) {
		var shape = dna.strand[i]
		ctx.beginPath ()
		ctx.fillStyle = 'rgba('
			+ shape.r + ','
			+ shape.g + ','
			+ shape.b + ','
			+ shape.a / 255 + ')';
		ctx.moveTo (shape.x (0), shape.y (0))
		for (var j = 1; j < shape.verts.length / 2; j += 1)
			ctx.lineTo (shape.x (j), shape.y (j));
		ctx.fill ()
	}
}

//start evolution when the start button is clicked
startButton.addEventListener ('click', startEvolution)
//pause evolution when the pause button is clicked
pauseButton.addEventListener ('click', pauseEvolution)
//when the number of polygons is changed
numPolysInput.addEventListener ('change', function (event) {
	var newLength = parseInt (numPolysInput.value)
	bestDNA.changeLength (newLength)
	drawDNA (bestCtx, bestDNA)
	bestDifference = compareContextData (inputCtx, bestCtx)
})
//when the number of vertices is changed
numVertsInput.addEventListener ('change', function (event) {
	var newWidth = parseInt (numVertsInput.value)
	bestDNA.changeWidth (newWidth)
	drawDNA (bestCtx, bestDNA)
	bestDifference = compareContextData (inputCtx, bestCtx)
})
//when the input image is changes
imageInput.addEventListener ('change', function (event) {
	reader.readAsDataURL (event.target.files[0]);
}, false)
//prepare for loading image
reader.addEventListener ('load', function (event) {
	proxyImage.src = event.target.result;
})
//load the image
proxyImage.addEventListener ('load', function (event) {
	inputCtx.canvas.width =
	testCtx.canvas.width =
	bestCtx.canvas.width = event.target.width;
	inputCtx.canvas.height = 
	testCtx.canvas.height =
	bestCtx.canvas.height = event.target.height;
	// just in case we have transparent input
	inputCtx.clearRect (0, 0, event.target.width, event.target.height);
	inputCtx.drawImage (event.target, 0, 0);

	if (Worker) {
		try {
			comparators = [] // TODO: reuse old comparators	
			var width = inputCtx.canvas.width
				,scan = 0

			for (var i = numComparators; i > 0; i--) {
				var comparator = new Worker ('comparator.js')
					,slice = Math.floor ((width - scan) / i)
					,data = inputCtx.getImageData (scan, 0, slice, inputCtx.canvas.height).data
				console.log (scan, slice)
				scan += slice

				comparator.onmessage = comparatorResponse
				comparator.postMessage (data.buffer, [data.buffer])
				if (data.byteLength) {  // no support for transferring
					comparators = null
					break
				}
				else
					comparators.unshift (comparator)
			}
		} catch (ex) {
			alert (ex)
			comparators = null
		}
	}

	//add random DNA to start with
	initialize ();
	//start evolving the image
	startEvolution ();
})

//when dna import button is clicked
importButton.addEventListener ('click', function (event) {
	//import DNA
	if (event.button != 0)
		return
	bestDNA = new DNA (clipboard.value)
	drawDNA (bestCtx, bestDNA)
	bestDifference = compareContextData (inputCtx, bestCtx)
})

//when dna export button is clicked
exportButton.addEventListener ('click', function (event) {
	//export dna
	if (event.button != 0)
		return
	clipboard.value = bestDNA
})

//when svg export button is clicked
exportSVGButton.addEventListener ('click', function (event) {
	//export svg
	if (event.button != 0)
		return
	clipboard.value = bestDNA.toSVG ()
})

//when toolbox minimise/maximise button is clicked
minmaxButton.addEventListener ('click', function (event) {
	var div = document.getElementById('toolbox');
	//if toolbox is not hidden
   	if (div.style.display !== 'none') {
		document.getElementById("minmax").innerText = '▼';
		//hide toolbox
        	div.style.display = 'none';
    	}
    	else {
		document.getElementById("minmax").innerText = '▲';
		//show toolbox
        	div.style.display = 'block';
    	}
})

