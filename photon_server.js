var http = require('http'),
	journey = require('journey'),
	fs = require('fs'),
	im = require('imagemagick');

// Configuration:
var config = {
	origin: 'http://photo.codexfons.com',
	port: 9000,
	albumBase: 'data',
	persistData: true
};

var albums = {};

function evalDivision(term) {
	var parts = term.split('/');
	if (parts.length < 2) return parseInt(parts[0]);
	return parseInt(parts[0]) / parseInt(parts[1]);
}

function _updateAlbumPhotos(albumName, callback) {
	var albumPath = config.albumBase + '/' + albumName;
	var fileNames = fs.readdirSync(albumPath);
	var pendingImages = fileNames.length;
	var pendingImageIds = [];
	for (var i = 0; i < fileNames.length; i++) {
		var fname = fileNames[i];
		var stat = fs.statSync(albumPath + '/' + fname);
		
		// Disregard files starting with underscore and non-images
		if (stat.isDirectory() ||
			(fname[0] == '_') ||
			(['jpg', 'png', 'gif'].indexOf(
				fname.substring(fname.length - 3).toLowerCase()) < 0)) {
			pendingImages--;
			continue;
		}

		var id = fname.substring(0, fname.length - 4);

		albums[albumName].photos[id] = {
			name: id,
			fileName: fname
		};

		// Read metadata
		pendingImageIds.push(id);
		im.readMetadata(albumPath + '/' + fname, function(err, metadata) {
			var id = pendingImageIds.splice(0, 1);
			if (err) console.log(err)
			else {
				albums[albumName].photos[id].width = metadata.exif.imageWidth;
				albums[albumName].photos[id].height = metadata.exif.imageLength;
				albums[albumName].photos[id].aperture = 'f/' + evalDivision(metadata.exif.fNumber);
				albums[albumName].photos[id].iso = metadata.exif.isoSpeedRatings;
				albums[albumName].photos[id].exposure = metadata.exif.exposureTime;
				albums[albumName].photos[id].focalLength = evalDivision(metadata.exif.focalLength);
				albums[albumName].photos[id].camera = metadata.exif.model;
				albums[albumName].photos[id].createdAt = metadata.exif.dateTimeOriginal;
			}
			pendingImages--;
			if (callback && (pendingImages < 1)) callback();
		});

		// Generate thumbnail, if necessary
		if (fileNames.indexOf('_resized_' + id + '.jpg') < 0) {
			im.resize({
				srcPath: albumPath + '/' + fname,
				dstPath: albumPath + '/_resized_' + id + '.jpg',
				quality: 1.0,
				width: 400
			});
		}
	}
}

function getAlbums(callback) {
	var dirtyFlag = false;
	var existingAlbums = Object.keys(albums);
	var albumNames = fs.readdirSync(config.albumBase).sort();
	var pendingAlbums = albumNames.length;
	for (var i = 0; i < albumNames.length; i++) {
		var albumName = albumNames[i];
		var albumStat = fs.statSync(config.albumBase + '/' + albumName);
		if (!albumStat.isDirectory()) {
			pendingAlbums--;
			continue;
		}

		existingAlbums.splice(existingAlbums.indexOf(albumName), 1);
		if ((!albums[albumName]) ||
			(albums[albumName].lastUpdate < albumStat.mtime)) {
			// Either nonexistent or outdated => update album record
			albums[albumName] = {
				name: albumName,
				lastUpdate: albumStat.mtime,
				createdAt: albumStat.ctime,
				photos: {}
			};

			_updateAlbumPhotos(albumName, function () {
				if (callback && (pendingAlbums < 1)) callback();
			});
			dirtyFlag = true;
		}
		pendingAlbums--;
	}

	// Remove deleted albums
	for (var i = 0; i < existingAlbums.length; i++) {
		delete albums[existingAlbums[i]];
		dirtyFlag = true;
	}

	// Write to file if changes were made
	if (dirtyFlag && config.persistData) {
		fs.writeFile('cache.dat', JSON.stringify(albums));
	}

	if (callback && (pendingAlbums < 1)) callback();
}

exports.createRouter = function () {
	var router = new (journey.Router)({
		strict: false,
		strictUrls: false,
		api: 'basic'
	});

	router.path(/\/album/, function () {
		var headers = {
			"Access-Control-Allow-Origin": config.origin
		};

		// GET /album (album list)
		this.get().bind(function (res) {
			getAlbums(function () {
				res.send(200, headers, Object.keys(albums));
			});
		});

		// GET /album/:id (photo list for album)
		this.get(/\/([\w|\d|\-|\s|\%]+)/).bind(function (res, id) {
			getAlbums(function () {
				if (!albums[id]) {
					res.send(404, headers, {error: 'album not found'});
				} else {
					res.send(200, headers, albums[id]);
				}
			});
		});
	});

	return router;
};

exports.createServer = function () {
	// Try to load archived album data, then update (or rebuild) it.
	if (config.persistData && fs.readdirSync('.').indexOf('cache.dat') > -1) {
		albums = JSON.parse(fs.readFileSync('cache.dat'));
	}
	getAlbums();

	var router = exports.createRouter();
	var server = http.createServer(function (request, response) {
		var body = '';

		request.on('data', function (chunk) {
			body += chunk;
		});

		request.on('end', function () {
			router.handle(request, body, function (route) {
				response.writeHead(route.status, route.headers);
				response.end(route.body);
			});
		});
	});

	server.listen(config.port);

	return server;
};

exports.createServer();
