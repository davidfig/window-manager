const Canvas = require('canvas')
const fs = require('fs')

const args = process.argv

let s = ''

const names = {
    'minimize.png': 'backgroundMinimizeButton',
    'maximize.png': 'backgroundMaximizeButton',
    'close.png': 'backgroundCloseButton',
    'restore.png': 'backgroundRestoreButton',
    'resize.png': 'backgroundResize'
}

let converted = 0

for (let key in names)
{
    console.log('Converting ' + key + '...')

    const image = new Canvas.Image()
    image.onload = () =>
    {
        const canvas = new Canvas(20, 20)
        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0)
        s += names[key] + ': \'url(' + canvas.toDataURL() + ')\',\n'
        converted++
        if (converted === Object.keys(names).length)
        {
            console.log('Writing png-data.text...')
            fs.writeFileSync('png-data.txt', s)
        }
    }
    image.src = 'images/' + key
}