import fs from "fs"
import {glob} from "glob"

let regex = /import \{([^}]+)\} from ['"]@tabler\/icons-react['"]/

// Wrote it to extract named icon imports from all the files
// so to put then in IconReexported.jsx as default imports which fixed
// the problem where all icons were being imported


const listOfFiles = await glob("./src/**/*.jsx")
const allIcons = []

listOfFiles.forEach(path => {
    const fpath = "./"+path
    const data = fs.readFileSync(fpath, 'utf8')
    try {
        const match = regex.exec(data)
        if (match) {
            // The replace is necessary to work with multiline imports
            const icons = match[1].replace(/[\r\n]\s*/g, "").split(", ").map(icon => icon.trim())
            const newIcons = icons.filter(icon => !allIcons.includes(icon))
            allIcons.push(...newIcons)
            const updated = match.input.replace(regex, 'import { $1 } from "src/IconsReexported.jsx"')
            fs.writeFileSync(fpath, updated)
        }
    } catch (err) {
        console.log("Coulnt' read file: ", path, err)
    }
})
const importLines = allIcons.map((name) => `import ${name} from "@tabler/icons-react/dist/esm/icons/${name}.mjs"`)
const importLinesOut = importLines.join('\n')+(importLines.length > 0 ? "\n" : "")
fs.writeFileSync("./src/IconsReexported.jsx", importLinesOut, {flag: "a"})
const exportLine = `export { ${allIcons.join(", ")} }`
fs.writeFileSync("./src/IconsReexported.jsx", exportLine, {flag: "a"})
console.log(allIcons)