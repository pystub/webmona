
numImagesInput = document.getElementById('num-image');
numberOfImages = parseInt (numImagesInput.value);
galleryDiv = document.getElementById('gallery');
window.onload = function(e)
{
	//loop for number of images to get
	for (var i=0; i<22; i++)
		{
			//get imageid for (next)best % match from database
			//get gallery(imageid) from imgur
			//add image to gallery div html
			galleryDiv.innerHTML += 'original';
			//get svg(imageid) from database
			//add svg to gallery div html
			galleryDiv.innerHTML += 'render';
		}
}