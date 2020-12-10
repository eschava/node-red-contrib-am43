module.exports = function(RED) {
    "use strict";

    const noble = require('@abandonware/noble');
    const am43 = require('am43-ctrl/src/am43');
	
    function Am43Node(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        function sendCommand(command, error) {
            if (typeof command == 'string' && command.toLowerCase() == 'open')
                node.device.am43Open();
            else if (typeof command == 'string' && command.toLowerCase() == 'close')
                node.device.am43Close();
            else if (typeof command == 'string' && command.toLowerCase() == 'stop')
                node.device.am43Stop();
            else if (!isNaN(parseInt(command, 10)) && !isNaN(command - 0))
                node.device.am43GotoPosition(parseInt(command, 10))
            else
                error('Unrecognized command: ' + command);
        }

        node.on('input', function(msg, send, error) {
            send = send || function() { node.send.apply(node, arguments) };
            error = error || function(err) { node.error(err, msg) };

            // if address from message was changed: start scanning
            var forceScan = 'scan' in msg && msg.scan;
            var addressChanged = node.device != null && 'address' in msg && msg.address && node.device.id != msg.address.toLowerCase();
            if (forceScan || addressChanged) {
                node.device = null;
            }

            var command = msg.payload;

			if (node.device != null) {
			    sendCommand(command, error);
			} else if (node.scanningActive) {
				node.status({fill:"yellow", shape:"dot", text:"searching"});
			} else {
			    var address = msg.address || config.address;
			    if (!address) {
			        node.status({fill:"red", shape:"dot", text:"address is not specified"});
			        return;
			    }
				node.scanningActive = true;
				node.status({fill:"green", shape:"dot", text:"searching"});

				node.stopScanningTimeout = setTimeout(function() {
					noble.stopScanning();
				}, parseInt(config.scanningTimeout) * 1000);

				var foundDevices = [];
			
				var discover = function(peripheral) {
					foundDevices.push(peripheral.address);
					
					if (peripheral.address === address.toLowerCase()) {
                        node.status({fill:"green", shape:"dot", text:"found"});

					    var device = new am43(address, peripheral, noble);
					    device.am43Init();
                        //device.log.enabled = true;

                        device.on('stateChanged', (data) => {
                            device.log(`state changed received: ${JSON.stringify(data)}`);
                            if (data.state != null)
                            {
                                var text = data.state;
                                if (data.position != null)
                                    text += " (" + data.position + ")";
                                node.status({fill:"green", shape:"dot", text:text});
                            }
                            send(data, error);
                        });

						node.device = device;

						noble.removeListener('discover', discover);
						node.scanningActive = false;

                        // execute command when connected
						if (command != undefined)
						    sendCommand(command);
					}
				}
				noble.on('discover', discover);
				
				noble.once('scanStop', function() {
					noble.removeListener('discover', discover);
					node.scanningActive = false;
					if (node.device == null) {
						node.status({fill:"red", shape:"dot", text:"not found"});
						node.error('Device ' + address + ' not found among [' + foundDevices + ']');
					}
				});
			
				if (noble.state === 'poweredOn') {
					noble.startScanning();
				} else {
					noble.once('stateChange', function(state) {
						if (state === 'poweredOn')
							noble.startScanning();
						else
							node.status({fill:"red", shape:"dot", text:"device status: " + state});
					});
				}
			}
        });
		
		this.on('close', function() {
			if (node.stopScanningTimeout)
				clearTimeout(node.stopScanningTimeout);
			noble.stopScanning();
			node.status({});
		});
    }

    RED.nodes.registerType("AM43", Am43Node);
}
