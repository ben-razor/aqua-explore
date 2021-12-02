## Aqua Playground

[Aqua Playground](https://aqua-explore.web.app/) is a Code Sandbox POC application that allows Fluence Aqua code to be entered, compiled to JS on a remote server, 
and interacted with using JS.

The plan for the next version of the software is to create an environment where developers can learn and explore the Fluence system and Aqua language,
and prototype their own projects built on the platform.

## Aqua Playground V2 Plan

New features that will be implemented include:

* HTML / CSS editor support
* User log in (Using Ceramic DID)
* Ability to save and load projects that are grouped into collections
* A series of interactive Aqua tutorials implemented within the IDE
* UI Improvements
* Editor improvements (Basic autocomplete / tooltips)
* Efficiency, stability, usability and codebase improvements

## Client Side Aqua compilation

**This feature is fundamental to the viability of the application and would need a little work on the Fluence side:**

A target will need adding to the Aqua compiler build script to allow the JS target to be imported as a library. The library would export a compileAqua 
method taking the current CLI params as input and returning the compiled JS/TS/AIR.

If this can be implemented it will vastly speed up the compilation time and allow other creative uses of the compiler.

If not implemented and a compilation server continues to be used, the number of concurrent users is severely limited.

An alternative solution is to distribute the client and server in a container but then the easy accessibilty of the web version is lost.

I couldn't see how to do this myself without spending a lot of time learning the Scala language and build tools.

## Summary

The Aqua language and Fluence platform can be somewhat challenging to get to grips with at first as it is different in a number of ways from what the
majority of developers are familiar with.

With these features implemented, the Aqua Playground can serve as an entry point for new developers to get to grips with Fluence. This will increase the 
likelihood of on-boarding new developers to the project, speeding up adoption of the platform.

Here is a screen shot of how the application currently appears to give an impression of the new features will be integrated:

![Aqua Playground Screenshot](https://raw.githubusercontent.com/ben-razor/aqua-explore/main/demo/docs/aqua-playground-3.png)
