import { Loader } from 'three';

class OFFLoader extends Loader {
  load(url, onLoad, onProgress, onError) {
    const scope = this;
    const loader = new THREE.FileLoader(this.manager);
    loader.setPath(this.path);
    loader.setRequestHeader(this.requestHeader);
    loader.setWithCredentials(this.withCredentials);
    loader.load(
      url,
      function (text) {
        try {
          onLoad(scope.parse(text));
        } catch (e) {
          if (onError) {
            onError(e);
          } else {
            console.error(e);
          }

          scope.manager.itemError(url);
        }
      },
      onProgress,
      onError
    );
  }

  parse(text) {
    const vertices = [];
    const normals = [];
    const indices = [];

    var lines = text.split("\n");
    lines = lines.map((line) => line.trim());
    lines = lines.filter((line) => line.length > 0 && !line.startsWith("#"));

    var magic = lines.shift();
    if (magic !== "OFF" && magic !== "NOFF") {
      return;
    }

    var sizes = lines.shift().split(" ");
    var nV = parseInt(sizes[0]);
    var nF = parseInt(sizes[1]);
    var nE = parseInt(sizes[2]);

    for (var i = 0; i < nV; i++) {
      var line = lines[i];

      const lineValues = line.split(/\s+/);

      if (lineValues.length === 3) {
        // XYZ
        vertices.push(parseFloat(lineValues[0]));
        vertices.push(parseFloat(lineValues[1]));
        vertices.push(parseFloat(lineValues[2]));
      }

      if (lineValues.length === 6) {
        // XYZ and normal
        vertices.push(parseFloat(lineValues[0]));
        vertices.push(parseFloat(lineValues[1]));
        vertices.push(parseFloat(lineValues[2]));
        normals.push(parseFloat(lineValues[3]));
        normals.push(parseFloat(lineValues[4]));
        normals.push(parseFloat(lineValues[5]));
      }
    }

    for (var i = nV; i < nV + nF; i++) {
      var line = lines[i];

      const lineValues = line.split(/\s+/);

      var k = parseInt(lineValues[0]);
      if (k !== 3) {
        continue;
      }

      indices.push(parseInt(lineValues[1]));
      indices.push(parseInt(lineValues[2]));
      indices.push(parseInt(lineValues[3]));
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    if (normals.length > 0) {
      geometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(normals, 3)
      );
    }

    if (indices.length > 0) {
      geometry.setIndex(indices);
    }

    return geometry;
  }
}

export { OFFLoader };
