## Fluence Explore

A possible starting point for a playground for exploring [Fluence Network](https://fluence.network/) Aqua code. It consists of:

* A CodeMirror editor configured for Aqua code highlighting
* A python Flask app that takes posted Aqua and returns compiled version / errors

## How To Use

The aqua server takes posted Aqua code and runs it through the cli Aqua compiler. Sends back js, ts or air.

```
git clone git@github.com:ben-razor/aqua-explore.git
cd ./aqua-explore/scripts
python3 aqua_server.py
```

```
# Open another terminal cd back to aqua-explore
npm install
cd ./demo          # The client itself lives in the demo folder
npm install
npm run start
```

If this all worked then http://localhost:8080/ will show a web interface with an Aqua editor with syntax highlighting. 

Clicking the run button will post the aqua to the server and the output will display either the compiled js or an error message. **(It takes about 5s to compile)** 

### Setting Up The Editor

Fluence provides an [Aqua TextMate Grammar](https://github.com/fluencelabs/aqua-vscode/blob/main/syntaxes/aqua.tmLanguage.json).

The intention was to [CodeMirror](https://codemirror.net/) for the editor component but this uses a different syntax format.

#### TextMate to CodeMirror

[Neek Sandhu] made a wrapper application that allows TextMate grammar to be used in CodeMirror (https://github.com/neeksandhu/codemirror-textmate). It is in [npm](https://npm.io/package/codemirror-textmate).

This repository cloned that application and adds support for Fluence code syntax highlighting.

### Next Step

The next step would be do hot module replacement of the compiled Aqua client side and allow for code editing.

I think a solution would be to clone [codesandbox](https://github.com/codesandbox/codesandbox-client), strip out the other languages and configure it for Aqua only.

I couldn't get that working so I stopped at this point.

### Reference Documents

https://gitcoin.co/issue/fluencelabs/Gitcoin-GR11-Hackathon/10/100026543#

https://github.com/fluencelabs/aqua-playground/tree/master/aqua/examples
