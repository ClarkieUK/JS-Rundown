// @ts-nocheck 

import { initGPU } from "./core/gpuDevice";
import GUI from 'https://muigui.org/dist/0.x/muigui.module.js';

async function main(){

    // init canvas and gpu related shebang
    const canvas = document.querySelector('canvas')
    const {device, context, format} = await initGPU(canvas);

    // shader pipeline
    let shaderCode = await(await fetch('src/shaders/texture.wgsl')).text();

    const textureModule = device.createShaderModule({
        label: 'texture module',
        code: shaderCode,
    })

    const pipeline = device.createRenderPipeline({
        label: 'texture pipeline',
        layout: 'auto',
        vertex: {
            module: textureModule,
        },
        fragment: {
            module: textureModule,
            targets: [{format: format}]
        }
    })

    // texture data
    const kTextureWidth = 5;
    const kTextureHeight = 7;
    const _ = [255, 0, 0, 255];
    const y = [255, 255, 0, 255];
    const b = [0, 0, 255, 255];
    const textureData = new Uint8Array([
    _, _, _, _, _,
    _, y, _, _, _,
    _, y, _, _, _,
    _, y, y, _, _,
    _, y, _, _, _,
    _, y, y, y, _,
    b, _, _, _, _,
    ].flat());

    const texture = device.createTexture({
        size: [kTextureWidth, kTextureHeight],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    })

    device.queue.writeTexture(
        { texture },
        textureData, 
        { bytesPerRow: kTextureWidth * 4 },
        { width: kTextureWidth, height: kTextureHeight },
    )

    // since we want to use multiple samplers , need multiple bind groups

    const bindGroups = [];

    for (let i = 0; i < 8; i++) {
        
        const sampler = device.createSampler({
            addressModeU: (i & 1) ? 'repeat' : 'clamp-to-edge',
            addressModeV: (i & 2) ? 'repeat' : 'clamp-to-edge',
            magFilter: (i & 4) ? 'linear' : 'nearest',
        });
        
        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: sampler },
                { binding: 1, resource: texture.createView() }
            ]
        })

        bindGroups.push(bindGroup)
    }

    const settings = {
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        magFilter: 'linear',
    }

    // render desciptor
    const renderPassDescriptor = {
        label: 'our basic canvas renderPass',
        colorAttachments: [
            {
                view: undefined,
                clearValue: [0.3, 0.3, 0.3, 1],
                loadOp: 'clear',
                storeOp: 'store',
            }
        ]
    }

    function render() {
        const ndx = (settings.addressModeU === 'repeat' ? 1 : 0) +
                    (settings.addressMoveV === 'repeat' ? 2 : 0) +
                    (settings.magFilter === 'linear' ? 4 : 0);

        renderPassDescriptor.colorAttachments[0].view =
            context.getCurrentTexture().createView()

        const encoder = device.createCommandEncoder({
            label: 'render quad encoder',
        })

        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroups[1]);
        pass.draw(6);
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
            // re-render
            render();
            }
        });
    observer.observe(canvas);
}

main();

// got to magfilter 