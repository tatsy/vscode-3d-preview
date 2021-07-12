
function basename(url) {
  var name = url.split('').reverse().join('');
  name = /([^\/]*)/.exec(name);
  name = name[1].split('').reverse().join('');
  return name;
}

function extname(url) {
  return url.split('.').pop().toLowerCase();
}

function isMeshSupport(fileToLoad) {
  switch(extname(fileToLoad)) {
    case 'stl': return true;
    case 'off': return true;
    case 'ply': return true;
    case 'xyz': return false;
    case 'pcd': return false;
    default:    return true;
  }
}

function createModelLoader(fileToLoad) {
  switch(extname(fileToLoad)) {
    case 'stl': return new THREE.STLLoader();
    case 'ply': return new THREE.PLYLoader();
    case 'xyz': return new THREE.XYZLoader();
    case 'pcd': return new THREE.PCDLoader();
    case 'off': return new THREE.OFFLoader();
    default: return new THREE.OBJLoader();
  }
}

function getBBoxCenter(geometry) {
  geometry.computeBoundingBox();

  var center = new THREE.Vector3();
  center.x = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
  center.y = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
  center.z = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;
  return center;
}

function getBBoxMaxExtent(geometry) {
  geometry.computeBoundingBox();

  var cx = (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
  var cy = (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
  var cz = (geometry.boundingBox.max.z - geometry.boundingBox.min.z);

  return Math.max(cx, Math.max(cy, cz));
}

function autoCameraPos(geometry) {
  geometry.computeBoundingBox();
  
  var cx = (geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2;
  var cy = (geometry.boundingBox.max.y - geometry.boundingBox.min.y) / 2;
  var cz = (geometry.boundingBox.max.z - geometry.boundingBox.min.z) / 2;
  var sx = cx > 0 ? 1.0 : -1.0;
  var sy = cy > 0 ? 1.0 : -1.0;
  var sz = cz > 0 ? 1.0 : -1.0;
  var d = Math.max(cx, Math.max(cy, cz)) * 2.0;
  
  var center = getBBoxCenter(geometry);
  var cameraPos = new THREE.Vector3(d * sx, d * sy, d * sz);
  cameraPos.add(center);
  cameraPos.multiplyScalar(1);

  return cameraPos;
}

// function addPly(scene, load_path, point_size) {
// function addPly(self, loadPath) { 
//   var loader = new THREE.PLYLoader();
//   loader.load(loadPath, function (geometry) {
//     const sprite = new THREE.TextureLoader().load('three/textures/sprites/disc.png');
//     var pointsMaterial = new THREE.PointsMaterial({ size: 35, sizeAttenuation: true, map: sprite, alphaTest: 0.5, transparent: true });

//     console.log(geometry);

//     try {
//       if (geometry.getAttribute('color').length > 0) {
//         pointsMaterial.vertexColors = true;
//       }
//     } catch (e) {
//       console.error(e);
//       self.monochrome = true;
//     }

//     // add point cloud
//     self.points = new THREE.Points(geometry, pointsMaterial);
//     self.points.name = basename(loadPath);
//     self.scene.add(self.points);

//     // add mesh
//     try {
//       if (geometry.getIndex().length > 0) {
//         geometry.computeVertexNormals();
//         var material = new THREE.MeshStandardMaterial({ color: 0x0055ff, flatShading: true });
//         self.mesh = new THREE.Mesh(geometry, material);
//         self.mesh.castShadow = false;
//         self.mesh.receiveShadow = false;
//         self.scene.add(self.mesh);
//       }
//     } catch (e) { console.error(e); }

//     // init camera
//     self.initCamera();
//     self.animate();
//   }.bind(self));
// }

// function addObj(self, loadPath) {
//   var loader = new THREE.OBJLoader2();
//   loader.load(loadPath, function (object) {
//     // merge geometries
//     console.log(typeof object);
//     console.log(object);
//     var geometry = object;
//     if (object.detail.loaderRootNode.isGroup) {
//       geometry = THREE.BufferGeometryUtils.mergeBufferGeometries(
//         object.detail.loaderRootNode.children.map(child => 
//           child.geometry.clone().applyMatrix4(child.matrix))
//       );
//     }
    
//     console.log(geometry);
    
//     pointsMaterial = new THREE.PointsMaterial();
//     self.points = new THREE.Points(geometry, pointsMaterial);
//     self.points.name = basename(loadPath);

//     try {
//       if (geometry.getAttribute("color").length > 0) {
//         pointsMaterial.vertexColors = true;
//       }
//     } catch (e) {
//       console.error(e);
//       self.monochrome = true;
//     }

//     self.scene.add(self.points);

//     // add mesh
//     try {
//       geometry.computeVertexNormals();
//       var material = new THREE.MeshStandardMaterial({ color: 0x0055ff, flatShading: true });
//       self.mesh = new THREE.Mesh(geometry, material);
//       self.mesh.castShadow = true;
//       self.mesh.receiveShadow = true;
//       self.scene.add(self.mesh);
//     } catch (e) { console.error(e); }

//     self.initCamera();
//     self.animate();
//   }.bind(self));
// }

// function addPcd(self, loadPath) {
//   var loader = new THREE.PCDLoader();
//   loader.load(loadPath, function (points) {
//     if (points.material.vertexColors == false) {
//       self.monochrome = true
//     }
//     self.points = points;
//     self.scene.add(points);
//     self.initCamera();
//     self.animate();
//   }.bind(self));
// }

// function addBin(self, loadPath) {
//   var loader = new THREE.FileLoader();
//   loader.setResponseType('arraybuffer');
//   loader.load(loadPath, function (points) {
//     var vertices = []
//     var color = []
//     points = new Float32Array(points)
//     var numPoints = points.length / 4
//     for (i = 0; i < numPoints; i++) {
//       x = points[(i) * 4]
//       y = points[(i) * 4 + 1]
//       z = points[(i) * 4 + 2]
//       vertices.push(x, y, z)
//     }
//     var geometry = new THREE.BufferGeometry();
//     geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
//     var material = new THREE.PointsMaterial();
//     points = new THREE.Points(geometry, material);
//     self.points = points
//     self.scene.add(points)
//     self.initCamera();
//     self.animate();
//   }.bind(self));
// }
