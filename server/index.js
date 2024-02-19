import dotenv from 'dotenv'
import express from "express";
import http from "http";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import ACTIONS from "../client/src/Actions.js";
import compiler from "compilex";
import cors from "cors";

var options = { stats: true }; //prints stats on console
compiler.init(options);

const app = express();
app.use(
  cors({
    origin:  process.env.REACT_APP_BACKEND_URL, // Replace with your frontend URL
  })
);
dotenv.config();
app.use(bodyParser.json());
//we cannot do app.listen so
const server = http.createServer(app);
const io = new Server(server); //creating instance which we import

app.post("/execute", async (req, res) => {
  const { code, input } = req.body;
  // console.log(code);
  // console.log(input);
  var envData = { OS: "windows" };

  compiler.compilePython(envData, code, function (data) {
    res.send(data);
  });
  // Language specific command to execute code
  
});

const userSocketMap = {};
// { //like this
//     'adsdfgbisdfdf': "M Husain", (socketID:username)
// }

function getAllConnectedClients(roomId) {
  //in Map data type to convert in to array which has data of clients id
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socetID) => {
      return {
        socetID,
        username: userSocketMap[socetID],
      };
    }
  );
}

io.on("connection", (socket) => {
  console.log("Socket connected ", socket.id);

  //listening on request for join as it is emitted from frontend
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    //store the mapping on server (konsi socketId konse user ki hai)
    userSocketMap[socket.id] = username;
    socket.join(roomId); //if roomId already exist then it will join the user into that room otherwise new room will be created
    const clients = getAllConnectedClients(roomId);
    // console.log(clients);
    //to notify already existing user that new user joined
    clients.forEach(({ socetID }) => {
      io.to(socetID).emit(ACTIONS.JOINED, {
        clients,
        username: username,
        socetID: socket.id,
      }); //which socketId to be notified
    });
  });
  //video
  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  socket.on("user:call", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });
  socket.on("join room", (room) => {
    socket.join(room);
    socket.broadcast.to(room).emit("user joined", socket.id);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleNewICECandidateMsg);

    function handleOffer(incoming) {
      socket.to(incoming.to).emit("offer", {
        from: socket.id,
        signal: incoming.signal,
      });
    }

    function handleAnswer(incoming) {
      socket.to(incoming.to).emit("answer", incoming.signal);
    }

    function handleNewICECandidateMsg(incoming) {
      socket.to(incoming.to).emit("ice-candidate", incoming.candidate);
    }
  });

  //lsitening on code change event
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    //sending to everyone accept myself do use socket.in instead io.to
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  //TO SYNC THE CODE
  socket.on(ACTIONS.SYNC_CODE, ({ socetID, code }) => {
    io.to(socetID).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    //to nofity on fronted that user disconnected
    rooms.forEach((roomID) => {
      socket.in(roomID).emit(ACTIONS.DISCONNECTED, {
        socetID: socket.id,
        username: userSocketMap[socket.id],
      });
    });
  });
  delete userSocketMap[socket.id];
  socket.leave();
});

server.listen(9000, () => {
  console.log("Server started at port 9000 sucessfully");
});
