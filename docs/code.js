const WM = require('..')

const wm = new WM()

const test = wm.createWindow( { x: 10, y: 10, title: 'Test Window' })
test.content.style.padding = '0.5em'
test.content.innerHTML = 'This is a test window.'
test.open()

const test2 = wm.createWindow({ width: 300, height: 300, x: 100, y: 100, backgroundColorWindow: 'rgb(255,200,255)' })
test2.content.style.padding = '0.5em'
test2.content.innerHTML = 'This is a pink test window.'
test2.open()

const test3 = wm.createWindow({ x: 300, y: 200, title: 'Create a better demo!' })
test3.content.style.padding = '0.5em'
test3.content.innerHTML = 'I should probably make a better demo. And also get the minimize/maximize buttons working. One day.'
test3.open()