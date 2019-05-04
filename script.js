let connected = false
let launch = false
let rocket1 = true
let time = [0, 0, 0]
let timeDisplay
let r1Button
let r2Button
let overlay
let incrementButtons
let rocketButtons
let timerTimer
let controlButton
let connectButton
let characteristicCache = null;
let deviceCache = null;


window.onload = function() {
    r1Button = document.getElementById("rocket1")
    r2Button = document.getElementById("rocket2")

    incrementButtons = document.getElementsByClassName("increment")
    rocketButtons = document.getElementsByClassName("chooserButton")

    overlay = document.getElementById("overlay")

    timeDisplay = [document.getElementById("centiseconds"), document.getElementById("seconds"), document.getElementById("minutes")]
    timeDisplay.forEach(element => {
        element.innerHTML = "00"
    })
}

function updateDisplay(){
    time.forEach(function(element, i) {
        if(element < 10){
            timeDisplay[i].innerHTML = "0" + element.toString()
        } else {
            timeDisplay[i].innerHTML = time[i]
        }
    })
}

function toggleConnect(e) {
    connectButton = e
    if(connected) {
        disconnect()
        connected = false
        e.innerHTML = "Connect"
        overlay.setAttribute("style", "display: block")
    } else {
        connect()
        connected = true
        e.innerHTML = "Disconnect"
        overlay.setAttribute("style", "display: none")
    }
}
function toggleRocket(e) {
    if(e.id == "rocket1"){
        rocket1 = true
        r1Button.classList.add("active")
        r2Button.classList.remove("active")
    } else {
        rocket1 = false
        r1Button.classList.remove("active")
        r2Button.classList.add("active")
    }
    console.log("rocket1: " + rocket1)
}
function toggleLaunch(e) {
    launch = !launch
    controlButton = e
    if(launch) {
        e.innerHTML = "Abort"
        timerTimer = setInterval(updateTimer, 10)
        for(element of incrementButtons) {
            element.setAttribute("style", "opacity: 0")
            element.disabled = true
        }
        for(element of rocketButtons){
            element.disabled = true
            element.classList.remove("CBhoverable")
        }
    } else {
        e.innerHTML = "Launch"
        clearInterval(timerTimer)
        for(element of incrementButtons) {
            element.setAttribute("style", "opacity: 1")
            element.disabled = false
        }
        for (element of rocketButtons) {
            element.disabled = false
            element.classList.add("CBhoverable")
        }
    }
}
function updateTimer(){
    countTime(0, -1)
    updateDisplay()
}
function incrementTime(units, value) {
    let i = 0
    switch(units) {
        case "minutes":
            i = 2
            break
        case "seconds":
            i = 1
            break
        case "centiseconds":
            i = 0
            break
    }
    countTime(i, value)
    updateDisplay()
    console.log(time[2] + " " + time[1] + " " + time[0])
}
function countTime(i, value) {
    console.log(i)
    let base = 100
    if(i != 0){
        base = 60
    }
    time[i] += value
    if(time[i] < 0) {
        time[i] += base
        if(time[i + 1] > 0 || time[i + 2] > 0) {
            console.log("BORROW")
            countTime(i + 1, -1)
        } else {
            console.log("ZERO")
            time[0] = 0
            time[1] = 0
            time[2] = 0
            TimeUP()
        }
    } else if(time[i] >= base) {
        time[i] -= base
        if(i != 2) {
            countTime(i + 1, 1)
        } else {
            time[2] = 60
        }
    }
}
function TimeUP() {
    if(launch) {
        console.log(launch)
        controlButton.innerHTML = "Reset"
        clearInterval(timerTimer)
        send("L")
        if(rocket1) {
            send("T")
        } else {
            send("F")
        }
    }
}

function connect() {
    return (deviceCache ? Promise.resolve(deviceCache) :
        requestBluetoothDevice()).
        then(device => connectDeviceAndCacheCharacteristic(device)).
        catch(error => {
            console.log(error);
            connected = false
            connectButton.innerHTML = "Connect"
            overlay.setAttribute("style", "display: block")
        })
}
function requestBluetoothDevice() {
    //
    console.log('Requesting bluetooth device...');

    return navigator.bluetooth.requestDevice({
        filters: [{ services: [0xFFE0] }],
    }).
        then(device => {
            console.log('"' + device.name + '" bluetooth device selected')
            deviceCache = device

            return deviceCache
        });
}
function connectDeviceAndCacheCharacteristic(device) {
    //
    if (device.gatt.connected && characteristicCache) {
        return Promise.resolve(characteristicCache)
    }

    console.log('Connecting to GATT server...')

    return device.gatt.connect().
        then(server => {
            console.log('GATT server connected, getting service...')

            return server.getPrimaryService(0xFFE0);
        }).
        then(service => {
            console.log('Service found, getting characteristic...')

            return service.getCharacteristic(0xFFE1)
        }).
        then(characteristic => {
            console.log('Characteristic found');
            characteristicCache = characteristic

            return characteristicCache;
        });
}
function writeToCharacteristic(characteristic, data) {
    characteristic.writeValue(new TextEncoder().encode(data));
}
function send(data) {
    //
    data = String(data);

    if (!data || !characteristicCache) {
        return;
    }

    writeToCharacteristic(characteristicCache, data);
    console.log(data, 'out');
}
function disconnect() {
    //
    if (deviceCache) {
        console.log('Disconnecting from "' + deviceCache.name + '" bluetooth device...');
        //deviceCache.removeEventListener('gattserverdisconnected', handleDisconnection);

        if (deviceCache.gatt.connected) {
            deviceCache.gatt.disconnect();
            console.log('"' + deviceCache.name + '" bluetooth device disconnected');
        }
        else {
            console.log('"' + deviceCache.name +
                '" bluetooth device is already disconnected');
        }
    }
    characteristicCache = null;
    deviceCache = null;
}