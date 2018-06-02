
import {toggleMark, setBlockType, wrapIn} from "prosemirror-commands"
import {schema} from "prosemirror-schema-basic"
import {Plugin} from "prosemirror-state"

export const toolboxPlugin = new Plugin({
		view(editorView) {
			// Create new class to hold editor and internal state such as editorView, HTML Dom elements, commands
			let toolboxView = new ToolboxView(toolboxButtons, editorView)

			// Append DOM portion of toolbox to current editor.
			editorView.dom.parentNode.appendChild(toolboxView.dom);

			// Return toolbox class. Caller will call its update method in every editor update.
			return toolboxView;
		}
})

class ToolboxView {
	constructor(toolboxButtons, editorView) {
		this.buttons = toolboxButtons;
		this.editorView = editorView;

		// Create dom representation of toolbox.
		this.addToolbox(toolboxButtons, editorView)
	}
	addToolbox(toolboxButtons, editorView) {
	    // Create div, unordered list, with classes
	    this.dom = document.createElement("div")
	    this.dom.className = "section_content settings pos-relative";
	    let ul_element = document.createElement("ul");  
	    ul_element.className = "editor-settings editor-settings-main active";
	    
	    toolboxButtons.forEach(({dom}) => ul_element.appendChild(dom));        // Append all list items to ul

	    this.dom.appendChild(ul_element)    // Append ul to div

	    /***************** TODO *********************/
	    this.update(editorView, null) // tooltip plugin does one this.update(view, null)

	    this.dom.addEventListener("mousedown", e => {
			e.preventDefault()
			editorView.focus()
			toolboxButtons.forEach(({command, dom}) => {
			if (dom.contains(e.target))
				command(editorView.state, editorView.dispatch, editorView)
			})
	    })
	}

	update(view, lastState) {
		// Update if popup should show or not.
		this.selectionUpdate(view, lastState);

		// If clicked on a toolbox button, make an update on that:
	    this.buttons.forEach(({command, dom}) => {
	      let active = command(this.editorView.state, null, this.editorView)
	      dom.style.display = active ? "" : "none"
	    })
	}

	selectionUpdate(view, lastState) {
	    let state = view.state
	    // Don't do anything if the document/selection didn't change
	    if (lastState && lastState.doc.eq(state.doc) &&
	        lastState.selection.eq(state.selection)) return

	    // Hide the tooltip if the selection is empty
	    if (state.selection.empty) {
	    	this.dom.style.display = "none"
	      	return
	    }

	    // Otherwise, reposition it and update its content
	    this.dom.style.display = ""
	    let {from, to} = state.selection
	    // These are in screen coordinates
	    let start = view.coordsAtPos(from), end = view.coordsAtPos(to)
	    // The box in which the tooltip is positioned, to use as base
	    let box = this.dom.offsetParent.getBoundingClientRect()
	    // Find a center-ish x position from the selection endpoints (when
	    // crossing lines, end may be more to the left)
	    let left = Math.max((start.left + end.left) / 2, start.left + 3)
	    this.dom.style.left = (left - box.left) - 425 + "px"
	    this.dom.style.bottom = (box.bottom - start.top) + "px"
	    //this.tooltip.textContent = to - from
  }

  destroy() { this.dom.remove() }
}

function heading(level) {
  return {
    command: setBlockType(schema.nodes.heading, {level}),
    dom: toolboxButton("H" + level, null)
  }
}
function toolboxButton(text, name) {

    let li = document.createElement("li");
    li.className = "";
    // If there is an icon name, then create it.
    if (name != null) {
      let icon = document.createElement("i");
      icon.className = "zmdi zmdi-format-"+name;
      li.appendChild(icon);
    }
    // Add text if text exists.
    if (text != null)
      li.textContent = text;
    return li;
}

// Buttons in toolbox. They have a command assignment (command), and DOM representation description (dom).
let toolboxButtons = [
  {command: toggleMark(schema.marks.strong), dom: toolboxButton(null, "bold")},
  {command: toggleMark(schema.marks.em), dom: toolboxButton(null, "italic")},
  {command: setBlockType(schema.nodes.paragraph), dom: toolboxButton("p", null)},
  heading(1), heading(2), heading(3),
  {command: wrapIn(schema.nodes.blockquote), dom: toolboxButton(null, "quote")}
];
