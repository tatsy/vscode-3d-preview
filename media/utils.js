import * as THREE from 'three';
import { PLYLoader } from './three/loaders/PLYLoader.js';
import { STLLoader } from './three/loaders/STLLoader.js';
import { XYZLoader } from './three/loaders/XYZLoader.js';
import { PCDLoader } from './three/loaders/PCDLoader.js';
import { OFFLoader } from './three/loaders/OFFLoader.js';
import { OBJLoader } from './three/loaders/OBJLoader.js';

function basename(url) {
  var name = url.split('').reverse().join('');
  name = /([^\/]*)/.exec(name);
  name = name[1].split('').reverse().join('');
  return name;
}

function extname(url) {
  const index = url.lastIndexOf('.');
  if (index === -1) {
    return '';
  }
  return url.substring(index);
}

function isMeshSupport(fileToLoad) {
  switch (extname(fileToLoad)) {
    case 'stl':
      return true;
    case 'off':
      return true;
    case 'ply':
      return true;
    case 'xyz':
      return false;
    case 'pcd':
      return false;
    default:
      return true;
  }
}

function createModelLoader(fileToLoad) {
  switch (extname(fileToLoad)) {
    case '.obj':
      return new OBJLoader();
    case '.stl':
      return new STLLoader();
    case '.ply':
      return new PLYLoader();
    case '.xyz':
      return new XYZLoader();
    case '.pcd':
      return new PCDLoader();
    case '.off':
      return new OFFLoader();
    default:
      throw new Error('Unsupported file format!');
  }
}

// Accept either a THREE.Box3 or a geometry whose bounding box is (re)computed.
function toBox3(geometryOrBox) {
  if (geometryOrBox.isBox3) {
    return geometryOrBox;
  }
  geometryOrBox.computeBoundingBox();
  return geometryOrBox.boundingBox;
}

function getBBoxCenter(geometryOrBox) {
  const box = toBox3(geometryOrBox);
  return box.getCenter(new THREE.Vector3());
}

function getBBoxMaxExtent(geometryOrBox) {
  const box = toBox3(geometryOrBox);
  const size = box.getSize(new THREE.Vector3());
  return Math.max(size.x, Math.max(size.y, size.z));
}

function autoCameraPos(geometryOrBox) {
  const box = toBox3(geometryOrBox);

  var cx = (box.max.x - box.min.x) / 2;
  var cy = (box.max.y - box.min.y) / 2;
  var cz = (box.max.z - box.min.z) / 2;
  var sx = cx > 0 ? 1.0 : -1.0;
  var sy = cy > 0 ? 1.0 : -1.0;
  var sz = cz > 0 ? 1.0 : -1.0;
  var d = Math.max(cx, Math.max(cy, cz)) * 2.0;

  var center = getBBoxCenter(box);
  var cameraPos = new THREE.Vector3(d * sx, d * sy, d * sz);
  cameraPos.add(center);
  cameraPos.multiplyScalar(1);

  return cameraPos;
}

export {
  basename,
  extname,
  isMeshSupport,
  createModelLoader,
  getBBoxCenter,
  getBBoxMaxExtent,
  autoCameraPos,
};
