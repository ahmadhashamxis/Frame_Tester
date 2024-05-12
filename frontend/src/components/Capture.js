import React, { useState, useRef } from "react";

const VideoCapture = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordedFrames, setRecordedFrames] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isUpload, setIsUploading] = useState(false);

  // const videoRef = useRef(null);
  const [isStopClicked, setIsStopClicked] = useState(false);
  const [loading, setLoading] = useState(false);
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
    setIsRecording(true);
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
    extractFrames(recordedVideo);
  };

  const generateFramesFromVideo = () => {
    if (loading) return;

    setLoading(true);
    try {
      const videoBlob = new Blob([selectedFile], { type: "video/webm" });
      extractFrames(videoBlob);
      setLoading(false);
    } catch {
      setLoading(false);
    }
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

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = () => {
    setIsUploading(true);
  };

  const UploadHeader = () => {
    const sendFilesAwait = async () => {
      const BASE_URL = "http://localhost:5000";
      const formData = new FormData();

      // recordedFrames.forEach((frame, index) => {
      //   formData.append(`file`, frame);
      // });
      formData.append('file',recordedFrames[0]);
      

      console.log("formData", formData.get("file"));
      try {
        const response = await fetch(`${BASE_URL}/image_feed`, {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        console.log(data);
      } catch (error) {
        console.error("Error uploading files: ", error);
      }
    };

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.44rem 1.88rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <input
            placeholder="bucket Name"
            className="p-2 rounded-lg"
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              display: "none",
            }}
          />
        </div>
        <button
          className="p-2 rounded-lg"
          style={{
            background: "#3E5FAA",
            color: "white",
            border: "none",
          }}
          onClick={sendFilesAwait}
        >
          Infer
        </button>
      </div>
    );
  };

  return !Array.isArray(recordedFrames) || !recordedFrames.length ? (
    <div
      className="my-20 text-white"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div className="flex">
        <div
          className={` flex flex-col-reverse w-1/2 items-center justify-center ${
            selectedFile ? "hidden" : "flex m-auto"
          }`}
          id="recording"
        >
          <div className="text-center">{timer} seconds</div>
          {/* <video ref={videoRef} autoPlay className="w-[80%] m-auto" /> */}
          <div className="flex gap-5 justify-center mb-4 text-lg " style={{}}>
            <button
              onClick={startRecording}
              className="bg-[#3E5FAA] p-3 rounded-lg"
            >
              Start Recording
            </button>
            <button
              onClick={stopRecording}
              className={`p-3 rounded-lg  ${
                isStopClicked ? "bg-gray-500" : "bg-red-500"
              }`}
            >
              {isStopClicked ? "Get Frames" : "Stop Recording"}
            </button>
          </div>

          <div
            className="w-[90%] h-[4px] mb-4"
            style={{ background: "rgba(255, 255, 255, 0.2)" }}
          ></div>

          <h3 className="text-2xl mb-4">OR</h3>
        </div>
        <div
          style={{
            width: "50%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {" "}
          <div
            className={`w-full ${isRecording ? "hidden" : "flex m-auto"}`}
            id="video-upload"
          >
            <div
              className="relative w-[70%] h-96 rounded-2xl m-auto border border-dashed border-[#5D38C2] flex flex-col justify-center items-center"
              style={{ background: "rgba(255, 255, 255, 0.05)" }}
            >
              <div className="flex flex-col">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  fill="none"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M58.3334 36.6667C51.2634 36.6667 47.7267 36.6667 45.53 34.4701C43.3334 32.2734 43.3334 28.7367 43.3334 21.6667C43.3334 14.5967 43.3334 11.0601 45.53 8.86341C47.7267 6.66675 51.2634 6.66675 58.3334 6.66675C65.4034 6.66675 68.94 6.66675 71.1367 8.86341C73.3334 11.0601 73.3334 14.5967 73.3334 21.6667C73.3334 28.7367 73.3334 32.2734 71.1367 34.4701C68.94 36.6667 65.4034 36.6667 58.3334 36.6667ZM60.8334 15.0001C60.8334 14.337 60.57 13.7012 60.1011 13.2323C59.6323 12.7635 58.9964 12.5001 58.3334 12.5001C57.6703 12.5001 57.0344 12.7635 56.5656 13.2323C56.0968 13.7012 55.8334 14.337 55.8334 15.0001V19.1667H51.6667C51.0037 19.1667 50.3678 19.4301 49.8989 19.899C49.4301 20.3678 49.1667 21.0037 49.1667 21.6667C49.1667 22.3298 49.4301 22.9657 49.8989 23.4345C50.3678 23.9034 51.0037 24.1667 51.6667 24.1667H55.8334V28.3334C55.8334 28.9965 56.0968 29.6323 56.5656 30.1012C57.0344 30.57 57.6703 30.8334 58.3334 30.8334C58.9964 30.8334 59.6323 30.57 60.1011 30.1012C60.57 29.6323 60.8334 28.9965 60.8334 28.3334V24.1667H65C65.6631 24.1667 66.299 23.9034 66.7678 23.4345C67.2367 22.9657 67.5 22.3298 67.5 21.6667C67.5 21.0037 67.2367 20.3678 66.7678 19.899C66.299 19.4301 65.6631 19.1667 65 19.1667H60.8334V15.0001Z"
                    fill="white"
                  ></path>
                  <path
                    opacity="0.5"
                    d="M73.3333 42.3267C73.3266 47.2267 73.29 51.3867 73.0133 54.8033C72.69 58.77 72.0266 62.0833 70.5466 64.8333C69.9007 66.0391 69.0808 67.1431 68.1133 68.11C65.3366 70.8867 61.8033 72.1433 57.3233 72.7433C52.9466 73.3333 47.3333 73.3333 40.1766 73.3333H39.8233C32.6633 73.3333 27.0566 73.3333 22.6766 72.7433C18.2 72.1433 14.6633 70.8867 11.89 68.11C9.42996 65.65 8.15663 62.59 7.48329 58.7933C6.81663 55.06 6.69663 50.42 6.67329 44.6567C6.66663 43.19 6.66663 41.64 6.66663 40V39.82C6.66663 32.66 6.66663 27.0533 7.25663 22.6733C7.85663 18.1967 9.11329 14.66 11.89 11.8867C14.6633 9.11 18.2 7.85333 22.6766 7.25333C26.57 6.73 31.5766 6.67 37.6733 6.66333C38.2904 6.66333 38.8822 6.90846 39.3185 7.3448C39.7548 7.78113 40 8.37293 40 8.99C40 9.60707 39.7548 10.1989 39.3185 10.6352C38.8822 11.0715 38.2904 11.3167 37.6733 11.3167C31.49 11.3233 26.8933 11.3767 23.2966 11.86C19.3333 12.3933 16.9433 13.4067 15.1766 15.1733C13.41 16.94 12.4 19.3333 11.8666 23.3C11.3233 27.3333 11.3166 32.6267 11.3166 40V42.6133L14.4233 39.9C15.7851 38.7085 17.5487 38.0791 19.3571 38.1391C21.1655 38.1992 22.8835 38.9442 24.1633 40.2233L37.4633 53.5233C38.4952 54.5558 39.8583 55.1911 41.3125 55.3173C42.7668 55.4435 44.219 55.0526 45.4133 54.2133L46.34 53.5633C48.0626 52.3526 50.145 51.7622 52.2468 51.8887C54.3485 52.0153 56.3451 52.8513 57.91 54.26L66.6866 62.16C67.57 60.3033 68.0966 57.8667 68.3766 54.4267C68.64 51.1867 68.6766 47.2533 68.68 42.3267C68.68 41.7096 68.9251 41.1178 69.3614 40.6815C69.7978 40.2451 70.3896 40 71.0066 40C71.6237 40 72.2155 40.2451 72.6518 40.6815C73.0882 41.1178 73.3333 41.7096 73.3333 42.3267Z"
                    fill="white"
                  ></path>
                </svg>
                <h3 className="text-lg ">
                  {selectedFile ? selectedFile.name : "Upload Video"}
                </h3>
                <input
                  type="file"
                  onClick={handleUpload}
                  onChange={handleFileChange}
                  className="absolute "
                  style={{
                    top: "0px",
                    left: "0px",
                    opacity: "0",
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                  }}
                ></input>
              </div>
            </div>
          </div>
          {selectedFile && (
            <button
              onClick={generateFramesFromVideo}
              className={`p-3 rounded-lg  ${"bg-gray-500"}`}
              style={{ width: "10%" }}
            >
              {loading ? "Loading ..." : "Get Frames"}
            </button>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div
      style={{
        height: "100vh",
        width: "100%",
      }}
    >
      <UploadHeader />
      <div className="flex gap-3 flex-wrap justify-center mt-8">
        {recordedFrames.map((frame, index) => (
          <img
            key={index}
            src={frame}
            alt={`Frame ${index}`}
            className="w-[500px]"
            style={{
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoCapture;
