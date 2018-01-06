const WM = require('..')
const html = require('../src/html')

// create a window manager and change some of the default styles
const wm = new WM({
    borderRadius: '10px'
})

// create a test window
const test = wm.createWindow( { x: 10, y: 10, title: 'Test Window' })
test.content.style.padding = '1em'
test.content.innerHTML = 'This is a test window.'
test.open()

// create a pink test window, changing the window's style
const test2 = wm.createWindow({
    width: 300, height: 150,
    x: 100, y: 100,
    backgroundColorWindow: 'rgb(255,200,255)',
    titlebarHeight: '22px',
    backgroundColorTitlebarActive: 'green',
    backgroundColorTitlebarInactive: 'purple'
})
test2.content.style.padding = '0.5em'
test2.content.innerHTML = 'This is a pink test window.<br><br>Check out the fancy title bar for other style tests.<br><br><br>And scrolling!!!'
test2.open()

// create a test window with a button to create a modal window
const test3 = wm.createWindow({ x: 300, y: 400, width: 350, title: 'This is one fancy demo!' })
test3.content.style.padding = '1em'
html.create({ parent: test3.content, html: 'OK. It isn\'t that fancy, but it shows off some of the functionality of this library.' })
const div = html.create({ parent: test3.content, styles: { textAlign: 'center', marginTop: '1em' } })
const button = html.create({ parent: div, type: 'button', html: 'open modal window' })
button.onclick = () =>
{
    // create a modal window
    const modal = wm.createWindow({
        modal: true,
        width: 200,
        center: test3, // center window in test3
        title: 'modal window',
        minimizable: false,
        maximizable: false
    })
    const div = html.create({ parent: modal.content, styles: { 'margin': '0.5em' }})
    html.create({ parent: div, html: 'This needs to be closed before using other windows.' })
    const buttonDiv = html.create({ parent: div, styles: { 'text-align': 'center', margin: '1em' } })
    const button = html.create({ parent: buttonDiv, type: 'button', html: 'close modal' })
    button.onclick = () =>
    {
        modal.close()
    }
    modal.open()
}
test3.open()

const test4 = wm.createWindow({ x: 300, y: 20, title: 'My wife\'s art gallery!' })
test4.content.innerHTML = '<iframe width="560" height="315" src="https://www.youtube.com/embed/-slAp_gVa70" frameborder="0" gesture="media" allow="encrypted-media" allowfullscreen></iframe>'
test4.open()
test4.sendToBack()

const test5 = wm.createWindow({ x: 20, y: 600, title: 'window save/load' })
html.create({ parent: test5.content, html: 'Save the windows, and then move windows around and load them.', styles: { margin: '0.5em' }})
const buttons = html.create({ parent: test5.content, styles: { 'text-align': 'center' } })
const save = html.create({ parent: buttons, html: 'save window state', type: 'button', styles: { margin: '1em', background: 'rgb(200,255,200)' } })
const load = html.create({ parent: buttons, html: 'load window state', type: 'button', styles: { margin: '1em', background: 'rgb(255,200,200)' } })
test5.open()
let data
save.onclick = () =>
{
    data = wm.save()
}

load.onclick = () =>
{
    if (data)
    {
        wm.load(data)
    }
}

const wallpaper = html.create({ parent: wm.overlay, styles: { 'text-align': 'center', 'margin-top': '50%', color: 'white' } })
wallpaper.innerHTML = 'You can also use the background as wallpaper or another window surface.'