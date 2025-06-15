'use strict';

import { File } from 'keep-streaming';
import { Mutex } from 'another-mutex';

/**
 * Creates an HTML binding element class for IoT ohubx24-color binding.
 * The binding writes a color state data (0 / 1) to a device file when 
 * color CSS properties change on associated elements.
 * Supports up to 24 channels.
 * 
 * Elements can use multiple device channels for different colors.
 * 
 * Usage:
 * <iot-ohubx24-color-binding id="colorBinding" channels-per-element="2" colors-channel="white:0;blue:1" location="/dev/ohubx24-sim0">
 * 
 * In this case, each element has 2 channels, and the color channels are white and blue.
 * The white color will be written to the first channel (0),
 * and the blue color will be written to the second channel (1).
 * 
 * So if we have '01' as values for an element,
 * it means that the first channel is off and the second channel is on,
*/
const createHTMLIoTOHubX24ColorBindingElement = (window) => {
    return class HTMLIoTOHubX24ColorBindingElement extends window.HTMLElement {

        constructor() {
            super();
            this._mtx = new Mutex(); // mutex for thread-safe file writing
            this._deviceFile; // file handle for the device file


            this._data = []; // channels' states: ['0', '1', '0', '1', ...]

            // elements referencing the binding.
            this.elements = new Map();

            // default number of channels per element.
            this._channelsPerElement = 1;
                
            // color channels mapping.
            // Example:
            // {
            //   'white': 0,
            //   'blue': 1
            // }
            this._colorsChannel = {};
            
            // CSS property names to monitor for color changes
            // Default is ['color'], can be customized via color-property-names attribute
            this._colorPropertyNames = ['color'];
            
            // start monitoring style changes
            // after the element is loaded.
            this.addEventListener('load', (ev) => {
                this._init();
            });
        }

        /**
         * Parses the color channels attribute
         * and creates a mapping of color values to element channels.
         * 
         * Supported syntaxes:
         * 1. Simple color list: "white;blue;red" 
         *    - Colors are assigned sequential indices starting from 0
         * 2. All colors with explicit indices: "white:0;blue:1;red:2" or "red:2;white:0;blue:1"
         *    - Uses the specified indices for each color
         * 3. Mixed format (some with indices, some without): "white:0;blue;red:2"
         *    - Falls back to sequential assignment from 0, ignoring all explicit indices
         *    - Emits a warning about the mixed format
         * 
         * If no colors-channel attribute is specified, defaults to "white" with index 0.
         * 
         * Example:
         * <iot-ohubx24-color-binding id="colorBinding" channels-per-element="2" colors-channel="white;blue" location="/dev/ohubx24-sim0">
         * 
         * In this case, each element has 2 channels, and the color channels are white and blue.
         * The white color will be written to the first channel (0),
         * and the blue color will be written to the second channel (1).
         */
        _parseColorsChannel() {
            const colorsChannel = this.getAttribute('colors-channel');
            if (!colorsChannel) {
                // Default to "white" color with index 0
                this._colorsChannel['white'] = 0;
                return;
            }

            const splittedColorsChannels = colorsChannel.split(';');
            const colorEntries = [];
            let allHaveIndices = true;
            let someHaveIndices = false;
            
            // parse all entries and check if they all have explicit indices
            for (let i = 0; i < splittedColorsChannels.length; i++) {
                const entry = splittedColorsChannels[i].trim();
                if (entry.length == 0) {
                    continue;
                }
                
                if (entry.includes(':')) {
                    const parts = entry.split(':');
                    if (parts.length === 2) {
                        const color = parts[0].trim();
                        const indexStr = parts[1].trim();
                        const index = parseInt(indexStr);
                        if (!isNaN(index) && indexStr === index.toString()) {
                            colorEntries.push({ color, index });
                            someHaveIndices = true;
                        } else {
                            allHaveIndices = false;
                            colorEntries.push({ color });
                        }
                    } else {
                        allHaveIndices = false;
                        colorEntries.push({ color: entry });
                    }
                } else {
                    allHaveIndices = false;
                    colorEntries.push({ color: entry });
                }
            }
            
            // assign indices
            if (allHaveIndices && colorEntries.length > 0) {
                // use explicit indices
                for (const entry of colorEntries) {
                    this._colorsChannel[entry.color.toLowerCase()] = entry.index;
                }
            } else {
                // no explicit indices or some are invalid.
                // assign sequential indices from 0
                if (someHaveIndices && !allHaveIndices) {
                    console.warn(`[WARNING] Binding ${this.nodeName} with id=${this.id}: Mixed format detected in 'colors-channel' attribute. Some colors have explicit indices while others don't. Falling back to sequential assignment from 0.`);
                }
                for (let i = 0; i < colorEntries.length; i++) {
                    this._colorsChannel[colorEntries[i].color.toLowerCase()] = i;
                }
            }
        }

        /**
         * Parses the channels-per-element attribute.
         * Channels per element is the number of channels that 
         * each element has. Each channel is reserved for
         * a color value (1/0 on/off).
         * Example:
         * <iot-ohubx24-color-binding id="colorBinding" channels-per-element="2" colors-channel="white:0;blue:1" location="/dev/ohubx24-sim0">
         * 
         * In this case, each element has 2 channels, and the color channels are white and blue.
         * The white color will be written to the first channel (0),
         * and the blue color will be written to the second channel (1).
         * 
         * So if we have '01' as values for an element,
         * it means that the first channel is off and the second channel is on,
         * which means than white is off and blue is on.
         */
        _parseChannelsPerElement() {
            const channelsPerElement = this.getAttribute('channels-per-element');
            if (!channelsPerElement) {
                return;
            }
            try {
                this._channelsPerElement = parseInt(channelsPerElement);
            } catch (error) {
                console.error(`[ERROR] Invalid 'channels-per-element' attribute: ${this._channelsPerElement}`);
            }
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
         * Initializes the color binding element
         * and sets up the device file for writing.
         */
        _init() {
            if (!this._validateAttributes()) {
                return;
            }

            this._parseChannelsPerElement();

            this._parseColorsChannel();

            this._parseColorPropertyNames();

            this._deviceFile = new File(this.getAttribute('location'));
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
            if (!this._colorPropertyNames.includes(propertyName)) {
                return;
            }
            if (!this.elements.has(index)) {
                return;
            }

            if (!this._colorsChannel) {
                return;
            }
            if (!this._deviceFile) {
                return;
            }

            this._mtx.lock().then((unlock) => {
                try {
                    // fill the parts of the data array that are not yet set with 0s.
                    const elementLastChannelPos = (index + 1) * this._channelsPerElement - 1;

                    if (this._data.length <= elementLastChannelPos) {

                        const difference = elementLastChannelPos + 1 - this._data.length;

                        for (let i = 0; i < difference; i++) {
                            this._data.push('0');
                        }
                    }

                    propertyValue = propertyValue.trim().toLowerCase();
                    // color channel is 0 to (channelsPerElement-1)
                    const colorChannel = this._colorsChannel[propertyValue];

                    // values are in the format:
                    // { 2: '0',
                    //   3: '1'}
                    let values = new Map();

                    const elementFirstChannelPos = index * this._channelsPerElement;

                    // set all channels to 0
                    for (let i = 0; i < this._channelsPerElement; i++) {
                        values.set(elementFirstChannelPos + i, '0');
                    }

                    if (typeof colorChannel === 'undefined' || colorChannel >= this._channelsPerElement) {
                        unlock();
                        return;
                    }

                    values.set(elementFirstChannelPos + colorChannel, '1');
                    
                    let isSame = true;

                    for (const [pos, value] of values) {
                        if (this._data[pos] != value) {
                            isSame = false;
                            break;
                        }
                    }

                    if (isSame) {
                        unlock();
                        return;
                    }

                    for (const [pos, value] of values) {
                        this._data[pos] = value;
                    }

                    const data = this._data.join('');

                            /**
                     * Writes binary data to the device file
                     * in a thread-safe manner using mutex.
                     * values are in the format:
                     * { 2: '0',
                     *   3: '1'}
                     * where the key is the position in the data array.
                     */

                    // write the data to the device file.
                    this._deviceFile.prepareWrite(data)
                        .onError(err => {
                            console.error('Error writing to file:', err);
                            unlock();
                        })
                        .onFinish(() => {
                            unlock();
                        })
                        .write();
                }catch(e){
                    unlock();
                    console.error(e);
                }
            });
        }

        /**
         * Parses the color-property-names attribute to determine which CSS properties
         * should be monitored for color changes.
         * 
         * Supported formats:
         * - Single property: "background-color"
         * - Multiple properties: "color background-color border-color"
         * 
         * If no color-property-names attribute is specified, defaults to "color".
         * 
         * Example:
         * <iot-ohubx24-color-binding color-property-names="color background-color" ...>
         */
        _parseColorPropertyNames() {
            const colorPropertyNames = this.getAttribute('color-property-names');
            if (!colorPropertyNames) {
                // Default to monitoring 'color' property
                this._colorPropertyNames = ['color'];
                return;
            }

            // Split by whitespace and filter out empty strings
            this._colorPropertyNames = colorPropertyNames.trim().split(/\s+/).filter(name => name.length > 0);
            
            if (this._colorPropertyNames.length === 0) {
                // Fallback to default if no valid property names found
                this._colorPropertyNames = ['color'];
            }
        }
        
    };
};
export default createHTMLIoTOHubX24ColorBindingElement;