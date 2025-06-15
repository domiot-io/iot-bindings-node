'use strict';
import { File } from 'keep-streaming';

/**
 * Creates an HTML binding element class for IoT hubx24-button binding.
 * The binding reads button state data (0 / 1) from a device file and dispatches
 * press/release events to the elements associated with the binding.
 * Supports up to 24 channels.
 * 
 * Usage:
 * <iot-ihubx24-button-binding id="buttonBinding" location="/dev/ihubx24-sim0">
 */
const createHTMLIoTIHubX24ButtonBindingElement = (window) => {
    return class HTMLIoTIHubX24ButtonBindingElement extends window.HTMLElement {

        constructor() {
            super();

            // button states: 011101000000000000000000
            this._data = '';
 
            // elements referencing the binding:
            // {0: <button>, 1: <button>, 2: <button>, ...}
            this.elements = new Map(); 

            // start retreiving data from the device file
            // after the element is loaded.
            this.addEventListener('load', (ev) => {
                this._init();
            });
        }


        /**
         * Callback for when an element attribute is modified
         */
        elementAttributeModified(index, el, attributeName, attributeValue) {
            // do nothing
        }

        /**
         * Callback for when an element attribute with namespace is modified
         */
        elementAttributeNSModified(index, el, namespace, attributeName, attributeValue) {
            // do nothing
        }

        /**
         * Callback for when an element style property is modified
         */
        elementStyleModified(index, el, propertyName, propertyValue) {
            // do nothing
        }

        /**
         * Validates the id and location mandatory attributes
         * of the binding element.
         */
        _validateAttributes() {
            if (!this.id) {
                console.error(`[ERROR] Binding ${this.nodeName} has no 'id' attribute`);
                return false;
            }
            
            const location = this.getAttribute('location');
            if (!location) {
                console.error(`[ERROR] Binding ${this.nodeName} with id=${this.id} has no 'location' attribute`);
                return false;
            }

            return true;
        }

        /**
         * Reads data from the device
         * file and updates the button states.
         */
        _init() {
            const scope = this;

            if (!this._validateAttributes()) {
                return;
            }

            // read from the device file
            const location = this.getAttribute('location');
            const deviceFile = new File(location);

            let buffer = '';            
            
            deviceFile.prepareRead()
                .onData(chunk => {

                    buffer += chunk.toString();

                    let lines = buffer.split(/\r\n|\r|\n/);

                    buffer = lines.pop();

                    lines.forEach(data => {
                        scope._onData.call(scope, data);
                    });
                })
                .onError(err => console.error(`Error reading device file ${scope.location} of binding ${scope.nodeName} with id=${scope.id} : `, err))
                .read();
        }

        /**
         * Processes incoming button state data
         * and dispatches press/releaseevents.
         */
        _onData(data){

            for (let i = 0; i < data.length; i++) {
                // skip if no element is associated with this button index
                if (!this.elements || !this.elements.has(i)) {
                    continue;
                }
                
                const val = data[i];
                const previousVal = this._data[i];
                
                // skip if button state hasn't changed
                if (previousVal && previousVal == val) {
                    continue;
                }
                
                const el = this.elements.get(i);
                
                if (val == 1) {
                    // button pressed.
                    const pressEvent = new window.Event('press');
                    el.dispatchEvent(pressEvent);
                } else {
                    // button released.
                    const releaseEvent = new window.Event('release');
                    el.dispatchEvent(releaseEvent);
                }
            }
            
            this._data = data;
        }
    };
};

export default createHTMLIoTIHubX24ButtonBindingElement;