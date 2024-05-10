import React, { useState, useRef } from "react";

const VideoCapture = () => {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordedFrames, setRecordedFrames] = useState([]);
  // const [isRecording, setIsRecording] = useState(false);
  // const videoRef = useRef(null);
  const [isStopClicked, setIsStopClicked] = useState(false);

  const [timer, setTimer] = useState(0);
  const intervalRef = useRef(null);

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000); 
  };

  const stopTimer = () => {
    clearInterval(intervalRef.current);
  };

  const startRecording = () => {
    setIsStopClicked(false);
    setRecordedChunks([]);
    setRecordedFrames([]);
    setTimer(0);
    startTimer();
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (event) => {
          setRecordedChunks((prev) => [...prev, event.data]);
        };
        recorder.start();
        setMediaRecorder(recorder);
        // videoRef.current.srcObject = stream;
      })
      .catch((error) => {
        console.error("Error accessing media devices: ", error);
      });
  };

  const stopRecording = async () => {
    setIsStopClicked(true);
    stopTimer();
    mediaRecorder.stop();
    const recordedVideo = new Blob(recordedChunks, { type: "video/webm" });
    // const videoURL = URL.createObjectURL(recordedVideo);
    // videoRef.current.src = videoURL;
    extractFrames(recordedVideo);
  };

  const extractFrames = (videoBlob) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    video.src = URL.createObjectURL(videoBlob);
    video.onloadedmetadata = async () => {
      const { videoWidth, videoHeight } = video;
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      let frames = [];
      for (let i = 0; i < video.duration; i += 1) {
        video.currentTime = i;
        await new Promise((resolve) => (video.onseeked = resolve));
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        frames.push(canvas.toDataURL("image/png"));
      }
      setRecordedFrames(frames);
    };
  };

  return (
    <div className="my-4">
      <div className="flex flex-col-reverse ">
        <div className="text-center">{timer} seconds</div>
        {/* <video ref={videoRef} autoPlay className="w-[80%] m-auto" /> */}
        <div className="flex gap-5 justify-center mb-4 md:text-lg ">
          <button
            onClick={startRecording}
            className="bg-blue-400 p-3 rounded-lg"
          >
            Start Recording
          </button>
          <button
            onClick={stopRecording}
            className={`p-3 rounded-lg  ${
              isStopClicked ? "bg-green-400" : "bg-red-400"
            }`}
          >
            {isStopClicked ? "Get Frames" : "Stop Recording"}
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap justify-center mt-8">
        {recordedFrames.map((frame, index) => (
          <img
            key={index}
            src={frame}
            alt={`Frame ${index}`}
            className="w-[500px]"
          />
        ))}
      </div>
    </div>
  );
};

export default VideoCapture;
