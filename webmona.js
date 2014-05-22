function clamp (value, min, max) {
	return Math.max (min, Math.min (max, value));
}
function randInt (n) {
	return Math.floor (Math.random () * n)
}
function randSignedInt (n) {
	return Math.floor (Math.random () * ((n << 1) + 1)) - n;
}
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
var timeUnits = [
	/* name, modulo */
	{n: 'ms', m: 1000},
	{n: 's', m: 60},
	{n: 'm', m: 60},
	{n: 'h', m: 24},
	{n: 'd', m: 7},
	{n: 'w', m: Infinity},
]
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
Shape.prototype.setX = function setX (i, value) {
	return this.verts [i * 2] = value;
}
Shape.prototype.setY = function setY (i, value) {
	return this.verts [i * 2 + 1] = value;
}
Shape.prototype.getPolycount = function getShapePolycount () {
	return this.verts.length / 2;
}
Shape.prototype.dupe = function dupeShape () {
	var result = new Shape (this.r, this.g, this.b, this.a, 0);
	for (var i = this.verts.length - 1; i >= 0; --i)
		result.verts.unshift (this.verts[i]);
	return result;
}
Shape.prototype.changePolycount = function changeShapePolycount (newPolycount) {
	while (newPolycount * 2 > this.verts.length)
		this.verts.push (0);
	while (newPolycount * 2 < this.verts.length)
		this.verts.pop ();
}

function DNA (length, polycount) {
	if (!(this && this instanceof DNA))
		throw new TypeError ();
	if (arguments.length == 1 && (typeof arguments[0] == 'string')) {
		var data = arguments[0].split (/[ \n\r\t]+/)
		this.polycount = parseInt (data.shift ())
		this.strand = Array (parseInt (data.shift ()))
		for (var i = 0; i < this.strand.length; i++) {
			this.strand[i] = new Shape (
				parseInt (data.shift ()),
				parseInt (data.shift ()),
				parseInt (data.shift ()),
				parseFloat (data.shift ()) * 255, 0
			)
			for (var j = 0; j < this.polycount * 2; j++)
				this.strand[i].verts.push (parseFloat (data.shift ()))
		}
		return
	}
	this.strand = [];
	this.polycount = polycount;
	for (var i = length - 1; i >= 0; --i)
		this.strand.push (new Shape (0, 0, 0, 255, polycount));
}
DNA.prototype.dupe = function dupeDNA () {
	var result = new DNA (0, this.polycount);
	for (var i = 0; i < this.strand.length; ++i)
		result.strand.push (this.strand[i].dupe ());
	return result
}
DNA.prototype.changeLength = function changeDNALength (newLength, factory) {
	//change DNA length
	while (newLength > this.strand.length)
		this.strand.push (factory instanceof Function ?
			factory (this.polycount) :
			new Shape (0, 0, 0, 255, this.polycount)
		);
	while (newLength < this.strand.length)
		this.strand.pop ();
}
DNA.prototype.changePolycount = function changeDNAPolycount (newPolycount) {
	//change DNA polycount
	for (var i = this.strand.length - 1; i >= 0; --i)
		this.strand[i].changePolycount (newPolycount);
	this.polycount = newPolycount;
}

DNA.prototype.toString = function serializeDNA () {
	// header
	var string =
		this.polycount + ' ' +
		this.strand.length
	// shapes
	for (var i = 0; i < this.strand.length; i++) {
		string += ' '
			+ this.strand[i].r + ' '
			+ this.strand[i].g + ' '
			+ this.strand[i].b + ' '
			+ this.strand[i].a / 255
		for (var j = 0; j < this.polycount; j++) {
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
		for (var j = 0; j < this.strand[i].getPolycount (); j++) {
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
		x1 = shape.x (shape.getPolycount () - 1) - shape.x (0)
		y1 = shape.y (shape.getPolycount () - 1) - shape.y (0)
		for (var j = 0; j < shape.getPolycount (); j++) {
			// calculate current vector
			x0 = shape.x (j) - shape.x ((j + 1) % shape.getPolycount ())
			y0 = shape.y (j) - shape.y ((j + 1) % shape.getPolycount ())
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

//set up variables
var imageInput = document.getElementById ('image-input')
	,inputCtx = document.getElementById ('input-canvas').getContext ('2d')
	,testCtx = document.getElementById ('test-canvas').getContext ('2d')
	,bestCtx = document.getElementById ('best-canvas').getContext ('2d')

	,bestDNA
	,testDNA

	,fitnessOut = document.getElementById ('fitness')
	,evolutionCountOut = document.getElementById ('evolution-count')
	,evolutionsPerSecondOut = document.getElementById ('evolutions-per-second')
	,consecutiveFailuresOut = document.getElementById ('consecutive-failures')
	,timeElapsedOut = document.getElementById ('time-elapsed')

	,startButton = document.getElementById ('start')
	,pauseButton = document.getElementById ('pause')

	,numPolysInput = document.getElementById ('num-polys')
	,numVertsInput = document.getElementById ('num-verts')

	,importButton = document.getElementById ('b_import_dna')
	,clipboard = document.getElementById ('clipboard')

	,bitsPP = 4
	,startTime
	,elapsedTime = 0
	,evolutionCount
	,consecutiveFailures
	,lastRateEval = {time: 0, evolutions: 0}
	,evolutionsPerSecond
	,running = false
	,evolutionTimer
	,maximumDifference
	,bestDifference
	,bestComplexity

	,numComparators = 8
	,comparators

	,reader = new FileReader ()
	,proxyImage = new Image ();


function initialize () {
	// add some random DNA to start
	var newLength = parseInt (numPolysInput.value)
		,newPolycount = parseInt (numVertsInput.value)
		,width = inputCtx.canvas.width
		,height = inputCtx.canvas.height
	bestDNA = new DNA (newLength, newPolycount)
	bestDNA.randomize (width, height)
	bestDifference = Infinity
	bestComplexity = Infinity
	// TODO: detect transparent/grayscale images and update bitsPP
	maximumDifference = width * height * bitsPP * 255

	startTime = new Date ()
	elapsedTime = 0

	evolutionCount = 0


	drawDNA (bestCtx, bestDNA)
}

function startEvolution () {
	// if we are using comparators, check the value
	// otherwise check if evolution timer is active
	if (comparators ? running : evolutionTimer)
		return

	startTime = +new Date ()

	startButton.classList.add ('hidden')
	pauseButton.classList.remove ('hidden')

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

var CHANGE_SHAPE = 1
	,NULL_CONTRIBUTION_CHECK = 2
	,MOVE_SHAPE_TO_TOP = 3

	,mutationType
	,targetShapeIndex
	,targetShape
	,verts

	,accumulatedDifference
	,pendingComparatorResponses

function evolutionStep () {
	if (comparators && !running)
		return
	var rr = Math.random ()
	if (rr < 0.9) // 90%
		mutationType = CHANGE_SHAPE
	else if (rr < 0.95) // 5%
	 	mutationType = NULL_CONTRIBUTION_CHECK
	else // 5%
		mutationType = MOVE_SHAPE_TO_TOP

	// mutate DNA
	testDNA = bestDNA.dupe ()
	targetShapeIndex = randInt (testDNA.strand.length)
	targetShape = testDNA.strand[targetShapeIndex]
	verts = targetShape.verts
	var width = inputCtx.canvas.width
		,height = inputCtx.canvas.height
		,panicRatio = Math.sqrt (consecutiveFailures / testDNA.strand.length)

	switch (mutationType) {
	case CHANGE_SHAPE:
		if (rr < 0.4) { // 40%
			// change one shape's colour slightly
			targetShape.r = clamp (targetShape.r + randSignedInt (15), 0, 255)
			targetShape.g = clamp (targetShape.g + randSignedInt (15), 0, 255)
			targetShape.b = clamp (targetShape.b + randSignedInt (15), 0, 255)
			targetShape.a = clamp (targetShape.a + randSignedInt (15), 0, 255)
		}
		else if (rr < 0.8) { // 40%
			// completely relocate one vertex
			// TODO: fix/explain this
			var targetVertIndex = randInt (verts.length >> 1) << 1
			verts[targetVertIndex] = randInt (width)
			verts[targetVertIndex + 1] = randInt (height)
		}
		else { // 10%
			// jitter all vertices of one shape
			for (var i = verts.length; i > 0;) {
				// ITERATIONS ARE REVERSED
				verts[--i] = clamp (verts[i] + randSignedInt (5), 0, height) // Y
				verts[--i] = clamp (verts[i] + randSignedInt (5), 0, width) // X
			}
		}
		break

	case NULL_CONTRIBUTION_CHECK:
		// check whether a shape is completely obscured or transparent
		// if it is, it will be re-added with random vertices and colour
		for (var i = verts.length; i > 0;) {
			// ITERATIONS ARE REVERSED
			verts[--i] = 0 // Y
			verts[--i] = 0 // X
		}
		break

	case MOVE_SHAPE_TO_TOP:
		// check whether shape should be drawn on top
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
		bestDNA = testDNA
		drawDNA (bestCtx, bestDNA)
		consecutiveFailures = 0
	}

	if (new Date () - lastRateEval.time >= 1000) {
		evolutionsPerSecond = evolutionCount - lastRateEval.evolutions;
		lastRateEval.time += 1000;
		lastRateEval.evolutions = evolutionCount;
	}
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

startButton.addEventListener ('click', startEvolution)
pauseButton.addEventListener ('click', pauseEvolution)

numPolysInput.addEventListener ('change', function (event) {
	var newLength = parseInt (numPolysInput.value)
	bestDNA.changeLength (newLength, function (polycount) {
		var result = new Shape (
			randInt (255),
			randInt (255),
			randInt (255),
			randInt (255),
			polycount
		);
		for (var i = 0; i < polycount; i++) {
			result.setX (i, randInt (inputCtx.canvas.width));
			result.setY (i, randInt (inputCtx.canvas.height));
		}
		return result;
	})
	drawDNA (bestCtx, bestDNA)
	bestDifference = compareContextData (inputCtx, bestCtx)
})
numVertsInput.addEventListener ('change', function (event) {
	var newPolycount = parseInt (numVertsInput.value)
	bestDNA.changePolycount (newPolycount)
	drawDNA (bestCtx, bestDNA)
	bestDifference = compareContextData (inputCtx, bestCtx)
})

imageInput.addEventListener ('change', function (event) {
	reader.readAsDataURL (event.target.files[0]);
}, false)
reader.addEventListener ('load', function (event) {
	proxyImage.src = event.target.result;
})
proxyImage.addEventListener ('load', function (event) {
	// show elements hidden by default
	var hiddenElements = document.getElementsByClassName ('default-hidden');
	for (var i = hiddenElements.length; i > 0;)
		hiddenElements[--i].classList.remove ('default-hidden');
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

	startEvolution ();
})

importButton.addEventListener ('click', function (event) {
	//import DNA
	if (event.button != 0)
		return
	bestDNA = new DNA (clipboard.value)
	drawDNA (bestCtx, bestDNA)
	bestDifference = compareContextData (inputCtx, bestCtx)
})
