import React from 'react';
import ToggleButton from 'react-toggle-button';
const TransparencyMouseFix = require('electron-transparency-mouse-fix');
const ipcRenderer = require('electron').ipcRenderer;
const Web = require('../scripts/Web');
const fs = require('fs');
let remote = require('electron').remote;



export default class Map extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            lastLoc: {
                x: 0,
                y: 0
            },
            currentZone: 'eastcommons',
            mapZoom: 100,
            mapScrollPositionX: 0,
            mapScrollPositionY: 0,
            toggleMapPing: false,
            mapScaleInstructions: 0,
            BGColor: '#FFF',
            BGShow: true,
            Opacity: 255,
            TextSize: 12,
            TextColor: '#000',
        };

        ipcRenderer.on('mapProps', (event, data) => {
            let zone = this.state.currentZone;
            this.setState(data, ()=>{
                if(zone !== data.currentZone){
                    //The player has entered a new zone. Check if the map exists (it should load automatically)
                    if(!fs.existsSync('../../img/maps/Map_' + data.currentZone + '.jpg')){
                        //If map does not exist, load from the web.
                        Web.GetMapImage(data.currentZone).then((result)=>{
                            this.setState({currentZone: data.currentZone});
                        }).catch((err)=>{
                            console.log(err);
                        });
                    }
                }
            });
        });
    }

    componentDidMount() {
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
                }}><span name={"drag-handle"} id="drag-handle" className={"click-on"} style={{ position: "absolute", fontSize: 0.65 + "em", top: -1 + "px", left: 0 + "px" }}>&#8865;</span>
                    <div style={{ padding: 0.6 + "em" }}>
                        <div className="pure-grid" style={{ backgroundColor: "#AFDEFF" }}>
                            <div className="pure-u-1-3 bold">
                                <div name="currentZone" id="currentZone" className="" style={{ lineHeight: "2em" }}>
                                    {this.state.currentZone}
                                </div>
                            </div>
                            <div className="pure-u-2-3 bold click-on" style={{ textAlign: "right", lineHeight: "1.9em" }}>
                                <div style={{ display: "inline-flex" }}>
                                    <ToggleButton
                                        name="toggleMapPing"
                                        value={this.state.toggleMapPing || false}
                                        onToggle={(value) => {
                                            this.setState({
                                                toggleMapPing: !value,
                                            })
                                        }} />
                                </div>
                                <div name="mapZoomIn" className="pure-button" style={{ marginRight: "0.5em", marginLeft: "0.5em", padding: "5px" }}
                                    onClick={() => { this.setState({ mapZoom: this.state.mapZoom + 10 }); }}>
                                    +
                                </div>
                                <div name="mapZoomOut" className="pure-button" style={{ marginRight: "0.5em", padding: "5px" }}
                                    onClick={() => {
                                        if (this.state.mapZoom > 100)
                                            this.setState({ mapZoom: this.state.mapZoom - 10 });
                                    }}>
                                    -
                                </div>
                                <div name="mapZoomReset" className="pure-button" style={{ marginRight: "0.5em", padding: "5px" }}
                                    onClick={() => { this.setState({ mapZoom: 100 }); }}>
                                    0
                                </div>
                                <div name="mapSetScale" id="mapSetScale" className="pure-button" style={{ marginRight: "0.5em", padding: "5px" }}
                                    onClick={() => {
                                        //change zoneText to first instructions
                                        if (this.state.mapScaleInstructions == 0) {
                                            document.getElementById('currentZone').innerText = "Click on 0,0";
                                            document.getElementById('mapSetScale').innerText = "Cancel";
                                            //Change mouse to crosshairs
                                            let mapContainer = document.getElementById('mapContainer');
                                            mapContainer.style.cursor = "crosshair";
                                            this.setState({ mapScaleInstructions: 1 });
                                        } else {
                                            document.getElementById('currentZone').innerText = "East Commonlands";
                                            document.getElementById('mapSetScale').innerText = "Scale";
                                            document.getElementById('mapContainer').style.cursor = "normal";
                                            this.setState({ mapScaleInstructions: 0 });
                                        }

                                        //capture mouse click

                                        //change zoneText to second instructions

                                        //capture mouse click and return mouse to normal
                                    }}>
                                    Scale
                                </div>
                            </div>
                        </div>
                        <figure name="mapContainer" id="mapContainer" style={{ overflow: "scroll", maxHeight: this.state.configMapHeight - 60 + "px", marginLeft: "0px", width: "100%" }}>
                            <img style={{ height: this.state.mapZoom + "%", width: this.state.mapZoom + "%", overflow: "hidden" }} src={`../../img/maps/Map_${this.state.currentZone}.jpg`} />
                        </figure>
                    </div>
                </div>
            </div>
        );
    }
}