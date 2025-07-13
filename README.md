# VSCode 3D Viewer Light

[![License: GPL3](https://img.shields.io/badge/License-GPL3-green.svg)](https://opensource.org/licenses/gpl-3-0)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/tatsy.vscode-3d-preview)](https://marketplace.visualstudio.com/items?itemName=tatsy.vscode-3d-preview)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/r/tatsy.vscode-3d-preview)](https://marketplace.visualstudio.com/items?itemName=tatsy.vscode-3d-preview)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/d/tatsy.vscode-3d-preview)](https://marketplace.visualstudio.com/items?itemName=tatsy.vscode-3d-preview)

**See in VS Marketplace:** [vscode-3d-preview](https://marketplace.visualstudio.com/items?itemName=tatsy.vscode-3d-preview)

## Description

This extension is inspired by [vscode-3dviewer](https://github.com/stef-levesque/vscode-3dviewer) but has minimal features to preview triangular meshes, and point clouds.

## Features

This extension supports 3D formats equally as [Open3D](http://www.open3d.org/docs/0.9.0/tutorial/Basic/file_io.html) (but partly not support currently).

|     | point | mesh |
|:---:|:-----:|:----:|
| obj | o | o |
| off | o | o |
| pcd | o | x |
| ply | o | o |
| stl | x | o |
| xyz | o | x |

### Mesh preview

![mesh](images/mesh_preview.jpg)

### Point cloud preview

![points](images/point_preview.jpg)

### Large color point cloud

![color_points](images/color_points.jpg)

## Configuration

The extension provides several configuration options that can be set in VS Code settings:

### Coordinate System

- **Setting**: `3dpreview.coordinateSystem`
- **Default**: `"opengl"`
- **Options**: Platform presets and custom configuration

This setting allows you to switch between different coordinate systems used by various 3D platforms:

#### Platform Presets

- **OpenGL** (default): +X right, +Y up, +Z forward
- **Blender**: +X right, +Z up, -Y forward  
- **Unity**: +X right, +Y up, +Z forward (left-handed)
- **Unreal**: +Y right, +Z up, +X forward
- **Maya**: +X right, +Y up, +Z forward
- **3ds Max**: +X right, +Z up, -Y forward
- **OpenCV**: +X right, -Y up, +Z forward
- **COLMAP**: +X right, -Y up, +Z forward
- **NeRFStudio**: +X right, +Y up, +Z forward
- **Custom**: User-defined axis configuration

#### Custom Coordinate System

When set to "custom", you can configure individual axes:

- **Setting**: `3dpreview.customCoordinateSystem`
- **Properties**:
  - `rightAxis`: Which axis points right (`+x`, `-x`, `+y`, `-y`, `+z`, `-z`)
  - `upAxis`: Which axis points up 
  - `forwardAxis`: Which axis points forward

#### Usage

You can change the coordinate system:
1. Through VS Code settings (search for "3dpreview.coordinateSystem")
2. Using the "Coordinate System" folder in the 3D viewer's control panel
3. For custom systems, adjust individual axes in the "Custom Axes" subfolder

This feature is particularly useful when working with 3D models from different software packages that use different coordinate system conventions.

## FAQ

- Q. When I drag and drop a mesh file, a blank display is shown.
  - A. To show a 3D data using this extension, you should first open a workspace including the 3D data that you want to open.

## Reference

- [vscode-3dviewer](https://github.com/stef-levesque/vscode-3dviewer)
- [vscode-pc-viewer](https://github.com/Obarads/vscode-pc-viewer)
- [three.js](https://threejs.org/)

## License

GNU General Public License v3 2021-2025 (c) Tatsuya Yatagawa
