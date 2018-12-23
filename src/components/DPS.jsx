import React from 'react';
import { PassThrough } from 'stream';
const ipcRenderer = require('electron').ipcRenderer;

export default class DPS extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            Current: 0,
            Average: 0,
            Peak: 0,
            TextSize: 12,
            BGColor: "#FFFFFF",
            Opacity: 80
        };

        ipcRenderer.on('dpsProps', (event, data) => {
            this.setState(data);
        });
    }

    render() {
        return (
            <div className={"click-through"}>
                <div style={{
                    fontSize: (this.state.TextSize) + "pt",
                    backgroundColor: (this.state.BGShow ? this.state.BGColor : "#0000"),
                    opacity: (this.state.Opacity / 100)
                }}><span className={"click-on"} style={{ position: "absolute", fontSize: 0.65 + "em", top: -1 + "px", left: 0 + "px" }}>&#8865;</span>
                    <div className={"click-through"} style={{ padding: 0.6 + "em" }}>
                        DPS: <span style={{ float: "right" }}>{this.state.Current}</span><br />
                        Avg: <span style={{ float: "right" }}>{this.state.Average}</span><br />
                        Peak:<span style={{ float: "right" }}>{this.state.Peak}</span></div>
                </div>
            </div>
        );
    }
}