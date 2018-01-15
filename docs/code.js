const FPS = require('yy-fps')

const WM = require('../src/window-manager')
const html = require('../src/html')

// create a window manager and change some of the default styles
const wm = new WM({
    borderRadius: '10px',
    snap: { screen: true, windows: true, spacing: 5 }
})

window.onload = () =>
{
    test()
    test2()
    test3()
    test4()
    test5()
    test6()
    test7()
    update()
}

function test()
{
    const test = wm.createWindow({ x: 10, y: 10, title: 'Test Window', resizable: false })
    test.content.style.padding = '1em'
    test.content.innerHTML = 'This is a test window.'
    test.open()
}

function test2()
{
    const test = wm.createWindow({
        width: 300, height: 150,
        x: 100, y: 100,
        backgroundColorWindow: 'rgb(255,200,255)',
        titlebarHeight: '22px',
        backgroundColorTitlebarActive: 'green',
        backgroundColorTitlebarInactive: 'purple'
    })
    test.content.style.padding = '0.5em'
    test.content.innerHTML = 'This is a pink test window.<br><br>Check out the fancy title bar for other style tests.<br><br><br>And scrolling!!!'
    test.open()
}

function test3()
{
    // create a test window with a button to create a modal window
    const test = wm.createWindow({ x: 300, y: 400, width: 350, title: 'This is one fancy demo!' })
    test.content.style.padding = '1em'
    html({ parent: test.content, html: 'OK. It isn\'t that fancy, but it shows off some of the functionality of this library.<br><br>Please excuse the mess. I do NOT keep my desktop this messy, but I thought it made for a good demo.' })
    const div = html({ parent: test.content, styles: { textAlign: 'center', marginTop: '1em' } })
    const button = html({ parent: div, type: 'button', html: 'open modal window' })
    button.onclick = () =>
    {
        // create a modal window
        const modal = wm.createWindow({
            modal: true,
            width: 200,
            title: 'modal window',
            minimizable: false,
            maximizable: false
        })
        const div = html({ parent: modal.content, styles: { 'margin': '0.5em' } })
        html({ parent: div, html: 'This needs to be closed before using other windows.' })
        const buttonDiv = html({ parent: div, styles: { 'text-align': 'center', margin: '1em' } })
        const button = html({ parent: buttonDiv, type: 'button', html: 'close modal' })
        button.onclick = () =>
        {
            modal.close()
        }
        modal.open()

        // center window in test
        modal.center(test)
    }
    test.open()
}

function test4()
{
    const test = wm.createWindow({ x: 300, y: 20, title: 'My wife\'s art gallery!' })
    test.content.innerHTML = '<iframe width="560" height="315" src="https://www.youtube.com/embed/-slAp_gVa70" frameborder="0" gesture="media" allow="encrypted-media" allowfullscreen></iframe>'
    test.open()
    test.sendToBack()
}

function test5()
{
    const test = wm.createWindow({ x: 20, y: 600, title: 'window save/load' })
    html({ parent: test.content, html: 'Save the windows, and then move windows around and load them.', styles: { margin: '0.5em' } })
    const buttons = html({ parent: test.content, styles: { 'text-align': 'center' } })
    const save = html({ parent: buttons, html: 'save window state', type: 'button', styles: { margin: '1em', background: 'rgb(200,255,200)' } })
    const load = html({ parent: buttons, html: 'load window state', type: 'button', styles: { margin: '1em', background: 'rgb(255,200,200)' } })
    test.open()
    let data
    save.onclick = () => data = wm.save()
    load.onclick = () => { if (data) wm.load(data) }
}

function test6()
{
    const test = wm.createWindow({ x: 800, y: 350, width: 250, height: 350, title: 'One of my early games' })
    const game = html({ parent: test.content, type: 'button', html: 'play game', styles: { 'margin-top': '50%', 'margin-left': '50%', transform: 'translate(-50%, 0)' } })
    game.onclick = () =>
    {
        test.content.style.overflow = 'hidden'
        test.content.innerHTML = ''
        test.content.innerHTML = '<iframe width="100%", height="100%" src="https://yopeyopey.com/games/gotpaws/"></iframe>'
    }
    test.open()
}

function test7()
{
    const test = wm.createWindow({ x: 700, y: 40, width: 400, height: 300, title: 'API documentation' })
    test.content.innerHTML = '<iframe width="100%" height="100%" src="https://davidfig.github.io/window-manager/jsdoc/"></iframe>'
    test.open()
}

const wallpaper = html({ parent: wm.overlay, styles: { 'text-align': 'center', 'margin-top': '50%', color: 'white' } })
wallpaper.innerHTML = 'You can also use the background as wallpaper or another window surface.'

const fps = new FPS()
function update()
{
    fps.frame(false, true)
    requestAnimationFrame(update)
}