# Change Log

All notable changes to the "vscode-3dpreview" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## Unreleased

- Add the `3dpreview.upAxis` setting and GUI dropdown to choose which axis of the file points up (+X, -X, +Y, -Y, +Z, -Z). The model is rotated in place, the axes helper follows the file's coordinate system and the grid stays on the world floor ([#14](https://github.com/tatsy/vscode-3d-preview/issues/14)).

## v0.2.5

- Restore free rotation with `TrackballControls` and add the `3dpreview.cameraControls` setting to switch between trackball and orbit controls ([#12](https://github.com/tatsy/vscode-3d-preview/issues/12)).
- Add the `3dpreview.pointSizeAttenuation` setting and GUI toggle to keep points at a fixed on-screen size ([#4](https://github.com/tatsy/vscode-3d-preview/issues/4)).
- Add a directional light that follows the camera, with the `3dpreview.lightIntensity` setting and GUI slider ([#13](https://github.com/tatsy/vscode-3d-preview/issues/13)).
- Support smooth shading. Meshes are now smooth-shaded by default; the `3dpreview.flatShading` setting and GUI toggle restore the previous flat look. OBJ meshes have their duplicated vertices welded so that smooth normals can be computed (STL files stay flat because the format carries no connectivity).
- Register the window resize handler so the canvas follows the editor size.
- Migrate linting to ESLint 9 flat config (`eslint.config.mjs`) and drop the unused `tslint` dependency.

## v0.2.2

- Default point size support ([#7](https://github.com/tatsy/vscode-3d-preview/issues/7))
- Revise JS codes to follow ES6.
- Performance tuning.

## v0.2.1

- Add a new option to close control panel by default.

## v0.2.0

- FPS display.
- Automatic point size.
- Automatic positioning of gird/axis helpers.
- Automatic check whether `*.ply`, `*.obj`, and `*.off` files represent a mesh or a point cloud.
- Wireframe color change support.

## v0.1.0

- Initial release
