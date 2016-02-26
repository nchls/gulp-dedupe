'use strict';

var through = require('through2');
var css = require('css');

module.exports = function dedupeCSS() {
    return through.obj(function(file, encoding, callback) {
        var contents = String(file._contents.toString(encoding));
        var ast = css.parse(contents);
        var outputAst = {
            type: 'stylesheet',
            stylesheet: {
                rules: []
            }
        };
        var outputString;

        var declarationKeys = [];
        var rule;
        var selector;
        var revisedDeclarations;
        var declaration;
        var property;
        var declarationKey;
        for (var i = ast.stylesheet.rules.length - 1; i >= 0; i--) {
            rule = ast.stylesheet.rules[i]
            if (rule.type === 'rule') {
                selector = rule.selectors.join(',');
                revisedDeclarations = [];
                for (var j = rule.declarations.length - 1; j >= 0; j--) {
                    declaration = rule.declarations[j];
                    property = declaration.property;
                    if (property !== undefined) {
                        declarationKey = selector + '{' + property;
                        if (declarationKeys.indexOf(declarationKey) === -1) {
                            declarationKeys.push(declarationKey);
                            revisedDeclarations.splice(0, 0, declaration);
                            continue;
                        }
                        if (declaration.value.indexOf('!important') !== -1) {
                            revisedDeclarations.push(declaration);
                        }
                    }
                }
                if (revisedDeclarations.length > 0) {
                    rule.declarations = revisedDeclarations;
                    outputAst.stylesheet.rules.splice(0, 0, rule);
                }
            } else {
                outputAst.stylesheet.rules.splice(0, 0, rule);
            }
        }

        outputString = css.stringify(outputAst);

        file.contents = new Buffer(outputString);

        callback(null, file);
    });
};
