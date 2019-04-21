import React from 'react';
import ToggleButton from 'react-toggle-button';

const Log = require('./scripts/LogListener');
const DB = require('./scripts/DB');
const { dialog } = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const Config = require('./scripts/Config');

let regexConfigDps = /configDps/;
let lastUpdate;



export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      logDirectory: '',
      playerName: '',
      serverName: 'project1999',
      showAdvancedConfig: false,
      showDebugging: false,

      bufferOutput: [],
      bufferListenerInterval: {},

      dps: { peak: 0, average: 0, current: 0 },
      dpsInterval: {},

      lastLoc: {
        x: 0,
        y: 0
      },
      locInterval: {},
      currentZone: '',
      mapZoom: 100,
      mapScrollPositionX: 0,
      mapScrollPositionY: 0,
      toggleMapPing: false,
      mapScaleInstructions: 0,

      mobInfoInterval: {},
      mobInfoTarget: '',

      logListenerActive: false,
      overlayDpsActive: false,
      overlayMapActive: false,
      overlaySpellTimersActive: false,
      overlayMobInfoActive: false,

      configDpsWidth: 300,
      configDpsHeight: 230,
      configDpsX: 50,
      configDpsY: 50,
      configDpsBG: "#FFFFFF",
      configDpsBGshow: true,
      configDpsOpacity: 100,
      configDpsTextColor: "#000000",
      configDpsTextSize: 12,

      configMobInfoLookupCommand: "You say, \"Look at %t\"",
      configMobInfoWidth: 400,
      configMobInfoHeight: 450,
      configMobInfoX: 50,
      configMobInfoY: 50,
      configMobInfoBG: "#FFFFFF",
      configMobInfoBGshow: true,
      configMobInfoOpacity: 100,
      configMobInfoTextColor: "#000000",
      configMobInfoTextSize: 12,

      configMapWidth: 500,
      configMapHeight: 400,
      configMapX: 50,
      configMapY: 50,
      configMapBG: "#FFFFFF",
      configMapBGshow: true,
      configMapOpacity: 100,
      configMapTextColor: "#000000",
      configMapTextSize: 12,

      configSpellTimersWindowWidth: 400,
      configSpellTimersWindowHeight: 400,
      configSpellTimersWindowX: 50,
      configSpellTimersWindowY: 50,
      configSpellTimersWindowBG: "#FFFFFF",
      configSpellTimersWindowBGshow: true,
      configSpellTimersWindowOpacity: 100,
      configSpellTimersWindowTextColor: "#000000",
      configSpellTimersWindowTextSize: 12
    };

    Config.LoadConfig().then((data) => {
      lastUpdate = Date.now();
      this.setState(data);
      this.setState({
        bufferListenerInterval: {},
        dps: { peak: 0, average: 0, current: 0 },
        dpsInterval: {},
        locInterval: {},
        logListenerActive: false,
        overlayDpsActive: false,
        overlayMapActive: false,
        overlaySpellTimersActive: false,
        overlayMobInfoActive: false
      })
    }).catch((err) => {
      console.log(err);
    });

    //Bind functions
    this.logDirectory = this.logDirectory.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.StartLogListener = this.StartLogListener.bind(this);
    this.StopLogListener = this.StopLogListener.bind(this);
    this.CheckBasicConfig = this.CheckBasicConfig.bind(this);

  }

  logDirectory() {
    var file = dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    this.setState({ logDirectory: file });
  }
  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    }, () => {
      if (lastUpdate < Date.now() - 20000)
        Config.SaveConfig(this.state);
    });
  }

  CheckBasicConfig() {
    if (this.state.playerName.length > 0 &&
      this.state.serverName.length > 0 &&
      this.state.logDirectory.length > 0)
      return true;
    else return false;
  }

  StartLogListener() {
    if (!this.CheckBasicConfig()) {
      alert('Cannot start listener. Fields are missing!');
      return false;
    }
    Config.SaveConfig(this.state);
    const logFile = this.state.logDirectory + '\\eqlog_' + this.state.playerName + '_' + this.state.serverName + '.txt';
    let listenerOptions = {
      playerName: this.state.playerName,
      mobInfoLookupCommand: this.state.configMobInfoLookupCommand
    }
    Log.StartLogListener(logFile, listenerOptions);

    //LocInterval
    this.state.locInterval = setInterval(() => {
      this.setState({
        lastLoc: Log.getLastLoc(),
        currentZone: Log.getCurrentZone()
      });
    }, 1000);


    //DPS Interval
    this.state.dpsInterval = setInterval(() => {
      this.setState({
        dps: Log.getPlayerDps()
      }, () => {
        let configDps = {
          Width: parseInt(this.state.configDpsWidth),
          Height: parseInt(this.state.configDpsHeight),
          X: parseInt(this.state.configDpsX),
          Y: parseInt(this.state.configDpsY),
          BGColor: this.state.configDpsBG,
          BGShow: this.state.configDpsBGshow,
          TextSize: parseInt(this.state.configDpsTextSize),
          TextColor: this.state.configDpsTextColor,
          Opacity: parseInt(this.state.configDpsOpacity),
          Current: parseFloat(this.state.dps.current),
          Average: parseFloat(this.state.dps.average),
          Peak: parseFloat(this.state.dps.peak)
        }
        ipcRenderer.send('overlayDpsUpdate', configDps);
      });
    }, 300);


    //Buffer Interval
    this.state.bufferListenerInterval = setInterval(() => {
      this.setState({
        bufferOutput: Log.getBuffer()
      });
    }, 500);

    //Mob Info Interval
    this.state.mobInfoInterval = setInterval(() => {
      if (this.state.mobInfoTarget != Log.getMobInfoTarget()) {
        this.setState({
          mobInfoTarget: Log.getMobInfoTarget()
        }, () => {
          let configMobInfo = {
            Width: parseInt(this.state.configMobInfoWidth),
            Height: parseInt(this.state.configMobInfoHeight),
            X: parseInt(this.state.configMobInfoX),
            Y: parseInt(this.state.configMobInfoY),
            BGColor: this.state.configMobInfoBG,
            BGShow: this.state.configMobInfoBGshow,
            TextSize: parseInt(this.state.configMobInfoTextSize),
            TextColor: this.state.configMobInfoTextColor,
            Opacity: parseInt(this.state.configMobInfoOpacity),
            mobInfoTarget: this.state.mobInfoTarget
          }
          ipcRenderer.send('overlayMobInfoUpdate', configMobInfo);
        });
      }
    }, 500);
  }

  StopLogListener() {
    Log.StopLogListener();
    clearInterval(this.state.bufferListenerInterval);
    clearInterval(this.state.dpsInterval);
    clearInterval(this.state.locInterval);
    clearInterval(this.state.mobInfoInterval);
    Config.SaveConfig(this.state);
  }

  convertAlpha(value) {
    let hexString = value.toString(16);
    if (hexString.length % 2) {
      hexString = '0' + hexString;
    }
    return hexString;
  }

  render() {
    return (<div className="wrapper">
      <div className="scroll">
        <h2 className="centered">Tavid's EQ Enchantments</h2>
        <div className="pure-grid">
          <div className="pure-u-1-2">
            <div className="p1">
              <p>Welcome to Tavid's EQ Enchantments! Overlays can be toggled using the controls to the right.
                Below, you will find configuration tools to help you set up the overlays to better fit your visuals. <u>
                  At a minimum</u>, you need to enter your player name, log path, and server name.</p>
              <div className="flex-between underline">
                <h3 className="inline">Show Advanced Configuration</h3>
                <ToggleButton
                  name="showAdvancedConfigToggle"
                  value={this.state.showAdvancedConfig || false}
                  onToggle={(value) => {
                    this.setState({
                      showAdvancedConfig: !value,
                    })
                  }} />
              </div>
              <div className="flex-between underline">
                <h3 className="inline">Show Debugging Output</h3>
                <ToggleButton
                  name="showDebuggingToggle"
                  value={this.state.showDebugging || false}
                  onToggle={(value) => {
                    this.setState({
                      showDebugging: !value,
                    })
                  }} />
              </div>
            </div>
          </div>
          <div className="pure-u-1-2">
            <div className="p1">
              <div className="flex-between underline">
                <h3 className="inline">Log Listener</h3>
                <ToggleButton
                  name="logListenerToggle"
                  value={this.state.logListenerActive || false}
                  onToggle={(value) => {
                    if (this.CheckBasicConfig()) {
                      if (this.state.logListenerActive) {
                        this.StopLogListener();
                      } else {
                        this.StartLogListener();
                      }
                      this.setState({
                        logListenerActive: !value,
                      })
                    } else
                      alert('Cannot activate listnener. Basic config incomplete!');
                  }} />
              </div>
              <div className="flex-between underline">
                <h3 className="inline">DPS Overlay</h3>
                <ToggleButton
                  name="overlayDpsToggle"
                  value={this.state.overlayDpsActive || false}
                  onToggle={(value) => {
                    if (this.CheckBasicConfig()) {
                      this.setState({
                        overlayDpsActive: !value,
                      });
                      let configDps = {
                        Width: parseInt(this.state.configDpsWidth),
                        Height: parseInt(this.state.configDpsHeight),
                        X: parseInt(this.state.configDpsX),
                        Y: parseInt(this.state.configDpsY),
                        BGColor: this.state.configDpsBG,
                        BGShow: this.state.configDpsBGshow,
                        Opacity: parseInt(this.state.configDpsOpacity),
                        TextSize: parseInt(this.state.configDpsTextSize),
                        TextColor: this.state.configDpsTextColor,
                        Current: 0,
                        Average: 0,
                        Peak: 0
                      }
                      ipcRenderer.send('overlayToggleDPS', configDps);
                    } else
                      alert('Cannot activate overlay. Basic config incomplete!');
                  }} />
              </div>
              <div className="flex-between underline">
                <h3 className="inline">Map Overlay</h3>
                <ToggleButton
                  name="overlayMapToggle"
                  value={this.state.overlayMapActive || false}
                  onToggle={(value) => {
                    if (this.CheckBasicConfig())
                      this.setState({
                        overlayMapActive: !value,
                      })
                    else
                      alert('Cannot activate overlay. Basic config incomplete!');
                  }} />
              </div>
              <div className="flex-between underline">
                <h3 className="inline">Spell Timers Overlay</h3>
                <ToggleButton
                  name="overlaySpellTimersToggle"
                  value={this.state.overlaySpellTimersActive || false}
                  onToggle={(value) => {
                    if (this.CheckBasicConfig())
                      this.setState({
                        overlaySpellTimersActive: !value,
                      })
                    else
                      alert('Cannot activate overlay. Basic config incomplete!');
                  }} />
              </div>
              <div className="flex-between underline">
                <h3 className="inline">Mob Info Overlay</h3>
                <ToggleButton
                  name="overlayMobInfoToggle"
                  value={this.state.overlayMobInfoActive || false}
                  onToggle={(value) => {
                    if (this.CheckBasicConfig()) {
                      this.setState({
                        overlayMobInfoActive: !value,
                      })
                      let configMobInfo = {
                        Width: parseInt(this.state.configMobInfoWidth),
                        Height: parseInt(this.state.configMobInfoHeight),
                        X: parseInt(this.state.configMobInfoX),
                        Y: parseInt(this.state.configMobInfoY),
                        BGColor: this.state.configMobInfoBG,
                        BGShow: this.state.configMobInfoBGshow,
                        TextSize: parseInt(this.state.configMobInfoTextSize),
                        TextColor: this.state.configMobInfoTextColor,
                        Opacity: parseInt(this.state.configMobInfoOpacity),
                        mobInfoTarget: this.state.mobInfoTarget
                      }
                      ipcRenderer.send('overlayMobInfoToggle', configMobInfo);
                    } else
                      alert('Cannot activate overlay. Basic config incomplete!');
                  }} />
              </div>
            </div>
          </div>
          <div className="pure-u-1-1">
            <h2 className="centered">Basic Configuration</h2>
            <div className="bordered m1">
              <form className="pure-form pure-form-aligned m1">
                <div className="pure-control-group-fill">
                  <label htmlFor="playerName">Player Name:</label>
                  <input name="playerName" type="text" value={this.state.playerName} onChange={this.handleInputChange} />
                </div>
                <div className="pure-control-group-fill">
                  <label htmlFor="inputDirectory">Everquest Logs Path (i.e. C:\Evequest\Logs):</label>
                  <input name="inputDirectory" type="text" onClick={this.logDirectory} value={this.state.logDirectory} />
                </div>
                <div className="pure-control-group-fill">
                  <label htmlFor="inputServerName">Server Name:</label>
                  <input name="serverName" type="text" value={this.state.serverName} onChange={this.handleInputChange} />
                </div>
                <div className="pure-control-group-fill">
                  <label htmlFor="resultLogName">Expected Log File:</label>
                  <input name="logName" type="text" value={this.state.logDirectory + '\\eqlog_' + this.state.playerName + '_' + this.state.serverName + '.txt'} disabled />
                </div>
              </form>
            </div>
          </div>
          <div name="advancedConfig" className={this.state.showAdvancedConfig ? "pure-u-1-1" : "hidden"}>
            <div className="p1">
              <div className="pure-u-1-1">
                <h2 className="centered">Advanced Config</h2>
              </div>

              <div className="pure-u-1-2">
                <h3 className="centered">DPS Overlay Settings</h3>
                <div className="pure-u-1-1">
                  <div className="bordered">
                    <form className="pure-form pure-form-aligned m1">
                      <div className="pure-control-group-fill">
                        <label htmlFor="configDpsWidth">Width:</label>
                        <input name="configDpsWidth" type="number" value={this.state.configDpsWidth} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configDpsHeight">Height:</label>
                        <input name="configDpsHeight" type="number" value={this.state.configDpsHeight} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configDpsX">X:</label>
                        <input name="configDpsX" type="number" value={this.state.configDpsX} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configDpsY">Y:</label>
                        <input name="configDpsY" type="number" value={this.state.configDpsY} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configDpsBG">BGColor:</label>
                        <input name="configDpsBG" type="color" value={this.state.configDpsBG} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configDpsBGshow">Show BG:</label>
                        <ToggleButton
                          name="configDpsBGshow"
                          value={this.state.configDpsBGshow || false}
                          onToggle={(value) => {
                            this.setState({
                              configDpsBGshow: !value,
                            })
                          }} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configDpsOpacity">Opacity:</label>
                        <input name="configDpsOpacity" type="range" min={10} max={100} value={this.state.configDpsOpacity} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configDpsTextSize">TextSize:</label>
                        <input name="configDpsTextSize" type="number" value={this.state.configDpsTextSize} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configDpsTextColor">TextColor:</label>
                        <input name="configDpsTextColor" type="color" value={this.state.configDpsTextColor} onChange={this.handleInputChange} />
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="pure-u-1-2">
                <h3 className="centered">DPS Overlay Preview</h3>
                <div className="bordered" style={{ minHeight: 20 + "em" }}>
                  <div className="bordered" style={
                    {
                      height: (this.state.configDpsHeight) + "px",
                      width: (this.state.configDpsWidth) + "px",
                      position: "relative",
                      left: (this.state.configDpsX / 50) + "em",
                      top: (this.state.configDpsY / 50) + "em",
                      fontSize: (this.state.configDpsTextSize) + "pt",
                      backgroundColor: (this.state.configDpsBGshow ? this.state.configDpsBG : "#0000"),
                      opacity: (this.state.configDpsOpacity / 100),
                      color: (this.state.configDpsTextColor)
                    }}><span style={{ position: "absolute", fontSize: 0.65 + "em", top: -1 + "px", left: 0 + "px" }}>&#8865;</span>
                    <div style={{ padding: 0.6 + "em" }}>
                      DPS: <span style={{ float: "right" }}>10.34</span><br />
                      Avg: <span style={{ float: "right" }}>20.34</span><br />
                      Peak:<span style={{ float: "right" }}>142</span></div>
                  </div>
                </div>
              </div>
              <div className="pure-u-1-2">
                <h3 className="centered">Mob Info Settings</h3>
                <div className="pure-u-1-1">
                  <div className="bordered">
                    <form className="pure-form pure-form-aligned m1">
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMobInfoLookupCommand">Lookup Text:<br />(Must include %t, suggested is <br />"/say Look at %t.")</label>
                        <textarea name="configMobInfoLookupCommand" value={this.state.configMobInfoLookupCommand} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMobInfoWidth">Width:</label>
                        <input name="configMobInfoWidth" type="number" value={this.state.configMobInfoWidth} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMobInfoHeight">Height:</label>
                        <input name="configMobInfoHeight" type="number" value={this.state.configMobInfoHeight} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMobInfoX">X:</label>
                        <input name="configMobInfoX" type="number" value={this.state.configMobInfoX} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMobInfoY">Y:</label>
                        <input name="configMobInfoY" type="number" value={this.state.configMobInfoY} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMobInfoBG">BGColor:</label>
                        <input name="configMobInfoBG" type="color" value={this.state.configMobInfoBG} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMobInfoBGshow">Show BG:</label>
                        <ToggleButton
                          name="configMobInfoBGshow"
                          value={this.state.configMobInfoBGshow || false}
                          onToggle={(value) => {
                            this.setState({
                              configMobInfoBGshow: !value,
                            })
                          }} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMobInfoOpacity">Opacity:</label>
                        <input name="configMobInfoOpacity" type="range" min={10} max={100} value={this.state.configMobInfoOpacity} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMobInfoTextSize">TextSize:</label>
                        <input name="configMobInfoTextSize" type="number" value={this.state.configMobInfoTextSize} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMobInfoTextColor">TextColor:</label>
                        <input name="configMobInfoTextColor" type="color" value={this.state.configMobInfoTextColor} onChange={this.handleInputChange} />
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="pure-u-1-2">
                <h3 className="centered">Mob Info Overlay Preview</h3>
                <div className="bordered" style={{ minHeight: 28 + "em" }}>
                  <div className="bordered" style={
                    {
                      height: (this.state.configMobInfoHeight) + "px",
                      width: (this.state.configMobInfoWidth) + "px",
                      position: "relative",
                      left: (this.state.configMobInfoX / 50) + "em",
                      top: (this.state.configMobInfoY / 50) + "em",
                      fontSize: (this.state.configMobInfoTextSize) + "pt",
                      backgroundColor: (this.state.configMobInfoBGshow ? this.state.configMobInfoBG : "#0000"),
                      opacity: (this.state.configMobInfoOpacity / 100),
                      color: (this.state.configMobInfoTextColor)
                    }}><span style={{ position: "absolute", fontSize: 0.65 + "em", top: -1 + "px", left: 0 + "px" }}>&#8865;</span>
                    <div style={{ padding: 0.6 + "em", lineHeight: 1.25 + "em" }}>
                      <div name="mobTitle" className="centered bold" style={{ backgroundColor: "#AFDEFF" }}>
                        a bull elephant
                      </div>
                      <div style={{ marginLeft: 1 + "em", marginRight: 1 + "em" }}>
                        <b>Race: </b>Animal<br />
                        <b>Class: </b>Warrior<br />
                        <b>Level: </b>20-24<br />
                      </div>
                      <div className="centered bold" style={{ backgroundColor: "#EBEAFC" }}>
                        Spawn
                      </div>
                      <div style={{ marginLeft: 1 + "em", marginRight: 1 + "em" }}>
                        <b>Zone: </b>Southern Karana<br />
                        <b>Location: </b>Wander<br />
                      </div>
                      <div className="centered bold" style={{ backgroundColor: "#EBEAFC" }}>
                        Stats
                      </div>
                      <div style={{ marginLeft: 1 + "em", marginRight: 1 + "em" }}>
                        <b>AC: </b> 142<br />
                        <b>HP: </b> 551 (595,657)<br />
                        <b>Dmg/Hit: </b> 1 - 38<br />
                        <b>Attacks/Round: </b> 1<br />
                        <b>Special: </b>None
                      </div>
                      <div className="centered bold" style={{ backgroundColor: "#EBEAFC" }}>
                        Known Loot
                      </div>
                      <div className={"click-on"} style={{ fontSize: 0.8 + "em", overflowY: 'scroll', minHeight: 8 + 'em', maxHeight: 8 + 'em', pointerEvents: 'all' }}>
                        <ul><li>* None</li></ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pure-u-1-2">
                <h3 className="centered">Map Settings</h3>
                <div className="pure-u-1-1">
                  <div className="bordered">
                    <form className="pure-form pure-form-aligned m1">
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMapWidth">Width:</label>
                        <input name="configMapWidth" type="number" value={this.state.configMapWidth} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMapHeight">Height:</label>
                        <input name="configMapHeight" type="number" value={this.state.configMapHeight} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMapX">X:</label>
                        <input name="configMapX" type="number" value={this.state.configMapX} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMapY">Y:</label>
                        <input name="configMapY" type="number" value={this.state.configMapY} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMapBG">BGColor:</label>
                        <input name="configMapBG" type="color" value={this.state.configMapBG} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMapBGshow">Show BG:</label>
                        <ToggleButton
                          name="configMapBGshow"
                          value={this.state.configMapBGshow || false}
                          onToggle={(value) => {
                            this.setState({
                              configMapBGshow: !value,
                            })
                          }} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMapOpacity">Opacity:</label>
                        <input name="configMapOpacity" type="range" min={10} max={100} value={this.state.configMapOpacity} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMapTextSize">TextSize:</label>
                        <input name="configMapTextSize" type="number" value={this.state.configMapTextSize} onChange={this.handleInputChange} />
                      </div>
                      <div className="pure-control-group-fill">
                        <label htmlFor="configMapTextColor">TextColor:</label>
                        <input name="configMapTextColor" type="color" value={this.state.configMapTextColor} onChange={this.handleInputChange} />
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="pure-u-1-2">
                <h3 className="centered">Map Overlay Preview</h3>
                <div className="bordered" style={{ minHeight: 28 + "em" }}>
                  <div className="bordered" style={
                    {
                      height: (this.state.configMapHeight) + "px",
                      width: (this.state.configMapWidth) + "px",
                      position: "relative",
                      left: (this.state.configMapX / 50) + "em",
                      top: (this.state.configMapY / 50) + "em",
                      fontSize: (this.state.configMapTextSize) + "pt",
                      backgroundColor: (this.state.configMapBGshow ? this.state.configMapBG : "#0000"),
                      opacity: (this.state.configMapOpacity / 100),
                      color: (this.state.configMapTextColor)
                    }}><span style={{ position: "absolute", fontSize: 0.65 + "em", top: -1 + "px", left: 0 + "px" }}>&#8865;</span>
                    <div style={{ padding: 0.6 + "em" }}>
                      <div className="pure-grid" style={{ backgroundColor: "#AFDEFF" }}>
                        <div className="pure-u-1-3 bold">
                          <div name="currentZone" id="currentZone" className="" style={{ lineHeight: "2em" }}>
                            East Commonlands
                          </div>
                        </div>
                        <div className="pure-u-2-3 bold" style={{ textAlign: "right", lineHeight: "1.9em" }}>
                          <div style={{display:"inline-flex"}}>
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
                                document.getElementById('mapContainer').style.cursor = "default";
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
                        <img style={{ height: this.state.mapZoom + "%", width: this.state.mapZoom + "%", overflow: "hidden" }} src="../img/maps/Map_eastcommons.jpg" />
                      </figure>

                    </div>
                  </div>
                </div>
              </div>


            </div>
          </div>
          <div name="debuggingWindow" className={this.state.showDebugging ? "pure-u-1-1" : "hidden"}>
            <div className="p1">
              <div className="pure-u-1-3">
                <h2 className="centered">Listener Output (LastLoc)</h2>
                <div name="bufferOutputLastLoc" className="bordered" style={{ minHeight: 3 + "em" }}>
                  <div className="pure-u-1-2"><b>X: </b>{this.state.lastLoc.x}</div>
                  <div className="pure-u-1-2"><b>Y: </b>{this.state.lastLoc.y}</div>
                  <div className="pure-u-1-1"><b>Zone: </b>{this.state.currentZone}</div>
                </div>
              </div>
              <div className="pure-u-2-3"><h2 className="centered">Listener Output (DPS)</h2>
                <div name="bufferDpsOutput" className="bordered" style={{ minHeight: 4.8 + "em" }} >
                  <div className="pure-u-1-3"><b>DPS: </b>{this.state.dps.current}</div>
                  <div className="pure-u-1-3"><b>Avg Dmg: </b>{this.state.dps.average}</div>
                  <div className="pure-u-1-3"><b>Peak DPS: </b>{this.state.dps.peak}</div>
                </div>
              </div>
              <div className="pure-u-1-1"><h2 className="centered">Listener Output (Main Buffer)</h2>
                <div name="bufferOutput" className="bordered" style={{ minHeight: 17.8 + "em", maxHeight: 17.8 + "em", overflowY: "scroll", overflowX: "hidden" }}>
                  <pre>
                    {this.state.bufferOutput.join('\n')}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >);
  }


}