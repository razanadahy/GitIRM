const Service = require('node-windows').Service;

const svc = new Service({
    name: 'PointageService',
    description: 'service Windows de pointage',
    script: require('path').join(__dirname, 'PowerMonitor.js')
});

svc.install( function() {
    svc.start();
});
