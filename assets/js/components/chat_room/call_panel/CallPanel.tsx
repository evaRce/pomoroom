import React, { useState, useRef, useEffect } from "react";
import { Button, Modal } from "antd";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Phone,
} from "lucide-react"
import { useEventContext } from "../EventContext";

export default function CallPanel({ chatName, userLogin }) {
  const [modalVisible, setModalVisible] = useState(false);
  const { addEvent, getEventData, removeEvent } = useEventContext();
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [users, setUsers] = useState({});
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isOnCall, setIsOnCall] = useState(false);

  // Retrieves connected users data and initializes peer connections for each
  useEffect(() => {
    const connectUsersData = getEventData("connected_users");

    if (connectUsersData) {
      setConnectedUsers(connectUsersData);
      connectUsersData.forEach((user) => {
        addUserConnection(user);
      });
      removeEvent("connected_users");
    }
  }, [getEventData("connected_users")]);

  // Handles incoming offer requests by creating a peer connection for each
  useEffect(() => {
    const offerRequestData = getEventData("offer_requests");

    if (offerRequestData) {
      offerRequestData.forEach((offerFromUser) => {
        createPeerConnection(offerFromUser, undefined);
      });
      removeEvent("offer_requests");
    }
  }, [getEventData("offer_requests")]);

  // Adds received ICE candidates to peer connections
  useEffect(() => {
    const iceCandidatesData = getEventData("receive_ice_candidate_offers");

    if (iceCandidatesData) {
      iceCandidatesData.forEach(
        ({ candidate: candidateData, from_user: fromUser }) => {
          const peerConnection = users[fromUser]?.peerConnection;
          if (peerConnection && candidateData !== null) {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidateData));
          }
        }
      );
      removeEvent("receive_ice_candidate_offers");
    }
  }, [getEventData("receive_ice_candidate_offers")]);

  // Handles incoming SDP offers by creating and setting peer connections
  useEffect(() => {
    const sdpOffersData = getEventData("receive_sdp_offers");

    if (sdpOffersData) {
      sdpOffersData.forEach(
        ({ description: { sdp: sdpOffer }, from_user: fromUser }) => {
          if (sdpOffer) {
            createPeerConnection(fromUser, sdpOffer);
          }
        }
      );
      removeEvent("receive_sdp_offers");
    }
  }, [getEventData("receive_sdp_offers")]);

  // Sets remote description for received SDP answers
  useEffect(() => {
    const answersData = getEventData("receive_answers");

    if (answersData) {
      answersData.forEach(
        ({ description: descriptionAnswer, from_user: fromUser }) => {
          const peerConnection = users[fromUser]?.peerConnection;
          if (peerConnection && descriptionAnswer) {
            peerConnection.setRemoteDescription(descriptionAnswer);
          }
        }
      );
      removeEvent("receive_answers");
    }
  }, [getEventData("receive_answers")]);

  // Requests access to local media (video and audio) for call setup
  const handleGetMedia = async () => {
    const constraints = { video: true, audio: true };

    try {
      setModalVisible(true);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsOnCall(true);
      addEvent("start_private_call", { contact_name: chatName });
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  // Adds a new user to the connection list without a peer connection initially
  const addUserConnection = (userNickname) => {
    if (users[userNickname] === undefined) {
      setUsers((prevUsers) => ({
        ...prevUsers,
        [userNickname]: { peerConnection: null },
      }));
    }
  };

  // Creates a new peer connection with optional offer
  function createPeerConnection(fromUser, offer) {
    let newPeerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    setUsers((prevUsers) => ({
      ...prevUsers,
      [fromUser]: { peerConnection: newPeerConnection },
    }));

    if (localStream !== undefined) {
      localStream
        .getTracks()
        .forEach((track) => newPeerConnection.addTrack(track, localStream));
    }

    if (offer !== undefined) {
      newPeerConnection.setRemoteDescription({ type: "offer", sdp: offer });
      newPeerConnection
        .createAnswer()
        .then((answer) => {
          newPeerConnection.setLocalDescription(answer);
          addEvent("new_answer", {
            to_user: fromUser,
            description: answer,
          });
        })
        .catch((err) => console.log(err));
    }

    newPeerConnection.onicecandidate = async ({ candidate }) => {
      if (candidate !== null) {
        addEvent("new_ice_candidate", { to_user: fromUser, candidate });
      }
    };

    if (offer === undefined) {
      newPeerConnection.onnegotiationneeded = async () => {
        try {
          newPeerConnection
            .createOffer()
            .then((offer) => {
              newPeerConnection.setLocalDescription(offer);
              addEvent("new_sdp_offer", {
                to_user: fromUser,
                description: offer,
              });
            })
            .catch((err) => console.log(err));
        } catch (error) {
          console.log(error);
        }
      };
    }

    newPeerConnection.ontrack = async (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    return newPeerConnection;
  }

  // Toggles audio (mute/unmute) in the local stream
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  // Toggles video in the local stream
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled((prev) => !prev);
    }
  };

  // Ends the call by closing and removing the peer connection and stopping local media tracks
  const endCall = (user) => {
    if (users[user]?.peerConnection) {
      users[user].peerConnection.close();
      users[user].peerConnection = null;
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    setUsers((prevUsers) => {
      const updatedUsers = { ...prevUsers };
      delete updatedUsers[user];
      return updatedUsers;
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setModalVisible(false);
    setIsOnCall(false);
    addEvent("end_private_call", {});
  };

  return (
    <div>
      {isOnCall ? (
        <Button
          type="text"
          className="!h-9 !w-9 !rounded-lg !bg-green-50 !text-green-600 hover:!bg-green-100 hover:!text-green-700"
          icon={<Phone className="h-[18px] w-[18px]" />}
          title="Mostrar llamada"
          onClick={() => setModalVisible(true)}
        />
      ) : (
        <Button
          type="text"
          className="!h-9 !w-9 !rounded-lg text-gray-600 hover:!bg-gray-100 hover:!text-gray-900"
          icon={<Phone className="h-[18px] w-[18px]" />}
          title="Llamar"
          onClick={handleGetMedia}
        />
      )}

      <Modal
        open={modalVisible}
        title={`Llamando a ${chatName}`}
        centered
        onCancel={() => setModalVisible(false)}
        wrapClassName="video-modal"
        footer={
          <div className="flex items-center justify-center gap-5 py-2">
            <Button
              type="text"
              className={`!h-14 !w-14 !rounded-full !p-0 inline-flex items-center justify-center ${
                isMuted
                  ? "!bg-red-500 !text-white hover:!bg-red-600"
                  : "!bg-gray-700 !text-gray-200 hover:!bg-gray-600"
              }`}
              onClick={toggleAudio}
              title="Audio"
              icon={isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            />

            <Button
              type="text"
              className={`!h-14 !w-14 !rounded-full !p-0 inline-flex items-center justify-center ${
                !isVideoEnabled
                  ? "!bg-red-500 !text-white hover:!bg-red-600"
                  : "!bg-gray-700 !text-gray-200 hover:!bg-gray-600"
              }`}
              onClick={toggleVideo}
              title="Video"
              icon={isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            />

            <Button
              type="text"
              className="!h-14 !w-14 !rounded-full !p-0 inline-flex items-center justify-center !bg-red-500 !text-white hover:!bg-red-600"
              onClick={() => endCall(userLogin.nickname)}
              title="Cortar llamada"
              icon={<PhoneOff className="h-6 w-6" />}
            />
          </div>
        }
      >
        <div
          className={`grid gap-4 overflow-auto p-4 m-0 ${
            connectedUsers.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          <div className="relative">
            <video
              ref={localVideoRef}
              playsInline
              autoPlay
              muted
              className="w-full aspect-video object-cover rounded-lg bg-orange-300"
              style={{ transform: "rotateY(180deg)" }}
            ></video>
          </div>
          {connectedUsers.length > 1 && (
            <div className="relative">
              <video
                ref={remoteVideoRef}
                playsInline
                autoPlay
                className="w-full aspect-video object-cover rounded-lg bg-green-400"
                style={{ transform: "rotateY(180deg)" }}
              ></video>
            </div>
          )}
        </div>

        <div className="w-full mt-4 text-center">
          <h3 className="text-xl font-semibold">Usuarios Conectados:</h3>
          <ul className="list-disc list-inside">
            {connectedUsers.length > 0 ? (
              connectedUsers.map((user, index) => <li key={index}>{user}</li>)
            ) : (
              <li>No hay usuarios conectados</li>
            )}
          </ul>
        </div>
      </Modal>
    </div>
  );
}
