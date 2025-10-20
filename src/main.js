/*function notes()

{
    // The map object holds key-value pairs where keys can be any datatype 
    // maps remember the order of insertion

    // passing an array to 'new Map(arr)' creates a map.
    // WeakMaps have objects as keys and can be garbage collected,

    

    let myMap = new WeakMap()

    let obj = {fname:"Liam"}
    let obj2 = {fname:"Bob"}

    myMap.set(obj,"player")
    myMap.set(obj2,"enemy")

    // objects

    const person = {
        fullName: function() {
            return this.firstName + " " + this.lastName
        }
    }

    const p1 = {
        firstName : "Bob",
        lastName : "Bobby",
        display : function(){
            document.writeln(this.firstName)
        }
    }

    person.fullName.call(p1)
    person.fullName.apply(p1)

    // call, takes arguments seperately
    // apply takes arguments as an array
    
    const arr = [1,2,3]

    Math.max.apply(null,arr)

    function Person(first,last,age)
    {
        this.firstName = first
        this.lastName = last
        this.age = age
    }

    const x = new Person('bob','bob',21);

    let {lastName} = x;



    // this way objects inherent functions 
    // can be used on other objects

    // as objects are always passed via reference, any assignment of an object
    // and subsequent changes to the assigned variable will change the 'original' objects 
    // values in memory, they point to the same location.

    document.writeln(lastName)

};
notes()
normal functions are hoisted to top of scope, arrow functions are NOT

function add(x,y) { return x+y }; 

let ad = (a,b) => a + b;

*/

const GRID_SIZE = 4;
document.getElementById('debug').innerHTML = GRID_SIZE

async function main()
{
    const canvas = document.querySelector("canvas")
    
    // This checks if the entry point for WebGPU exists.
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported on this browser");
    };
    
    // now we request a GPU adapter, the physical GPU interface essentially
    const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
    });
    if (!adapter) {
        throw new Error("No usable GPU found")
    }

    // configure the drawing canvas with the physical GPU
    // navigator.gpu.getPreferredCanvasFormat(); is pretty much always
    // the preferred canvas format
    const device = await adapter.requestDevice();
    const context = canvas.getContext("webgpu")
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: canvasFormat,
    });
    
    const vertices = new Float32Array([
        -0.8, -0.8,
         0.8, -0.8,
         0.8,  0.8,

        -0.8, -0.8,
         0.8,  0.8,
        -0.8,  0.8,
    ])
    
    // create the buffer, write the data to the buffer, give info about data in 
    // buffer.
    const vertexBuffer = device.createBuffer({
        label: "Cell Vertices",
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    
    device.queue.writeBuffer(vertexBuffer, 0, vertices)

    const vertexBufferLayout = {
        arrayStride : 8, // 2 vertices of 4 bytes each
        attributes: [{
            format: "float32x2",
            offset: 0,
            shaderLocation: 0,
        }]
    }

    const shaderCode = await(await fetch('src/shaders/cell_shader.wgsl')).text()  

    const cellShaderModule = device.createShaderModule({
        label: "Cell shader",
        code: shaderCode,
        
    });
    // create the encoder which allows us to send commands
    // to the GPU
    
    const cellPipeline = device.createRenderPipeline({
        label: 'Cell pipeline',
        layout: 'auto',
        vertex: {
            module: cellShaderModule,
            entryPoint: "vertexMain",
            buffers: [vertexBufferLayout]
        },
        fragment: {
            module: cellShaderModule,
            entryPoint: "fragmentMain",
            targets: [{
                format: canvasFormat
            }]
        }
    })

    const encoder = device.createCommandEncoder();

    // create a renderpass which is responsible for drawing all 
    // our information to the screen
    // passes require a 

    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: "clear", // indicates CLEAR when you start render pass
            clearValue: [0, 0, 0.4, 1], // baseline colour rgb-a
            storeOp: 'store', // save results of pass into texture
        }]
    });

    pass.setPipeline(cellPipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    //pass.draw(vertices.length / 2); // 2 points for each vertice 

    pass.end();
    
    device.queue.submit([encoder.finish()]);   // once submitted you need to then 
                                               // rebuild a encoder and then buffer
};



main()