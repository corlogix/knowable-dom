import { camelCase } from "lodash";
import { Config, State } from "./types";

export function enhanceEvent(state: State, element: HTMLElement, config: Config | undefined): boolean {
    if(!state.event) return true;
    
    if(element.dataset.label) {
        state.event.label = element.dataset.label;
    }

    if(element.dataset.section) {
        if(!state.event?.sections) state.event.sections = {};
        for (const section of element.dataset.section.split(",")) {
            state.event.sections[camelCase(`section_${section}`)] = true;
        }
    }

    config?.customized?.autoSection?.(element);

    return false;
}