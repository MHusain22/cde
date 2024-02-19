import { useEffect, useRef, useState } from "react";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";
import "codemirror/theme/dracula.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "./CodeEditor.css";
import ACTIONS from "../Actions";
import axios from "axios";

const CodeEditor = ({ socketRef, roomId, onCodeChange,language }) => {
  const editorRef = useRef(null);
  console.log(language);

  useEffect(() => {
    async function init() {
      //to convert textArea to code editor
      editorRef.current = CodeMirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          // mode: { name: "javascript", json: true },
          mode: { name: "text/x-java", json: true },
          // mode: `${language}`,
          // mode: "text/x-java",
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
        }
      );
      //code change event listeners with getter
      editorRef.current.on("change", (instance, changes) => {
        // console.log("changes", changes);
        const { origin } = changes;
        const code = instance.getValue(); //getter to get value
        //to pass the code to parent
        onCodeChange(code);
        // console.log(code);
        if (origin !== "setValue") {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
      });

      //to show the value when the user enters the room
      // editorRef.current.setValue(`console.log("hello")`);
    }
    init();
  }, []);

  //dispalying code change on other rooms
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          editorRef.current.setValue(code);
        }
      });
    }

    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    };
  }, [socketRef.current]);

  // var width = window.innerWidth;
  // editorRef.current.setSize(0.7*width);
  

  return (
    <div className="">
      <textarea
       
        id="realtimeEditor"
      />
      
    </div>
  );
};

export default CodeEditor;
