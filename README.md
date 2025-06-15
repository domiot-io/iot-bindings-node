# HTML/DOM IoT Binding Element Factories

Collections of HTML/DOM binding elements for linking DOM elements with physical IoT components.

## Bindings

The binding elements link the DOM elements with physical components.

Bindings have two core attributes: `id` and `location`, without which they can't work.

Bindings listen for changes in the attributes of the elements that reference them (including CSS property changes). They parse these attributes into values interpretable by a driver and then communicate these values to that driver. Bindings also consume and interpret values from drivers, updating the DOM accordingly by modifying an attribute or dispatching an event.

## Installation

```
npm install iot-bindings-node
```

## Example

```
import { retailElementFactoryCollection } from 'iot-elements-node';
import { linuxBindingFactoryCollection } from 'iot-bindings-node';
import { DOMIoT } from 'jsdomiot';

const html = `
<html>
    <aisle>
        <iot-ihubx24-button-binding id="buttonBinding" location="/dev/ihubx24-sim0">
        <iot-ohubx24-color-binding id="colorBinding" channels-per-element="2" colors-channel="white;blue" location="/dev/ohubx24-sim0">
        
        <iot-button id="myButton" binding="buttonBinding">
        <iot-shelving-unit id="myShelvingUnit" style="color:white;" binding="colorBinding">
    </aisle>
</html>`;

const domiot = new DOMIoT(html, [retailElementFactoryCollection, linuxBindingFactoryCollection]);
const document = domiot.window.document;

// Listen for button press events
document.getElementById('myButton').addEventListener('press', (ev) => {
    const myShelvingUnit = document.getElementById('myShelvingUnit');
    myShelvingUnit.style.setProperty('color', 'blue'); // Changes physical light color to blue
});
document.getElementById('myButton').addEventListener('release', (ev) => {
    const myShelvingUnit = document.getElementById('myShelvingUnit');
    myShelvingUnit.style.setProperty('color', 'white'); // Changes physical light color to white
});
```

## Available Bindings

### Linux

#### ihubx24-button (Input)

Binding between a hub of 24 input channels and a elements that can behave like buttons.

**Example:**
```
<iot-ihubx24-button-binding id="buttonBinding" location="/dev/ihubx24-sim0">
<iot-button id="btn1" binding="buttonBinding">>
<iot-button id="btn2" binding="buttonBinding">
```

The binding reads button state data (0 / 1) from a device file and dispatches press/release events to the elements associated with the binding. In the example above, it will dispatch events to the `iot-button` elements.

Button states are read as strings where each character represents a button state:
```
"011101000000000000000000"  // 24 channels: 0=released, 1=pressed
```

This binding can be used with [ihubx24-sim](https://github.com/domiot-io/drivers/tree/main/linux/ihubx24-sim) driver or drivers any driver that implements the same interface.

**Attributes:**
- `id` (required): Unique identifier for the binding.
- `location` (required): Path to the device file (e.g., `/dev/ihubx24-sim0`).

**Events Dispatched:**
- `press`: Fired when button is pressed (channel state changes to 1).
- `release`: Fired when button is released (channel state changes to 0).


#### ohubx24-color (Output)

Binding between a hub of 24 output channels and css color property of the elements that reference the binding.

**Example:**
```
<iot-ohubx24-color-binding 
    id="colorBinding" 
    channels-per-element="2" 
    colors-channel="white:0;blue:1" 
    location="/dev/ohubx24-sim0">

 <iot-shelving-unit id="myShelvingUnit1" style="color:white;" binding="colorBinding">
 <iot-shelving-unit id="myShelvingUnit2" style="color:white;" binding="colorBinding">
```

The binding writes a color state data (0 / 1) to a device file when color CSS properties change on associated elements.

Color states are written as binary strings:
```
"101010000000000000000000"  // 24 channels: 0=off, 1=on
```

This binding can be used with [ohubx24-sim](https://github.com/domiot-io/drivers/tree/main/linux/ohubx24-sim) driver or drivers any driver that implements the same interface.

**Attributes:**
- `id` (required): Unique identifier for the binding.
- `location` (required): Path to the device file.
- `channels-per-element` (optional): Number of channels per element (default: 1).
- `colors-channel` (required): Color-to-channel mapping (format: `"color1:channel1;color2:channel2"`).

**Monitored CSS Properties:**
- `color`: Text color changes trigger device writes.

## API Reference

### Linux Bindings

Import the Linux binding collection:

```
import { linuxBindingFactoryCollection } from 'iot-bindings-node/linux';
```

Or import individual binding creators:

```
import { 
    createHTMLIoTIHubX24ButtonBindingElement,
    createHTMLIoTOHubX24ColorBindingElement,
    bindingFactoryCollection 
} from 'iot-bindings-node/linux';
```

### Binding Element Methods

All binding elements inherit from `HTMLElement` and provide these callback methods:

- `elementAttributeModified(index, el, attributeName, attributeValue)`: Called when bound element attributes change
- `elementAttributeNSModified(index, el, namespace, attributeName, attributeValue)`: Called when namespaced attributes change  
- `elementStyleModified(index, el, propertyName, propertyValue)`: Called when bound element styles change

## License

MIT.