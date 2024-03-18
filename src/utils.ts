// Found this on SO.
// I don't like it, but it gets the job done.
export async function replaceAsync(str: string, regex: RegExp, asyncFn: (full: string, ...args: string[]) => Promise<string>): Promise<string> {
    const promises: Array<Promise<string>> = []
    str.replace(regex, (full, ...args) => {
        promises.push(asyncFn(full, ...args))
        return null
    })
    const data = await Promise.all(promises)
    return str.replace(regex, () => data.shift())
}
