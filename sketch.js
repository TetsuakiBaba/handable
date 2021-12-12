var g_landmarks = [];
var g_angles = [];
var is_enable_mouse = false;
var is_pinched = false;
var dollar;

var trail_mode = {
    kinds: [{ name: 'None' }, { name: 'All Fingers' }, { name: 'Index Finger' }],
    name: 'None',
    current: 0,
    toggle: function () {
        this.current++;
        if (this.current > this.kinds.length - 1) {
            this.current = 0;
        }
        this.name = this.kinds[this.current].name;
        console.log(this.name);
    }
}

var g_browser_mode;
var is_dollar_active = false;
var is_pose_active = false;
var time_stamp_pose_active;
var time_stamp_pose_deactive;
var ms_operation_activate = 1000;
var threshold = -0.08;
var poses = [
    {
        class: 'scissors',
        angles: [151.0232640949309, 145.089203018993, 144.16041218595345, 169.68865560150968, 177.15161107874442, 175.53394799584137, 173.98758495731641, 179.36823806450363, 174.9455227261207, 164.41700628951898, 26.185195501561566, 169.24322576395195, 155.01530489937826, 38.58580456701814, 168.6758256467776],
        active: false,
        timestamp: 0

    },
    {
        class: '5_fingers_pinch',
        angles: [154.3371648438161, 174.62492934438916, 171.23768032070492, 166.31589751344552, 141.49517480457678, 162.75608187430615, 164.91395822446106, 125.91358194207635, 138.95927474274404, 162.89030937597866, 116.01607436927182, 140.65775245114062, 139.3503002981901, 151.04051353558503, 156.65701995872436],
        active: false,
        timestamp: 0
    }
]


var trails_left;
var trails_right;
var previous_z = 0;
// ここからMediaPipeの記述
function onResults(results) {

    if (results.multiHandLandmarks) {

        g_landmarks = [];
        g_angles = [];
        let num = 0;
        for (const landmarks of results.multiHandLandmarks) {
            landmarks.handedness = results.multiHandedness[num];
            g_landmarks.push(landmarks);
            num++;
        }
        //console.log(g_landmarks);
        //console.log(results.multiHandedness);
        //console.log(results.multiHandness[0].Left);

        // ハンドジェスチャ認識処理はこのタイミングがよいと思う
        for (landmarks of g_landmarks) {
            let tips = [4, 8, 12, 16, 20];
            //console.log(landmarks.handedness);
            if (landmarks.handedness.label == 'Left' && landmarks.handedness.score > 0.85) {
                trails_right.addVertex([
                    { x: width * (1.0 - landmarks[4].x), y: height * (landmarks[4].y) },
                    { x: width * (1.0 - landmarks[8].x), y: height * (landmarks[8].y) },
                    { x: width * (1.0 - landmarks[12].x), y: height * (landmarks[12].y) },
                    { x: width * (1.0 - landmarks[16].x), y: height * (landmarks[16].y) },
                    { x: width * (1.0 - landmarks[20].x), y: height * (landmarks[20].y) }
                ]);

                if (is_enable_mouse) {
                    if (landmarks[8].z < threshold && previous_z >= threshold) {
                        (async () => {
                            const message = await window.myapi.leftClick({
                                x: width * (1.0 - landmarks[8].x),
                                y: height * (landmarks[8].y)
                            })
                        })()
                    }
                }
                previous_z = landmarks[8].z;
            }
            else if (landmarks.handedness.label == 'Right' && landmarks.handedness.score > 0.85) {
                trails_left.addVertex([
                    { x: width * (1.0 - landmarks[4].x), y: height * (landmarks[4].y) },
                    { x: width * (1.0 - landmarks[8].x), y: height * (landmarks[8].y) },
                    { x: width * (1.0 - landmarks[12].x), y: height * (landmarks[12].y) },
                    { x: width * (1.0 - landmarks[16].x), y: height * (landmarks[16].y) },
                    { x: width * (1.0 - landmarks[20].x), y: height * (landmarks[20].y) }
                ]);
            }

            let pos_fingers = [
                [0, 1, 2, 3, 4],
                [0, 5, 6, 7, 8],
                [0, 9, 10, 11, 12],
                [0, 13, 14, 15, 16],
                [0, 17, 18, 19, 20]
            ];
            // 各関節角度を計算して g_angles に保存
            let index = 0;
            for (pos_finger of pos_fingers) {
                let v1 = createVector(
                    landmarks[pos_finger[0]].x - landmarks[pos_finger[1]].x,
                    landmarks[pos_finger[0]].y - landmarks[pos_finger[1]].y,
                    landmarks[pos_finger[0]].z - landmarks[pos_finger[1]].z);
                let v2 = createVector(
                    landmarks[pos_finger[2]].x - landmarks[pos_finger[1]].x,
                    landmarks[pos_finger[2]].y - landmarks[pos_finger[1]].y,
                    landmarks[pos_finger[2]].z - landmarks[pos_finger[1]].z);
                let v3 = createVector(
                    landmarks[pos_finger[1]].x - landmarks[pos_finger[2]].x,
                    landmarks[pos_finger[1]].y - landmarks[pos_finger[2]].y,
                    landmarks[pos_finger[1]].z - landmarks[pos_finger[2]].z);
                let v4 = createVector(
                    landmarks[pos_finger[3]].x - landmarks[pos_finger[2]].x,
                    landmarks[pos_finger[3]].y - landmarks[pos_finger[2]].y,
                    landmarks[pos_finger[3]].z - landmarks[pos_finger[2]].z);

                let v5 = createVector(
                    landmarks[pos_finger[2]].x - landmarks[pos_finger[3]].x,
                    landmarks[pos_finger[2]].y - landmarks[pos_finger[3]].y,
                    landmarks[pos_finger[2]].z - landmarks[pos_finger[3]].z);
                let v6 = createVector(
                    landmarks[pos_finger[4]].x - landmarks[pos_finger[3]].x,
                    landmarks[pos_finger[4]].y - landmarks[pos_finger[3]].y,
                    landmarks[pos_finger[4]].z - landmarks[pos_finger[3]].z);
                g_angles.push(abs(degrees(v1.angleBetween(v2))));
                g_angles.push(abs(degrees(v3.angleBetween(v4))));
                g_angles.push(abs(degrees(v5.angleBetween(v6))));
            }


            // pose_gesturing との比較
            if (g_angles.length == 15) {
                for (let pose of poses) {
                    let d_sum = 0;
                    for (let pos = 0; pos < g_angles.length; pos++) {
                        d_sum += pow(g_angles[pos] - pose.angles[pos], 2);
                    }
                    d_sum = sqrt(d_sum);
                    //console.log(d_sum);

                    if (pose.class == 'scissors') {
                        if (d_sum < 100) {
                            if (pose.active == false) {
                                pose.active = true;
                                pose.timestamp = millis();
                            }
                        }
                        else {
                            pose.active = false;
                            pose.timestamp = millis();
                        }
                    }
                    else if (pose.class == '5_fingers_pinch') {
                        //console.log(d_sum);
                        if (d_sum < 50) {
                            if (pose.active == false) {
                                pose.active = true;
                                pose.timestamp = millis();
                            }
                        }
                        else {
                            pose.active = false;
                            pose.timestamp = millis();
                        }
                    }

                }
            }



            let distance_4to8 = dist(
                landmarks[4].x, landmarks[4].y, landmarks[4].z,
                landmarks[8].x, landmarks[8].y, landmarks[8].z);

            if (distance_4to8 < 0.05) {
                if (is_pinched == false) {
                    if (g_browser_mode == false) {
                        (async () => {
                            const message = await window.myapi.down({
                                x: width * (1.0 - (landmarks[4].x + (landmarks[8].x - landmarks[4].x) / 2)),
                                y: height * (landmarks[4].y + (landmarks[8].y - landmarks[4].y) / 2)
                            })
                        })()
                    }
                }
                else {
                    if (g_browser_mode == false) {
                        (async () => {
                            const message = await window.myapi.drag({
                                x: width * (1.0 - (landmarks[4].x + (landmarks[8].x - landmarks[4].x) / 2)),
                                y: height * (landmarks[4].y + (landmarks[8].y - landmarks[4].y) / 2)
                            })
                        })()
                    }
                }
                is_pinched = true;
            }
            else {
                if (is_pinched == true) {
                    if (g_browser_mode == false) {
                        (async () => {
                            const message = await window.myapi.up({
                                x: width * (1.0 - (landmarks[4].x + (landmarks[8].x - landmarks[4].x) / 2)),
                                y: height * (landmarks[4].y + (landmarks[8].y - landmarks[4].y) / 2)
                            })
                        })()
                    }
                }
                is_pinched = false;
            }
        }
        //  draw();
    }
    if (isLooping() == false) {
        loop();
    }
}

// ここまでMediaPipeの記述
var camera;
var video;
var cam;


function startCamera() {
    startMediaPipeHands('8ce8e876fe1196ef2fdff50084325a364d50628dc4f98bd938e163efed58a6cf');
}

function setup() {
    // put setup code here
    var mycanvas = createCanvas(windowWidth, windowHeight);
    drawingContext.shadowBlur = 7;
    drawingContext.shadowOffsetX = 5;
    drawingContext.shadowOffsetY = 5;
    drawingContext.shadowColor = color(150, 150, 150);
    console.log(mycanvas);
    document.querySelector('#p5Canvas').appendChild(mycanvas.elt);
    //mycanvas.parent('#p5canvas');
    // video = createCapture(VIDEO);
    // video.size(1280, 720);
    // video.hide();
    //noLoop();

    trails_left = new Trails(5);
    trails_right = new Trails(5);
    // electron利用時は startCamera はコメントアウトする

    if (localStorage.getItem('electron') == null) {
        //alert('debug mode')
        g_browser_mode = true;
        startCamera();
    }
    else {
        g_browser_mode = false;
    }
    console.log('hello');

    dollar = DollarRecognizer();
}

function draw() {
    clear();

    //background(127);
    //image(video, 0, 0);

    if (g_landmarks.length > 0) {

        for (landmarks of g_landmarks) {

            // 押し込んでマウスクリック操作
            if (is_enable_mouse) {
                if (landmarks[8].z / threshold > 0.4) {
                    noStroke();
                    fill(255, 0, 0, 150);
                    circle(
                        width * (1.0 - landmarks[8].x),
                        height * landmarks[8].y,
                        (width / 20) * landmarks[8].z / threshold,
                        (width / 20) * landmarks[8].z / threshold
                    );
                    strokeWeight(2);
                    noFill();
                    stroke(255, 0, 0);
                    circle(
                        width * (1.0 - landmarks[8].x),
                        height * landmarks[8].y,
                        (width / 20),
                        (width / 20)
                    );
                }
            }


            let array_points = [
                [0, 1, 2, 5, 9, 13, 17, 0],
                [2, 3, 4],
                [5, 6, 7, 8],
                [9, 10, 11, 12],
                [13, 14, 15, 16],
                [17, 18, 19, 20]
            ];

            noFill();
            stroke(50, 200);
            for (array_point of array_points) {
                if (array_point.length > 0) {
                    strokeWeight(width / 100);
                    beginShape();
                    curveVertex(
                        width * (1.0 - landmarks[array_point[0]].x),
                        height * (landmarks[array_point[0]].y)
                    );
                    for (point of array_point) {
                        vertex(
                            width * (1.0 - landmarks[point].x),
                            height * landmarks[point].y
                        );
                    }
                    curveVertex(
                        width * (1.0 - landmarks[array_point[array_point.length - 1]].x),
                        height * (landmarks[array_point[array_point.length - 1]].y)
                    );
                    endShape();
                }
            }


            if (is_enable_mouse) {
                if (is_pinched) {
                    noStroke();
                    fill(255, 0, 0, 200);
                    circle(
                        width * (1.0 - (landmarks[4].x + (landmarks[8].x - landmarks[4].x) / 2)),
                        height * (landmarks[4].y + (landmarks[8].y - landmarks[4].y) / 2),
                        50);
                }
            }

            for (pose of poses) {
                if (pose.class == 'scissors' && pose.active == true) {
                    noStroke();
                    fill(150, 0, 0, 150);
                    let my_x = width * (1.0 - (landmarks[12].x + (landmarks[8].x - landmarks[12].x) / 2));
                    let my_y = height * (landmarks[12].y + (landmarks[8].y - landmarks[12].y) / 2);
                    arc(width * (1.0 - (landmarks[12].x + (landmarks[8].x - landmarks[12].x) / 2)),
                        height * (landmarks[12].y + (landmarks[8].y - landmarks[12].y) / 2),
                        80, 80,
                        0,
                        TWO_PI * ((millis() - pose.timestamp) / ms_operation_activate),
                        PIE);
                    if ((millis() - pose.timestamp) / ms_operation_activate > 1.0) {
                        pose.active = false;

                        if (g_browser_mode == false) {
                            (async () => {
                                if (my_x < width / 2) {
                                    const message = await window.myapi.pressKey({
                                        kind: 'left'
                                    })
                                    message = await window.myapi.releaseKey({
                                        kind: 'left'
                                    })
                                }
                                else {
                                    const message = await window.myapi.pressKey({
                                        kind: 'right'
                                    })
                                    message = await window.myapi.releaseKey({
                                        kind: 'right'
                                    })
                                }
                            })()
                        }

                    }
                    //text(millis() - timestamp_pose_active, width / 2, height / 2);
                }
                if (pose.class == '5_fingers_pinch' && pose.active == true) {
                    noStroke();
                    fill(150, 150, 150, 150);
                    let my_x = width * (1.0 - (landmarks[12].x + (landmarks[8].x - landmarks[12].x) / 2));
                    let my_y = height * (landmarks[12].y + (landmarks[8].y - landmarks[12].y) / 2);
                    arc(width * (1.0 - (landmarks[12].x + (landmarks[8].x - landmarks[12].x) / 2)),
                        height * (landmarks[12].y + (landmarks[8].y - landmarks[12].y) / 2),
                        80, 80,
                        0,
                        TWO_PI * ((millis() - pose.timestamp) / ms_operation_activate),
                        PIE);
                    if ((millis() - pose.timestamp) / ms_operation_activate > 1.0) {
                        pose.active = false;
                        trail_mode.toggle();
                    }
                }

            }

        }
    }

    if (trails_right.have_nothing_to_draw == true &&
        trails_left.have_nothing_to_draw == true) {
        noLoop();
    }
    if (trail_mode.name == 'All Fingers') {
        trails_right.draw();
        trails_left.draw();
    }
    else if (trail_mode.name == 'Index Finger') {
        trails_right.drawIndex();
        trails_left.drawIndex();
    }
    // strokeWeight(1);
    // text("p5 and MediaPipe Hands Demo", 20, 20);
    // noFill();
    // stroke(0);
    // strokeWeight(5);
    // rect(0, 0, width, height);
    // circle(mouseX, mouseY, 20);
}

var videoElement;
var hands;
function keyPressed() {

    if (key == ' ') {
        //console.log(g_angles);
        trail_mode.toggle();
    }

}

function toggleFingerGesture(_enable_mouse) {
    is_enable_mouse = _enable_mouse;
}
function toggleMediaPipeHands(_deviceId) {

    if (document.querySelector('video')) {
        stopMediaPipeHands();
    }
    else {
        startMediaPipeHands(_deviceId);
    }
}
function startMediaPipeHands(_deviceId) {
    videoElement = document.createElement('video');// document.getElementsByClassName('input_video')[0];
    document.querySelector('body').appendChild(videoElement);
    videoElement.hidden = true;
    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });
    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    hands.onResults(onResults);

    camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        audio: false,
        width: 1280,
        height: 720,
        deviceId: _deviceId
    });
    stream = camera.start();

}

function stopMediaPipeHands() {
    if (document.querySelector('video')) {
        let stream = videoElement.srcObject;
        window.cancelAnimationFrame(id_callback_camera_utils);
        stream.getTracks().forEach(track => track.stop())
        hands.close();
        videoElement.remove();
    }
    g_landmarks = [];
    draw();

}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function showDevices() {
    navigator.mediaDevices.enumerateDevices()
        .then(function (devices) {
            devices.forEach(function (device) {
                console.log(device.kind + ": " + device.label +
                    " id = " + device.deviceId);
            });
            return devices;
        })
        .catch(function (err) {
            console.log(err.name + ": " + err.message);
        });
}


