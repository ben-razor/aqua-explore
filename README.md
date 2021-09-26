## Fluence Explore

A playground for exploring [Fluence Network](https://fluence.network/) Aqua code.

## How To Use

The aqua server takes posted Aqua code and runs it through the aqua compiler. Sends back js/ts/air.

```
git clone git@github.com:ben-razor/aqua-explore.git
cd ./aqua-explore/scripts
python3 aqua_server.py
```

(Open another terminal cd back to aqua-explore)

npm install
cd ./demo          # The client itself lives in the demo folder
npm install
npm run start
```

If this all worked then http://localhost:8080/ will show a web interface with an Aqua editor with syntax highlighting. 

Clicking the run button will post the aqua to the server and the output will display either the compiled js or an error message. 

### Reference Documents

https://gitcoin.co/issue/fluencelabs/Gitcoin-GR11-Hackathon/10/100026543#

https://github.com/fluencelabs/aqua-playground/tree/master/aqua/examples

### Setting Up The Editor

Fluence provides an [Aqua TextMate Grammar](https://github.com/fluencelabs/aqua-vscode/blob/main/syntaxes/aqua.tmLanguage.json).

The intention was to [CodeMirror](https://codemirror.net/) for the editor component but this uses a different syntax format.

### TextMate to CodeMirror

[Neek Sandhu]has made a wrapper application that allows TextMate grammar to be used in CodeMirror (https://github.com/neeksandhu/codemirror-textmate). It is in [npm](https://npm.io/package/codemirror-textmate).

This repository clones that application and adds support for Fluence code syntax highlighting.

## Compiling Aqua

One of the steps that the online application will need to perform is compiling the entered Aqua code.
