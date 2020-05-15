const fs = require('fs-extra')
const path = require('path')

async function importFiles()
{
    const images = {}
    const files = await fs.readdir(path.join(__dirname))
    for (const file of files)
    {
        if (file.includes('.svg'))
        {
            images[file.replace('.svg', '')] = await fs.readFile(path.join(__dirname, file)) + ''
        }
    }
    let s = ''
    for (const name in images)
    {
        s += `export const ${name}='${images[name]}';`
    }
    await fs.outputFile(path.join(__dirname, '..', 'src', 'images.js'), s)
    process.exit(0)
}

importFiles()