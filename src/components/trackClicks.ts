import kebabCase from "lodash.kebabcase";
import { enhanceEvent } from "./enhanceEvents";
import { State, TrackingOptions, Unsubscriber } from "./types"

export function trackClicks({ onCapture, onError, config }: TrackingOptions): Unsubscriber {

    const trackedTarget: HTMLElement = document.body;

    config?.debug && console.log("Tracking 'click' events on", trackedTarget)

    const listener = (e: any) => {
        try {
            let target = e.target as HTMLElement;
            const state: State = {
                event: undefined,
                autolabel: undefined,
                element: undefined
            };

            config?.debug && console.log("Clicked on", target);

            while (target instanceof SVGElement) {
                target = target.parentElement as HTMLElement;
            }

            if(!(e.screenX === 0 && e.screenY === 0)) {
                for (let element = target; element !== trackedTarget; element = element.parentElement as HTMLElement) {
                    const className = element.className;
                    
                    const isLink = element.nodeName === "A" && typeof element.getAttribute("href") === "string";
                    const isButton = element.nodeName === "BUTTON" || element.onclick;

                    if(!state.event && (isLink || isButton)) {

                        const tag = element.nodeName.toLowerCase();

                        const elementType = config?.customized?.labelElementType?.(element) ?? tag === "a" ? "link" : tag;

                        state.event = {
                            eventType: "click",
                            elementType,
                            sections: {},
                            label: element.dataset.label || element.title || undefined,
                            field: (element as HTMLButtonElement).name || undefined,
                        };

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

                    if(enhanceEvent(state, element, config)) {
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

                    onCapture?.(state.event);
                }
            }
        }
        catch(e) {
            onError?.(e as any);
        }
    };

    trackedTarget.addEventListener("click", listener, true);

    return () => {
        trackedTarget.removeEventListener("click", listener, true)
    }
}