const fse = require('fs-extra');
const moment = require('moment');
const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');
const ep = new exiftool.ExiftoolProcess(exiftoolBin);

// Update these using a known time on your camera and in real life
const CAMERA_DATE = '2017:12:17 5:30:00';
const ACTUAL_DATE = '2018:02:16 17:57:00'

// Update this to match the exif format used by your camera (if different)
const DATE_FORMAT = 'YYYY:MM:DD HH:mm:ss';

// Update this if you are too cool for school and want to save your photos in a 
// different directory
const ORIGINALS_PATH = './photos';

function getDateOffset(camera, actual) {
  return new Promise((resolve, reject)=> {
    try {
      let cameraDate = moment(camera, DATE_FORMAT),
          actualDate = moment(actual, DATE_FORMAT),
          offsetDate = actualDate.diff(cameraDate, 'seconds');
      resolve(offsetDate);
    } catch (e) {
      reject(e);
    }
  });
}

function updateMetadata(path, offset) {
  return ep.open()
    .then(()=> ep.readMetadata(path, ['-File:all']))
    .then((results) => {
      let cameraDate = moment(results.data[0].DateTimeOriginal, DATE_FORMAT),
          actualDate = cameraDate.add(offset, 'seconds').format(DATE_FORMAT);

      return actualDate;
    })
    .then((actualDate)=> {
      let metadata = { DateTimeOriginal: actualDate, CreateDate: actualDate };
      return ep.writeMetadata(path, metadata, ['overwrite_original']);
    })
    .then(() => ep.close());
}

function process ( ) {
  let offset;
  return getDateOffset(CAMERA_DATE, ACTUAL_DATE)
    .then((data) => { offset = data; })
    .then(()=> fse.readdir(ORIGINALS_PATH))
    .then((data)=> data.map((img)=> ORIGINALS_PATH + '/' + img))
    .then((data)=> Promise.all(data.map((path)=> updateMetadata(path, offset))))
    .then(() => console.log('All Done!'))
    .catch(console.error);
}

process();
