    const path = require('path');

    const fs = require('fs');
    
    //helper function to delete image
    const clearImage = filePath => {
        filePath = path.join(__dirname, '..', filePath);
        fs.unlink(filePath, err => console.log(err));
    };

    exports.clearImage = clearImage;