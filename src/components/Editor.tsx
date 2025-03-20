import React, { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { PluginKey } from "prosemirror-state";
import {  SuggestionKeyDownProps } from "@tiptap/suggestion";
import { VariableExtension } from "../extensions/VariableExtension"; 
import { VARIABLES } from "../types/variables"; 

interface EditorProps {
  className?: string;
}

const Editor: React.FC<EditorProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestionPos, setSuggestionPos] = useState({ x: 0, y: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      VariableExtension,
      Mention.configure({
        HTMLAttributes: { class: "mention" },
        suggestion: {
          char: "{",
          startOfLine: false,
          allowSpaces: false,
          pluginKey: new PluginKey("my-mention"),
          items: ({ query }) =>
            VARIABLES.filter((v) =>
              v.label.toLowerCase().includes(query.toLowerCase())
            ),
          render: () => {
            return {
              onStart: (props) => {
                const rect = props.clientRect?.();
                if (rect) {
                  setIsOpen(true);
                  setSuggestionPos({ x: rect.x, y: rect.y + rect.height });
                }
              },
              onUpdate: (props) => {
                const rect = props.clientRect?.();
                if (rect) {
                  setSuggestionPos({ x: rect.x, y: rect.y + rect.height });
                }
              },
              onKeyDown: (props: SuggestionKeyDownProps) => {
                if (props.event.key === "ArrowDown") {
                  setSelectedIndex((prev) => (prev + 1) % VARIABLES.length);
                  return true;
                }
                if (props.event.key === "ArrowUp") {
                  setSelectedIndex((prev) => (prev + VARIABLES.length - 1) % VARIABLES.length);
                  return true;
                }
                if (props.event.key === "Enter") {
                  
                  const selectedVariable = VARIABLES[selectedIndex];
                   
                  if (selectedVariable && props.view) {
                    const { state, dispatch } = props.view;
                    const tr = state.tr.insertText(selectedVariable.value, state.selection.from);
                    dispatch(tr);
                    return true;
                  }
                }
                return false;
              },
              onExit: () => setIsOpen(false),
            };
          },
          command: ({ editor, range, props }) => {
            const variable = VARIABLES.find((v) => v.id === props.id);
            if (!variable) return;
        
            
            const formattedValue = `{{${variable.id}}}`;
            console.log("Inserting variable:", formattedValue);
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent(
                `<span class="mention" data-id="${variable.id}" contenteditable="false">${formattedValue}</span>&nbsp;`
              )
              .run();
          },
        },
      }),
    ],
    content: `<p>Type <strong>{{</strong> to insert a variable.</p>`,
  });

  
  useEffect(() => {
    if (!editor) return;

    const handleClick = (event: Event) => {
      const element = event.target as HTMLElement;
      if (element.classList.contains("mention")) {
        const variableId = element.dataset.id; 
        if (variableId) {
          editor
            .chain()
            .focus()
            .setTextSelection(editor.state.selection.from)
            .deleteSelection()
            .run();
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick); 
  }, [editor]);

  
  const saveContent = () => {
    if (!editor) return;
    const jsonContent = editor.getJSON();
    sessionStorage.setItem("editorContent", JSON.stringify(jsonContent)); 
    alert("Content Saved!");
  };
  
  const loadContent = () => {
    const storedContent = sessionStorage.getItem("editorContent"); 
    if (storedContent && editor) {
      editor.commands.setContent(JSON.parse(storedContent));
    }
  };
  

  
  useEffect(() => {
    if (editor) loadContent();
  }, [editor]);

  return (
    <div className="relative w-full max-w-xl mx-auto mt-5">
      <div className="border rounded p-4 min-h-[200px]">
        {editor && <EditorContent editor={editor} />}
      </div>

      {isOpen && (
        <div
          className="absolute z-50 bg-white border shadow-md rounded w-60"
          style={{ top: suggestionPos.y, left: suggestionPos.x }}
        >
          {VARIABLES.map((item, idx) => (
            <div
              key={item.id}
              className={`p-2 cursor-pointer ${
                idx === selectedIndex ? "bg-gray-100" : ""
              }`}
              onClick={() => {
                editor?.commands.insertVariable(item); 
                setIsOpen(false);
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}

      {/* ✅ Save/Load buttons */}
      <div className="flex justify-center mt-4">
        <button className="bg-blue-500 text-white px-4 py-2 rounded mr-2" onClick={saveContent}>
          Save Content
        </button>
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={loadContent}>
          Load Content
        </button>
      </div>
    </div>
  );
};

export default Editor;
