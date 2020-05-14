/**
 * shortcut to create an html element
 * @param {object} options
 * @param {type} [options.string=div]
 * @param {object} [options.styles]
 * @param {HTMLElement} [options.parent]
 * @param {string} [options.html]
 * @returns {HTMLElement}
 */
export function html(options={})
{
    const object = document.createElement(options.type || 'div')
    if (options.parent)
    {
        options.parent.appendChild(object)
    }
    if (options.styles)
    {
        Object.assign(object.style, options.styles)
    }
    if (options.html)
    {
        object.innerHTML = options.html
    }
    return object
}