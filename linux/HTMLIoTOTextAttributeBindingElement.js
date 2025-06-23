'use strict';

import { File } from 'keep-streaming';

/**
 * Creates an HTML binding element class for IoT text - an attribute binding.
 * The binding writes a given attribute text to a device file accepting text
 * such as an LCD display device file when 
 * the given attribute changes on associated elements.
 * The driver file receives the name of the attribute and the text:
 * <attribute-name>=<text>
 * Examples: text="Welcome to DOMIoT Hotel! Have a nice stay!"
 * 
 * If no attribute-name is provided, the binding will use the 'text' attribute.
 * Only the first 1024 characters of the text are written to the device file.
 * 
 * Usage:
 * <iot-otext-attribute-binding id="lcdBinding" attribute-name="message" location="/dev/lcd-sim0">
 * <iot-door id="door" message="Welcome to DOMIoT Hotel! Have a nice stay!" binding="lcdBinding">
 */
const createHTMLIoTOTextAttributeBindingElement = (window) => {
    return class HTMLIoTOTextAttributeBindingElement extends window.HTMLElement {

        constructor() {
            super();

            this._attributeName = 'text'; // default attribute name

            this._deviceFile; // file handle for the device file

            // Current message sent to device.
            this._currentText = '';
            
            // elements referencing the binding
            // this binding will only use the first
            // element referencing it.
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
            if (attributeName === this._attributeName) {
                this._writeText(el.getAttribute(this._attributeName));
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
         * Initializes the binding element
         * and sets up the device file to write the text to.
         */
        _init() {
            if (!this._validateAttributes()) {
                return;
            }

            this._attributeName = this.getAttribute('attribute-name') || 'text';

            const location = this.getAttribute('location');
            this._deviceFile = new File(location);

            const el = this.elements.get(0);
            if (!el) {
                return;
            }

            this._writeText(el.getAttribute(this._attributeName));
        }

        /**
         * Writes the text to the device file
         */
        _writeText(text) {

            if (!text || this._currentText == text) {
                return;
            }

            if (!this._deviceFile) {
                return;
            }

            const message = this._attributeName + '=' + text.substring(0, 1024);

            this._currentText = text;
            
            this._deviceFile.prepareWrite(message)
                .onError(err => {
                    console.error(`[ERROR] otext binding ${this.id}: Failed to write message:`, err);
                })
                .write();
        }
    };
};

export default createHTMLIoTOTextAttributeBindingElement; 
