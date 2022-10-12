import { kebabCase } from "lodash";
import { enhanceEvent } from "./enhanceEvents";
import { State, TrackingOptions } from "./types";

export function trackChanges({ onCapture, onError, config }: TrackingOptions) {

    const trackedTarget: HTMLElement = document.body;

    config?.debug && console.log("Tracking 'changes' events on", trackedTarget);
    
    const listener = (e: any) => {
        try {
            const target: HTMLElement = e.target;

            const state: State = {
                event: undefined,
                autolabel: undefined,
                element: target,
            };

            const tag = target.nodeName.toLowerCase();

            const inputType = (target as HTMLInputElement).type || undefined;

            const isInput = tag === "input";
            const isTextArea = tag === "textarea";
            const isCheckbox = tag === "input" && inputType === "checkbox";
            const isRadio = tag === "input" && inputType === "radio";

            state.event = {
                eventType: "change",
                elementType:
                    isInput
                    ? tag + "-" + (target as HTMLInputElement).type
                    : isTextArea
                    ? "input-textarea"
                    : tag,
                sections: {},
                label: target.dataset.label ?? target.getAttribute("label") ?? "unkown",
                field: (target as HTMLInputElement).name ?? undefined
            };

            if(isCheckbox || isRadio) {
                const option = target.nextElementSibling && target.nextElementSibling?.nodeName === "LABEL"
                    ? target.nextElementSibling.textContent?.trim?.()
                    : target.previousElementSibling && target.previousElementSibling?.nodeName === "LABEL"
                    ? target.previousElementSibling.textContent?.trim?.()
                    : (target as HTMLInputElement).value ?? undefined

                state.event.option = option;
                state.event.hasValue = (target as HTMLInputElement).checked;
            }

            if (isTextArea || (isInput && inputType === "text")) {
                state.event.hasValue = !!(target as HTMLInputElement).value;
            }


            if(isInput || isTextArea) {
                const id = target.getAttribute("id");
                if(id) {
                    const labels = document.body.getElementsByTagName("LABEL");
                    for (const label of Object.values(labels)) {
                        if(label.getAttribute("for") === id) {
                            state.event.label = label.textContent?.trim?.();
                        }
                    }
                }
            }

            for (let element = target; element !== trackedTarget; element = element.parentElement as HTMLElement) {

                if(element.dataset.section === "@IGNORE") {
                    state.event = undefined;
                    break;
                }

                if(enhanceEvent(state, element, config)) {
                    break;
                }
            }

            if(state.event) {
                if(state.event.label) state.event.label = kebabCase(state.event.label)
                else {
                    state.event.label = kebabCase(state.autolabel ?? state.event.field ?? state.event.option ?? undefined)
                        || (
                            state.element?.className + (
                                state.element?.children.length === 1
                                    ? "\n" + state.element.children[0].className
                                    : ""
                            )
                        )
                }

                onCapture?.(state.event);
            }
        }
        catch(e) {
            onError?.(e as any);
        }
    };

    trackedTarget.addEventListener("change", listener, true);

    return () => {
        trackedTarget.removeEventListener("change", listener, true)
    }
}