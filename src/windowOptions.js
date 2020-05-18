import { close, maximize, restore, resize } from './images'

/**
 * @typedef {object} WindowOptions
 * @property {number} [x=0]
 * @property {number} [y=0]
 * @property {number} [width]
 * @property {number} [height]
 * @property {boolean} [modal]
 * @property {boolean} [openOnCreate=true]
 * @property {boolean} [movable=true]
 * @property {boolean} [resizable=true]
 * @property {boolean} [maximizable=true]
 * @property {boolean} [closable=true]
 * @property {boolean} [noSnap] don't snap this window or use this window as a snap target
 * @property {boolean} [titlebar=true]
 * @property {string} [titlebarHeight=36px]
 * @property {boolean} [titleCenter]
 * @property {string} [minWidth=200px]
 * @property {string} [minHeight=60px]
 * @property {string} [borderRadius=4px]
 * @property {object} [styles]
 * @property {string} [shadow='0 0 12px 1px rgba(0, 0, 0, 0.6)']
 * @property {number} [animateTime=250]
 * @property {string} [backgroundModal=rgba(0,0,0,0.6)]
 * @property {string} [backgroundWindow=#fefefe]
 * @property {string} [backgroundTitlebarActive=#365d98]
 * @property {string} [backgroundTitlebarInactive=#888888]
 * @property {string} [foregroundButton=#ffffff]
 * @property {string} [foregroundTitle=#ffffff]
 * @property {string} [maximizeButton=...]
 * @property {string} [closeButton=...]
 * @property {string} [resize=...]
 */
export const windowOptions = {
    x: 0,
    y: 0,
    width: undefined,
    height: undefined,
    modal: false,
    openOnCreate: true,

    classNames: {},

    minWidth: '200px',
    minHeight: '60px',
    borderRadius: 0,
    styles: {},

    shadow: 'none',
    movable: true,
    resizable: true,
    maximizable: true,
    closable: true,

    titlebar: true,
    titlebarHeight: '2rem',

    backgroundModal: 'rgba(0, 0, 0, 0.6)',
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