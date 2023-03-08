const path = require('path');

const cv = require('@u4/opencv4nodejs');

exports.cv = cv;

const dataPath = path.resolve(__dirname, '../data');
exports.dataPath = dataPath;
exports.getDataFilePath = fileName => path.resolve(dataPath, fileName);

const grabFrames = async (videoFile, delay, onFrame) => {
  const cap = new cv.VideoCapture(videoFile);
  //let done = false;
  while(true) {
    let frame = cap.read();

    if (frame.empty) {
      cap.reset();
      frame = cap.read();
    }

    // Call the onFrame callback and wait for it to complete
    const result = await onFrame(frame);

    if (result) {
      return result;
    }

    // Delay before reading the next frame
    await new Promise(resolve => setTimeout(resolve, delay));

  }
};
exports.grabFrames = grabFrames;

exports.runVideoDetection = async (src, detect) => {
  let res = await grabFrames(src, 1000, async frame => {
    return await detect(frame) // this is the classifyImg function, which returns jpeg encoded version of our image, with the yolo stuff applied to it
  })

  return res;
};

exports.drawRectAroundBlobs = (binaryImg, dstImg, minPxSize, fixedRectWidth) => {
  const {
    centroids,
    stats
  } = binaryImg.connectedComponentsWithStats();

  // pretend label 0 is background
  for (let label = 1; label < centroids.rows; label += 1) {
    const [x1, y1] = [stats.at(label, cv.CC_STAT_LEFT), stats.at(label, cv.CC_STAT_TOP)];
    const [x2, y2] = [
      x1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_WIDTH)),
      y1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_HEIGHT))
    ];
    const size = stats.at(label, cv.CC_STAT_AREA);
    const blue = new cv.Vec(255, 0, 0);
    if (minPxSize < size) {
      dstImg.drawRectangle(
        new cv.Point(x1, y1),
        new cv.Point(x2, y2),
        { color: blue, thickness: 2 }
      );
    }
  }
};

const drawRect = (image, rect, color, opts = { thickness: 2 }) =>
  image.drawRectangle(
    rect,
    color,
    opts.thickness,
    cv.LINE_8
  );

exports.drawRect = drawRect;
exports.drawBlueRect = (image, rect, opts = { thickness: 2 }) =>
  drawRect(image, rect, new cv.Vec(255, 0, 0), opts);
exports.drawGreenRect = (image, rect, opts = { thickness: 2 }) =>
  drawRect(image, rect, new cv.Vec(0, 255, 0), opts);
exports.drawRedRect = (image, rect, opts = { thickness: 2 }) =>
  drawRect(image, rect, new cv.Vec(0, 0, 255), opts);