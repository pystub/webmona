var refData
onmessage = function (event) {
	//compare images
	var newData = new Uint8ClampedArray (event.data)

	if (!refData || refData.length != newData.length) {
		refData = newData
		return
	}

	var delta = 0
	for (var i = refData.length; i > 0;) {
		// tricky reverse cycles again
		delta +=
			Math.abs (refData[--i] - newData[i]) + // A
			Math.abs (refData[--i] - newData[i]) + // B
			Math.abs (refData[--i] - newData[i]) + // G
			Math.abs (refData[--i] - newData[i])   // R
	}


	postMessage (delta)
}