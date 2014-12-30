var fs = require('fs');
var rootDir = require('path').dirname(__dirname);


var dist = rootDir + '/dist/';

fs.readFile(rootDir + '/config/crontab', function (err, buffer) {
    var pattern = /\$\{ROOT_DIR}/g;
    var data = buffer.toString();
    var output = data.replace(pattern, rootDir);

    fs.writeFile(dist + 'crontab', output);
});
