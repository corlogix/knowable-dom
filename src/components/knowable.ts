import { nanoid } from "nanoid";
import { trackChanges } from "./trackChanges";
import { trackClicks } from "./trackClicks";
import { trackErrors } from "./trackErrors";

import type { Event, Config, Unsubscriber, TrackingOptions } from "./types";

const defaultConfig: Config = {
    name: "unknown",
    getPage: () => window.location.pathname.slice(1),
    tracking: false,
    apiPath: "/api/track/{name}",
    batchDelay: 30000,
    debug: false
};

const sessionId = nanoid();
let config: Config = defaultConfig;
let cleanup: Unsubscriber = null;
let pending: Event[] = [];
let timeout: any = null;

function send(name: Config["name"], data: Event[] = []) {
    config.debug && console.log("Sending events for", `"${name}"`, data);
    if(!data.length || config.debug) return;
    const url = (config.apiPath ?? defaultConfig.apiPath)?.replace?.("{name}", name) ?? "/";
    return navigator.sendBeacon(url, JSON.stringify(data));
} 

function flush() {
    if(pending.length) {
        config.debug && console.log("Flushing", pending.length, "events");
        send(config.name, pending);
        pending = [];
    }
    timeout = null;
    removeEventListener("unload", flush);
}

function push(event: Event) {
    pending.push(event);
    if(!timeout) {
        timeout = setTimeout(flush, config.batchDelay);
        addEventListener("unload", flush);
    }
}

function onCapture(event: Event) {
    event.sessionId = sessionId;
    event.timestamp = Date.now();
    event.page = config.getPage?.();
    push(event);
    config.onCapture?.(event);
    config.debug && console.log("Captured event", {event})
}

function onError(e: Error) {
    onCapture({
        eventType: "error",
        label: "tracking-error",
        message: e && e.message
    });
}

export function defineKnowable(configObj: Config): Unsubscriber {
    cleanup?.();

    config = {...defaultConfig, ...configObj };

    const fullTrackingEnabled = typeof config.tracking  === "boolean" && config.tracking 

    let shouldTrackClicks = fullTrackingEnabled as boolean;
    let shouldTrackChanges = fullTrackingEnabled as boolean;
    let shouldTrackErrors = fullTrackingEnabled as boolean;

    if(!fullTrackingEnabled && typeof config.tracking === "object") {
        shouldTrackClicks = config.tracking.clicks ?? false;
        shouldTrackChanges = config.tracking.changes ?? false;
        shouldTrackErrors = config.tracking.errors ?? false;
    }
    
    const options: TrackingOptions = {
        onCapture,
        onError: shouldTrackErrors ? onError : undefined,
        config,
    }

    const clickUnsubscriber = shouldTrackClicks ? trackClicks(options) : null;
    const changeUnsubscriber = shouldTrackClicks ? trackChanges(options) : () => null;
    const errorUnsubscriber = shouldTrackClicks ? trackErrors(options) : () => null;

    cleanup = () => {
        clickUnsubscriber?.();
        changeUnsubscriber?.();
        errorUnsubscriber?.();
        flush();
    }

    config.debug && console.log({
        config,
        fullTrackingEnabled,
        shouldTrackChanges,
        shouldTrackClicks,
        shouldTrackErrors,
    })

    return cleanup;
}