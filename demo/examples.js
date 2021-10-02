export const defaultAqua = `import "@fluencelabs/aqua-lib/builtin.aqua"

service HelloWorld("hello-world"):
    hello(str: string)
    
func sayHello() -> string:
    HelloWorld.hello("Hello. Welcome to the Aqua Playground.")
    <- "Hello. Welcome to the Aqua Playground."
    
func getRelayTime() -> u64:
    on HOST_PEER_ID:
        ts <- Peer.timestamp_ms()
    <- ts
`;

export const defaultJS = `registerHelloWorld({
    hello: async (str) => {
        console.log(str)
    }
});

const testAquaService = async () => {
    const message = await sayHello();
    const relayTime = await getRelayTime();
    const dateStr = new Date(relayTime).toLocaleString();
    
    setOutput(message + '<br /><br />Time on host: ' + dateStr);
};

testAquaService();`;

export let defaultExample =     {
    "aqua": defaultAqua,
    "js": defaultJS,
    "name": "helloAqua",
    "title": "Hello Aqua"
};

async function getExamples() {
    let success = true;
    let j;

    try {
        let r = await fetch('https://storage.googleapis.com/birdfeed-01000101.appspot.com/examples_3.json');
        j = await r.json();
    }
    catch(e) {
        success = false;
    }

    return { success: success, examplesData: j};
}

export { getExamples };