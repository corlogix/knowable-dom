![alt text](https://github.com/corlogix/knowable-dom/blob/main/docs/knowabledom.jpg?raw=true)

# Knowable DOM
A fully automated user-metrics tracking library for DOM-Based applications. Tracking clicks across your browser application.

---

## Installation
```bash
npm i knowable-dom@latest
```

<br/>

## Basic Setup
```typescript
import defineKnowable from "knowable-dom";

defineKnowable({
    name: "my-app",
    tracking: true,
});
```

<br/>

## Configuration Options
```typescript

{
    // name of your application
    name: string;

    // the function that determines the "page" field in the request body
    getPage?: () => string;

    // callback when an analytics event is triggered by "click" | "change" | "error"
    onCapture?: (event) => string;
    
    // Uses Navigator.sendBeacon to post the analytical data
    apiPath?: string;

    // The time delay for the beacon to be sent to the backend
    batchDelay?: number;
    
    // Determines when to track everything OR certain things
    tracking: {
        clicks?: boolean;
        changes?: boolean;
        errors?: boolean;
    } | boolean;

    // Skips the Navigator.sendBeacon call and shows verbose console logs
    debug?: boolean;

    // Customize your analytics
    customized?: {
        // Can be used to send a specialized "label" to the analytics api
        labelElementType?: (target: HTMLElement) => string;
        // mutates the listener state for specific targets
        applyClickState?: (target: HTMLElement) => State;
        // mutates the listener state to "Automatically" add sections to specialized components
        autoSection?: (target: HTMLElement) => Event["sections"];
    }
}

```

<br/>

---

## Request Object
When an event is captured, it will attempt to send a request to a specified endpoint.
>Default Endpoint: "/api/track/${config.name}"

```jsonc
{
    "sessionId": "ja3iodhjs4fiha", // Unique session based of of the load of the browser tab
    "timestamp": 1234719082475, // Date as a number
    "page": "", // if using DOM routers then this can be derived from "getPage" function in the config
    "sections": { // derived by the "data-section" attributes
        "definedSection": true
    },
    "eventType": "click", // click | change | error
    "elementType": "button", // the element where the event occured
    "label": "my-button-to-click", // derived from the element or the "data-label" attribute
    "to": "string;", // for links "a" tags and etc
    "field": "string", // for input fields
    "option": "string", // for multi-option fields
    "hasValue": true, // for input fields that have a value
    "message": "string", // mostly for error events
}
```

<br/>

---

## DOM "data" attributes
You can add "data" attributes to divs and other elements that will be captured when this library is listening to events.

For example:
```html
<div data-section="my-div">
    <button onclick="func()" data-label="my btn">My Button</button>
</div>
```
The above code example will have a request object like
```jsonc
{
    ...
    "eventType": "click",
    "elementType": "button",
    "sections": {
        "myDiv": true,
    },
    "label": "my-btn"
    ...
}
```

<br/>
<br/>
<br/>

---
---

## Related Documentation

[Navigator.sendBeacon](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)

>Intended to be used for sending analytics data to a web server, and avoids some of the problems with legacy techniques for sending analytics, such as the use of