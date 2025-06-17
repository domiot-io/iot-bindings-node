'use strict';
import { HTMLElementFactoryCollection } from 'iot-elements-node';

import createHTMLIoTIHubX24ButtonBindingElement from './HTMLIoTIHubX24ButtonBindingElement.js'
import createHTMLIoTOHubX24ColorBindingElement from './HTMLIoTOHubX24ColorBindingElement.js'
import createHTMLIoTIOHubX24LockBindingElement from './HTMLIoTIOHubX24LockBindingElement.js'
import createHTMLIoTLCDMessageBindingElement from './HTMLIoTLCDMessageBindingElement.js'

const bindingFactoryCollection = new HTMLElementFactoryCollection();
export default bindingFactoryCollection;

bindingFactoryCollection.add('iot-ihubx24-button-binding', createHTMLIoTIHubX24ButtonBindingElement);
bindingFactoryCollection.add('iot-ohubx24-color-binding', createHTMLIoTOHubX24ColorBindingElement);
bindingFactoryCollection.add('iot-iohubx24-lock-binding', createHTMLIoTIOHubX24LockBindingElement);
bindingFactoryCollection.add('iot-lcd-message-binding', createHTMLIoTLCDMessageBindingElement);
