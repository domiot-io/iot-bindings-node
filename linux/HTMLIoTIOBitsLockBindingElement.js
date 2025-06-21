'use strict';

import { File } from 'keep-streaming';
import { Mutex } from 'another-mutex';

/**
 * Creates an HTML binding element class for IoT iobits-lock binding.
 * The binding reads state data from a device file and updates the 'locked' (0:unlocked, 1:locked)
 * attribute on associated elements. It also writes lock state data (0/1) 
 * to the device file when the 'locked' attribute changes on associated elements.
 * Uses a single I/O channel to control the lock mechanism.
 * 
 * Usage:
 * <iot-iobits-lock-binding id="lockBinding" location="/dev/iohubx24-sim0">
 * <iot-door id="hotelDoor" locked binding="lockBinding">
 */
const createHTMLIoTIOBitsLockBindingElement = (window) => {
    return class HTMLIoTIOBitsLockBindingElement extends window.HTMLElement {

        constructor() {
            super();

            this._deviceFile; // device file
            
            this._data = '';
            
            // elements referencing the binding
            this.elements = new Map();
            
            this.addEventListener('load', (ev) => {
                this._init();
            });
        }

        /**
         * Callback for when an element attribute is modified
         */
        elementAttributeModified(index, el, attributeName, attributeValue) {
            if (attributeName == 'locked') {
                this._updateLockState(index, el);
            }
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

            // Check if the binding is already in use by another element.
            if (this.elements.size > 1) {
                console.warn(`[WARNING] Binding ${this.nodeName} with id=${this.id} has location "${location}" already in use by another binding. Each lock should have its own dedicated driver file for safety and reliability. Sharing device files between bindings can cause unpredictable behavior and security risks.`);
            }

            return true;
        }

        /**
         * Initializes the lock binding element,
         * sets up the device file,
         * and starts reading from the device
         */
        _init() {
            const scope = this;

            if (!this._validateAttributes()) {
                return;
            }

            const location = this.getAttribute('location');
            this._deviceFile = new File(location);
            
            // Check initial state from associated elements (channel 0)
            this._syncInitialState();

            // Start reading from the device file
            let buffer = '';
            
            this._deviceFile.prepareRead()
                .onData(chunk => {
                    buffer += chunk.toString();

                    let lines = buffer.split(/\r\n|\r|\n/);

                    buffer = lines.pop();

                    lines.forEach(data => {
                        scope._onData.call(scope, data);
                    });
                })
                .onError(err => console.error(`Error reading device file ${location} of binding ${scope.nodeName} with id=${scope.id}: `, err))
                .read();
        }

        /**
         * Syncs the initial lock state from associated elements to the device
         */
        _syncInitialState() {
            // Check if element on channel 0 has the locked attribute
            const el = this.elements.get(0);
            if (el) {
                const isLocked = el.hasAttribute('locked');
                const data = isLocked ? '1' : '0';
                this._onData(data);
            } else {
                // default to unlocked if no elements found yet
                const data = '0';
                this._onData(data);
            }
            
        }

        /**
         * Processes incoming lock state data from the device
         * and updates element attributes accordingly
         */
        _onData(data) {

            if (data.length == 0 || this._data.length == 0) {
                return;
            }

            data = data[0];

            if (data === this._data) {
                return;
            }

            const el = this.elements.get(0);

            if (!el) {
                return;
            }

            if (data === '1') {
                el.setAttribute('locked', '');
            } else {
                el.removeAttribute('locked');
            }

        }

        /**
         * Updates the lock state based
         * on the element's locked attribute.
         * Writes the new lock state to the device file.
         */
        _updateLockState(index, el) {
            if (!this._deviceFile) {
                return;
            }

            const isLocked = el.hasAttribute('locked');
            const newLockState = isLocked ? '1' : '0';

            if (newLockState === this._data) {
                return;
            }
            
            this._data = newLockState;
            
            this._deviceFile.prepareWrite(newLockState)
                .onError(error => {
                    console.error(`[ERROR] Lock binding ${this.id}: Failed to write lock state:`, error);
                })
                .write();
            
            
        }
    };
};

export default createHTMLIoTIOBitsLockBindingElement; 
