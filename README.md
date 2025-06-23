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
        <iot-ibits-button-binding id="buttonBinding" location="/dev/ihubx24-sim0">
        <iot-obits-color-binding id="colorBinding" channels-per-element="2" colors-channel="white;blue" location="/dev/ohubx24-sim0">
        
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

#### ibits-button (Input)

Binding between drivers such as a hub of output channels communicating with bits, and a elements that can behave like buttons.

**Example:**
```
<iot-ibits-button-binding id="buttonBinding" location="/dev/ihubx24-sim0">
<iot-button id="btn1" binding="buttonBinding">>
<iot-button id="btn2" binding="buttonBinding">
```

The binding reads button state data (0 / 1) from a device file and dispatches press/release events to the elements associated with the binding. In the example above, it will dispatch events to the `iot-button` elements.

Button states are read as strings where each character represents a button state:
```
"011101000000000000000000"  // 24 channels: 0=released, 1=pressed
```

This binding can be used with [ihubx24-sim](https://github.com/domiot-io/drivers/tree/main/linux/ihubx24-sim) driver or any driver that implements the same interface.

**Attributes:**
- `id` (required): Unique identifier for the binding.
- `location` (required): Path to the device file (e.g., `/dev/ihubx24-sim0`).

**Events Dispatched:**
- `press`: Fired when button is pressed (channel state changes to 1).
- `release`: Fired when button is released (channel state changes to 0).


#### obits-color (Output)

Binding between drivers such as a hub of output channels communicating with bits, and css color property of the elements that reference the binding.

**Example:**
```
<iot-obits-color-binding 
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

This binding can be used with [ohubx24-sim](https://github.com/domiot-io/drivers/tree/main/linux/ohubx24-sim) driver or any driver that implements the same interface.

**Attributes:**
- `id` (required): Unique identifier for the binding.
- `location` (required): Path to the device file.
- `channels-per-element` (optional): Number of channels per element (default: 1).
- `colors-channel` (required): Color-to-channel mapping (format: `"color1:channel1;color2:channel2"`).

**Monitored CSS Properties:**
- `color`: Text color changes trigger device writes.


#### iobits-lock (Input/Output)

Binding between an IO driver such as an electronic lock mechanism driver communicating with bits and elements that can be locked/unlocked.

**Example:**
```
<iot-iobits-lock-binding id="lockBinding" location="/dev/iohubx24-sim0">
<iot-door id="hotelDoor" locked binding="lockBinding">
```

The binding reads lock state data (0=unlocked, 1=locked) from a device file and updates the 'locked' attribute on associated elements. It also writes lock state data (0/1) to the device file when the 'locked' attribute changes on associated elements. Uses a single I/O channel to control the lock mechanism.

Lock states are read/written as single character strings:
```
"0"  // unlocked
"1"  // locked
```

This binding can be used with [iohubx24-sim](https://github.com/domiot-io/drivers/tree/main/linux/iohubx24-sim) driver or any driver that implements the same interface.

**Attributes:**
- `id` (required): Unique identifier for the binding.
- `location` (required): Path to the device file (e.g., `/dev/iohubx24-sim0`).

**Element Attributes:**
- `locked`: Presence indicates locked state, absence indicates unlocked state.

**Behavior:**
- When device reports lock state change, updates element's `locked` attribute
- When element's `locked` attribute changes, sends new state to device


#### otext-attribute (Output)

Binding between text consuming devices such as an LCD display, and elements that need to display text.

**Example:**
```
<iot-otext-attribute-binding id="lcdBinding" attribute-name="message" location="/dev/lcd-sim0">
<iot-door id="hotelDoor" message="Welcome to your room!" binding="lcdBinding">
```

The binding writes message text to a device file when the 'message' attribute changes on associated elements.

Messages are written as plain text strings (only first 120 characters are taken into account):

```
"Welcome to your room!"
```

This binding can be used with [lcd-sim](https://github.com/domiot-io/drivers/tree/main/linux/lcd-sim) driver or any driver that implements the same interface.

**Attributes:**
- `id` (required): Unique identifier for the binding.
- `location` (required): Path to the device file (e.g., `/dev/lcd-sim0`).
- `attribute-name` (optional): Attribute containing the text to send to the device file. If no `attribute-name` is provided, the binding will use the 'text' attribute.

**Element Attributes:**
- `message`: Text message to display on the device (max 120 characters).

**Behavior:**
- When element's `message` attribute changes, sends new message to device
- Messages longer than 120 characters are automatically truncated

## API Reference

### Linux Bindings

Import the Linux binding collection:

```
import { linuxBindingFactoryCollection } from 'iot-bindings-node/linux';
```

Or import individual binding creators:

```
import { 
    createHTMLIoTIBitsButtonBindingElement,
    createHTMLIoTOBitsColorBindingElement,
    createHTMLIoTIOBitsLockBindingElement,
    createHTMLIoTOTextMessageBindingElement,
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
