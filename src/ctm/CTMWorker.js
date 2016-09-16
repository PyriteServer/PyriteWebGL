/* eslint-disable */
// Disable ES LINT Because external (Three.js)

importScripts('lzma.js', 'ctm.js');

self.onmessage = function (event) {
	                                    const files = [];

	                                        for (let i = 0; i < event.data.offsets.length; i++) {
		                                    const stream = new CTM.Stream(event.data.data);
		                                        stream.offset = event.data.offsets[i];

		                                        files[i] = new CTM.File(stream);
	}

	                                        self.postMessage(files);
	                                        self.close();
};
