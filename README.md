# VSCode 3D Viewer Light

## Description

This extension is inspired by [vscode-3dviewer](https://github.com/stef-levesque/vscode-3dviewer) but has minimal features to preview triangular meshes, and point clouds.

## Features

This extension supports 3D formats equally as [Open3D](http://www.open3d.org/docs/0.9.0/tutorial/Basic/file_io.html) (but partly not support currently). 

|     | point | mesh |
|:---:|:-----:|:----:|
| obj | o | x |
| off | o | o |
| pcd | o | x |
| ply | o | o |
| stl | o | x |
| xyz | o | x |

#### Mesh preview

![mesh](images/mesh_preview.jpg)

#### Point cloud preview

![mesh](images/point_preview.jpg)

## FAQ

* When I drag&drop a mesh file, a blank display is shown.
    * To show a 3D data using this extension, you should first open a workspace including the 3D data that you want to open.

## Reference

* [vscode-3dviewer](https://github.com/stef-levesque/vscode-3dviewer)
* [vscode-pc-viewer](https://github.com/Obarads/vscode-pc-viewer)
* [three.js](https://threejs.org/)

## Lincense

MIT License 2021 (c) Tatsuya Yatagawa
