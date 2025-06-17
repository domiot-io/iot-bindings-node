'use strict';

import { File } from 'keep-streaming';

/**
 * Creates an HTML binding element class for IoT LCD message binding.
 * The binding writes message text to an LCD device file when 
 * the 'message' attribute changes on associated door elements.
 * 
 * Usage:
 * <iot-lcd-message-binding id="lcdBinding" location="/dev/lcd-sim0">
 * <iot-door id="hotelDoor" message="Welcome to your room!" binding="lcdBinding">
 */
const createHTMLIoTLCDMessageBindingElement = (window) => {
    return class HTMLIoTLCDMessageBindingElement extends window.HTMLElement {

        constructor() {
            super();
            this._deviceFile; // file handle for the LCD device file
            
            // Current message displayed on LCD
            this._currentMessage = '';
            
            // elements referencing the binding
            this.elements = new Map();
            
            // start monitoring attribute changes after the element is loaded
            this.addEventListener('load', (ev) => {
                this._init();
            });
        }

        /**
         * Callback for when an element attribute is modified
         */
        elementAttributeModified(index, el, attributeName, attributeValue) {
            if (attributeName === 'message') {
                this._updateMessage(index, el);
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

            return true;
        }

        /**
         * Initializes the LCD message binding element and sets up the device file
         */
        _init() {
            if (!this._validateAttributes()) {
                return;
            }

            const location = this.getAttribute('location');
            this._deviceFile = new File(location);
            
            // Initialize with empty message
            this._writeMessage('');
        }

        /**
         * Updates the LCD message based on the door element's message attribute
         */
        _updateMessage(index, el) {
            const newMessage = el.getAttribute('message') || '';
            
            if (this._currentMessage !== newMessage) {
                this._currentMessage = newMessage;
                this._writeMessage(newMessage);
            }
        }

        /**
         * Writes the message to the LCD device file
         */
        _writeMessage(message) {
            if (!this._deviceFile) {
                return;
            }

            // LCD driver expects plain text (up to 120 characters)
            const displayMessage = message.substring(0, 120);
            
            this._deviceFile.prepareWrite(displayMessage)
                .onError(err => {
                    console.error(`[ERROR] LCD binding ${this.id}: Failed to write message:`, err);
                })
                .write();
        }
    };
};

export default createHTMLIoTLCDMessageBindingElement; 