var fs = require('fs');
var rootDir = require('path').dirname(__dirname);


var dist = rootDir + '/dist/';

fs.readFile(rootDir + '/config/crontab', function (err, data) {
    var output = data.toString().replace('${ROOT_DIR}', rootDir);

    fs.writeFile(dist + 'crontab', output);
});
