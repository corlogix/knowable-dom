import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

const root = createRoot(document.getElementById("app") as HTMLElement);

root.render(<BrowserRouter>

<h1>Hello</h1>
</BrowserRouter>);