var albums = [];
var currentAlbum;
var currentPhoto;
var scrollPosition = 0; // for restore when leaving detail view

var photoElem = document.getElementById('photoOverlay');

function get(url, callback) {
	var r = new XMLHttpRequest();
	r.onload = callback;
	r.open('get', 'http://holo.codexfons.net:9000' + url, true);
	r.send();
}

function getAlbums(callback) {
	get('/album', callback);
}

function getAlbum(id, callback) {
	get('/album/' + id, callback);
}

function previousPhoto() {
	var photoNames = Object.keys(currentAlbum.photos)
	var photoIndex = photoNames.indexOf(currentPhoto.name);
	if (currentPhoto && (photoIndex >= 1)) {
		window.location.hash = '#' + currentAlbum.name + '/'
			+ currentAlbum.photos[photoNames[photoIndex - 1]].name;
	}
}

function nextPhoto() {
	var photoNames = Object.keys(currentAlbum.photos)
	var photoIndex = photoNames.indexOf(currentPhoto.name);
	if (currentPhoto && (photoIndex < photoNames.length - 1)) {
		window.location.hash = '#' + currentAlbum.name + '/'
			+ currentAlbum.photos[photoNames[photoIndex + 1]].name;
	}
}

function closeOverlay() {
	if (currentPhoto) {
		window.location.hash = '#' + currentAlbum.name;
	}
}

function doKeyNavigation(e) {
	switch (e.keyCode) {
	case 27: // ESC
		closeOverlay();
		break;
	case 37: // arrow left
		previousPhoto();
		break;
	case 39: // arrow right
		nextPhoto();
		break;
	}
	return false;
}

function init() {
	var path = window.location.hash.substring(1).split('/');
	var albumName = path[0];
	if (albumName) {
		document.title = albumName.replace(/_/g, ' ') + ' - Photon';
	} else {
		document.title = 'Photon';
	}

	getAlbums(function () {
		var nav = document.getElementById('nav');
		nav.innerHTML = '';
		albums = JSON.parse(this.responseText);
		for (var i = 0; i < albums.length; i++) {
			var elem = document.createElement('a');
			if (albums[i] == albumName) {
				elem.className = 'activeAlbum';
			}
			elem.href = '#' + albums[i];
			elem.innerHTML = albums[i].replace(/_/g, '&nbsp;');
			nav.appendChild(elem);
			// Space between links to allow proper line breaks
			nav.appendChild(document.createTextNode(' '));
		}
	});
	
	var albumElem = document.getElementById('album');		
	getAlbum(albumName, function () {
		albumElem.innerHTML = '';
		currentAlbum = JSON.parse(this.responseText);
		var photos = currentAlbum.photos;

		for (var key in photos) {
			var elem = document.createElement('div');
			var createdAt = new Date(photos[key].createdAt);
			elem.innerHTML = '\
				<a href="#' + albumName + '/' + key + '">\
					<p>Aperture: ' + photos[key].aperture +
						'&#x3000;ISO: ' + photos[key].iso +
						'&#x3000;Exposure: ' + photos[key].exposure + ' sec.' + 
						'<br>Focal length: ' + photos[key].focalLength + ' mm' +
						'&#x3000;Camera: ' + photos[key].camera + 
						'<br>Date: ' + createdAt.toString().split('(')[0] + 
					'</p>\
					<img src="data/' + albumName + '/_resized_' + photos[key].name + '.jpg">\
				</a>';
			albumElem.appendChild(elem);
		}

		// Show selected photo, if necessary
		if (path.length > 1) {
			// Blur album
			albumElem.className = 'hidden';

			currentPhoto = photos[path[1]];
			if (currentPhoto) {
				photoElem.innerHTML = '\
					<a href="#' + albumName + '">\
						<img src="data/' + albumName + '/' + currentPhoto.fileName + '">\
					</a>';
				var imageElem = photoElem.children[0].children[0];
				imageElem.onload = function () {
					// Scale image according to orientation
					if (imageElem.width > imageElem.height) {
						imageElem.className = 'landscape';
					} else {
						imageElem.className = 'portrait';
					}
					imageElem.style.display = 'block';
				};
				photoElem.className = 'visible';
			}				
		} else {
			currentPhoto = undefined;
			albumElem.className = '';
			photoElem.innerHTML = '';
			photoElem.className = '';
			document.body.scrollTop = scrollPosition;
		}
	});
}

init();
window.onhashchange = init;
window.onscroll = function () { scrollPosition = document.body.scrollTop; };
window.onkeyup = doKeyNavigation;
Hammer(photoElem).on('swipeleft', function () { nextPhoto(); });
Hammer(photoElem).on('swiperight', function () { previousPhoto(); });

