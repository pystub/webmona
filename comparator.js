//ref data variable
var refData;
onmessage = function (event) {
	//compare images
	//new data variable
	var newData = new Uint8ClampedArray (event.data);
	//if no ref data 
	if (!refData || refData.length != newData.length) 
		{
			//set ref data to new data
			refData = newData;
			return;
		}
	var delta = 0
	for (var i = refData.length; i > 0;) 
		{
			// tricky reverse cycles again
			delta += Math.abs (refData[--i] - newData[i]) 
			+ Math.abs (refData[--i] - newData[i]) 
			+ Math.abs (refData[--i] - newData[i]) 
			+ Math.abs (refData[--i] - newData[i]);
		}
	//post message back to main script
	postMessage (delta)
}
