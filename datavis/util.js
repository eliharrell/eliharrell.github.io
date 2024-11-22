// you can modify this file however you like; use it to create helper
// functions that both good.js and bad.js may want to use
export function dataProc(data) {
    const ret = []
    data.forEach((d) => {
        const numeric = {
            part: d.part,
            percentage: +d.percentage,
            time: +d.time
        }
        ret.push(numeric)
    })
    return ret
}

// just a toy demo function; feel free to delete it, and its use in good.js and bad.js
export function foo(row) {
  return `${row.part}: ${row.percentage}% ${row.time} days`;
}
