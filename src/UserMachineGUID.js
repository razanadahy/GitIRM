const os = require('os');
const Registry = require('winreg');

function getUserMachineGUID() {
    return new Promise((resolve, reject) => {
        const regKey = new Registry({
            hive: Registry.HKLM,
            key: '\\SOFTWARE\\Microsoft\\Cryptography'
        });

        regKey.get('MachineGuid', (error, item) => {
            if (error) {
                resolve({ pcName: os.hostname(), guid: "" });
            } else {
                resolve({ pcName: os.hostname(), guid: item.value });
            }
        });
    });
}

module.exports = getUserMachineGUID;
