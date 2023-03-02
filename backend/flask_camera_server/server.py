from flask import Flask, render_template, Response, jsonify, request
from camera import VideoCamera
from flask_cors import CORS, cross_origin

app = Flask(__name__)
cors = CORS(app, resources={r"/": {"origins": "*"}})

video_camera = None


def gen(camera):
    global video_camera

    if video_camera is None:
        video_camera = VideoCamera()

    while True:
        frame, results = camera.get_frame()

        #print('RESULTS', results)  # printing result of YOLOv8 inference, returned along with our jpeg

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')


@app.route('/video_feed')
@cross_origin()
def video_feed():
    return Response(gen(VideoCamera()), mimetype='multipart/x-mixed-replace; boundary=frame')


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)