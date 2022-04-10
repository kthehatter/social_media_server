const multer = require('multer');


module.exports = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req, file, cb) => {

        // The function should call `cb` with a boolean
        // to indicate if the file should be accepted
        
        if (file&&!file.mimetype.match(/png||jpeg||jpg||mp4||gif$i/)) {
            // You can always pass an error if something goes wrong:
            cb(new Error('File does not support'), false);
            return;
        }

        // To accept the file pass `true`, like so:
        cb(null, true);
    }
});