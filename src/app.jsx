import React from 'react';
import ToggleButton from 'react-toggle-button';

const Log = require('./scripts/LogListener');
const DB = require('./scripts/DB');
const { dialog } = require('electron').remote;
const Config = require('./scripts/Config');



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
      overlayDpsActive: false,
      overlayMapActive: false,
      overlaySpellTimersActive: false
    };

    Config.LoadConfig().then((data) => {
      this.setState(data);
      this.setState({
        bufferListenerInterval: {},
        dps: { peak: 0, average: 0, current: 0 },
        dpsInterval: {},
        locInterval: {},
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
    Log.StartLogListener(logFile, this.state.playerName);

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
      });
    }, 300);

    //Buffer Interval
    this.state.bufferListenerInterval = setInterval(() => {
      this.setState({
        bufferOutput: Log.getBuffer()
      });
    }, 500);
  }

  StopLogListener() {
    Log.StopLogListener();
    clearInterval(this.state.bufferListenerInterval);
    clearInterval(this.state.dpsInterval);
    clearInterval(this.state.locInterval);
    Config.SaveConfig(this.state);
  }


  render() {
    return (<div className="wrapper">
      <div className="scroll">
        <h2 className="centered">Tavid's EQ Enchantments</h2>
        <div className="pure-grid">
          <div className="pure-u-1-2">
            <div className="p1">
              <p>Welcome to Tavid's EQ Enchantments! Overlays can be toggled using the controls to the right.
                Below, you will find configuration tools to help you set up the overlays to better fit your visuals.
            <u>At a minimum</u>, you need to enter your player name, log path, and server name. Overlays will remain
            inactive and listener will not function until you do.</p>
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
                <h3 className="inline">DPS Overlay</h3>
                <ToggleButton
                  name="overlayDpsToggle"
                  value={this.state.overlayDpsActive || false}
                  onToggle={(value) => {
                    if (this.CheckBasicConfig())
                      this.setState({
                        overlayDpsActive: !value,
                      })
                    else
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
              <div className="centered">
                <button name="btnStartLogListener" className="pure-button m1" onClick={this.StartLogListener}>Start Log Listener</button>
                <button name="btnStopLogListener" className="pure-button m1" onClick={this.StopLogListener}>Stop Log Listener</button>
              </div>
            </div>
          </div>
          <div name="advancedConfig" className={this.state.showAdvancedConfig ? "pure-u-1-1" : "hidden"}>
            <div className="p1">
              <div className="pure-u-1-1">
                <h2 className="centered">Advanced Config</h2>
              </div>
            </div>
          </div>
          <div name="debuggingWindow" className={this.state.showDebugging ? "pure-u-1-1" : "hidden"}>
            <div className="p1">
              <div className="pure-u-1-3">
                <h2 className="centered">Listener Output (LastLoc)</h2>
                <div name="bufferOutputLastLoc" className="bordered" style={{minHeight: 3 + "em"}}>
                  <div className="pure-u-1-2"><b>X: </b>{this.state.lastLoc.x}</div>
                  <div className="pure-u-1-2"><b>Y: </b>{this.state.lastLoc.y}</div>
                  <div className="pure-u-1-1"><b>Zone: </b>{this.state.currentZone}</div>
                </div>
              </div>
              <div className="pure-u-2-3"><h2 className="centered">Listener Output (DPS)</h2>
                <div name="bufferDpsOutput" className="bordered" style={{minHeight: 4.8 + "em"}} >
                  <div className="pure-u-1-3"><b>DPS: </b>{this.state.dps.current}</div>
                  <div className="pure-u-1-3"><b>Avg Dmg: </b>{this.state.dps.average}</div>
                  <div className="pure-u-1-3"><b>Peak DPS: </b>{this.state.dps.peakDPS}</div>
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
    </div>);
  }
}