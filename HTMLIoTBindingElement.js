'use strict';

/**
 * Creates a new HTMLIoTBindingElement.
 * The HTMLIoTBindingElement serves as a base class
 * that provides the standard callback methods (elementAttributeModified,
 * elementAttributeNSModified, elementStyleModified) that all binding elements
 * should implement.
 */
const createHTMLIoTBindingElement = (window) => {
    return class HTMLIoTBindingElement extends window.HTMLElement {
        constructor() {
            super();
        }

        /**
         * Callback for when an element attribute is modified
         */
        elementAttributeModified(index, el, attributeName, attributeValue) {
            // ...
        }

        /**
         * Callback for when an element attribute with namespace is modified
         */
        elementAttributeNSModified(index, el, namespace, attributeName, attributeValue) {
            // ...
        }

        /**
         * Callback for when an element style property is modified
         */
        elementStyleModified(index, el, propertyName, propertyValue) {
            // ...
        }
    };
};

export default createHTMLIoTBindingElement;
