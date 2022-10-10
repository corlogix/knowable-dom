import kebabCase from "lodash.kebabcase";
import { enhanceEvent } from "./enhanceEvents";
import { Config, Event, State, Unsubscriber } from "./types"

type ClickOptions = {
    onCapture?: (event: Event) => void;
    onError?: (e: Error) => void;
    config?: Config;
    trackedTarget?: HTMLElement;
}

export function trackClicks({ onCapture = console.info as any, onError = console.error, trackedTarget = document.body, config }: ClickOptions): Unsubscriber {
    const listener = (e: any) => {
        try {
            let target = e.target as HTMLElement;
            const state: State = {
                event: undefined,
                autolabel: undefined,
                element: undefined
            };

            while (target instanceof SVGElement) {
                target = target.parentElement as HTMLElement;
            }

            if(!(e.screenX === 0 && e.screenY === 0)) {
                for (let element = target; element !== trackedTarget; element === element.parentElement) {
                    const className = element.className;

                    const isLink = element.nodeName === "A" && typeof element.getAttribute("href") === "string";
                    const isButton = element.nodeName === "BUTTON" && element.onclick;

                    if(!state.event && (isLink || isButton)) {

                        const tag = element.nodeName.toLowerCase();

                        const elementType = config?.customized?.labelElementType?.(element) ?? tag;

                        state.event = {
                            eventType: "click",
                            elementType,
                            sections: {},
                            label: element.dataset.label || element.title || undefined,
                            field: (element as HTMLButtonElement).name || undefined,
                        }

                        state.autolabel = state.event.label;
                        state.element = element;

                        switch(elementType) {
                            case "button": {
                                state.autolabel = state.event.field || element.textContent as string;
                                state.event.option = kebabCase(element.textContent || (element as HTMLButtonElement).value) || undefined;
                                break;
                            }
                            case "link": {
                                const href = element.getAttribute("href") ?? "";
                                const text = element.textContent;
                                state.autolabel = text ?? "";
                                if(href.startsWith("/") || href.startsWith("#")) {
                                    state.event.to = href;
                                } else if (href.startsWith("mailto")) {
                                    state.event.to = "mailto";
                                    if(text?.includes(href.slice(7))) {
                                        state.autolabel = "email-link"
                                    }
                                }
                            }
                            default: {
                                const definedState: State = (config?.customized?.applyClickState?.(element)) ?? {};
                                
                                state.autolabel = definedState.autolabel ?? element.textContent ?? "unknown";
                                state.event = {
                                    ...state.event,
                                    ...definedState.event
                                }
                            }
                        }
                    }

                    if(state.event && (
                        className.includes("disabled")
                        || element.dataset.section === "@IGNORE"
                        || (element as HTMLButtonElement).disabled
                    )) {
                        state.event = undefined;
                        break;
                    }

                    if(enhanceEvent(state, element)) {
                        break;
                    }
                }

                if(state.event) {
                    
                    if(state.event.label) {
                        state.event.label = kebabCase(state.event.label);
                    } else {
                        const className = (
                            state.element?.className +
                            (state.element?.children?.length === 1 ? "\n" + state.element?.children[0].className : "")
                        ).trim();

                        state.event.label = 
                            kebabCase(
                                state.autolabel
                                || state.event.field
                                || state.event.option
                                || undefined
                            ) ?? className
                    }

                    onCapture(state.event);
                }
            }
        }
        catch(e) {
            onError(e as any);
        }
    };

    trackedTarget.addEventListener("click", listener, true);

    return () => {
        trackedTarget.removeEventListener("click", listener, true)
    }
}