export const config = {

    /**
     * application menu container styles
     * @type {object}
     */
    ApplicationContainerStyle: {
        'z-index': 999999,
        'position': 'absolute',
        'top': 0,
        'left': 0,
        'user-select': 'none',
        'font-size': '0.85em'
    },

    /**
     * application menu-bar styles
     * @type {object}
     */
    ApplicationMenuStyle: {
        'display': 'flex',
        'position': 'relative',
        'flex-direction': 'row',
        'color': 'black',
        'backgroundColor': 'rgb(230,230,230)',
        'width': '100vw',
        'border': 'none',
        'box-shadow': 'unset',
        'outline': 'none'
    },

    /**
     * application menu entry styles
     * @type {object}
     */
    ApplicationMenuRowStyle: {
        'padding': '0.25em 0.5em',
        'margin': 0,
        'line-height': '1em'
    },

    /**
     * lower-level menu window styles
     * @type {object}
     */
    MenuStyle: {
        'flex-direction': 'column',
        'position': 'absolute',
        'user-select': 'none',
        'color': 'black',
        'z-index': 999999,
        'backgroundColor': 'white',
        'border': '1px solid rgba(0,0,0,0.5)',
        'boxShadow': '1px 3px 3px rgba(0,0,0,0.25)'
    },

    /**
     * lower-level menu row styles
     * @type {object}
     */
    RowStyle: {
        'display': 'flex',
        'padding': '0.25em 1.5em 0.25em',
        'line-height': '1.5em'
    },

    /**
     * lower-level menu accelerator styles
     * @type {object}
     */
    AcceleratorStyle: {
        'opacity': 0.5
    },

    /**
     * lower-level menu separator styles
     * @type {object}
     */
    SeparatorStyle: {
        'border-bottom': '1px solid rgba(0,0,0,0.1)',
        'margin': '0.5em 0'
    },

    /**
     * accelerator key styles
     * NOTE: accelerator keys must use text-decoration as its used as a toggle in the code
     * @type {object}
     */
    AcceleratorKeyStyle: {
        'text-decoration': 'underline',
        'text-decoration-color': 'rgba(0,0,0,0.5)'
    },

    /**
     * minimum column width in pixels for checked and arrow in the lower-level menus
     * @type {number}
     */
    MinimumColumnWidth: 20,

    /**
     * CSS background style for selected MenuItems
     * NOTE: unselected have 'transparent' style
     * @type {string}
     */
    SelectedBackgroundStyle: 'rgba(0,0,0,0.1)',

    /**
     * number of pixels to overlap child menus
     * @type {number}
     */
    Overlap: 5,

    /**
     * time in milliseconds to wait for submenu to open when mouse hovers
     * @param {number}
     */
    SubmenuOpenDelay: 500
}