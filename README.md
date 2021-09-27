# Aqua Explore

A playground for exploring [Fluence Network](https://fluence.network/) Aqua code. It consists of:

* An editor configured for Aqua code highlighting
* A Python Flask app that takes posted Aqua and returns compiled version / errors
* An editor configured to edit the JS to create the output from the compiled Aqua module
* User can select from a number of example Aqua scripts
* The app displays the generated JS allowing the user to copy it in their project

View the current version at [Aqua Playground](http://34.77.88.57/).

**The server this is currently deployed on will not handle many simultaneous requests**

It is still under development.

A submission for the [Gitcoin GR11](https://gitcoin.co/issue/fluencelabs/Gitcoin-GR11-Hackathon/10/100026543#) hackathon.

## Prerequisites

You need to have [Aqua](https://doc.fluence.dev/aqua-book/getting-started/installation) installed to run the aqua_server. You will also need npm + python3.

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

### How The Syntax Highlighting Was Set Up

Fluence provides an [Aqua TextMate Grammar](https://github.com/fluencelabs/aqua-vscode/blob/main/syntaxes/aqua.tmLanguage.json).

The application uses [CodeMirror](https://codemirror.net/) for the editor component but this uses a different syntax format.

[Neek Sandhu] made a wrapper application that allows TextMate grammar to be used in CodeMirror (https://github.com/neeksandhu/codemirror-textmate). It is in [npm](https://npm.io/package/codemirror-textmate).

This repository cloned that application and adds support for Fluence code syntax highlighting.

### Reference Documents

https://gitcoin.co/issue/fluencelabs/Gitcoin-GR11-Hackathon/10/100026543#

https://github.com/fluencelabs/aqua-playground/tree/master/aqua/examples
