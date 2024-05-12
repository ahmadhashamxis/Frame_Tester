from flask import Flask, send_from_directory, request, jsonify
import base64
import cv2
import asyncio
from PIL import Image
import os
from ultralytics import YOLO
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.config["UPLOAD_FOLDER"] = "uploads"


def perform_inference(image_path, model):
    try:
        # Load the image
        image = cv2.imread(image_path)
        results = model(image)
        annotated_frame = results[0].plot()
        _, buffer = cv2.imencode(".jpg", annotated_frame)

        # Encode the image data to base64
        encoded_image = base64.b64encode(buffer)

        return encoded_image
    except Exception as e:
        # If an error occurs during inference, print the error
        print(f"Error in performing inference: {e}")
        return None


async def image_feed(websocket, path):
    try:
        model = YOLO("yolov8n.pt")
        image_path = await websocket.recv()
        annotated_image = perform_inference(image_path, model)
        if annotated_image:
            await websocket.send(annotated_image)
    except Exception as e:
        print(f"Error in sending annotated image: {e}")


def run_yolo_inference(input_image):
    image = Image.open(input_image)
    print("Recieved", input_image)
    image_array = np.array(image)
    image_rgb = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
    # model_new_path = # path to model is /model/md.pt
    model_new_path = os.path.join("model", "md.pt")
    model = YOLO(model_new_path)
    result = model(image_rgb, conf=0.5)
    detections = result[0].plot()

    temp_output_path = os.path.join("tmp", "output.jpg")
    cv2.imwrite(temp_output_path, detections)

    return temp_output_path


@app.route("/image_feed", methods=["POST"])
def image_feed_route():
    annotated_images = []

    # Ensure that request.files is not empty
    if "file" not in request.files:
        return jsonify({"error": "No files uploaded"})
    else:
        return jsonify({"succ": "Yes files uploaded"})
    #     for index in range(len(request.files)):
    #         file_key = f"file{index}"
    #         image_file = request.files[file_key]

    #         # Save the image to a temporary file
    #         image_path = f"temp_image_{index}.jpg"
    #         image_file.save(image_path)

    #         # Run YOLO inference
    #         try:
    #             annotated_image_path = run_yolo_inference(image_path)
    #             annotated_images.append(annotated_image_path)
    #         except Exception as e:
    #             print(f"Error processing image {image_path}: {e}")
    #             annotated_images.append(
    #                 image_path
    #             )  # Send original image if inference fails

    #         # Remove the temporary image file
    #         os.remove(image_path)

    # # Return annotated images or paths as a response
    # return jsonify(annotated_images)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
