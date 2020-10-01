const { BrowserWindow, app, Menu, ipcMain, shell } = require("electron");
const path = require("path");
const os = require("os");
const imagemin = require("imagemin");
const imageinMozjpeg = require("imagemin-mozjpeg");
const imageinPngquant = require("imagemin-pngquant");
const slash = require("slash");
const log = require("electron-log");

let mainWindow;
let aboutWindow;

process.env.NODE_ENV = "production";

const isDev = process.env.NODE_ENV !== "production" ? true : false;

const isMac = process.platform === "darwin" ? true : false;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Fresize",
    width: 450,
    height: 600,
    icon: "./assets/icons/Icon_256x256.png",
    resizable: isDev ? true : false,
    backgroundColor: "white",
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile("./app/index.html");
}

function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    title: "Fresize",
    width: 330,
    height: 380,
    icon: "./assets/icons/Icon_256x256.png",
    resizable: false,
    backgroundColor: "white",
  });

  aboutWindow.loadFile("./app/about.html");
  aboutWindow.removeMenu();
}

const menu = [
  {
    role: "fileMenu",
  },
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [{ label: "About", click: createAboutWindow }],
        },
      ]
    : [
        {
          label: "Help",
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]),
  ...(isDev
    ? [
        {
          label: "Developer",
          submenu: [
            {
              role: "reload",
            },
            {
              role: "forcereload",
            },
            {
              role: "separator",
            },
            {
              role: "toggledevtools",
            },
          ],
        },
      ]
    : []),
];

if (isMac) {
  menu.unshift({ role: "appMenu" });
}

ipcMain.on("image:minimize", (e, option) => {
  option.dest = path.join(os.homedir(), "fresize");
  shrinkImage(option);
});

async function shrinkImage({ imgPath, quality, dest }) {
  try {
    const pngQuality = quality / 100;

    const files = await imagemin([slash(imgPath)], {
      destination: dest,
      plugins: [
        imageinMozjpeg({ quality }),
        imageinPngquant({
          quality: [pngQuality, pngQuality],
        }),
      ],
    });

    //console.log(files);
    log.info(files);

    shell.openPath(dest);

    mainWindow.webContents.send("image:done");
  } catch (error) {
    // console.log(error);
    log.warn(error);
  }
}

app.on("ready", () => {
  createMainWindow();
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);
  mainWindow.on("ready", () => (mainWindow = null));
});

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow();
  }
});
