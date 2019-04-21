import React from 'react';
const TransparencyMouseFix = require('electron-transparency-mouse-fix');
const ipcRenderer = require('electron').ipcRenderer;
let remote = require('electron').remote;


export default class DPS extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            Current: 0,
            Average: 0,
            Peak: 0,
            TextSize: 12,
            BGColor: "#FFFFFF",
            Opacity: 80,
            TextColor: '#000000'
        };

        ipcRenderer.on('dpsProps', (event, data) => {
            this.setState(data);
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
                }}><span name={"drag-handle"} id="drag-handle" className={"click-on"} style={{ position: "absolute", fontSize: 0.65 + "em", top: -1 + "px", left: 0 + "px" }}>&#8865;</span>
                    <div className="click-through" style={{ padding: 0.6 + "em" }}>
                        DPS: <span style={{ float: "right" }}>{this.state.Current}</span><br />
                        Avg: <span style={{ float: "right" }}>{this.state.Average}</span><br />
                        Peak:<span style={{ float: "right" }}>{this.state.Peak}</span></div>
                </div>
            </div>
        );
    }
}