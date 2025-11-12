// @ts-nocheck 

import { initGPU } from './core/gpuDevice.js';
import { rand } from './utils/rand.js';
import { createCircleVertices } from './utils/circleMesh.js';
import { createCircleVerticesColored } from './utils/circleMesh.js';

async function main()
{

    const canvas = document.querySelector('canvas');

    const {device, context, format} = await (initGPU(canvas))

    let shaderCode = await(await fetch('src/shaders/gpu_fundamentals.wgsl')).text();
    
    const module = device.createShaderModule({
        label: 'basic shader module',
        code: shaderCode,
    });
 
    shaderCode = await(await fetch('src/shaders/triangle.wgsl')).text();

    const triangleModule = device.createShaderModule({
        label: 'basic triangle shader module',
        code: shaderCode,
    });

    const trianglePipeline = device.createRenderPipeline({
        label: 'pipeline',
        layout: 'auto',
        vertex:{
            entryPoint: 'vs',
            module: triangleModule,
            buffers: [
                {//static
                    arrayStride: 5 * 4,
                    attributes: [
                        {shaderLocation: 0, offset:0, format: 'float32x2'},//position
                        {shaderLocation: 1, offset:2 * 4, format: 'float32x3'}
                    ],
                },
            ],
        },
        fragment:
        {
            entryPoint: 'fs',
            module: triangleModule,
            targets: [{format: format}],
        }
    })

    const pipeline = device.createRenderPipeline({
        label: 'pipeline',
        layout: 'auto',
        vertex: {
            entryPoint: 'vs',
            module: module,
            buffers: [ // will have 3 buffers
            {//static
                arrayStride: 5 * 4,
                attributes: [
                    {shaderLocation: 0, offset:0, format: 'float32x2'},//position
                    {shaderLocation: 4, offset:2 * 4, format: 'float32x3'}
                ],
            },
            {//static
                arrayStride: 6 * 4, //
                stepMode: 'instance',
                attributes: [
                    {shaderLocation: 1, offset:0, format: 'float32x4'},//color
                    {shaderLocation: 2, offset:4*4, format: 'float32x2'}//offset
                ],
            },
            {//changing
                arrayStride: 2 * 4,
                stepMode: 'instance', // other is 'vertex'
                attributes: [
                    {shaderLocation: 3, offset:0, format: 'float32x2'} //scale
                ],
            },
        ],
        },
        fragment : {
            entryPoint: 'fs',
            module: module,
            targets: [{ format: format}],
        }
    });

    const renderPassDescriptor = {
        label: 'renderpass',
        colorAttachments: [
            {
                view: undefined,
                clearValue: [0.3, 0.3, 0.3, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
    };

    const kColorOffset = 0;
    const kOffsetOffset = 4; // after 4 color values and 2 position values

    const kScaleOffset = 0; // after 4 (0 when split) colour values

    const kNumObjects = 50;
    const objectInfos = [];
    
    const { vertexData, numVertices } = createCircleVerticesColored({
        radius: 0.5,
        innerRadius: 0.25,
        numSubdivisions: 50,
    });

    const datat = new Float32Array([
        0.5,-0.5,1.0,1.0,1.0,
        0.0,0.5,0.0,0.0,0.0,
        -0.5,-0.5,0.0,1.0,0.0])

    const test = device.createBuffer({
        label:'test',
        size: datat.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })

    device.queue.writeBuffer(test, 0, datat)

    // create 2 storage buffers
    const staticUnitSize =
        4 * 4 +
        2 * 4;
    const changingUnitSize =
        2 * 4;  // scale is 2 32bit floats (4bytes each)

    const staticVertexBufferSize = staticUnitSize * kNumObjects;
    const changingVertexBufferSize = changingUnitSize * kNumObjects;
    
    const staticVertexBuffer = device.createBuffer({
        label: 'static vertex buffer',
        size: staticVertexBufferSize,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    const changingVertexBuffer = device.createBuffer({
        label: 'changing vertex buffer',
        size: changingVertexBufferSize,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })

    const vertexBuffer = device.createBuffer({
        label: 'vertex buffer',
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });


    device.queue.writeBuffer(vertexBuffer, 0, vertexData);
    
    {
        const staticVertexValues = new Float32Array(staticVertexBufferSize / 4);
        for (let i = 0; i < kNumObjects; ++i) {
        const staticOffset = i * (staticUnitSize / 4);
    
        // These are only set once so set them now
        staticVertexValues.set([rand(), rand(), rand(), 1], staticOffset + kColorOffset);        // set the color
        staticVertexValues.set([rand(-0.9, 0.9), rand(-0.9, 0.9)], staticOffset + kOffsetOffset);      // set the offset
    
        objectInfos.push({
            scale: rand(0.2, 0.5),
        });
        }
        device.queue.writeBuffer(staticVertexBuffer, 0, staticVertexValues);
    }
    
    // a typed array we can use to update the changingStorageBuffer
    const vertexValues = new Float32Array(changingVertexBufferSize / 4);

    function render() {

        renderPassDescriptor.colorAttachments[0].view =
            context.getCurrentTexture().createView();

        const encoder = device.createCommandEncoder({ label: 'encoder'});

        const pass = encoder.beginRenderPass(renderPassDescriptor);
        
        pass.setPipeline(pipeline);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.setVertexBuffer(1, staticVertexBuffer);
        pass.setVertexBuffer(2, changingVertexBuffer);

        const aspect = canvas.width / canvas.height ;

        // set the scales for each object
        objectInfos.forEach(({scale}, ndx) => {
            const offset = ndx * (changingUnitSize / 4);
            vertexValues.set([scale / aspect, scale], offset + kScaleOffset); // set the scale
        });  
        // upload all scales at once
        device.queue.writeBuffer(changingVertexBuffer, 0, vertexValues);

        pass.draw(numVertices, kNumObjects);

        pass.setPipeline(trianglePipeline);
        pass.setVertexBuffer(0, test);
        pass.draw(3, 1);

        pass.end();



        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
    }

    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            const canvas = entry.target;
            const width = entry.contentBoxSize[0].inlineSize;
            const height = entry.contentBoxSize[0].blockSize;
            canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
            canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
            render();
        }
    });

    observer.observe(canvas)

}; 



//document.getElementById('debug').innerHTML = ""

main()
