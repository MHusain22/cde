import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Editor.css";
import logo from "../Images/code-sync.png";
import Client from "../Client/Client";
import CodeEditor from "../CodeEditor";
import { initSocket } from "../../socket.js";
import ACTIONS from "../../Actions.js";
import {
  useLocation,
  useNavigate,
  Navigate,
  useParams,
} from "react-router-dom";
import toast from "react-hot-toast";
import ReactPlayer from "react-player";
import peer from "../../service/peer.js";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";
import axios from "axios";
import API_URL from "../../../util/backend.js";

const Editor = () => {
  const [myStream, setMyStream] = useState();
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [lang, setLang] = useState("text/x-java");
  const { roomId } = useParams();

  //initialization of socket
  const socketRef = useRef(null);
  const codeRef = useRef(null);

  const location = useLocation(); //to get the username from the usenavigte
  const reactNavigator = useNavigate();

  const [clients, setClients] = useState([
    // {socketId:1, username:"M Husain"},
    // {socketId:2, username:"Nusrat V"},
  ]);

  const handleCall = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    const offer = await peer.getOffer();
    socketRef.current.emit("user:call", { to: roomId, offer });
    setMyStream(stream);
  }, [roomId, socketRef]);

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log("Incoming call", from, offer);
      const ans = await peer.getAnswer(offer); //seend bac to first user
      socketRef.current.emit("call:accepted", { to: from, ans });
    },
    [socketRef]
  );

  const handleCallAccepted = useCallback(({ from, ans }) => {
    peer.setLocalDescription(ans);
    console.log("Call Accepted");
  }, []);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket(); //imported from socket.js for establishing connection
      //to handle errors is any then
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }
      //video
      socketRef.current.on("incoming:call", handleIncomingCall);
      socketRef.current.on("call:accepted", handleCallAccepted);

      // sending event to server to join
      socketRef.current.emit(ACTIONS.JOIN, {
        //sending data to server
        roomId,
        username: location.state?.username, // ? it will not throw error
      });

      //listening from joined event to notify clients
      socketRef.current.on(ACTIONS.JOINED, ({ clients, socetID, username }) => {
        if (username !== location.state?.username) {
          //only notify to everyone except me
          toast.success(`${username} joined the room. `);
        }
        setClients(clients);
        //to sync to code on clients screeen if new client joins the room
        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          socetID,
          code: codeRef.current,
        });
      });
      //cm

      //listening from disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socetID, username }) => {
        toast.success(`${username} left the room. `);
        setClients((prev) => {
          return prev.filter((client) => client.socetID != socetID);
        });
      });
    };

    init();

    //clearing the listeners or else it will create problem in memory uer cleanupp function
    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED); //unsubscribing the event
      socketRef.current.off(ACTIONS.DISCONNECTED); //unsubscribing the event
      socketRef.current.off("incoming:call", handleIncomingCall); //unsubscribing the event
      socketRef.current.off("call:accepted", handleCallAccepted); //unsubscribing the event
    };
  }, [socketRef]);

  //sdsdsdfsdf

  //copy room id
  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("RoomID copied to clipboard");
      // console.log(roomId);
    } catch (err) {
      toast.error("Could not copy the Room ID");
      console.log(err);
    }
  };
  //leave
  const leaveRoom = () => {
    reactNavigator("/");
  };

  //if we dont get the username on username: location.state?.username due to some reason then redirect it to home page
  if (!location.state) {
    return <Navigate to="/" />;
  }

  const handleLanguage = (e) => {
    console.log(e.target.value);
    setLang(e.target.value);
  };

  const executeCode = async () => {
    try {
      const response = await axios.post(API_URL+"/execute", {
        code: codeRef.current,
        input,
      });
      console.log(response.data);
      setOutput(response.data.output);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="main">
      <div className="left">
        <div className="logo">
          <img src={logo} alt="logo" />
        </div>
        <hr />
        <h3>Connected</h3>
        <div className="clientlist">
          {clients.map((client) => (
            <Client key={client.socetID} username={client.username} />
          ))}
        </div>

        <button onClick={handleCall}>Video</button>
        {myStream && (
          <ReactPlayer playing url={myStream} height="100px" width="200px" />
        )}
        <button className="btn copybtn" onClick={copyRoomId}>
          Copy ROOM ID
        </button>
        <button className="btn leavebtn" onClick={leaveRoom}>
          Leave
        </button>
      </div>
      <div className="right">
        {/* <CodeMirror
          value={code}
          onBeforeChange={(editor, data, value) => setCode(value)}
          options={{
            mode: "python", // Change mode accordingly
            theme: "dracula",
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineNumbers: true,
          }}
        /> */}
        <div className="cd">
          <CodeEditor
            value={codeRef.current}
            onBeforeChange={(editor, data, value) => setCode(value)}
            socketRef={socketRef}
            roomId={roomId}
            language={lang}
            onCodeChange={(code) => {
              codeRef.current = code;
            }}
          />
        </div>
      </div>
      <div className="frame">
        <select name="language" onChange={handleLanguage} id="">
          <option value="python">Python</option>
          <option value="text/x-java">Java</option>
          <option value="text/x-csrc">C</option>
        </select>
        <h2>Input:</h2>
        <textarea
          id="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={executeCode}>Execute</button>
        <h2>Output:</h2>
        <textarea
          value={output}
          name=""
          id="output"
          cols="30"
          rows="5"
        ></textarea>
      </div>
      {/* </div> */}
    </div>
  );
};

export default Editor;
