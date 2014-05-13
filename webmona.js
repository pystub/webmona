function clamp (value, min, max) {
	return Math.max (min, Math.min (max, value))
}
function randSignedInt (n) {
	return Math.floor (Math.random () * ((n << 1) + 1)) - n
}

function Shape (r, g, b, a, n) {
	if (!(this && this instanceof Shape))
		throw new TypeError ()
	this.r = r
	this.g = g
	this.b = b
	this.a = a
	this.verts = []
	for (var i = n * 2 - 1; i >= 0; --i)
		this.verts.push (0)
}
Shape.prototype.x = function getX (i) {
	return this.verts [i * 2]
}
Shape.prototype.y = function getY (i) {
	return this.verts [i * 2 + 1]
}
Shape.prototype.getWidth = function getShapeWidth () {
	return this.verts.length / 2
}
Shape.prototype.dupe = function dupeShape () {
	var result = new Shape (this.r, this.g, this.b, this.a, 0)
	for (var i = this.verts.length - 1; i >= 0; --i)
		result.verts.unshift (this.verts[i])
	return result
}
Shape.prototype.changeWidth = function changeShapeWidth (newWidth) {
	while (newWidth * 2 > this.verts.length)
		this.verts.push (0)
	while (newWidth * 2 < this.verts.length)
		this.verts.pop ()
}

function DNA (length, width) {
	if (!(this && this instanceof DNA))
		throw new TypeError ()
	if (arguments.length == 1 && (typeof arguments[0] == 'string')) {
		var ptrn = /\s*(\d+(?:\.\d+)?)/y
			,string = arguments[0]
			//,validator = 0
		this.width = parseInt (ptrn.exec (string)[1])
		this.strand = Array (parseInt (ptrn.exec (string)[1]))
		for (var i = 0; i < this.strand.length; i++) {
			this.strand[i] = new Shape (
				parseInt (ptrn.exec (string)[1]),
				parseInt (ptrn.exec (string)[1]),
				parseInt (ptrn.exec (string)[1]),
				parseFloat (ptrn.exec (string)[1]) * 255, 0
			)
			for (var j = 0; j < this.width * 2; j++)
				this.strand[i].verts.push (parseFloat (ptrn.exec (string)[1]))
		}
		return
	}
	this.strand = []
	this.width = width
	for (var i = length - 1; i >= 0; --i)
		this.strand.push (new Shape (0, 0, 0, 255, width))
}
DNA.prototype.dupe = function dupeDNA () {
	var result = new DNA (0, this.width)
	for (var i = 0; i < this.strand.length; ++i)
		result.strand.push (this.strand[i].dupe ())
	return result
}
DNA.prototype.changeLength = function changeDNALength (newLength) {
	//change dna length
	while (newLength > this.strand.length)
		this.strand.push (new Shape (0, 0, 0, 255, this.width))
	while (newLength < this.strand.length)
		this.strand.pop ()
}
DNA.prototype.changeWidth = function changeDNAWidth (newWidth) {
	//change dna width
	for (var i = this.strand.length - 1; i >= 0; --i)
		this.strand[i].changeWidth (newWidth)
	this.width = newWidth
}
DNA.prototype.toString = function serializeDNA () {
	// header
	var string =
		this.width + ' ' +
		this.strand.length

	// shapes
	for (var i = 0; i < this.strand.length; i++) {
		string += ' '
			+ this.strand[i].r + ' '
			+ this.strand[i].g + ' '
			+ this.strand[i].b + ' '
			+ this.strand[i].a / 255
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

var inputCtx = document.getElementById ('input-canvas').getContext ('2d')
	,testCtx = document.getElementById ('test-canvas').getContext ('2d')
	,bestCtx = document.getElementById ('best-canvas').getContext ('2d')

	,differenceOut = document.getElementById ('difference')
	,evolutionCountOut = document.getElementById ('evolution-count')
	,evolutionsPerSecondOut = document.getElementById ('evolutions-per-second')
	,consecutiveFailuresOut = document.getElementById ('consecutive-failures')

	,startButton = document.getElementById ('start')
	,pauseButton = document.getElementById ('stop')

	,numPolysInput = document.getElementById ('num-polys')
	,numVertsInput = document.getElementById ('num-verts')
	
	,elapsedTime = 0
	,startTime
	,evolutionTimer
	,bestDifference
	,evolutionCount
	,lastRateEval = {time: 0, evolutions: 0}
	,evolutionsPerSecond
	,consecutiveFailures

	,numComparators = 8
	,comparators

function initialize () {
	//add some random dna to start
	var newLength = parseInt (numPolysInput.value)
		,newWidth = parseInt (numVertsInput.value)
	bestDNA = new DNA (newLength, newWidth)
	bestDifference = 1e+300

	startTime = new Date ()
	elapsedTime = 0

	evolutionCount = 0
	consecutiveFailures = 0

	for (var i = 0; i < bestDNA.strand.length; i++) {
		var shape = bestDNA.strand[i]
		for (var j = 0; j < shape.verts.length; j += 2) {
			shape.verts[j] = Math.floor (Math.random () * bestCtx.canvas.width)
			shape.verts[j + 1] = Math.floor (Math.random () * bestCtx.canvas.height)
		}
	}

	drawDNA (bestCtx, bestDNA)
}

var testDNA
	,accumulatedDifference
	,pendingComparatorResponses

function evolutionStep () {
	// mutate dna
	testDNA = bestDNA.dupe ()
	var targetShapeIndex = Math.floor (Math.random () * testDNA.strand.length)
		,targetShape = testDNA.strand[targetShapeIndex]
		,verts = targetShape.verts
		,width = inputCtx.canvas.width
		,height = inputCtx.canvas.height

	if (Math.random()<=0.5)
	{
    //increase colour
    rand = Math.floor((Math.random() * 4) + 1);
    if (rand=1) {targetShape.r = clamp (targetShape.r + randSignedInt (15), 0, 255)}
    if (rand=2) {targetShape.g = clamp (targetShape.g + randSignedInt (15), 0, 255)}
    if (rand=3) {targetShape.b = clamp (targetShape.b + randSignedInt (15), 0, 255)}
    if (rand=4) {targetShape.a = clamp (targetShape.a + randSignedInt (15), 0, 255)}
	}
	else
	{
	//decrease colour
    rand = Math.floor((Math.random() * 4) + 1);
    if (rand=1) {targetShape.r = clamp (targetShape.r - randSignedInt (15), 0, 255)}
    if (rand=2) {targetShape.g = clamp (targetShape.g - randSignedInt (15), 0, 255)}
    if (rand=3) {targetShape.b = clamp (targetShape.b - randSignedInt (15), 0, 255)}
    if (rand=4) {targetShape.a = clamp (targetShape.a - randSignedInt (15), 0, 255)}
	}

	for (var i = verts.length; i > 0;) {
		// ITERATIONS ARE REVERSED
		verts[--i] = clamp (verts[i] + randSignedInt (5), 0, height) // Y
		verts[--i] = clamp (verts[i] + randSignedInt (5), 0, width) // X
	}

	// difference evaluation
	drawDNA (testCtx, testDNA)

	if (comparators) {
		var scan = 0
		accumulatedDifference = 0
		pendingComparatorResponses = comparators.length
		
		for (var i = comparators.length; i > 0; i--) {
			var slice = Math.floor ((width - scan) / i)
				,data = testCtx.getImageData (scan, 0, slice, height).data
			console.log (scan, slice)
			scan += slice

			comparators[i - 1].postMessage (data.buffer, [data.buffer])
		}
		return
	}

	var difference = 0
		,dataLength = width * height * 4
		,inputData = inputCtx.getImageData (0, 0, width, height).data
		,testData = testCtx.getImageData (0, 0, width, height).data

	for (var i = dataLength; i > 0;) {
		// ITERATIONS ARE REVERSED
		difference +=
			Math.abs (inputData[--i] - testData[i]) + // A
			Math.abs (inputData[--i] - testData[i]) + // B
			Math.abs (inputData[--i] - testData[i]) + // G
			Math.abs (inputData[--i] - testData[i])   // R
	}

	validateMutation (newDifference)
}

function comparatorResponse (event) {
	accumulatedDifference += event.data
	--pendingComparatorResponses
	if (pendingComparatorResponses == 0) 
		validateMutation (accumulatedDifference)
}

function validateMutation (newDifference) {
	//validate mutation
	++evolutionCount
	++consecutiveFailures
	if (newDifference < bestDifference) {
		bestDNA = testDNA
		bestDifference = newDifference
		drawDNA (bestCtx, bestDNA)
		consecutiveFailures = 0
		//export dna
		dnaboard = document.getElementById ('dnaboard')
		dnaboard.value = bestDNA
	}

	if (new Date () - lastRateEval.time >= 1000) {
		evolutionsPerSecond = evolutionCount - lastRateEval.evolutions
		lastRateEval.time += 1000
		lastRateEval.evolutions = evolutionCount
	}
	evolutionTimer = setTimeout (evolutionStep, 1)
}

function updateInfo () {
	//update information
	differenceOut.value = bestDifference
	evolutionCountOut.value = evolutionCount
	evolutionsPerSecondOut.value = evolutionsPerSecond
	consecutiveFailuresOut.value = consecutiveFailures
	if (evolutionTimer)
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
			+ shape.a / 255 + ')'
		ctx.moveTo (shape.x (0), shape.y (0))
		for (var j = 1; j < shape.verts.length / 2; j += 1)
			ctx.lineTo (shape.x (j), shape.y (j))
		ctx.fill ()
	}
}

numPolysInput.addEventListener ('change', function (event) {
	var newLength = parseInt (numPolysInput.value)
	bestDNA.changeLength (newLength)
	drawDNA (bestCtx, bestDNA)
})
numVertsInput.addEventListener ('change', function (event) {
	var newWidth = parseInt (numVertsInput.value)
	bestDNA.changeWidth (newWidth)
	drawDNA (bestCtx, bestDNA)
})


var imageInput = document.getElementById ('image-input')
	,reader = new FileReader ()
	,proxyImage = new Image ()

imageInput.addEventListener ('change', function (event) {
	reader.readAsDataURL (event.target.files[0])
}, false)
reader.addEventListener ('load', function (event) {
	proxyImage.src = event.target.result
})
proxyImage.addEventListener ('load', function (event) {
	//make hiddenstuff visible
	var div = document.getElementById('hiddenstuff');
	div.style.display = 'block';
	inputCtx.canvas.width =
	testCtx.canvas.width = // congestionCtx.canvas.width =
	bestCtx.canvas.width = event.target.width
	inputCtx.canvas.height = 
	testCtx.canvas.height = // congestionCtx.canvas.height =
	bestCtx.canvas.height = event.target.height
	// just in case we have transparent input
	inputCtx.clearRect (0, 0, event.target.width, event.target.height)
	inputCtx.drawImage (event.target, 0, 0)

	if (Worker) {
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
	}

	//add random dna to start with
	initialize ()

	//start evolution
	if (!evolutionTimer)
		evolutionTimer = setTimeout (evolutionStep, 0)
	else
		return

	satrtTime = new Date ()
	lastRateEval.time = + new Date ()

	updateInfo ()
})

//get buttons
var exportButton = document.getElementById ('b_export_dna')
	,exportSVGButton = document.getElementById ('b_export_svg')
	,importButton = document.getElementById ('b_import_dna')
	,clipboard = document.getElementById ('clipboard')


exportSVGButton.addEventListener ('click', function (event) {
	//export svg
	if (event.button != 0)
		return
	clipboard.value = bestDNA.toSVG ()
})
importButton.addEventListener ('click', function (event) {
	//import dna
	if (event.button != 0)
		return
	bestDNA = new DNA (clipboard.value)
	bestDifference = 1e+300
})
