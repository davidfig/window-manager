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
    width: 300, height: 300,
    x: 100, y: 100,
    backgroundColorWindow: 'rgb(255,200,255)',
    titlebarHeight: '22px',
    backgroundColorTitlebarActive: 'green',
    backgroundColorTitlebarInactive: 'purple'
})
test2.content.style.padding = '0.5em'
test2.content.innerHTML = 'This is a pink test window.<br><br>Check out the fancy title bar for other style tests.'
test2.open()

// create a test window with a button to create a modal window
const test3 = wm.createWindow({ x: 300, y: 220, width: 350, title: 'Create a better demo!' })
test3.content.style.padding = '1em'
html.create({ parent: test3.content, html: 'I should probably make a better demo. And also get the minimize/maximize buttons working. One day.' })
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

const wallpaper = html.create({ parent: wm.overlay, styles: { 'text-align': 'center', 'margin-top': '50%', color: 'white' } })
wallpaper.innerHTML = 'You can also use the background as wallpaper or another window surface.'

const i = new Image()
i.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAAhElEQVQ4jbWUSwrAIAxEpScQBG+oN3bR07wuaqHY+kmIATcy84agjHM7BvBABoLCG6rXvy8z9xQgCmCxegBSm1Ik0AZWPtv9CLrQZe2KUBI8NYhhI6Ma1oGe9ehgDfQBPeAh7FAlacZ0ZdNHMf02ph9bkj7VYl0ObKgvDyT0BZt4F6zlXMgpEz867WPDAAAAAElFTkSuQmCC'
document.body.appendChild(i)
