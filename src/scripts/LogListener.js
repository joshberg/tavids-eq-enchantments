import Tail from 'always-tail';
import fs from 'fs';

var tail;
var isListenerRunning = false;
var buffer = [];
var lastLoc = {
    x: 0,
    y: 0
};
var dpsBuffer = [];
var peakDPS = 0;
var currentZone = '';

var dpsRegex = /You{1}\s(slash|bash|punch|kick|crush|pierce|strike)/g;
var timeStampRegex = /\[{1}.*\]{1}/g;
var locRegex = /Your Location is\s/g;
var loadingRegex = /You\shave\sentered\s/g


var StartLogListener = (logFile, playerName) => {
    console.log("Starting Log Listener: " + logFile);
    if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, "");
    tail = new Tail(logFile, '\n', {interval:500});
    tail.on('line', function (data) {
        buffer.push(data);
        if (buffer.length > 20) {
            buffer.splice(0, 1);
        }
        if (data.match(dpsRegex) || data.match(new RegExp("/" + playerName + ".+(critical|crippling).+\(\d+\)/g"))) {
            let moment = Date.now();
            let dmg = Number.parseInt(data.split(timeStampRegex)[1].match(/\d+/g)[0]);
            let hitData = {
                moment,
                dmg
            }
            if (dpsBuffer.length > 500) {
                dpsBuffer.shift();
            }
            dpsBuffer.push(hitData);
        }
        if (data.match(locRegex)) {
            let locData = data.split(timeStampRegex)[1].trim(); //Remove the timestamp
            let numbers = locData.match(/-*\d+\.\d+/g); //Find the numbers
            lastLoc.x = numbers[0];
            lastLoc.y = numbers[1];
        }
        if (data.match(loadingRegex)){
            let zoneText = data.split(loadingRegex)[1].trim();
            currentZone = zoneText.replace('.','');
        }
    });
    tail.on('error', function (data) {
        console.log("error:", data);
    });
    tail.watch();
    isListenerRunning = true;
};

var StopLogListener = () => {
    tail.unwatch();
    console.log("Log Listener is stopped!");
    isListenerRunning = false;
};

var isListening = () => {
    return isListenerRunning;
};

var getBuffer = () => {
    return buffer;
};

var getDpsBuffer = () => {
    return dpsBuffer;
};

var getPlayerDps = () => {
    //Clean buffer
    let totalDmg = 0;
    let count = 0;
    let totalAvg = 0;
    let totalCount = 0;
    let dps = 0;
    let avg = 0;
    let dpsObj = {
        peakDPS,
        current: dps,
        average: avg,
        sampleSize: count
    };
    if (dpsBuffer.length > 0) {
        for (let i = dpsBuffer.length - 1; i > -1; i--) {
            if (dpsBuffer[i].moment < Date.now() - 3000) { // DPS is over a 5 second span
                totalAvg += dpsBuffer[i].dmg;
                totalCount++;
            } else {
                count++;
                totalDmg += dpsBuffer[i].dmg;
            }
        }
        dps = totalDmg / 3; //Divide by number of seconds
        peakDPS = (peakDPS < dps ? dps : peakDPS);
        avg = totalAvg / totalCount;
        dpsObj.peak = Math.round(peakDPS*10)/10;
        dpsObj.current = Math.round(dps*10)/10;
        dpsObj.average = Math.round(avg*10)/10;
        return (dpsObj);
    } else {
        return dpsObj;
    }
};

var getLastLoc = () => {
    return lastLoc;
};

var getCurrentZone = () => {
    return currentZone;
};

module.exports = {
    StartLogListener,
    StopLogListener,
    isListening,
    getBuffer,
    getDpsBuffer,
    getLastLoc,
    getPlayerDps,
    getCurrentZone
}