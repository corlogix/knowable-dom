export type Config = {
    name: string;
    getPage?: () => string;
    onCapture?: (event: Event) => string;
    
    apiPath?: string;
    batchDelay?: number;
    
    tracking: {
        clicks?: boolean;
        changes?: boolean;
        errors?: boolean;
    } | boolean;

    debug?: boolean;

    customized?: {
        labelElementType?: (target: HTMLElement) => string;
        applyClickState?: (target: HTMLElement) => State;
        autoSection?: (target: HTMLElement) => Event["sections"];
    }
}

export type Event = {
    sessionId?: string;
    timestamp?: number;
    
    page?: string;
    sections?: Record<string, boolean>;
    
    eventType?: "click" | "change" | "error";
    elementType?: string;
    label?: string;
    to?: string;
    field?: string;
    option?: string;
    hasValue?: boolean;
    message?: string;

    context?: {
        type?: string;
        id?: string;
        properties?: Record<string, string>;
    }
}

export type ManualAction = Omit<Event, "sections" | "sessionId" | "timestamp"> & {
    sections?: string[];
};

export type UserMetric = {
    action: Event;
};

export type State = {
    event?: Event | undefined;
    autolabel?: string | undefined;
    element?: HTMLElement | undefined;
}

export type Unsubscriber = (() => void) | null;

export type TrackingOptions = {
    onCapture?: (event: Event) => void;
    onError?: (e: Error) => void;
    config?: Config;
}