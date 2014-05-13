
onmessage = function (event) {
	// mutate dna
	testDNA = bestDNA.dupe ()
	var targetShapeIndex = Math.floor (Math.random () * testDNA.strand.length)
		,targetShape = testDNA.strand[targetShapeIndex]
		,verts = targetShape.verts
		,width = inputCtx.canvas.width
		,height = inputCtx.canvas.height
	targetShape.r = clamp (targetShape.r + randSignedInt (15), 0, 255)
	targetShape.g = clamp (targetShape.g + randSignedInt (15), 0, 255)
	targetShape.b = clamp (targetShape.b + randSignedInt (15), 0, 255)
	targetShape.a = clamp (targetShape.a + randSignedInt (15), 0, 255)
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
	postMessage (dna)
}

