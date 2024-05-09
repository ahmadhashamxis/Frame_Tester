import React, { useState, useRef } from "react";

const VideoCapture = () => {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordedFrames, setRecordedFrames] = useState([]);
  const videoRef = useRef(null);

  const startRecording = () => {
    const stream = navigator.mediaDevices.getUserMedia({ video: true });
    stream
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (event) => {
          setRecordedChunks((prev) => [...prev, event.data]);
        };
        recorder.start();
        setMediaRecorder(recorder);
        videoRef.current.srcObject = stream;
      })
      .catch((error) => {
        console.error("Error accessing media devices: ", error);
      });
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    const recordedVideo = new Blob(recordedChunks, { type: "video/webm" });
    const videoURL = URL.createObjectURL(recordedVideo);
    videoRef.current.src = videoURL;
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
        <video ref={videoRef}  autoPlay className="w-[80%] m-auto" />
        <div className="flex gap-5 justify-center mb-4">
          <button
            onClick={startRecording}
            className="bg-blue-400 p-2 rounded-lg"
          >
            Start Recording
          </button>
          <button onClick={stopRecording} className="bg-red-400 p-2 rounded-lg">
            Stop Recording
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
