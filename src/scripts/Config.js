const fs = require('fs');

var SaveConfig = (state) => {
    fs.writeFile("../../config", JSON.stringify(state), (err) => {
        if (err)
            alert("Configuration was unable to save!\n" + err);
    });
}

var LoadConfig = () => {
    let state;
    return new Promise((resolve, reject) => {
        fs.exists("../../config", (err) => {
            fs.readFile("../../config", {
                    encoding: "utf-8"
                },
                (err, data) => {
                    if (err) {
                        alert(err);
                        reject(false);
                    } else {
                        state = JSON.parse(data);
                        resolve(state);
                    }
                });
        });
    });
}

module.exports = {
    SaveConfig,
    LoadConfig
}