/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Found this on SO.
// I don't like it, but it gets the job done.
// I also remade it for TypeScript, and I like it even less
// For the original SO answer, see: https://stackoverflow.com/a/48032528/4292157
export async function replaceAsync(str: string, regex: RegExp, asyncFn: (full: string, ...args: string[]) => Promise<string>): Promise<string> {
    const promises: Array<Promise<string>> = []
    str.replace(regex, (full, ...args): string => {
        promises.push(asyncFn(full, ...args))
        return ''
    })
    const data = await Promise.all(promises)
    return str.replace(regex, (): string => data.shift()!)
}
