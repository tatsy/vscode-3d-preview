# Change Log

All notable changes to the "vscode-3dpreview" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]
### Added
- Added comprehensive coordinate system support (`coordinateSystem`) with presets for major 3D platforms:
  - OpenGL (default), Blender, Unity, Unreal, Maya, 3ds Max, OpenCV, COLMAP, NeRFStudio
- Added custom coordinate system configuration (`customCoordinateSystem`) for user-defined axis mappings
- Added GUI controls for coordinate system presets and custom axis configuration
- Added automatic coordinate transformation with proper normal vector handling
- Added hot reload support for coordinate system changes

### Changed
- Replaced simple coordinate convention with full coordinate system transformation
- Default coordinate system is OpenGL (maintains backward compatibility)
- Enhanced GUI with coordinate system folder and custom axes subfolder
- Improved coordinate system handling with matrix transformations

### Fixed
- Improved coordinate system handling for 3D models with proper transformation matrices
- Fixed normal vector transformations for coordinate system changes

## [0.2.4] - Previous Release

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
