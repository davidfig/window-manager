/**
 * shortcut to create an html element
 * @param {object} options
 * @param {type} [options.type=div]
 * @param {string} [options.className]
 * @param {object} [options.styles]
 * @param {HTMLElement} [options.parent]
 * @param {string} [options.html]
 * @returns {HTMLElement}
 * @ignore
 */
export function html(options = {})
{
    const element = document.createElement(options.type || 'div')
    if (options.styles)
    {
        Object.assign(element.style, options.styles)
    }
    if (options.className)
    {
        element.className = options.className
    }
    if (options.html)
    {
        element.innerHTML = options.html
    }
    if (options.parent)
    {
        options.parent.appendChild(element)
    }
    return element
}