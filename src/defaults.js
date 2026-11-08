import { close, maximize, restore, resize } from './images'

export const defaultWindowOptions = {
    x: 0,
    y: 0,
    width: undefined,
    height: undefined,
    modal: false,
    openOnCreate: true,
    id: null,

    minWidth: '200px',
    minHeight: '60px',
    borderRadius: 0,
    styles: {},

    movable: true,
    resizable: true,
    maximizable: true,
    closable: true,

    noSnap: false,
    noMenu: false,

    titlebar: true,
    titlebarHeight: '2rem',

    backgroundWindow: '#fefefe',
    backgroundTitlebarActive: '#365d98',
    backgroundTitlebarInactive: '#888888',
    foregroundButton: '#ffffff',
    foregroundTitle: '#ffffff',

    closeButton: close,
    maximizeButton: maximize,
    restoreButton: restore,

    backgroundResize: resize
}

export const defaultWindowManagerOptions = {
    quiet: false,
    keepInside: true,
    snap: true,
    noAccelerator: false,
    menu: false,
    styles: {},
    backgroundModal: 'rgba(0, 0, 0, 0.6)',
}