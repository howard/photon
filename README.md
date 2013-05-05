Photon
======

A minimalist filesystem-based photo gallery.
Works well with modern browsers for desktop and mobile.

This software may be used according to the terms of the BSD license.

Check out the [demo](http://photo.codexfons.com/).


Install
-------

	$ git clone https://github.com/howard/photon.git
	$ nodejs photon_server.js

The server requires Journey and Imagemagick.
It has been tested on a Debian Sid server, but should run just as well on any other Unix-like operating system.
Windows support is not tested.

Before running the server, you should adjust the configuration in photon_server.js, which starts at line 7.
You should also adjust line 9 in script.js with the URL of your server.
Other than that, things should work out of the box.


Usage
-----

In your desired photo storage location, create folders for each album.
Take care that the folder names contain only letters, numbers, dashes, and underscores.
Underscores should be used as substitute for spaces, and are displayed as spaces in Photon.
Place your photos in JPEG format (using the .jpg file ending) in the appropriate folders.
The next time the server receives a request, it will notice that files were updated and start collecting information about the albums and the photos.
If thumbnails are not present yet, they will be generated.
The whole process may take some time, which is why it happens only when something changes.

Most of those conventions can be circumvented by editing the source code.
