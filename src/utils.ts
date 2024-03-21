/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

 export type ReplaceAsyncFn = (full: string, ...args: string[]) => Promise<string>

// Found this on SO.
// I don't like it, but it gets the job done.
// I also remade it for TypeScript, and I like it even less
// For the original SO answer, see: https://stackoverflow.com/a/48032528/4292157

/**
 * Replaces matches in a string asynchronously and returns the string result
 * @param {string} str - The string "haystack" to operate on.
 * @param {RegExp} regex - The regex to search for.
 * @param {ReplaceAsyncFn} asyncFn - The function to use for replacement.
 * @returns - The string result from the replacement
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace} for the default String.replace.
 * @see {@link https://stackoverflow.com/a/48032528/4292157} for the SO answer providing this code snippet.
 */
export async function replaceAsync(str: string, regex: RegExp, asyncFn: ReplaceAsyncFn): Promise<string> {
    const promises: Array<Promise<string>> = []
    str.replace(regex, (full, ...args): string => {
        promises.push(asyncFn(full, ...args))
        return ''
    })
    const data = await Promise.all(promises)
    return str.replace(regex, (): string => data.shift()!)
}

