import { Menu, MenuItem } from '../../src/index'

let _windows

export function menu(wm)
{
    const file = new Menu()
    file.append(new MenuItem({ label: '&New Window', accelerator: 'ctrl+m', click: () => newWindow(wm) }))

    _windows = new Menu()

    const about = new Menu()
    about.append(new MenuItem({ label: 'simple-&window-manager', click: () => aboutWM()}))
    about.append(new MenuItem({ label: 'yy-menu', click: () => aboutMenu() }))

    const main = new Menu()
    main.append(new MenuItem({ label: '&File', submenu: file }))
    main.append(new MenuItem({ label: '&Windows', submenu: _windows }))
    main.append(new MenuItem({ label: '&About', submenu: about }))
    Menu.setApplicationMenu(main)
}

export function menuWindows(wm)
{
    for (let i = 0; i < wm.windows.length; i++)
    {
        const win = wm.windows[i]
        _windows.append(new MenuItem({
            type: 'checkbox', label: win.options.title || 'Window ' + (i < 10 ? '&' : '') + i, accelerator: i < 10 ? 'ctrl+' + i : null, checked: true, click: (e, item) =>
            {
                if (item.checked)
                {
                    wm.windows[i].open()
                }
                else
                {
                    wm.windows[i].close()
                }
            }
        }))
    }
}

function newWindow()
{

}

function aboutWM()
{

}

function aboutMenu()
{

}