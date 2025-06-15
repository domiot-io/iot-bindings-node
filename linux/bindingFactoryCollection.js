'use strict';
import { HTMLElementFactoryCollection } from 'iot-elements-node';

import createHTMLIoTIHubX24ButtonBindingElement from './HTMLIoTIHubX24ButtonBindingElement.js'
import createHTMLIoTOHubX24ColorBindingElement from './HTMLIoTOHubX24ColorBindingElement.js'

const bindingFactoryCollection = new HTMLElementFactoryCollection();
export default bindingFactoryCollection;

bindingFactoryCollection.add('iot-ihubx24-button-binding', createHTMLIoTIHubX24ButtonBindingElement);
bindingFactoryCollection.add('iot-ohubx24-color-binding', createHTMLIoTOHubX24ColorBindingElement);
