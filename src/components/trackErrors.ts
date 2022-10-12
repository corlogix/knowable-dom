import { TrackingOptions } from "./types";

export const consoleError = console.error.bind(console);
export const consoleInfo = console.info.bind(console);

const formatStack = (stack: string) =>
    stack.split("\n")
        .map(l => l.trim())
        .map(l => {
            const match = l.match(/^at \S+/);
            return match && match[0]
        })
        .filter(Boolean)
        .slice(0, 4)
        .join("\n")


const getErrorMessage = (err: any): string | null => {
    if(!err) return null;

    const errType = typeof err;

    if(errType === "object" && err.message) {
        const name = err.name ?? "Error";
        let message = `${name}: ${err.message}`;
        if(name === "ResponseError") {
            message += `\nstatus: ${err.status}\nurl: ${err.url}`;
        } else if(err.stack) {
            const stack = formatStack(err.stack);
            if(stack.length) {
                message += "\n" + stack;
            }
        }
        return message;
    } else if (errType === "string") {
        if(err.match(/\n\s*at /)) {
            let message = err.split("\n")[0].trim();
            const stack = formatStack(err.split("\n")[0].trim());
            if(stack.length) {
                message += "\n" + stack;
            }
            return message;
        }
        return err;
    } else if (errType === "number") {
        return err.toString?.();
    }

    return "";
}

export function trackErrors({onCapture, onError, config}: TrackingOptions) {

    console.error = (...args) => {
        consoleError(...args);
        try {
            const message = args.map(getErrorMessage).join("\n");
            if(!message.match(/^warning/i)) {
                onCapture?.({
                    eventType: "error",
                    label: "console-error",
                    message
                });
            }
        } catch (e) {
            onError?.(e as any);
        }
    }

    const errorListener = (event: any) => {
        try {
            const message = getErrorMessage(event.error) ?? "";
            onCapture?.({
                eventType: "error",
                label: "uncaught-error",
                message
            });
        } catch (e) {
            onError?.(e as any);
        }
    }

    const unhandledRejectionListener = (event: any) => {
        try {
            const message = getErrorMessage(event.error) ?? "";
            onCapture?.({
                eventType: "error",
                label: "unhandled-rejection",
                message
            });
        } catch (e) {
            onError?.(e as any);
        }
    }

    addEventListener("error", errorListener);
    addEventListener("unhandledrejection", unhandledRejectionListener);

    return () => {
        console.error = consoleError;
        removeEventListener("error", errorListener);
        removeEventListener("unhandledrejection", unhandledRejectionListener);
    }
}