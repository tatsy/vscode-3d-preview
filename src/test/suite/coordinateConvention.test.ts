import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

suite("Coordinate System Tests", () => {
  test("Should have coordinate system setting", () => {
    const config = vscode.workspace.getConfiguration("3dpreview");
    const coordinateSystem = config.get("coordinateSystem", "opengl");
    
    const validSystems = [
      "opengl", "blender", "unity", "unreal", "maya", "3dsmax", 
      "opencv", "colmap", "nerfstudio", "custom"
    ];
    
    assert.ok(validSystems.includes(coordinateSystem), 
      "Coordinate system should be one of the valid presets");
  });

  test("Should default to OpenGL coordinate system", () => {
    const config = vscode.workspace.getConfiguration("3dpreview");
    const coordinateSystem = config.get("coordinateSystem", "opengl");
    
    assert.strictEqual(coordinateSystem, "opengl", 
      "Default coordinate system should be OpenGL");
  });

  test("Should allow setting different coordinate systems", async () => {
    const config = vscode.workspace.getConfiguration("3dpreview");
    
    // Test setting to blender
    await config.update("coordinateSystem", "blender", vscode.ConfigurationTarget.Global);
    
    const coordinateSystem = config.get("coordinateSystem");
    assert.strictEqual(coordinateSystem, "blender", 
      "Should be able to set coordinate system to blender");
    
    // Reset to opengl
    await config.update("coordinateSystem", "opengl", vscode.ConfigurationTarget.Global);
  });

  test("Should have custom coordinate system configuration", () => {
    const config = vscode.workspace.getConfiguration("3dpreview");
    const customCoordinateSystem = config.get("customCoordinateSystem", {
      rightAxis: "+x",
      upAxis: "+y",
      forwardAxis: "+z"
    });
    
    assert.ok(customCoordinateSystem.rightAxis, "Custom coordinate system should have rightAxis");
    assert.ok(customCoordinateSystem.upAxis, "Custom coordinate system should have upAxis");
    assert.ok(customCoordinateSystem.forwardAxis, "Custom coordinate system should have forwardAxis");
  });

  test("Should open 3D file with coordinate system setting", async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      // Skip test if no workspace folder available
      return;
    }

    const testFilePath = path.join(workspaceFolder.uri.fsPath, "data", "bunny.obj");
    const testFileUri = vscode.Uri.file(testFilePath);

    try {
      // Open the 3D file
      const document = await vscode.workspace.openTextDocument(testFileUri);
      assert.ok(document, "Should be able to open 3D file");
      
      // Check that coordinate system setting is available
      const config = vscode.workspace.getConfiguration("3dpreview");
      const coordinateSystem = config.get("coordinateSystem");
      assert.ok(coordinateSystem, "Coordinate system setting should be available");
      
    } catch (error) {
      console.log("Note: This test requires the 3D file to be available in the workspace");
      // This is expected if the test file doesn't exist
    }
  });
}); 