var albums = [];
var currentAlbum;
var scrollPosition = 0; // for restore when leaving detail view

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
			elem.innerHTML = albums[i].replace(/_/g, ' ');
			nav.appendChild(elem);
		}
	});
	

	getAlbum(albumName, function () {
		var albumElem = document.getElementById("album");
		albumElem.innerHTML = '';
		currentAlbum = JSON.parse(this.responseText);
		var photos = currentAlbum.photos;

		for (var key in photos) {
			var elem = document.createElement('div');
			elem.innerHTML = '\
				<a href="#' + albumName + '/' + key + '">\
					<p>Aperture: ' + photos[key].aperture +
						'&#x3000;ISO: ' + photos[key].iso +
						'&#x3000;Exposure: ' + photos[key].exposure + 
						'<br>Camera: ' + photos[key].camera + 
						'&#x3000;Date: ' + photos[key].createdAt + 
					'</p>\
					<img src="data/' + albumName + '/_resized_' + photos[key].name + '.jpg">\
				</a>';
			albumElem.appendChild(elem);
		}

		// Show selected photo, if necessary
		var photoElem = document.getElementById('photoOverlay');
		if (path.length > 1) {
			var photo = photos[path[1]];
			if (photo) {
				photoElem.innerHTML = '\
					<a href="#' + albumName + '">\
						<img src="data/' + albumName + '/' + photo.fileName + '">\
					</a>';
				var imageElem = photoElem.children[0].children[0];
				// Scale image according to orientation
				if (photo.width < photo.height) {
					imageElem.style.width = '90%';
					imageElem.style.height = 'auto';
				} else {
					imageElem.style.width = 'auto';
					imageElem.style.height = '90%';
				}
				photoElem.className = 'visible';
			}				
		} else {
			photoElem.innerHTML = '';
			photoElem.className = '';
			document.body.scrollTop = scrollPosition;
		}
	});
}

init();
window.onhashchange = init;
window.onscroll = function () { scrollPosition = document.body.scrollTop; };