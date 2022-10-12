import { createRoot } from "react-dom/client";
import defineKnowable from "react-knowable";
import { BrowserRouter } from "react-router-dom";


defineKnowable({
    name: "playground",
    tracking: true,
    debug: true,
    batchDelay: 5000
});


const root = createRoot(document.getElementById("app") as HTMLElement);

root.render(<BrowserRouter>
    <h1>Hello</h1>

    <div data-section="test-clicks">

        <button onClick={() => console.log("Clicked")}>test click event</button>
        <ul>
            <li onClick={() => console.log("menu item")}>menu item</li>
        </ul>

    </div>

    <div data-section="test-changes">

        <label htmlFor="123">my input</label>
        <input id="123" type="text" />

    </div>

</BrowserRouter>);