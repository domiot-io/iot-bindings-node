'use strict';
import { HTMLElementFactoryCollection } from 'iot-elements-node';

import createHTMLIoTIBitsButtonBindingElement from './HTMLIoTIBitsButtonBindingElement.js'
import createHTMLIoTOBitsColorBindingElement from './HTMLIoTOBitsColorBindingElement.js'
import createHTMLIoTIOBitsLockBindingElement from './HTMLIoTIOBitsLockBindingElement.js'
import createHTMLIoTOTextMessageBindingElement from './HTMLIoTOTextMessageBindingElement.js'

const bindingFactoryCollection = new HTMLElementFactoryCollection();
export default bindingFactoryCollection;

bindingFactoryCollection.add('iot-ibits-button-binding', createHTMLIoTIBitsButtonBindingElement);
bindingFactoryCollection.add('iot-obits-color-binding', createHTMLIoTOBitsColorBindingElement);
bindingFactoryCollection.add('iot-iobits-lock-binding', createHTMLIoTIOBitsLockBindingElement);
bindingFactoryCollection.add('iot-otext-message-binding', createHTMLIoTOTextMessageBindingElement);
