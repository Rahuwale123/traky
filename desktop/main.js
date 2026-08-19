const { app, BrowserWindow, shell } = require("electron");

// Points at the web app itself — this is a thin native wrapper, not a
// bundled build. You still run the backend + frontend dev servers exactly
// as you do today; this just gives them a proper dock icon and window
// instead of a browser tab. Once the app is deployed somewhere, point this
// at that URL instead (no rebuild needed, just set the env var).
const APP_URL = process.env.TRAKY_APP_URL || "http://localhost:5173";

app.name = "Traky";

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: "Traky",
    titleBarStyle: "hiddenInset",
    backgroundColor: "#f5f4fa",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(APP_URL);

  // Anything that tries to open a new window (e.g. an external link shared
  // in chat) opens in the user's real browser instead of another app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
