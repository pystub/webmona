function clamp (value, min, max) {
	return Math.max (min, Math.min (max, value))
}
function randInt (n) {
	return Math.floor (Math.random () * n)
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
		var data = arguments[0].split (/\s/)
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
	while (newLength > this.strand.length)
		this.strand.push (new Shape (0, 0, 0, 255, this.width))
	while (newLength < this.strand.length)
		this.strand.pop ()
}
DNA.prototype.changeWidth = function changeDNAWidth (newWidth) {
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

	,fitnessOut = document.getElementById ('fitness')
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
	,maximumDifference
	,bitsPP = 4
	,evolutionCount
	,lastRateEval = {time: 0, evolutions: 0}
	,evolutionsPerSecond
	,consecutiveFailures

function initialize () {
	var newLength = parseInt (numPolysInput.value)
		,newWidth = parseInt (numVertsInput.value)
		,width = inputCtx.canvas.width
		,height = inputCtx.canvas.height
	bestDNA = new DNA (newLength, newWidth)
	bestDifference = 1e+300
	// TODO: detect transparent/grayscale images and update bitsPP
	maximumDifference = width * height * bitsPP * 255

	startTime = new Date ()
	elapsedTime = 0

	evolutionCount = 0
	consecutiveFailures = 0

	for (var i = 0; i < bestDNA.strand.length; i++) {
		var shape = bestDNA.strand[i]
		for (var j = 0; j < shape.verts.length; j += 2) {
			shape.verts[j] = randInt (bestCtx.canvas.width)
			shape.verts[j + 1] = randInt (bestCtx.canvas.height)
		}
	}

	drawDNA (bestCtx, bestDNA)
}

function startEvolution () {
	if (!evolutionTimer)
		evolutionTimer = setInterval (evolutionStep, 0)

	satrtTime = new Date ()

	startButton.classList.add ('unvisible')
	pauseButton.classList.remove ('unvisible')

	lastRateEval.time = + new Date ()

	updateInfo ()
}
function pauseEvolution () {
	clearInterval (evolutionTimer)
	evolutionTimer = null

	elapsedTime += (new Date ()) - startTime

	pauseButton.classList.add ('unvisible')
	startButton.classList.remove ('unvisible')
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

function evolutionStep () {
	var rr = Math.random ()
		,operation
	if (rr < 0.9)
		operation = CHANGE_SHAPE
	else if (rr < 0.95)
	 	operation = NULL_CONTRIBUTION_CHECK
	else
		operation = MOVE_SHAPE_TO_TOP

	// mutation
	var testDNA = bestDNA.dupe ()
		,targetShapeIndex = randInt (testDNA.strand.length)
		,targetShape = testDNA.strand[targetShapeIndex]
		,verts = targetShape.verts
		,width = inputCtx.canvas.width
		,height = inputCtx.canvas.height
		,success = false

	switch (operation) {
	case CHANGE_SHAPE:
		if (rr < 0.4) {
			targetShape.r = clamp (targetShape.r + randSignedInt (15), 0, 255)
			targetShape.g = clamp (targetShape.g + randSignedInt (15), 0, 255)
			targetShape.b = clamp (targetShape.b + randSignedInt (15), 0, 255)
			targetShape.a = clamp (targetShape.a + randSignedInt (15), 0, 255)
		}
		else if (rr < 0.8) {
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

	var difference = compareContextData (inputCtx, testCtx)

	// validation
	switch (operation) {
	case CHANGE_SHAPE:
	case MOVE_SHAPE_TO_TOP:
		if (difference < bestDifference) {
			success = true
			bestDifference = difference
		}
		break

	case NULL_CONTRIBUTION_CHECK:
		if (difference == bestDifference) {
			success = true
			bestDifference = 1e+300
			targetShape.r = randInt (255)
			targetShape.g = randInt (255)
			targetShape.b = randInt (255)
			targetShape.a = randInt (255)
			for (var i = verts.length; i > 0;) {
				// ITERATIONS ARE REVERSED
				verts[--i] = randInt (height) // Y
				verts[--i] = randInt (width) // X
			}
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
		evolutionsPerSecond = evolutionCount - lastRateEval.evolutions
		lastRateEval.time += 1000
		lastRateEval.evolutions = evolutionCount
	}

}

function updateInfo () {
	var fitness = (maximumDifference - bestDifference) / maximumDifference
	fitnessOut.value = (fitness * 100).toFixed (2) + '%'
	evolutionCountOut.value = evolutionCount
	evolutionsPerSecondOut.value = evolutionsPerSecond
	consecutiveFailuresOut.value = consecutiveFailures
	if (evolutionTimer)
		requestAnimationFrame (updateInfo)
}

function drawDNA (ctx, dna) {
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

startButton.addEventListener ('click', startEvolution)
pauseButton.addEventListener ('click', pauseEvolution)

numPolysInput.addEventListener ('change', function (event) {
	var newLength = parseInt (numPolysInput.value)
	bestDNA.changeLength (newLength)
	drawDNA (bestCtx, bestDNA)
	bestDifference = 1e+300
})
numVertsInput.addEventListener ('change', function (event) {
	var newWidth = parseInt (numVertsInput.value)
	bestDNA.changeWidth (newWidth)
	drawDNA (bestCtx, bestDNA)
	bestDifference = 1e+300
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
	inputCtx.canvas.width =
	testCtx.canvas.width = // congestionCtx.canvas.width =
	bestCtx.canvas.width = event.target.width
	inputCtx.canvas.height = 
	testCtx.canvas.height = // congestionCtx.canvas.height =
	bestCtx.canvas.height = event.target.height
	// just in case we have transparent input
	inputCtx.clearRect (0, 0, event.target.width, event.target.height)
	inputCtx.drawImage (event.target, 0, 0)

	initialize ()
})

var exportButton = document.getElementById ('b_export_dna')
	,exportSVGButton = document.getElementById ('b_export_svg')
	,importButton = document.getElementById ('b_import_dna')
	,clipboard = document.getElementById ('clipboard')

exportButton.addEventListener ('click', function (event) {
	if (event.button != 0)
		return
	clipboard.value = bestDNA
})
exportSVGButton.addEventListener ('click', function (event) {
	if (event.button != 0)
		return
	clipboard.value = bestDNA.toSVG ()
})
importButton.addEventListener ('click', function (event) {
	if (event.button != 0)
		return
	bestDNA = new DNA (clipboard.value)
	drawDNA (bestCtx, bestDNA)
	bestDifference = 1e+300
})
