const Crawler = require('crawler');
const DB = require('./DB');
const request = require('request');
const fs = require('fs');
const p99root = "https://wiki.project1999.com/";
const mobInfoItems = ['AC',
    'agro_radius', 'attack_speed', 'attacks_per_round', 'class', 'damage_per_hit',
    'HP', 'HP_regen', 'level', 'mana_regen', 'name', 'race', 'respawn_time',
    'run_speed', 'special', 'zone', 'location', 'known_loot'
];

const ipcRenderer = require('electron').ipcRenderer;

var GetMapImage = (currentZone) => {
    ipcRenderer.send('logme', 'CurrentZone: ' + currentZone);
    let lookup = currentZone.split(' ').join('_');
    return new Promise((resolve, reject) => {
        //First get the image url by looking up the zone using the crawler
        var c = new Crawler({
            maxConnections: 1,
            rateLimit: 1000,
            callback: function (err, res, done) {
                if (err) {
                    ipcRenderer.send('logme', err);
                    reject(err);
                } else {
                    var $ = res.$; //jquery insertion.
                    let source = $('#wpTextbox1').text();
                    let target = source.split('== Map ==')[1].split('[[Image:')[1].split('.jpg')[0];
                    let writeStream = fs.createWriteStream('..\\..\\img\\maps\\' + currentZone + '.jpg');
                    writeStream.on('open', (fd)=>{
                        request.get(p99root + 'images/' + target + '.jpg')
                        .on('error', (error) => {
                            ipcRenderer.send('logme', 'GetMapImageError: ' + error);
                            reject(error);
                        })
                        .on('close', () => {
                            resolve(true);
                        }).pipe(writeStream);
                    });                   
                }
            }
        })
        c.queue({
            url: p99root + "index.php?title=" + lookup + "&action=edit"
        })
    });
};

var GetMobInfo = (target) => {
    ipcRenderer.send('logme', 'SearchTarget: ' + target);
    target = target.split(' ').join('_');
    let secondAttempt = false;
    return new Promise((resolve, reject) => {
        var c = new Crawler({
            maxConnections: 1,
            rateLimit: 1000,
            callback: function (err, res, done) {
                //parse res.body for the mob info box information.
                let mob = {};
                if (err) {
                    ipcRenderer.send('logme', err);
                    reject(err);
                } else {
                    var $ = res.$; //Jquery insertion
                    //Get the inner text from the text area
                    let source = $('#wpTextbox1').text();
                    if (source.includes('REDIRECT')) {
                        if (secondAttempt)
                            reject('Lookup Failed');
                        let newTarget = source.split(':')[1].split(']')[0].split(' ').join('_');
                        c.queue({
                            url: p99root + "index.php?title=" + newTarget + "&action=edit"
                        });
                        secondAttempt = true;
                        done();
                    } else {
                        //Parse source and add characteristics to the mob object.
                        let lines = source.split('|');
                        lines.shift();
                        for (let k = 0; k < lines.length; k++) {
                            let splitLine = lines[k].split('=');
                            let key = splitLine[0].trim();
                            if (mobInfoItems.indexOf(key) > -1) {
                                let value;
                                if (splitLine[1] === undefined) {
                                    value = '';
                                } else if (splitLine.length > 2) {
                                    splitLine.shift();
                                    splitLine[splitLine.length - 1] = splitLine[splitLine.length - 1].substring(0, splitLine[splitLine.length - 1].indexOf('}}'));
                                    value = splitLine.join('=');
                                } else {
                                    value = splitLine[1].trim();
                                }
                                mob[key] = value;
                            }
                        }
                        //Insert mob into the database:
                        let keys = Object.keys(mob);
                        for (let i = 0; i < keys.length; i++) {
                            if (mob[keys[i]].match(/[']/g)) {
                                mob[keys[i]] = mob[keys[i]].replace(/[']/g, `''`);
                            }
                            if (mob[keys[i]].match(/[{{:}}]/g)) {
                                mob[keys[i]] = mob[keys[i]].replace(/[{{:}}\[\]]/g, '');
                            }
                        }
                        let insert =
                            `INSERT INTO mobs(name, race, class, level,
                            zone, location, ac, hp,
                            agro_radius, dmgPerHit, attacksPerRound,
                            special, date, mobInfoTarget, known_loot)
                        VALUES ('${mob.name + `','` + mob.race + `','` + mob.class + `','` + mob.level + `','` +
                            mob.zone + `','` + mob.location + `','` + mob.AC + `','` + mob.HP + `','` + 
                            mob.agro_radius + `','` + mob.damage_per_hit + `','` + mob.attacks_per_round + `','` + 
                            mob.special + `','` + new Date().toISOString().replace('T',' ').replace('Z','') + `','` + target + `','` + mob.known_loot}');`
                        const info = DB.mobs.prepare(insert).run();
                        ipcRenderer.send('logme', mob);
                        ipcRenderer.send('logme', info);
                        resolve(true);
                    }
                }
            }
        })
        c.queue({
            url: p99root + "index.php?title=" + target + "&action=edit"
        })
    });
}

module.exports = {
    GetMobInfo,
    GetMapImage
}