import React from 'react';

const TransparencyMouseFix = require('electron-transparency-mouse-fix');

const ipcRenderer = require('electron').ipcRenderer;
const mobs = require('../scripts/DB').mobs;
const Web = require('../scripts/Web');

//check mobs database for mob tables
let dbCheck = mobs.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='mobs';`).get();
if (dbCheck == null || dbCheck == undefined) {
    //Initialize mob data table.
    let tableDef = `
        CREATE TABLE mobs(
            name TEXT NOT NULL,
            race TEXT,
            class TEXT,
            level TEXT,
            zone TEXT,
            location TEXT,
            ac TEXT,
            hp TEXT,
            agro_radius TEXT,
            dmgPerHit TEXT,
            attacksPerRound TEXT,
            special TEXT,
            date TEXT,
            mobInfoTarget TEXT,
            known_loot TEXT
        );
    `
    mobs.prepare(tableDef).run();
}


let mobData = {
    name: 'a bull elephant',
    race: 'Animal',
    class: 'Warrior',
    level: '20-24',
    zone: 'Southern Karana',
    location: 'Wander',
    ac: '142',
    hp: '551 (595,657)',
    dmgPerHit: '1 - 38',
    attacksPerRound: '1',
    special: '',
    known_loot: ""
}

export default class MobInfo extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            TextSize: 12,
            BGColor: "#FFFFFF",
            Opacity: 80,
            TextColor: '#000000',
            mobInfoTarget: '',
            mobData
        };

        ipcRenderer.on('mobInfoProps', (event, data) => {
            this.setState(data, () => {
                //Do the search and force render based on data.mobInfoTarget
                //Check if the mob exists in the mob database
                data.mobInfoTarget = data.mobInfoTarget.split(' ').join('_');
                if (data.mobInfoTarget !== undefined && data.mobInfoTarget !== '') {
                    ipcRenderer.send('logme', 'Mob Info Window searching for ' + data.mobInfoTarget);
                    let searchQuery = `SELECT * FROM mobs WHERE mobInfoTarget = ?`;
                    let searchResult = mobs.prepare(searchQuery).get(data.mobInfoTarget);
                    ipcRenderer.send('logme', searchResult);
                    if (searchResult == null || searchResult == undefined) {
                        //Mob did not exist, get it from web (autostores to db), update mobData, force render.
                        Web.GetMobInfo(data.mobInfoTarget).then(() => {
                            searchResult = mobs.prepare(searchQuery).get(data.mobInfoTarget);
                            this.setState({ mobData: searchResult });
                        }).catch((err) => {
                            //already handled.
                        });
                    } else {
                        /*Mob did exist, 
                            check the retrieval date
                            if now is greater than retrieval date by 30 days
                            get an updated version,
                            else
                            display the db version */
                        let checkDate = new Date();
                        checkDate.setDate(checkDate.getDate() - 30);
                        if (new Date(searchResult.date) < checkDate) {
                            Web.GetMobInfo(data.mobInfoTarget).then(() => {
                                searchResult = mobs.prepare(searchQuery).get(data.mobInfoTarget);
                                this.setState({ mobData: searchResult });
                            }).catch((err) => {
                                //already handled.
                            });
                        } else {
                            this.setState({ mobData: searchResult });
                        }
                    }
                }
            });
        });

    }

    componentDidMount(){
        const fix = new TransparencyMouseFix({
            log: true,
            fixPointerEvents: 'auto'
        })
    };

    render() {
        return (
            <div>
                <div style={{
                    fontSize: (this.state.TextSize) + "pt",
                    backgroundColor: (this.state.BGShow ? this.state.BGColor : "#0000"),
                    opacity: (this.state.Opacity / 100),
                    color: (this.state.TextColor)
                }}><span name="drag-handle" id="drag-handle" className="click-on" style={{ position: "absolute", fontSize: 0.65 + "em", top: -1 + "px", left: 0 + "px" }}>&#8865;</span>
                    <div className="click-through" style={{ padding: 0.6 + "em", lineHeight: 1.25 + "em" }}>
                        <div name="mobTitle" className="centered bold" style={{ backgroundColor: "#AFDEFF" }}>
                            {this.state.mobData.name}
                        </div>
                        <div style={{ marginLeft: 1 + "em", marginRight: 1 + "em" }}>
                            <b>Race: </b>{this.state.mobData.race}<br />
                            <b>Class: </b>{this.state.mobData.class}<br />
                            <b>Level: </b>{this.state.mobData.level}<br />
                        </div>
                        <div className="centered bold" style={{ backgroundColor: "#EBEAFC" }}>
                            Spawn
                        </div>
                        <div style={{ marginLeft: 1 + "em", marginRight: 1 + "em" }}>
                            <b>Zone: </b>{this.state.mobData.zone}<br />
                            <b>Location: </b>{this.state.mobData.location}<br />
                        </div>
                        <div className="centered bold" style={{ backgroundColor: "#EBEAFC" }}>
                            Stats
                        </div>
                        <div style={{ marginLeft: 1 + "em", marginRight: 1 + "em" }}>
                            <b>AC: </b>{this.state.mobData.ac}<br />
                            <b>HP: </b>{this.state.mobData.hp}<br />
                            <b>Dmg/Hit: </b>{this.state.mobData.dmgPerHit}<br />
                            <b>Attacks/Round: </b>{this.state.mobData.attacksPerRound}<br />
                            <b>Special: </b>{this.state.mobData.special}
                        </div>
                        <div className="centered bold" style={{ backgroundColor: "#EBEAFC" }}>
                            Known Loot
                        </div>
                        <div className={"click-on"} style={{ fontSize: 0.8 + "em", overflowY: 'scroll', maxHeight: 8 + 'em', pointerEvents: 'all' }} dangerouslySetInnerHTML={{ __html: this.state.mobData.known_loot }}></div>
                    </div>
                </div>
            </div>
        );
    }
}