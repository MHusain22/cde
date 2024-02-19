import React, { useState } from "react";
import "./Home.css";
import logo from "../Images/code-sync.png";
import { v4 as uuid } from "uuid"; //to generate unique id                                                                                                                                                                                                                                                                                                                                                                                                                      
import toast from "react-hot-toast"; //to alert success
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState("");
  const [username, setUserName] = useState("");

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuid();
    // console.log(id);
    setRoomId(id);
    toast.success("New Room Created");
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("ROOM ID and USERNAME is required");
      return;
    }
    navigate(`/editor/${roomId}`, {
      state: {
        //to pass data from one router to another
        username,
      },
    });
  };

  const handleInput = (e) => {
    if (e.code == "Enter") {
      joinRoom();
    }
  };

  return (
    <div className="outer">
      <div className="box">
        <div className="logo">
          <img src={logo} alt="logo" />
        </div>
        <div className="content">
          <h3>Paste Invitation ROOM ID</h3>
          <input
            type="text"
            value={roomId}
            onKeyUp={handleInput}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="ROOM ID"
          />
          <input
            type="text"
            value={username}
            onKeyUp={handleInput}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="USERNAME"
          />
          <button onClick={joinRoom} className="joinbtn">
            Join
          </button>
          <p>
            If you don't have an invite then create
            <span onClick={createNewRoom}>new room</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
