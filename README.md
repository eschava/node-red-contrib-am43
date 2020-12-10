# node-red-contrib-am43

This Node-Red module contains single "AM43" node that controls AM43-based blinds motor using Bluetooth 4 compatible adapter.

## Installation

This module requires [noble](https://github.com/abandonware/noble) library. It will be installed automatically but in case 
of any problems you can try to install it manually using corresponding instructions.

To install this module use Node-Red GUI installer or console command:

```
npm install node-red-contrib-am43
```

## Usage

**Configuration:** AM43 node needs only bluetooth address of devices (optional, if it's omitted then an incoming message should have **address** property)

**Input message:** sends command to the device. Every input message should have _payload_ property with command to execute.  
Supported commands are:
* _open_ - opens blinds (0%)
* _close_ - closes blinds(100%)
* _stop_ - stops current action if any
* _number_ - number in percents to open blinds

Optional parameters:
* _address_ - override address of the device from configuration.
* _scan_ - re-lookup for the device even if it was already found before.

If _address_ configuration parameter is not specified then input message should have _address_ property.  
Node tries to connect to the device with the first received message.

**Output message:** Output message could contain next fields:
* _state_ - blinds state (OPEN/CLOSE)
* _position_ - blinds position in percents
* _battery_ - battery level in percents
* _light_ - brightness in percents (if sensor is connected, 0 otherwise)

## Linux

On Linux bluetooth adapter could be used by root user only. 

To run node-red without root/sudo use instructions from [noble](https://github.com/abandonware/noble#linux)


## Version history


0.1.0 Test release
