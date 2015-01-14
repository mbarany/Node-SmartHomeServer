var fs = require('fs');
var rootDir = require('path').dirname(__dirname);

var nconf = require('../config');


var dist = rootDir + '/dist/';
var crontabUser = nconf.get('crontab:user');

fs.readFile(rootDir + '/config/crontab', function (err, buffer) {
    var data = buffer.toString();

    data = data.replace(/\$\{ROOT_DIR}/g, rootDir);
    data = data.replace(/\$\{USER}/g, crontabUser);

    fs.writeFile(dist + 'crontab', data);
});
