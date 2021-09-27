import * as CodeMirror from 'codemirror'
import { loadWASM } from 'onigasm'
import 'codemirror/lib/codemirror.css'
import './index.css';
import { Fluence, FluencePeer } from "@fluencelabs/fluence";
import { krasnodar } from "@fluencelabs/fluence-network-environment";
/*
import { 
    registerHelloWorld,
    sayHello,
    getRelayTime
} from './aqua/compiled/hello_world';
*/

import {
    ResultCodes,
    RequestFlow,
    RequestFlowBuilder,
    CallParams,
} from '@fluencelabs/fluence/dist/internal/compilerSupport/v1.js'

window['Fluence'] = Fluence;
window['FluencePeer'] = FluencePeer;
window['ResultCodes'] = ResultCodes;
window['RequestFlow'] = RequestFlow;
window['RequestFlowBuilder'] = RequestFlowBuilder;

let helloWorldJS = `

function missingFields(obj, fields) {
    return fields.filter(f => !(f in obj))
}

// Services

function registerHelloWorld(...args) {
    let peer;
    let serviceId;
    let service;
    if (FluencePeer.isInstance(args[0])) {
        peer = args[0];
    } else {
        peer = Fluence.getPeer();
    }

    if (typeof args[0] === 'string') {
        serviceId = args[0];
    } else if (typeof args[1] === 'string') {
        serviceId = args[1];
    }  
 else {
     serviceId = "hello-world"
}
window['registerHelloWorld'] = registerHelloWorld;

    // Figuring out which overload is the service.
    // If the first argument is not Fluence Peer and it is an object, then it can only be the service def
    // If the first argument is peer, we are checking further. The second argument might either be
    // an object, that it must be the service object
    // or a string, which is the service id. In that case the service is the third argument
    if (!(FluencePeer.isInstance(args[0])) && typeof args[0] === 'object') {
        service = args[0];
    } else if (typeof args[1] === 'object') {
        service = args[1];
    } else {
        service = args[2];
    }

    const incorrectServiceDefinitions = missingFields(service, ['hello']);
    if (incorrectServiceDefinitions.length) {
        throw new Error("Error registering service HelloWorld: missing functions: " + incorrectServiceDefinitions.map((d) => "'" + d + "'").join(", "))
    }

    peer.internals.callServiceHandler.use((req, resp, next) => {
        if (req.serviceId !== serviceId) {
            next();
                return;
            }


 if (req.fnName === 'hello') {
     
 const callParams = {
     ...req.particleContext,
     tetraplets: {
         str: req.tetraplets[0]
     },
 };
 resp.retCode = ResultCodes.success;
 service.hello(req.args[0], callParams); resp.result = {}

 }
    

            next();
        });
 }
      

// Functions

 function sayHello(...args) {
     let peer;
     
     let config;
     if (FluencePeer.isInstance(args[0])) {
         peer = args[0];
         config = args[1];
     } else {
         peer = Fluence.getPeer();
         config = args[0];
     }
    
     let request;
     const promise = new Promise((resolve, reject) => {
         const r = new RequestFlowBuilder()
                 .disableInjections()
                 .withRawScript(
                     \`
     (xor
 (seq
  (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
  (call %init_peer_id% ("hello-world" "hello") ["Hello, world!"])
 )
 (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
)

                 \`,
                 )
                 .configHandler((h) => {
                     h.on('getDataSrv', '-relay-', () => {
                    return peer.getStatus().relayPeerId;
                });
                
                h.onEvent('callbackSrv', 'response', (args) => {
  
});

                h.onEvent('errorHandlingSrv', 'error', (args) => {
                    const [err] = args;
                    reject(err);
                });
            })
            .handleScriptError(reject)
            .handleTimeout(() => {
                reject('Request timed out for sayHello');
            })
        if(config && config.ttl) {
            r.withTTL(config.ttl)
        }
        request = r.build();
    });
    peer.internals.initiateFlow(request);
    return Promise.race([promise, Promise.resolve()]);
}
      


 function getRelayTime(...args) {
     let peer;
     
     let config;
     if (FluencePeer.isInstance(args[0])) {
         peer = args[0];
         config = args[1];
     } else {
         peer = Fluence.getPeer();
         config = args[0];
     }
    
     let request;
     const promise = new Promise((resolve, reject) => {
         const r = new RequestFlowBuilder()
                 .disableInjections()
                 .withRawScript(
                     \`
     (xor
 (seq
  (seq
   (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
   (xor
    (call -relay- ("peer" "timestamp_ms") [] ts)
    (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
   )
  )
  (xor
   (call %init_peer_id% ("callbackSrv" "response") [ts])
   (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
  )
 )
 (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 3])
)

                 \`,
                 )
                 .configHandler((h) => {
                     h.on('getDataSrv', '-relay-', () => {
                    return peer.getStatus().relayPeerId;
                });
                
                h.onEvent('callbackSrv', 'response', (args) => {
    const [res] = args;
  resolve(res);
});

                h.onEvent('errorHandlingSrv', 'error', (args) => {
                    const [err] = args;
                    reject(err);
                });
            })
            .handleScriptError(reject)
            .handleTimeout(() => {
                reject('Request timed out for getRelayTime');
            })
        if(config && config.ttl) {
            r.withTTL(config.ttl)
        }
        request = r.build();
    });
    peer.internals.initiateFlow(request);
    return promise;
}
      

`;

import {
    activateLanguage,
    addGrammar,
    addTheme,
    ITextmateThemePlus,
    linkInjections,
} from 'codemirror-textmate'

let defaultAqua = `import "@fluencelabs/aqua-lib/builtin.aqua"

service HelloWorld("hello-world"):
    hello(str: string)
    
func sayHello():
    HelloWorld.hello("Hello, world!")
    
func getRelayTime() -> u64:
    on HOST_PEER_ID:
        ts <- Peer.timestamp_ms()
    <- ts
`;

(async () => {
    await loadWASM(
        // webpack has been configured to resolve `.wasm` files to actual 'paths" as opposed to using the built-in wasm-loader
        // oniguruma is a low-level library and stock wasm-loader isn't equipped with advanced low-level API's to interact with libonig
        require('onigasm/lib/onigasm.wasm'))

        const grammars = {
            'source.aqua': {
                loader: () => import('./tm/grammars/aqua.tmLanguage.json'),
                language: 'typescript',
                priority: 'asap'
            },
            'source.js': {
                loader: () => import('./tm/grammars/JavaScript.tmLanguage.json'),
                language: 'javascript',
                priority: 'asap'
            }
        }

    // To avoid FOUC, await for high priority languages to get ready (loading/compiling takes time, and it's an async process for which CM won't wait)
    await Promise.all(Object.keys(grammars).map(async scopeName => {
        const { loader, language, priority } = grammars[scopeName]

        addGrammar(scopeName, loader)

        if (language) {
            const prom = activateLanguage(scopeName, language, priority)

            // We must "wait" for high priority languages to load/compile before we render editor to avoid FOUC (Flash of Unstyled Content)
            if (priority === 'now') {
                await prom
            }

            return;
        }
    }))

    const editor = CodeMirror.fromTextArea(document.getElementById('cm-host') as HTMLTextAreaElement, {
        lineNumbers: true,
        mode: 'typescript'
    })
    editor.setValue(defaultAqua)


    const viewer = CodeMirror.fromTextArea(document.getElementById('cm-viewer') as HTMLTextAreaElement, {
        lineNumbers: true,
        lineWrapping: true,
        mode: 'javascript'
    })

    let host = 'http://127.0.0.1:5000';
    async function compileAqua(aquaCode, outputLang) {
        let r = await fetch(`${host}/api/compile_aqua`, {method: 'POST',   headers : { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }, body: JSON.stringify({'aqua': aquaCode, 'lang': outputLang})})

        let j = await r.json();

        return j;
    }

    async function runScript() {
        let script = editor.getValue();
        let result = await compileAqua(script, 'js');
        // let outputElem = document.getElementById('output-elem');
        // outputElem.innerHTML = result.data.output;
        viewer.setValue(result.data.output);
    }

    let button = document.getElementById('run-script-button');
    button.onclick = runScript; 


    let relayPeerId = '/dns4/kras-01.fluence.dev/tcp/19001/wss/p2p/12D3KooWKnEqMfYo9zvfHmqTLpLdiHXPe4SVqUWcWHDJdFGrSmcA';

    let client;
    function setClient(newClient) {
        client = newClient;
    }

    await Fluence.start({ connectTo: krasnodar[2] });

    let code = helloWorldJS + `
    registerHelloWorld({
        hello: async (str) => {
            console.log(str)
        }
    });

    const helloBtnOnClick = async () => {
        await sayHello();
        const relayTime = await getRelayTime();
        setHelloMessage(relayTime);
    };

    function setHelloMessage(msg) {
        console.log(msg);
    }

    document.getElementById('hello-button').onclick = async function() {
        await helloBtnOnClick();
    };
    `;

    eval(code);
    const isConnected = client !== null;
})()
