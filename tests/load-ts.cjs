const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

// Compile real TypeScript entrypoints with explicit disposable service adapters.
module.exports = function loadTs(file, imports = {}) {
    const { outputText, diagnostics } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        fileName: file, reportDiagnostics: true,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    })
    const errors = diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error)
    if (errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
        getCanonicalFileName: f => f, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n',
    }))
    const module = { exports: {} }
    vm.runInNewContext(outputText, {
        module, exports: module.exports, console, Buffer, process, Date, FormData, File,
        require: name => name in imports ? imports[name] : require(name),
    }, { filename: file })
    return module.exports
}
