const Menu = require('yy-menu')
const Item = Menu.MenuItem

function menu(wm)
{
    const file = new Menu()
    file.append(new Item({ label: '&New Window', accelerator: 'ctrl+m', click: () => newWindow(wm) }))

    const windows = new Menu()
    for (let i = 0; i < wm.windows.length; i++)
    {
        windows.append(new Item({
            type: 'checkbox', label: 'Window ' + (i < 10 ? '&' : '') + i, accelerator: i < 10 ? 'ctrl+' + i : null, checked: true, click: (e, item) =>
            {
console.log(item.checked)
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
    const main = new Menu()
    main.append(new Item({ label: '&File', submenu: file }))
    main.append(new Item({ label: '&Windows', submenu: windows }))
    Menu.setApplicationMenu(main)
}

function newWindow()
{

}

module.exports = menu