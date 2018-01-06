const Canvas = require('canvas')
const fs = require('fs')

const args = process.argv

let s = ''

const names = {
    'minimize.png': 'backgroundMinimizeButton',
    'maximize.png': 'backgroundMaximizeButton',
    'close.png': 'backgroundCloseButton',
    'restore.png': 'backgroundRestoreButton'
}

for (let i = 2; i < args.length; i++)
{
    console.log('Converting ' + args[i] + '...')

    const image = new Canvas.Image()
    image.onload = () =>
    {
        const canvas = new Canvas(20, 20)
        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0)
        s += names[args[i]] + ': \'url(' + canvas.toDataURL() + ')\',\n'
    }
    image.src = args[i]
}

fs.writeFileSync('png-data.txt', s)